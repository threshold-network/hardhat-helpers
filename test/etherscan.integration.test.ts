import chai from "chai"
import fs from "fs-extra"
import path from "path"
import { useEnvironment } from "./helpers"

const { expect } = chai
const fixture = path.join(__dirname, "fixture-projects", "proxy-project")
const contractName = "contracts/Counter.sol:VerifyTarget"

function artifactContents(directory: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const name of fs.readdirSync(directory).sort()) {
    const file = path.join(directory, name)
    if (fs.statSync(file).isDirectory())
      Object.assign(result, artifactContents(file))
    else result[file] = fs.readFileSync(file, "utf8")
  }
  return result
}

describe("Verification with existing build artifacts", function () {
  useEnvironment("proxy-project", () =>
    fs.removeSync(path.join(fixture, "deployments"))
  )

  let originalError: typeof console.error
  let restoreNetworkMock: () => void
  let errors: unknown[]
  let compileCalls: number
  let alreadyVerified: boolean
  let encodedArguments: string | undefined
  let deployment: {
    address: string
    abi: unknown[]
    args: number[]
    libraries: { TestLibrary: string }
  }
  let before: Record<string, string>

  beforeEach(async function () {
    const { ethers } = this.hre
    await this.hre.run("compile", { quiet: true })
    const library = await (
      await ethers.getContractFactory("TestLibrary")
    ).deploy()
    await library.deployed()
    const libraries = { TestLibrary: library.address }
    const factory = await ethers.getContractFactory("VerifyTarget", {
      libraries,
    })
    const instance = await factory.deploy(42)
    await instance.deployed()
    deployment = { address: instance.address, abi: [], args: [42], libraries }
    before = artifactContents(this.hre.config.paths.artifacts)
    originalError = console.error
    errors = []
    console.error = (err: unknown) => {
      errors.push(err)
    }
    compileCalls = 0
    alreadyVerified = false
    encodedArguments = undefined
    this.hre.tasks.compile.setAction(async () => {
      compileCalls += 1
      throw new Error("Verification must not recompile deployment artifacts")
    })
    const versions = require("@nomiclabs/hardhat-etherscan/dist/src/solc/version")
    const service = require("@nomiclabs/hardhat-etherscan/dist/src/etherscan/EtherscanService")
    const originalIsAlreadyVerified = service.isAlreadyVerified
    service.isAlreadyVerified = async () => alreadyVerified
    const originalGetLongVersion = versions.getLongVersion
    restoreNetworkMock = () => {
      versions.getLongVersion = originalGetLongVersion
      service.isAlreadyVerified = originalIsAlreadyVerified
    }
    versions.getLongVersion = async () =>
      require("solc").version().split(".Emscripten")[0]
    this.hre.tasks["verify:verify-minimum-build"].setAction(async (args) => {
      encodedArguments = args.deployArgumentsEncoded
      if (alreadyVerified)
        throw new Error("Contract source code already verified")
      return true
    })
  })

  afterEach(function () {
    console.error = originalError
    restoreNetworkMock?.()
  })

  it("verifies deployed bytecode with its constructor arguments and libraries without rewriting artifacts", async function () {
    const verifyTask = this.hre.tasks["verify:verify"]
    const action = verifyTask.action
    let argumentsPassed: Record<string, unknown> | undefined
    verifyTask.setAction(async (args, hre, runSuper) => {
      argumentsPassed = args
      return action(args, hre, runSuper)
    })
    await this.hre.helpers.etherscan.verify(deployment, contractName)
    expect(errors).to.deep.equal([])
    expect(argumentsPassed!.contract).to.equal(contractName)
    expect(argumentsPassed!.constructorArguments).to.deep.equal(deployment.args)
    expect(argumentsPassed!.libraries).to.deep.equal(deployment.libraries)
    expect(encodedArguments).to.equal("2a".padStart(64, "0"))
    expect(compileCalls).to.equal(0)
    expect(artifactContents(this.hre.config.paths.artifacts)).to.deep.equal(
      before
    )
  })

  it("reports missing build information without silently rebuilding it", async function () {
    this.hre.artifacts.getBuildInfo = async () => undefined
    await this.hre.helpers.etherscan.verify(deployment, contractName)
    expect(errors).to.have.length(1)
    expect(String(errors[0])).to.match(/build.?info|couldn't find its sources/i)
    expect(compileCalls).to.equal(0)
    expect(artifactContents(this.hre.config.paths.artifacts)).to.deep.equal(
      before
    )
  })

  it("accepts an already-verified response without changing artifacts", async function () {
    alreadyVerified = true
    await this.hre.helpers.etherscan.verify(deployment, contractName)
    expect(errors).to.deep.equal([])
    expect(compileCalls).to.equal(0)
    expect(artifactContents(this.hre.config.paths.artifacts)).to.deep.equal(
      before
    )
  })

  for (const message of [
    "Already Verified",
    "Contract source code already verified",
  ]) {
    it(`accepts the legacy response: ${message}`, async function () {
      this.hre.tasks["verify:verify"].setAction(async () => {
        throw new Error(message)
      })
      await this.hre.helpers.etherscan.verify(deployment, contractName)
      expect(errors).to.deep.equal([])
    })
  }
})
