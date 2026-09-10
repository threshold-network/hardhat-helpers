"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreSnapshot = exports.createSnapshot = void 0;
const snapshotIdsStack = [];
/**
 * Snapshot the state of the blockchain at the current.
 * @param {JsonRpcProvider} provider Ethers provider
 */
async function createSnapshot(provider) {
    const snapshotId = await provider.send("evm_snapshot", []);
    snapshotIdsStack.push(snapshotId);
}
exports.createSnapshot = createSnapshot;
/**
 * Restores the chain to a latest snapshot.
 * @param {JsonRpcProvider} provider Ethers provider
 */
async function restoreSnapshot(provider) {
    const snapshotId = snapshotIdsStack.pop();
    await provider.send("evm_revert", [snapshotId]);
}
exports.restoreSnapshot = restoreSnapshot;
function default_1(hre) {
    const provider = hre.ethers.provider;
    return {
        createSnapshot: () => createSnapshot(provider),
        restoreSnapshot: () => restoreSnapshot(provider),
    };
}
exports.default = default_1;
//# sourceMappingURL=snapshot.js.map