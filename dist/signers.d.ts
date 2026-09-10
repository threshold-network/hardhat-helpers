import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
declare type NamedSigners = {
    [name: string]: SignerWithAddress;
};
export interface HardhatSignersHelpers {
    getNamedSigners(): Promise<NamedSigners>;
    getUnnamedSigners(): Promise<SignerWithAddress[]>;
}
export default function (hre: HardhatRuntimeEnvironment): HardhatSignersHelpers;
export {};
//# sourceMappingURL=signers.d.ts.map