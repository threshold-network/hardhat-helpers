"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.from1ePrecision = exports.from1e18 = exports.to1ePrecision = exports.to1e18 = void 0;
const bignumber_1 = require("@ethersproject/bignumber");
const ethers_1 = require("ethers");
function to1e18(n) {
    return to1ePrecision(n, 18);
}
exports.to1e18 = to1e18;
function to1ePrecision(n, precision) {
    const decimalMultiplier = ethers_1.BigNumber.from(10).pow(precision);
    return ethers_1.BigNumber.from(n).mul(decimalMultiplier);
}
exports.to1ePrecision = to1ePrecision;
function from1e18(n) {
    return from1ePrecision(n, 18);
}
exports.from1e18 = from1e18;
function from1ePrecision(n, precision) {
    const value = ethers_1.BigNumber.from(n);
    const decimalMultiplier = ethers_1.BigNumber.from(10).pow(precision);
    return value.gte(decimalMultiplier) && value.mod(decimalMultiplier).isZero()
        ? value.div(decimalMultiplier).toString()
        : bignumber_1.formatFixed(n, precision);
}
exports.from1ePrecision = from1ePrecision;
//# sourceMappingURL=number.js.map