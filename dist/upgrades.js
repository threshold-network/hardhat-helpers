"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deployProxy = void 0;
require("@openzeppelin/hardhat-upgrades");
/**
 * Deploys contract as a TransparentProxy.
 *
 * @param {HardhatRuntimeEnvironment} hre Hardhat runtime environment.
 * @param {string} name Contract Name
 * @param {UpgradesDeployOptions} opts
 */
async function deployProxy(hre, name, opts) {
    var _a, _b, _c;
    const { ethers, upgrades, deployments, artifacts } = hre;
    const { log } = deployments;
    const existingDeployment = await deployments.getOrNull(name);
    if (existingDeployment) {
        throw new Error(`${name} was already deployed at ${existingDeployment.address}`);
    }
    const contractFactory = await ethers.getContractFactory((opts === null || opts === void 0 ? void 0 : opts.contractName) || name, opts === null || opts === void 0 ? void 0 : opts.factoryOpts);
    const contractInstance = (await upgrades.deployProxy(contractFactory, opts === null || opts === void 0 ? void 0 : opts.initializerArgs, opts === null || opts === void 0 ? void 0 : opts.proxyOpts));
    // Let the transaction propagate across the ethereum nodes. This is mostly to
    // wait for all Alchemy nodes to catch up their state.
    await contractInstance.deployTransaction.wait(1);
    log(`Deployed ${name} as ${((_a = opts === null || opts === void 0 ? void 0 : opts.proxyOpts) === null || _a === void 0 ? void 0 : _a.kind) || "transparent"} proxy at ${contractInstance.address} (tx: ${contractInstance.deployTransaction.hash})`);
    const artifact = artifacts.readArtifactSync((opts === null || opts === void 0 ? void 0 : opts.contractName) || name);
    const adminInstance = await upgrades.admin.getInstance();
    const implementation = await adminInstance.getProxyImplementation(contractInstance.address);
    const transactionReceipt = await ethers.provider.getTransactionReceipt(contractInstance.deployTransaction.hash);
    const deployment = {
        address: contractInstance.address,
        abi: artifact.abi,
        transactionHash: contractInstance.deployTransaction.hash,
        implementation: implementation,
        receipt: transactionReceipt,
        libraries: (_b = opts === null || opts === void 0 ? void 0 : opts.factoryOpts) === null || _b === void 0 ? void 0 : _b.libraries,
        devdoc: "Contract deployed as upgradable proxy",
        args: (_c = opts === null || opts === void 0 ? void 0 : opts.proxyOpts) === null || _c === void 0 ? void 0 : _c.constructorArgs,
    };
    await deployments.save(name, deployment);
    return [contractInstance, deployment];
}
exports.deployProxy = deployProxy;
/**
 * Upgrades previously deployed contract.
 *
 * @param {HardhatRuntimeEnvironment} hre Hardhat runtime environment.
 * @param {string} proxyDeploymentName Name of the proxy deployment that will be
 *        upgraded.
 * @param {string} newContractName Name of the new implementation contract.
 * @param {UpgradesDeployOptions} opts
 */
async function upgradeProxy(hre, proxyDeploymentName, newContractName, opts) {
    var _a, _b;
    const { ethers, upgrades, deployments, artifacts } = hre;
    const { log } = deployments;
    const proxyDeployment = await deployments.get(proxyDeploymentName);
    const newContract = await ethers.getContractFactory((opts === null || opts === void 0 ? void 0 : opts.contractName) || newContractName, opts === null || opts === void 0 ? void 0 : opts.factoryOpts);
    const newContractInstance = (await upgrades.upgradeProxy(proxyDeployment.address, newContract, opts === null || opts === void 0 ? void 0 : opts.proxyOpts));
    // Let the transaction propagate across the ethereum nodes. This is mostly to
    // wait for all Alchemy nodes to catch up their state.
    await newContractInstance.deployTransaction.wait(1);
    log(`Upgraded ${proxyDeploymentName} proxy contract (address: ${proxyDeployment.address}) ` +
        `in tx: ${newContractInstance.deployTransaction.hash}`);
    const artifact = artifacts.readArtifactSync((opts === null || opts === void 0 ? void 0 : opts.contractName) || newContractName);
    const adminInstance = await upgrades.admin.getInstance();
    const implementation = await adminInstance.getProxyImplementation(newContractInstance.address);
    log(`New ${proxyDeploymentName} proxy contract implementation address is: ${implementation}`);
    const transactionReceipt = await ethers.provider.getTransactionReceipt(newContractInstance.deployTransaction.hash);
    const deployment = {
        address: newContractInstance.address,
        abi: artifact.abi,
        transactionHash: newContractInstance.deployTransaction.hash,
        implementation: implementation,
        receipt: transactionReceipt,
        libraries: (_a = opts === null || opts === void 0 ? void 0 : opts.factoryOpts) === null || _a === void 0 ? void 0 : _a.libraries,
        devdoc: "Contract deployed as upgradable proxy",
        args: (_b = opts === null || opts === void 0 ? void 0 : opts.proxyOpts) === null || _b === void 0 ? void 0 : _b.constructorArgs,
    };
    await deployments.save(proxyDeploymentName, deployment);
    return [newContractInstance, deployment];
}
function default_1(hre) {
    return {
        deployProxy: (name, opts) => deployProxy(hre, name, opts),
        upgradeProxy: (currentContractName, newContractName, opts) => upgradeProxy(hre, currentContractName, newContractName, opts),
    };
}
exports.default = default_1;
//# sourceMappingURL=upgrades.js.map