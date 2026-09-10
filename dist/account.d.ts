import "@nomiclabs/hardhat-ethers";
import type { BigNumberish, Signer } from "ethers";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
export declare type FundOptions = {
    from: Signer;
    value?: BigNumberish;
    unit?: string;
};
export interface HardhatAccountHelpers {
    impersonateAccount(accountAddress: string, fundOptions?: FundOptions): Promise<SignerWithAddress>;
}
export default function (hre: HardhatRuntimeEnvironment): HardhatAccountHelpers;
//# sourceMappingURL=account.d.ts.map