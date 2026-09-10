"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferOwnership = void 0;
/**
 * Transfers ownership of an Ownable contract to a specific address.
 *
 * @param {HardhatRuntimeEnvironment} hre Hardhat runtime environment.
 * @param {string} contractName Deployed Contract Name
 * @param {string} newOwnerAddress New Owner Address
 * @param {string} from Address to send transaction from.
 */
async function transferOwnership(hre, contractName, newOwnerAddress, from) {
    const { helpers, deployments } = hre;
    const { log } = deployments;
    const currentOwner = await deployments.read(contractName, { from }, "owner");
    if (!(currentOwner && helpers.address.equal(currentOwner, newOwnerAddress))) {
        log(`transferring ownership of ${contractName} to ${newOwnerAddress}`);
        await deployments.execute(contractName, { from: from, log: true, waitConfirmations: 1 }, "transferOwnership", newOwnerAddress);
    }
    else {
        log(`${contractName} is owned by ${currentOwner}`);
    }
}
exports.transferOwnership = transferOwnership;
function default_1(hre) {
    return {
        transferOwnership: (contractName, newOwnerAddress, from) => transferOwnership(hre, contractName, newOwnerAddress, from),
    };
}
exports.default = default_1;
//# sourceMappingURL=ownable.js.map