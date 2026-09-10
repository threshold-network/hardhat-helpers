import { JsonRpcProvider } from "@ethersproject/providers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
export interface HardhatSnapshotHelpers {
    createSnapshot(): Promise<void>;
    restoreSnapshot(): Promise<void>;
}
/**
 * Snapshot the state of the blockchain at the current.
 * @param {JsonRpcProvider} provider Ethers provider
 */
export declare function createSnapshot(provider: JsonRpcProvider): Promise<void>;
/**
 * Restores the chain to a latest snapshot.
 * @param {JsonRpcProvider} provider Ethers provider
 */
export declare function restoreSnapshot(provider: JsonRpcProvider): Promise<void>;
export default function (hre: HardhatRuntimeEnvironment): HardhatSnapshotHelpers;
//# sourceMappingURL=snapshot.d.ts.map