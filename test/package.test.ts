import { expect } from "chai"
import { execFileSync } from "child_process"
import fs from "fs-extra"
import os from "os"
import path from "path"

import { projectRoot as project } from "./helpers"

describe("Public package entry points", function () {
  for (const baseOnly of [true, false]) {
    it(
      baseOnly
        ? "loads and typechecks base helpers without OpenZeppelin"
        : "combines base, upgrades and legacy imports without duplicate registration",
      function () {
        const consumer = fs.mkdtempSync(
          path.join(os.tmpdir(), "helpers-consumer-")
        )
        try {
          fs.symlinkSync(
            path.join(project, "node_modules"),
            path.join(consumer, "node_modules"),
            "dir"
          )
          fs.writeFileSync(
            path.join(consumer, "hardhat.config.js"),
            `
          require("hardhat-deploy")
          require(${JSON.stringify(path.join(project, "base.js"))})
          ${
            baseOnly
              ? ""
              : `require(${JSON.stringify(project)})
require(${JSON.stringify(path.join(project, "upgrades.js"))})`
          }
          module.exports = { namedAccounts: { deployer: 0 } }
        `
          )
          const source = path.join(consumer, "consumer.ts")
          fs.writeFileSync(
            source,
            `
          import ${JSON.stringify(path.join(project, "base"))}
          ${
            baseOnly
              ? ""
              : `import ${JSON.stringify(path.join(project, "upgrades"))}`
          }
          import hre from "hardhat"
          const block: Promise<number> = hre.helpers.time.lastBlockNumber()
          ${
            baseOnly
              ? "// @ts-expect-error Upgrade helpers require the opt-in import."
              : ""
          }
          hre.helpers.upgrades.deployProxy("Counter")
          void block
        `
          )
          const output = execFileSync(
            process.execPath,
            [
              "-e",
              `
          const assert = require("assert")
          const Module = require("module")
          const baseOnly = ${baseOnly}
          const originalLoad = Module._load
          Module._load = function(request, ...args) {
            if (baseOnly && request.startsWith("@openzeppelin/hardhat-upgrades")) {
              throw new Error("Optional OpenZeppelin plugin is not installed")
            }
            return originalLoad.call(this, request, ...args)
          }
          async function main() {
            const hre = require("hardhat")
            assert.strictEqual(Object.keys(hre.helpers).length, baseOnly ? 10 : 11)
            assert.strictEqual("upgrades" in hre, !baseOnly)
            assert.strictEqual("upgrades" in hre.helpers, !baseOnly)
            const signers = await hre.helpers.signers.getNamedSigners()
            assert(hre.helpers.address.isValid(await signers.deployer.getAddress()))
            const before = await hre.helpers.time.lastBlockNumber()
            await hre.helpers.time.mineBlocks(1)
            assert.strictEqual(await hre.helpers.time.lastBlockNumber(), before + 1)
            const ts = require("typescript")
            const program = ts.createProgram([${JSON.stringify(source)}], {
              noEmit: true, strict: true, target: ts.ScriptTarget.ES2020,
              module: ts.ModuleKind.CommonJS, esModuleInterop: true,
              resolveJsonModule: true, types: ["node", "mocha"],
            })
            if (baseOnly) assert(!program.getSourceFiles().some(f => f.fileName.includes("@openzeppelin/hardhat-upgrades")))
            const errors = ts.getPreEmitDiagnostics(program)
            assert.strictEqual(errors.length, 0, ts.formatDiagnosticsWithColorAndContext(errors, {
              getCurrentDirectory: () => process.cwd(),
              getCanonicalFileName: name => name,
              getNewLine: () => "\\n",
            }))
            console.log("consumer passed")
          }
          main().catch(error => { console.error(error); process.exitCode = 1 })
        `,
            ],
            { cwd: consumer, encoding: "utf8", timeout: 60000 }
          )
          expect(output).to.include("consumer passed")
        } finally {
          fs.removeSync(consumer)
        }
      }
    )
  }
})
