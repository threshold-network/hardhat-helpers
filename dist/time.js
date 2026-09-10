"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mineBlocksTo = exports.mineBlocks = exports.increaseTime = exports.lastBlockTime = void 0;
const ethers_1 = require("ethers");
/**
 * Returns number of the latest block.
 * @param {Provider} provider Ethers provider
 * @return {number} Latest block number.
 */
async function lastBlockNumber(provider) {
    return (await provider.getBlock("latest")).number;
}
/**
 * Returns timestamp of the latest block.
 * @param {Provider} provider Ethers provider
 * @return {number} Latest block timestamp.
 */
async function lastBlockTime(provider) {
    return (await provider.getBlock("latest")).timestamp;
}
exports.lastBlockTime = lastBlockTime;
/**
 * Increases block timestamp by the specified time period.
 * @param {Provider} provider Ethers provider
 * @param {BigNumberish} time Time period that should pass to the next mined block.
 * @return {number} Timestamp of the next block.
 */
async function increaseTime(provider, time) {
    const lastBlock = await lastBlockTime(provider);
    const expectedTime = ethers_1.ethers.BigNumber.from(lastBlock).add(time);
    await provider.send("evm_setNextBlockTimestamp", [expectedTime.toHexString()]);
    await provider.send("evm_mine", []);
    return expectedTime;
}
exports.increaseTime = increaseTime;
/**
 * Mines specific number of blocks.
 * @param {JsonRpcProvider} provider Ethers provider
 * @param {number} blocks
 * @return {number} Latest block number.
 */
async function mineBlocks(provider, blocks) {
    for (let i = 0; i < blocks; i++) {
        await provider.send("evm_mine", []);
    }
    return (await provider.getBlock("latest")).number;
}
exports.mineBlocks = mineBlocks;
/**
 * Mines blocks to get to the specific target block number.
 * @param {JsonRpcProvider} provider Ethers provider
 * @param {number} targetBlock
 * @return {number} Latest block number.
 * @throws Will throw an error if target block already passed.
 */
async function mineBlocksTo(provider, targetBlock) {
    const lastBlockNumber = (await provider.getBlock("latest")).number;
    if (targetBlock < lastBlockNumber)
        throw new Error(`target block number already passed; latest block number is [${lastBlockNumber}]`);
    const blocksToMine = targetBlock - lastBlockNumber;
    for (let i = 0; i < blocksToMine; i++) {
        await provider.send("evm_mine", []);
    }
    return (await provider.getBlock("latest")).number;
}
exports.mineBlocksTo = mineBlocksTo;
function default_1(hre) {
    const provider = hre.ethers.provider;
    return {
        lastBlockNumber: () => lastBlockNumber(provider),
        lastBlockTime: () => lastBlockTime(provider),
        increaseTime: (time) => increaseTime(provider, time),
        mineBlocks: (blocks) => mineBlocks(provider, blocks),
        mineBlocksTo: (targetBlock) => mineBlocksTo(provider, targetBlock),
    };
}
exports.default = default_1;
//# sourceMappingURL=time.js.map