import chai from "chai"
import { AbiCoder, BaseContract, Interface, TransactionReceipt } from "ethers"
import type { Contract, ContractTransactionResponse } from "ethers"
import type { Deployment } from "hardhat-deploy/types"
import type { HardhatRuntimeEnvironment } from "hardhat/types"
import type { HardhatUpgradesHelpers } from "../src/upgrades"
import type { HardhatContractsHelpers } from "../src/contracts"
import { useEnvironment } from "./helpers"

chai.use(require("chai-as-promised"))
const { expect } = chai

// TypeChain contracts extend BaseContract without Contract's string index signature.
interface TypedProxy extends BaseContract {
  readValue(): Promise<bigint>
}

const address = "0x0000000000000000000000000000000000000011"
const implementation = "0x0000000000000000000000000000000000000022"
const admin = "0x0000000000000000000000000000000000000033"
const owner = "0x0000000000000000000000000000000000000044"
const hash = `0x${"ab".repeat(32)}`

describe("Upgrade helpers", function () {
  useEnvironment("hardhat-deploy")

  let helpers: HardhatUpgradesHelpers
  let hre: HardhatRuntimeEnvironment
  let contract: TypedProxy & { deployTransaction?: ContractTransactionResponse }
  let transaction: ContractTransactionResponse
  let receipt: TransactionReceipt | null
  let saved: Array<{ name: string; deployment: Deployment }>
  let existing: Deployment | null
  let deploymentCalls: number
  let upgradeError: Error | undefined
  let interfaceVersion: string | undefined
  let attachedAbi: Interface

  beforeEach(function () {
    saved = []
    existing = null
    deploymentCalls = 0
    upgradeError = undefined
    interfaceVersion = undefined
    receipt = new TransactionReceipt(
      {
        to: null,
        from: owner,
        contractAddress: address,
        hash,
        index: 2,
        blockHash: hash,
        blockNumber: 5,
        logsBloom: "0x",
        gasUsed: 123n,
        cumulativeGasUsed: 456n,
        gasPrice: 7n,
        type: 2,
        status: 1,
        root: null,
        logs: [
          {
            address,
            topics: [hash],
            data: "0x",
            index: 3,
            transactionIndex: 2,
            transactionHash: hash,
            blockHash: hash,
            blockNumber: 5,
            removed: false,
          },
        ],
      },
      this.hre.ethers.provider
    )
    transaction = {
      hash,
      wait: async (confirmations: number) => {
        expect(confirmations).to.equal(1)
        return receipt
      },
    } as unknown as ContractTransactionResponse
    contract = new BaseContract(address, []) as TypedProxy
    Object.defineProperty(contract, "deploymentTransaction", {
      configurable: true,
      value: () => transaction,
    })

    hre = {
      ethers: {
        getContractFactory: async () => ({}),
        getContractAt: async (
          abi: ConstructorParameters<typeof Interface>[0]
        ) => {
          attachedAbi = new Interface(abi)
          return { interface: attachedAbi, owner: async () => owner }
        },
        provider: { getSigner: async () => ({}) },
      },
      upgrades: {
        deployProxy: async () => {
          deploymentCalls += 1
          return contract
        },
        upgradeProxy: async () => {
          if (upgradeError) throw upgradeError
          return contract
        },
        prepareUpgrade: async () => implementation,
        erc1967: {
          getImplementationAddress: async () => implementation,
          getAdminAddress: async () => admin,
        },
      },
      deployments: {
        getOrNull: async () => existing,
        get: async () => ({ address, abi: [] }),
        log: () => undefined,
        save: async (name: string, deployment: Deployment) => {
          saved.push({ name, deployment })
        },
      },
      artifacts: { readArtifactSync: () => ({ abi: [] }) },
      network: {
        provider: {
          send: async () =>
            interfaceVersion
              ? AbiCoder.defaultAbiCoder().encode(
                  ["string"],
                  [interfaceVersion]
                )
              : "0x",
        },
      },
    } as unknown as HardhatRuntimeEnvironment
    helpers = require("../src/upgrades").default(hre)
  })

  it("accepts BaseContract-derived types and preserves legacy receipt JSON", async function () {
    const [instance, deployment] = await helpers.deployProxy<TypedProxy>(
      "Proxy"
    )
    expect(instance).to.equal(contract)
    expect(saved).to.deep.equal([{ name: "Proxy", deployment }])
    const serialized = JSON.parse(JSON.stringify(deployment.receipt))
    expect(serialized).to.deep.equal({
      to: null,
      from: owner,
      contractAddress: address,
      transactionIndex: 2,
      gasUsed: "123",
      logsBloom: "0x",
      blockHash: hash,
      transactionHash: hash,
      logs: [
        {
          transactionIndex: 2,
          blockNumber: 5,
          transactionHash: hash,
          address,
          topics: [hash],
          data: "0x",
          logIndex: 3,
          blockHash: hash,
        },
      ],
      blockNumber: 5,
      cumulativeGasUsed: "456",
      status: 1,
      byzantium: true,
    })
  })

  it("keeps the default Contract return type", async function () {
    const [instance]: [Contract, Deployment] = await helpers.deployProxy(
      "Proxy"
    )
    expect(instance).to.equal(contract)
  })

  it("loads a deployed BaseContract-derived contract", async function () {
    hre.ethers.getContractAt = async () => contract as unknown as Contract
    const contracts: HardhatContractsHelpers =
      require("../src/contracts").default(hre)
    const instance = await contracts.getContract<TypedProxy>("Proxy")
    expect(instance).to.equal(contract)
  })

  it("rejects duplicate deployments before sending a transaction", async function () {
    existing = { address, abi: [] }
    await expect(helpers.deployProxy("Proxy")).to.be.rejectedWith(
      "already deployed"
    )
    expect(deploymentCalls).to.equal(0)
    expect(saved).to.have.length(0)
  })

  for (const method of ["deployProxy", "upgradeProxy"] as const) {
    it(`does not save ${method} without a receipt`, async function () {
      receipt = null
      const operation =
        method === "deployProxy"
          ? helpers.deployProxy("Proxy")
          : helpers.upgradeProxy("Proxy", "Implementation")
      await expect(operation).to.be.rejectedWith(
        "Could not find transaction receipt"
      )
      expect(saved).to.have.length(0)
    })
  }

  for (const legacy of [false, true]) {
    it(`saves upgrade receipts from the ${
      legacy ? "legacy" : "v6"
    } transaction field`, async function () {
      if (legacy) {
        Object.defineProperty(contract, "deploymentTransaction", {
          value: () => null,
        })
        contract.deployTransaction = transaction
      }
      const [instance, deployment] = await helpers.upgradeProxy<TypedProxy>(
        "Proxy",
        "Implementation"
      )
      expect(instance).to.equal(contract)
      expect(deployment.receipt?.transactionHash).to.equal(hash)
      expect(deployment.receipt?.gasUsed).to.equal("123")
      expect(saved).to.deep.equal([{ name: "Proxy", deployment }])
    })
  }

  it("preserves upgrade validation failures without saving a deployment", async function () {
    upgradeError = new Error("New storage layout is incompatible")
    await expect(
      helpers.upgradeProxy("Proxy", "Implementation")
    ).to.be.rejectedWith("New storage layout is incompatible")
    expect(saved).to.have.length(0)
  })

  for (const [version, callData, method] of [
    [undefined, undefined, "upgrade"],
    [undefined, "0x1234", "upgradeAndCall"],
    ["5.0.0", undefined, "upgradeAndCall"],
  ]) {
    it(`prepares ${method} with ProxyAdmin ${
      version ?? "v4"
    }`, async function () {
      interfaceVersion = version
      const { preparedTransaction } = await helpers.prepareProxyUpgrade(
        "Proxy",
        "Implementation",
        { callData }
      )
      expect(preparedTransaction.from).to.equal(owner)
      expect(preparedTransaction.to).to.equal(admin)
      const decoded = attachedAbi.parseTransaction({
        data: preparedTransaction.data,
      })
      expect(decoded?.name).to.equal(method)
      expect(decoded?.args[0]).to.equal(address)
      expect(decoded?.args[1]).to.equal(implementation)
      if (method === "upgradeAndCall") {
        expect(decoded?.args[2]).to.equal(callData ?? "0x")
      }
      expect(saved).to.have.length(0)
    })
  }
})
