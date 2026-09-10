import { HardhatRuntimeEnvironment } from "hardhat/types";
export declare type DeploymentArtifactsExportUserConfig = {
    default?: string;
    [networkName: string]: string | undefined;
};
export declare type DeploymentArtifactsExportConfig = {
    [networkName: string]: string;
};
export declare function exportDeploymentArtifacts(hre: HardhatRuntimeEnvironment): void;
//# sourceMappingURL=deployment-artifacts.d.ts.map