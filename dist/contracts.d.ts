import type { Contract } from "ethers";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
export interface HardhatContractsHelpers {
    getContract<T extends Contract>(deploymentName: string): Promise<T>;
}
export default function (hre: HardhatRuntimeEnvironment): HardhatContractsHelpers;
//# sourceMappingURL=contracts.d.ts.map