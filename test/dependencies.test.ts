import { expect } from "chai"
import { existsSync } from "fs"
import { mkdtemp, readFile, rm } from "fs/promises"
import { createServer, IncomingMessage, ServerResponse } from "http"
import { createRequire } from "module"
import { AddressInfo } from "net"
import { tmpdir } from "os"
import path from "path"
import { Readable } from "stream"
import { runInNewContext } from "vm"
import { HttpProvider } from "hardhat/internal/core/providers/http"
import { download } from "hardhat/internal/util/download"

// Resolve transitive dependencies from their consumers, including the ethers 5
// and Axios copies used by hardhat-deploy alongside the root's newer versions.
const hardhatRequire = createRequire(require.resolve("hardhat/package.json"))
const deployRequire = createRequire(
  require.resolve("hardhat-deploy/package.json")
)
const solcRequire = createRequire(hardhatRequire.resolve("solc/package.json"))

async function withServer(
  handler: (
    request: IncomingMessage,
    response: ServerResponse,
    body: string
  ) => void,
  run: (url: string) => Promise<void>
) {
  const server = createServer((request, response) => {
    const chunks: Buffer[] = []
    request.on("data", (chunk: Buffer) => chunks.push(chunk))
    request.on("end", () => {
      try {
        handler(request, response, Buffer.concat(chunks).toString("utf8"))
      } catch (error) {
        response.statusCode = 500
        response.end(String(error))
      }
    })
  })
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", resolve)
  })

  try {
    const { port } = server.address() as AddressInfo
    await run(`http://127.0.0.1:${port}`)
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
      server.closeAllConnections()
    })
  }
}

