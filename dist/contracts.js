"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function getContract(hre, deploymentName) {
    const deployment = await hre.deployments.get(deploymentName);
    return (await hre.ethers.getContractAt(deployment.abi, deployment.address));
}
function default_1(hre) {
    return {
        getContract: (deploymentName) => getContract(hre, deploymentName),
    };
}
exports.default = default_1;
//# sourceMappingURL=contracts.js.map