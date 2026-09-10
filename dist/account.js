"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@nomiclabs/hardhat-ethers");
async function impersonateAccount(hre, accountAddress, fundOptions) {
    var _a;
    // Make the required call against Hardhat Runtime Environment.
    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [accountAddress],
    });
    if (fundOptions === null || fundOptions === void 0 ? void 0 : fundOptions.from) {
        // Fund the account using a purse account in order to make transactions.
        // In case the account represents a contract, keep in mind the contract must
        // have a receive or fallback method to be funded successfully.
        let fundingValue;
        if (fundOptions.unit) {
            fundingValue = hre.ethers.utils.parseUnits(fundOptions.value.toString(), fundOptions.unit);
        }
        else {
            fundingValue = hre.ethers.utils.parseEther(((_a = fundOptions.value) === null || _a === void 0 ? void 0 : _a.toString()) || "1");
        }
        await fundOptions.from.sendTransaction({
            to: accountAddress,
            value: fundingValue,
        });
    }
    // Return the account's signer.
    return await hre.ethers.getSigner(accountAddress);
}
function default_1(hre) {
    return {
        impersonateAccount: (accountAddress, fundOptions) => impersonateAccount(hre, accountAddress, fundOptions),
    };
}
exports.default = default_1;
//# sourceMappingURL=account.js.map