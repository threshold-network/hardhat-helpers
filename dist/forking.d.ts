import type { HardhatRuntimeEnvironment } from "hardhat/types";
export interface HardhatForkingHelpers {
    resetFork(blockNumber: number): Promise<void>;
}
export default function (hre: HardhatRuntimeEnvironment): HardhatForkingHelpers;
//# sourceMappingURL=forking.d.ts.map