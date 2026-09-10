import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { Deployment } from "hardhat-deploy/dist/types";
export interface HardhatEtherscanHelpers {
    verify(deployment: Deployment, contract?: string): Promise<void>;
}
export default function (hre: HardhatRuntimeEnvironment): HardhatEtherscanHelpers;
//# sourceMappingURL=etherscan.d.ts.map