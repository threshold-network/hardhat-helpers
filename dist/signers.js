"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function getNamedSigners(hre) {
    const namedSigners = {};
    await Promise.all(Object.entries(await hre.getNamedAccounts()).map(async ([name, address]) => {
        namedSigners[name] = await hre.ethers.getSigner(address);
    }));
    return namedSigners;
}
async function getUnnamedSigners(hre) {
    const unnamedSigners = [];
    await Promise.all((await hre.getUnnamedAccounts()).map(async (address) => {
        unnamedSigners.push(await hre.ethers.getSigner(address));
    }));
    return unnamedSigners;
}
function default_1(hre) {
    return {
        getNamedSigners: () => getNamedSigners(hre),
        getUnnamedSigners: () => getUnnamedSigners(hre),
    };
}
exports.default = default_1;
//# sourceMappingURL=signers.js.map