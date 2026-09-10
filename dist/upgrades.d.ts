import "@openzeppelin/hardhat-upgrades";
import type { Contract } from "ethers";
import type { FactoryOptions, HardhatRuntimeEnvironment } from "hardhat/types";
import type { Deployment } from "hardhat-deploy/dist/types";
import type { DeployProxyOptions, UpgradeProxyOptions } from "@openzeppelin/hardhat-upgrades/src/utils/options";
export interface HardhatUpgradesHelpers {
    deployProxy<T extends Contract>(name: string, opts?: UpgradesDeployOptions): Promise<[T, Deployment]>;
    upgradeProxy<T extends Contract>(currentContractName: string, newContractName: string, opts?: UpgradesUpgradeOptions): Promise<[T, Deployment]>;
}
export interface UpgradesDeployOptions {
    contractName?: string;
    initializerArgs?: unknown[];
    factoryOpts?: FactoryOptions;
    proxyOpts?: DeployProxyOptions;
}
export interface UpgradesUpgradeOptions {
    contractName?: string;
    initializerArgs?: unknown[];
    factoryOpts?: FactoryOptions;
    proxyOpts?: UpgradeProxyOptions;
}
/**
 * Deploys contract as a TransparentProxy.
 *
 * @param {HardhatRuntimeEnvironment} hre Hardhat runtime environment.
 * @param {string} name Contract Name
 * @param {UpgradesDeployOptions} opts
 */
export declare function deployProxy<T extends Contract>(hre: HardhatRuntimeEnvironment, name: string, opts?: UpgradesDeployOptions): Promise<[T, Deployment]>;
export default function (hre: HardhatRuntimeEnvironment): HardhatUpgradesHelpers;
//# sourceMappingURL=upgrades.d.ts.map