import "@openzeppelin/hardhat-upgrades"

import type {
  BaseContract,
  Contract,
  ContractFactory,
  ContractTransaction,
  ContractTransactionResponse,
  TransactionReceipt,
} from "ethers"
import type {
  Artifact,
  FactoryOptions,
  HardhatRuntimeEnvironment,
} from "hardhat/types"
import type { Deployment, Receipt } from "hardhat-deploy/dist/types"
import type {
  DeployProxyOptions,
  UpgradeProxyOptions,
} from "@openzeppelin/hardhat-upgrades/src/utils/options"
import { Libraries } from "hardhat-deploy/types"
import ProxyAdminV4 from "@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol/ProxyAdmin.json"
import ProxyAdminV5 from "@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts-v5/proxy/transparent/ProxyAdmin.sol/ProxyAdmin.json"

import { getUpgradeInterfaceVersion } from "@openzeppelin/upgrades-core"

// Preserve the receipt metadata published by hardhat-helpers 0.6.
function toDeploymentReceipt(receipt: TransactionReceipt): Receipt {
  const deploymentReceipt = {
    to: receipt.to,
    from: receipt.from,
    contractAddress: receipt.contractAddress,
    transactionIndex: receipt.index,
    gasUsed: receipt.gasUsed.toString(),
    logsBloom: receipt.logsBloom,
    blockHash: receipt.blockHash,
    transactionHash: receipt.hash,
    logs: receipt.logs.map((log) => ({
      transactionIndex: log.transactionIndex,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
      address: log.address,
      topics: [...log.topics],
      data: log.data,
      logIndex: log.index,
      blockHash: log.blockHash,
      // Mined receipt logs omit the removed field in the existing export format.
      removed: undefined,
    })),
    blockNumber: receipt.blockNumber,
    cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
    status: receipt.status,
    byzantium: receipt.status !== null,
  }
  // hardhat-deploy's types exclude the null addresses and absent `removed`
  // field emitted by ethers v5. Preserve the existing JSON contract here.
  return deploymentReceipt as unknown as Receipt
}

export interface HardhatUpgradesHelpers {
  deployProxy<T extends BaseContract = Contract>(
    name: string,
    opts?: UpgradesDeployOptions
  ): Promise<[T, Deployment]>
  upgradeProxy<T extends BaseContract = Contract>(
    currentContractName: string,
    newContractName: string,
    opts?: UpgradesUpgradeOptions
  ): Promise<[T, Deployment]>
  prepareProxyUpgrade(
    proxyDeploymentName: string,
    newContractName: string,
    opts?: UpgradesPrepareProxyUpgradeOptions
  ): Promise<{
    newImplementationAddress: string
    preparedTransaction: ContractTransaction
  }>
}

type CustomFactoryOptions = FactoryOptions & {
  libraries?: Libraries
}

export interface UpgradesDeployOptions {
  /** Deploy a fresh proxy and replace this name only after success. */
  redeploy?: boolean
  contractName?: string
  initializerArgs?: unknown[]
  factoryOpts?: CustomFactoryOptions
  proxyOpts?: DeployProxyOptions
}

export interface UpgradesUpgradeOptions {
  contractName?: string
  initializerArgs?: unknown[]
  factoryOpts?: CustomFactoryOptions
  proxyOpts?: UpgradeProxyOptions
}

export interface UpgradesPrepareProxyUpgradeOptions {
  contractName?: string
  factoryOpts?: CustomFactoryOptions
  callData?: string
}

/**
 * Deploys contract as a TransparentProxy.
 *
 * @param {HardhatRuntimeEnvironment} hre Hardhat runtime environment.
 * @param {string} name Contract Name
 * @param {UpgradesDeployOptions} opts
 */
