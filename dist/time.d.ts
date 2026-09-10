import type { Provider, JsonRpcProvider } from "@ethersproject/providers";
import type { BigNumberish, BigNumber } from "ethers";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
export interface HardhatTimeHelpers {
    /**
     * Returns number of the latest block.
     * @return {number} Latest block number.
     */
    lastBlockNumber(): Promise<number>;
    /**
     * Returns timestamp of the latest block.
     * @return {number} Latest block timestamp.
     */
    lastBlockTime(): Promise<number>;
    /**
     * Increases block timestamp by the specified time period.
     * @param {BigNumberish} time Time period that should pass to the next mined block.
     * @return {number} Timestamp of the next block.
     */
    increaseTime(time: BigNumberish): Promise<BigNumber>;
    /**
     * Mines specific number of blocks.
     * @param {BigNumberish} blocks
     */
    mineBlocks(blocks: number): Promise<number>;
    /**
     * Mines blocks to get to a specific block number.
     * @param {BigNumberish} blocks
     */
    mineBlocksTo(blocks: number): Promise<number>;
}
/**
 * Returns timestamp of the latest block.
 * @param {Provider} provider Ethers provider
 * @return {number} Latest block timestamp.
 */
export declare function lastBlockTime(provider: Provider): Promise<number>;
/**
 * Increases block timestamp by the specified time period.
 * @param {Provider} provider Ethers provider
 * @param {BigNumberish} time Time period that should pass to the next mined block.
 * @return {number} Timestamp of the next block.
 */
export declare function increaseTime(provider: JsonRpcProvider, time: BigNumberish): Promise<BigNumber>;
/**
 * Mines specific number of blocks.
 * @param {JsonRpcProvider} provider Ethers provider
 * @param {number} blocks
 * @return {number} Latest block number.
 */
export declare function mineBlocks(provider: JsonRpcProvider, blocks: number): Promise<number>;
/**
 * Mines blocks to get to the specific target block number.
 * @param {JsonRpcProvider} provider Ethers provider
 * @param {number} targetBlock
 * @return {number} Latest block number.
 * @throws Will throw an error if target block already passed.
 */
export declare function mineBlocksTo(provider: JsonRpcProvider, targetBlock: number): Promise<number>;
export default function (hre: HardhatRuntimeEnvironment): HardhatTimeHelpers;
//# sourceMappingURL=time.d.ts.map