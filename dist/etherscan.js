"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Verifies contract on Etherscan.
 *
 * @param {HardhatRuntimeEnvironment} hre Hardhat runtime environment.
 * @param {Deployment} deployment Deployment Artifact
 * @param {string} contract Contract Name
 */
async function verify(hre, deployment, contract) {
    try {
        console.log(`Verifying contract ${deployment.address} on Etherscan...`);
        await hre.run("verify:verify", {
            address: deployment.address,
            constructorArguments: deployment.args,
            libraries: deployment.libraries,
            contract: contract,
        });
        // Catch the error to workaround https://github.com/NomicFoundation/hardhat/issues/2287
    }
    catch (err) {
        if (err instanceof Error &&
            (err.message.includes("Contract source code already verified") ||
                err.message.includes("Already Verified"))) {
            console.log("Contract is already verified");
        }
        else {
            console.error(err);
        }
    }
}
function default_1(hre) {
    return {
        verify: (deployment, contract) => verify(hre, deployment, contract),
    };
}
exports.default = default_1;
//# sourceMappingURL=etherscan.js.map