export async function deployProxy<T extends BaseContract = Contract>(
  hre: HardhatRuntimeEnvironment,
  name: string,
  opts?: UpgradesDeployOptions
): Promise<[T, Deployment]> {
  const { ethers, upgrades, deployments, artifacts } = hre
  const { log } = deployments

  const existingDeployment = await deployments.getOrNull(name)
  if (existingDeployment && !opts?.redeploy) {
    throw new Error(
      `${name} was already deployed at ${existingDeployment.address}`
    )
  }

  const contractFactory: ContractFactory = await ethers.getContractFactory(
    opts?.contractName || name,
    opts?.factoryOpts
  )

  const contractInstance: T = (await upgrades.deployProxy(
    contractFactory,
    opts?.initializerArgs,
    opts?.proxyOpts
  )) as unknown as T

  const deploymentTransaction = contractInstance.deploymentTransaction()

  // Let the transaction propagate across the ethereum nodes. This is mostly to
  // wait for all Alchemy nodes to catch up their state.
  const transactionReceipt = await deploymentTransaction?.wait(1)

  const contractAddress = await contractInstance.getAddress()
  const transactionHash = deploymentTransaction?.hash

  log(
    `Deployed ${name} as ${
      opts?.proxyOpts?.kind || "transparent"
    } proxy at ${contractAddress} (tx: ${transactionHash})`
  )

  const artifact = artifacts.readArtifactSync(opts?.contractName || name)

  const implementation = await upgrades.erc1967.getImplementationAddress(
    contractAddress
  )

  if (!transactionReceipt || !transactionHash) {
    throw new Error(
      `Could not find transaction receipt for transaction hash: ${transactionHash}`
    )
  }

  const deployment: Deployment = {
    address: contractAddress,
    abi: artifact.abi,
    transactionHash: transactionHash,
    implementation: implementation,
    receipt: toDeploymentReceipt(transactionReceipt),
    libraries: opts?.factoryOpts?.libraries,
    devdoc: "Contract deployed as upgradable proxy",
    args: opts?.proxyOpts?.constructorArgs,
  }

  await deployments.save(name, deployment)

  return [contractInstance, deployment]
}

/**
 * Upgrades previously deployed contract.
 *
 * @param {HardhatRuntimeEnvironment} hre Hardhat runtime environment.
 * @param {string} proxyDeploymentName Name of the proxy deployment that will be
 *        upgraded.
 * @param {string} newContractName Name of the new implementation contract.
 * @param {UpgradesDeployOptions} opts
 */
async function upgradeProxy<T extends BaseContract = Contract>(
  hre: HardhatRuntimeEnvironment,
  proxyDeploymentName: string,
  newContractName: string,
  opts?: UpgradesUpgradeOptions
): Promise<[T, Deployment]> {
  const { ethers, upgrades, deployments, artifacts } = hre
  const { log } = deployments

  const proxyDeployment: Deployment = await deployments.get(proxyDeploymentName)

  const newContract: ContractFactory = await ethers.getContractFactory(
    opts?.contractName || newContractName,
    opts?.factoryOpts
  )

  const newContractInstance: T = (await upgrades.upgradeProxy(
    proxyDeployment.address,
    newContract,
    opts?.proxyOpts
  )) as unknown as T

  // Supported OpenZeppelin 2.x/3.x plugins attach the upgrade transaction to
  // deployTransaction, including current upstream releases. Keep this adapter
  // until every supported version returns it through the ethers v6 API.
  const deploymentTransaction =
    newContractInstance.deploymentTransaction() ??
    (
      newContractInstance as BaseContract & {
        deployTransaction?: ContractTransactionResponse
      }
    ).deployTransaction

  // Let the transaction propagate across the ethereum nodes. This is mostly to
  // wait for all Alchemy nodes to catch up their state.
  const transactionReceipt = await deploymentTransaction?.wait(1)

  const contractAddress = await newContractInstance.getAddress()
  const transactionHash = deploymentTransaction?.hash

  log(
    `Upgraded ${proxyDeploymentName} proxy contract (address: ${proxyDeployment.address}) ` +
      `in tx: ${transactionHash}`
  )

  const artifact: Artifact = artifacts.readArtifactSync(
    opts?.contractName || newContractName
  )

  const implementation = await upgrades.erc1967.getImplementationAddress(
    contractAddress
  )

  log(
    `New ${proxyDeploymentName} proxy contract implementation address is: ${implementation}`
  )

  if (!transactionReceipt || !transactionHash) {
    throw new Error(
      `Could not find transaction receipt for transaction hash: ${transactionHash}`
    )
  }

  const deployment: Deployment = {
    address: contractAddress,
    abi: artifact.abi,
    transactionHash: transactionHash,
    implementation: implementation,
    receipt: toDeploymentReceipt(transactionReceipt),
    libraries: opts?.factoryOpts?.libraries,
    devdoc: "Contract deployed as upgradable proxy",
    args: opts?.proxyOpts?.constructorArgs,
  }

  await deployments.save(proxyDeploymentName, deployment)

  return [newContractInstance, deployment]
}