describe("Development dependency compatibility", function () {
  it("preserves Hardhat HTTP JSON-RPC results and provider errors", async function () {
    const requests: { method: string; params: unknown[] }[] = []
    await withServer(
      (_request, response, body) => {
        const rpc = JSON.parse(body)
        requests.push(rpc)
        response.setHeader("Content-Type", "application/json")
        response.end(
          JSON.stringify({
            jsonrpc: "2.0",
            id: rpc.id,
            ...(rpc.method === "eth_chainId"
              ? { result: "0x7a69" }
              : {
                  error: {
                    code: -32000,
                    message: "execution reverted",
                    data: "0x1234",
                  },
                }),
          })
        )
      },
      async (url) => {
        const { Pool } = hardhatRequire("undici")
        const pool = new Pool(url)
        try {
          const provider = new HttpProvider(url, "local", {}, 2000, pool)
          expect(await provider.request({ method: "eth_chainId" })).to.equal(
            "0x7a69"
          )

          let failure: unknown
          try {
            await provider.request({
              method: "eth_call",
              params: [{}, "latest"],
            })
          } catch (error) {
            failure = error
          }
          expect(failure).to.be.instanceOf(Error)
          expect(failure).to.include({
            code: -32000,
            message: "execution reverted",
            data: "0x1234",
          })
        } finally {
          await pool.close()
        }
      }
    )
    expect(
      requests.map(({ method, params }) => ({ method, params }))
    ).to.deep.equal([
      { method: "eth_chainId", params: [] },
      { method: "eth_call", params: [{}, "latest"] },
    ])
  })

  it("downloads a compiler archive through a redirect and extracts it", async function () {
    const AdmZip = hardhatRequire("adm-zip")
    const archive = new AdmZip()
    const compiler = Buffer.from([0, 1, 2, 127, 128, 255])
    archive.addFile("solc.exe", compiler)
    const directory = await mkdtemp(path.join(tmpdir(), "helpers-download-"))
    const visited: string[] = []
    try {
      await withServer(
        (request, response) => {
          visited.push(request.url || "")
          if (request.url === "/redirect") {
            response.writeHead(302, { Location: "/compiler.zip" })
            response.end()
          } else {
            response.end(archive.toBuffer())
          }
        },
        async (url) => {
          const destination = path.join(directory, "nested", "compiler.zip")
          await download(`${url}/redirect`, destination, 2000)
          const downloadedArchive = new AdmZip(destination)
          downloadedArchive.extractAllTo(path.join(directory, "extracted"))
          expect(
            await readFile(path.join(directory, "extracted", "solc.exe"))
          ).to.deep.equal(compiler)
          expect(existsSync(path.join(directory, "nested", "tmp-compiler.zip")))
            .to.be.false
        }
      )
      expect(visited).to.deep.equal(["/redirect", "/compiler.zip"])
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("submits hardhat-deploy multipart metadata through an HTTP redirect", async function () {
    const axios = deployRequire("axios")
    const FormData = deployRequire("form-data")
    const requests: { method?: string; contentType?: string; body: string }[] =
      []
    const metadata = JSON.stringify({ language: "Solidity", sources: {} })
    await withServer(
      (request, response, body) => {
        requests.push({
          method: request.method,
          contentType: request.headers["content-type"],
          body,
        })
        if (request.url === "/submit") {
          response.writeHead(307, { Location: "/verified" })
          response.end()
        } else {
          response.setHeader("Content-Type", "application/json")
          response.end(JSON.stringify({ result: [{ status: "perfect" }] }))
        }
      },
      async (url) => {
        const form = new FormData()
        form.append("chain", "31337")
        form.append("files", Readable.from([metadata]), "metadata.json")
        const response = await axios.post(`${url}/submit`, form, {
          headers: form.getHeaders(),
          proxy: false,
          timeout: 2000,
        })
        expect(response.status).to.equal(200)
        expect(response.data).to.deep.equal({ result: [{ status: "perfect" }] })
      }
    )
    expect(requests).to.have.length(2)
    for (const request of requests) {
      expect(request.method).to.equal("POST")
      expect(request.contentType).to.match(/^multipart\/form-data; boundary=/)
      expect(request.body).to.include('name="chain"\r\n\r\n31337')
      expect(request.body).to.include('filename="metadata.json"')
      expect(request.body).to.include(metadata)
    }
    expect(requests[1].body).to.equal(requests[0].body)
  })

  it("signs and recovers messages using hardhat-deploy's ethers 5", async function () {
    const { Wallet, utils } = deployRequire("ethers")
    // Public test key, used only for offline signing.
    const wallet = new Wallet(`0x${"01".repeat(32)}`)
    const message = "hardhat-helpers dependency compatibility"
    const signature = await wallet.signMessage(message)
    expect(utils.verifyMessage(message, signature)).to.equal(wallet.address)

    const signingKeyRequire = createRequire(
      deployRequire.resolve("@ethersproject/signing-key")
    )
    const { ec: EC } = signingKeyRequire("elliptic")
    const curve = new EC("secp256k1")
    expect(() => curve.sign("-1", wallet.privateKey.slice(2))).to.throw(
      "Can not sign a negative message"
    )
  })

  it("validates solc temporary filenames and supports explicit cleanup", function () {
    const tmp = solcRequire("tmp")
    expect(() => tmp.tmpNameSync({ postfix: [".smt2"] })).to.throw(
      "postfix option must be a string"
    )
    const file = tmp.fileSync({ postfix: ".smt2" })
    try {
      expect(path.isAbsolute(file.name)).to.be.true
      expect(existsSync(file.name)).to.be.true
    } finally {
      file.removeCallback()
    }
    expect(existsSync(file.name)).to.be.false
  })

  it("serializes Mocha worker options with regular expressions", function () {
    const {
      BufferedWorkerPool,
    } = require("mocha/lib/nodejs/buffered-worker-pool")
    const serialized = BufferedWorkerPool.serializeOptions({
      grep: /dependency compatibility/i,
      timeout: 2000,
      require: ["ts-node/register/files"],
    })
    const options = runInNewContext(`(${serialized})`)
    expect(options.grep.test("Dependency Compatibility")).to.be.true
    expect(options.grep.test("unrelated test")).to.be.false
    expect(options.timeout).to.equal(2000)
    expect(options.require).to.deep.equal(["ts-node/register/files"])
  })

  it("renders Mocha assertion diffs with the updated diff API", function () {
    const Base = require("mocha/lib/reporters/base")
    const inlineDiffs = Base.inlineDiffs
    try {
      Base.inlineDiffs = false
      const diff = Base.generateDiff("actual value\n", "expected value\n")
      expect(diff).to.include("-actual value")
      expect(diff).to.include("+expected value")
      expect(diff).not.to.include("failed to generate Mocha diff")
    } finally {
      Base.inlineDiffs = inlineDiffs
    }
  })

  it("preserves Cognito CookieStorage's js-cookie API", function () {
    const { CookieStorage } = require("amazon-cognito-identity-js")
    const originalDocument = Object.getOwnPropertyDescriptor(
      globalThis,
      "document"
    )
    const cookies = new Map<string, string>()
    // The browser owns cookie persistence; provide only that boundary here.
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        get cookie() {
          return [...cookies]
            .map(([name, value]) => `${name}=${value}`)
            .join("; ")
        },
        set cookie(cookie: string) {
          const [pair, ...attributes] = cookie.split("; ")
          const [name, ...value] = pair.split("=")
          const expires = attributes.find((attribute) =>
            attribute.startsWith("expires=")
          )
          if (expires && Date.parse(expires.slice(8)) < Date.now()) {
            cookies.delete(name)
          } else {
            cookies.set(name, value.join("="))
          }
        },
      },
    })
    try {
      const storage = new CookieStorage()
      expect(storage.setItem("dependency-test", "value with spaces")).to.equal(
        "value with spaces"
      )
      expect(storage.getItem("dependency-test")).to.equal("value with spaces")
      storage.removeItem("dependency-test")
      expect(storage.getItem("dependency-test")).to.be.null
      storage.setItem("dependency-test", "another value")
      expect(storage.clear()).to.deep.equal({})
      expect(cookies.size).to.equal(0)
    } finally {
      if (originalDocument) {
        Object.defineProperty(globalThis, "document", originalDocument)
      } else {
        Reflect.deleteProperty(globalThis, "document")
      }
    }
  })
})
