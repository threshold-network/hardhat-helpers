"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const plugins_1 = require("hardhat/plugins");
// This function is meant to be used along with the Hardhat forking feature
// (https://hardhat.org/guides/mainnet-forking.html). It resets the fork state
// to the given origin block. It is especially useful in system tests
// environment which leverage mainnet forking feature. For example, it
// can be used to set the environment to the same deterministic state, before
// each test case.
async function resetFork(hre, blockNumber) {
    if (hre.network.config.forking) {
        await hre.network.provider.request({
            method: "hardhat_reset",
            params: [
                {
                    forking: {
                        jsonRpcUrl: hre.network.config.forking
                            .url,
                        blockNumber: blockNumber,
                    },
                },
            ],
        });
    }
    else {
        throw new plugins_1.HardhatPluginError("@keep-network/hardhat-helpers", "network is not in the forking mode");
    }
}
function default_1(hre) {
    return {
        resetFork: (blockNumber) => resetFork(hre, blockNumber),
    };
}
exports.default = default_1;
//# sourceMappingURL=forking.js.map