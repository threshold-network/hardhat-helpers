import chai from "chai"
import fs from "fs-extra"
import path from "path"
import { useEnvironment } from "./helpers"

chai.use(require("chai-as-promised"))
const { expect } = chai
const fixture = path.join(__dirname, "fixture-projects", "proxy-project")
const deploymentFile = path.join(
  fixture,
  "deployments",
  "hardhat",
  "Counter.json"
)

function savedRecord(): string {
  return fs.readFileSync(deploymentFile, "utf8")
}

describe("On-chain proxy helpers", function () {
  useEnvironment("proxy-project", () =>
    fs.removeSync(path.join(fixture, "deployments"))
  )

  beforeEach(async function () {
    await this.hre.run("compile", { quiet: true })
  })

  it("deploys and upgrades a proxy, preserving state, admin ownership and mined receipts", async function () {
    const { helpers, upgrades, ethers, deployments } = this.hre
    const [owner] = await ethers.getSigners()
    const [proxy, first] = await helpers.upgrades.deployProxy("Counter", {
      initializerArgs: [42],
    })
    expect((await proxy.value()).toString()).to.equal("42")
    const adminAddress = await upgrades.erc1967.getAdminAddress(first.address)
    const admin = await ethers.getContractAt(
      ["function owner() view returns (address)"],
      adminAddress
    )
    expect(await admin.owner()).to.equal(await owner.getAddress())
    const firstRecord = JSON.parse(savedRecord())
    expect(firstRecord.transactionHash).to.equal(
      firstRecord.receipt.transactionHash
    )
    expect(firstRecord.receipt.status).to.equal(1)
    expect(firstRecord.receipt.logs).not.to.be.empty

    const [upgraded, next] = await helpers.upgrades.upgradeProxy(
      "Counter",
      "CounterV2",
      {
        proxyOpts: { call: { fn: "setExtra", args: [7] } },
      }
    )
    expect((await upgraded.value()).toString()).to.equal("42")
    expect((await upgraded.extra()).toString()).to.equal("7")
    expect(next.address).to.equal(first.address)
    expect(next.implementation).not.to.equal(first.implementation)
    expect(
      await upgrades.erc1967.getImplementationAddress(next.address)
    ).to.equal(next.implementation)
    expect(await upgrades.erc1967.getAdminAddress(next.address)).to.equal(
      adminAddress
    )
    expect(await admin.owner()).to.equal(await owner.getAddress())
    const receipt = await ethers.provider.getTransactionReceipt(
      next.transactionHash!
    )
    expect(receipt!.status).to.equal(1)
    const record = JSON.parse(savedRecord())
    expect(record.abi).to.deep.equal(
      this.hre.artifacts.readArtifactSync("CounterV2").abi
    )
    expect(record.transactionHash).to.equal(record.receipt.transactionHash)
    expect(record.receipt.blockNumber).to.equal(receipt!.blockNumber)
    expect(record.receipt.gasUsed).to.equal(receipt!.gasUsed.toString())
    expect((await deployments.get("Counter")).implementation).to.equal(
      next.implementation
    )
    const instance = await helpers.contracts.getContract("Counter")
    expect((await instance.extra()).toString()).to.equal("7")
  })

  it("reloads a persisted record and requires explicit redeployment to replace it", async function () {
    const { helpers, deployments } = this.hre
    const [first, original] = await helpers.upgrades.deployProxy("Counter", {
      initializerArgs: [42],
    })
    const before = savedRecord()
    await deployments.run([], {
      resetMemory: true,
      writeDeploymentsToFiles: true,
      deletePreviousDeployments: false,
    })
    await deployments.run([], {
      resetMemory: false,
      writeDeploymentsToFiles: true,
      deletePreviousDeployments: false,
    })
    await expect(
      helpers.upgrades.deployProxy("Counter", { initializerArgs: [9] })
    ).to.be.rejectedWith("already deployed")
    expect(savedRecord()).to.equal(before)
    const [second, fresh] = await helpers.upgrades.deployProxy("Counter", {
      initializerArgs: [9],
      redeploy: true,
    })
    expect(fresh.address).not.to.equal(original.address)
    expect((await first.value()).toString()).to.equal("42")
    expect((await second.value()).toString()).to.equal("9")
    expect(JSON.parse(savedRecord()).address).to.equal(fresh.address)
  })

  it("keeps the persisted record if fresh deployment reverts", async function () {
    const { helpers } = this.hre
    await helpers.upgrades.deployProxy("Counter", { initializerArgs: [42] })
    const before = savedRecord()
    await expect(
      helpers.upgrades.deployProxy("Counter", {
        initializerArgs: [0],
        redeploy: true,
      })
    ).to.be.rejectedWith("invalid initial value")
    expect(savedRecord()).to.equal(before)
  })

  it("rejects incompatible storage without changing the proxy or its record", async function () {
    const { helpers, upgrades } = this.hre
    const [, original] = await helpers.upgrades.deployProxy("Counter", {
      initializerArgs: [42],
    })
    const before = savedRecord()
    await expect(
      helpers.upgrades.upgradeProxy("Counter", "IncompatibleCounter")
    ).to.be.rejectedWith("incompatible")
    expect(
      await upgrades.erc1967.getImplementationAddress(original.address)
    ).to.equal(original.implementation)
    expect(savedRecord()).to.equal(before)
  })

  it("rejects an unauthorized upgrade without changing the proxy or its record", async function () {
    const { helpers, upgrades, ethers } = this.hre
    const [, stranger] = await ethers.getSigners()
    const [, original] = await helpers.upgrades.deployProxy("Counter", {
      initializerArgs: [42],
    })
    const before = savedRecord()
    await expect(
      helpers.upgrades.upgradeProxy("Counter", "CounterV2", {
        factoryOpts: { signer: stranger },
      })
    ).to.be.rejected
    expect(
      await upgrades.erc1967.getImplementationAddress(original.address)
    ).to.equal(original.implementation)
    expect(savedRecord()).to.equal(before)
  })

  it("keeps state and the record if an upgrade-and-call transaction reverts", async function () {
    const { helpers, upgrades } = this.hre
    const [proxy, original] = await helpers.upgrades.deployProxy("Counter", {
      initializerArgs: [42],
    })
    const before = savedRecord()
    await expect(
      helpers.upgrades.upgradeProxy("Counter", "CounterV2", {
        proxyOpts: { call: { fn: "setExtra", args: [0] } },
      })
    ).to.be.rejectedWith("invalid extra")
    expect(
      await upgrades.erc1967.getImplementationAddress(original.address)
    ).to.equal(original.implementation)
    expect((await proxy.value()).toString()).to.equal("42")
    expect(savedRecord()).to.equal(before)
  })
})
