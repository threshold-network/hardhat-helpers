import type { HardhatRuntimeEnvironment } from "hardhat/types";
export interface HardhatOwnableHelpers {
    transferOwnership(contractName: string, newOwnerAddress: string, from: string): Promise<void>;
}
/**
 * Transfers ownership of an Ownable contract to a specific address.
 *
 * @param {HardhatRuntimeEnvironment} hre Hardhat runtime environment.
 * @param {string} contractName Deployed Contract Name
 * @param {string} newOwnerAddress New Owner Address
 * @param {string} from Address to send transaction from.
 */
export declare function transferOwnership(hre: HardhatRuntimeEnvironment, contractName: string, newOwnerAddress: string, from: string): Promise<void>;
export default function (hre: HardhatRuntimeEnvironment): HardhatOwnableHelpers;
//# sourceMappingURL=ownable.d.ts.map