/**
 * Prepare upgrade of deployed contract.
 * It deploys new implementation contract and prepares transaction to upgrade
 * the proxy contract to the new implementation thorough a Proxy Admin instance.
 * The transaction has to be executed by the owner of the Proxy Admin.
 *
 * @param {HardhatRuntimeEnvironment} hre Hardhat runtime environment.
 * @param {string} proxyDeploymentName Name of the proxy deployment that will be
 *        upgraded.
 * @param {string} newContractName Name of the new implementation contract.
 * @param {UpgradesPrepareProxyUpgradeOptions} opts
 */
async function prepareProxyUpgrade(
  hre: HardhatRuntimeEnvironment,
  proxyDeploymentName: string,
  newContractName: string,
  opts?: UpgradesPrepareProxyUpgradeOptions
): Promise<{
  newImplementationAddress: string
  preparedTransaction: ContractTransaction
}> {
  const { ethers, upgrades, deployments } = hre
  const signer = await ethers.provider.getSigner()
  const { log } = deployments

  const proxyDeployment: Deployment = await deployments.get(proxyDeploymentName)

  const implementationContractFactory: ContractFactory =
    await ethers.getContractFactory(
      opts?.contractName || newContractName,
      opts?.factoryOpts
    )

  const newImplementationAddress: string = (await upgrades.prepareUpgrade(
    proxyDeployment.address,
    implementationContractFactory,
    {
      kind: "transparent",
      getTxResponse: false,
    }
  )) as string

  log(`new implementation contract deployed at: ${newImplementationAddress}`)

  const proxyAdminAddress = await hre.upgrades.erc1967.getAdminAddress(
    proxyDeployment.address
  )

  let proxyAdmin: Contract
  let upgradeTxData: string

  const proxyInterfaceVersion = await getUpgradeInterfaceVersion(
    hre.network.provider,
    proxyAdminAddress
  )

  switch (proxyInterfaceVersion) {
    case "5.0.0": {
      proxyAdmin = await hre.ethers.getContractAt(
        ProxyAdminV5.abi,
        proxyAdminAddress,
        signer
      )

      upgradeTxData = proxyAdmin.interface.encodeFunctionData(
        "upgradeAndCall",
        [
          proxyDeployment.address,
          newImplementationAddress,
          opts?.callData ?? "0x",
        ]
      )
      break
    }
    default: {
      proxyAdmin = await hre.ethers.getContractAt(
        ProxyAdminV4.abi,
        proxyAdminAddress,
        signer
      )

      if (opts?.callData) {
        upgradeTxData = proxyAdmin.interface.encodeFunctionData(
          "upgradeAndCall",
          [proxyDeployment.address, newImplementationAddress, opts?.callData]
        )
      } else {
        upgradeTxData = proxyAdmin.interface.encodeFunctionData("upgrade", [
          proxyDeployment.address,
          newImplementationAddress,
        ])
      }
    }
  }

  const preparedTransaction: ContractTransaction = {
    from: (await proxyAdmin.owner()) as string,
    to: proxyAdminAddress,
    data: upgradeTxData,
  }

  deployments.log(
    `to upgrade the proxy implementation execute the following ` +
      `transaction:\n${JSON.stringify(preparedTransaction, null, 2)}`
  )

  // Preparation is not execution. Keep the canonical deployment unchanged
  // until the admin transaction has been mined and independently confirmed.

  return { newImplementationAddress, preparedTransaction }
}

export default function (
  hre: HardhatRuntimeEnvironment
): HardhatUpgradesHelpers {
  return {
    deployProxy: (name: string, opts?: UpgradesDeployOptions) =>
      deployProxy(hre, name, opts),
    upgradeProxy: (
      currentContractName: string,
      newContractName: string,
      opts?: UpgradesUpgradeOptions
    ) => upgradeProxy(hre, currentContractName, newContractName, opts),
    prepareProxyUpgrade: (
      proxyDeploymentName: string,
      newContractName: string,
      opts?: UpgradesPrepareProxyUpgradeOptions
    ) => prepareProxyUpgrade(hre, proxyDeploymentName, newContractName, opts),
  }
}
