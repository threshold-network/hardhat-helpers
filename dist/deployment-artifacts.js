"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportDeploymentArtifacts = void 0;
const plugins_1 = require("hardhat/plugins");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path = __importStar(require("path"));
const emoji_1 = require("hardhat/internal/cli/emoji");
function exportDeploymentArtifacts(hre) {
    const networkName = hre.network.name;
    const sourceDir = path.join(hre.config.paths.deployments, networkName);
    const destinationDir = path.resolve(hre.config.deploymentArtifactsExport[networkName]);
    console.log(`Exporting deployment artifacts for network ${networkName}...`);
    if (!fs_extra_1.default.pathExistsSync(sourceDir)) {
        throw new plugins_1.HardhatPluginError("@keep-network/hardhat-helpers", `source deployments artifacts directory doesn't exist [${sourceDir}]`);
    }
    console.debug(`  Source:      ${sourceDir}\n  Destination: ${destinationDir}`);
    fs_extra_1.default.ensureDirSync(destinationDir);
    if (!isDirEmpty(destinationDir)) {
        throw new plugins_1.HardhatPluginError("@keep-network/hardhat-helpers", `destination dir is not empty [${destinationDir}]`);
    }
    fs_extra_1.default.copySync(sourceDir, destinationDir, {
        recursive: true,
    });
    // TODO: Remove address for `hardhat` network.
    console.log(`${emoji_1.emoji("🙌 ")}Done!`);
}
exports.exportDeploymentArtifacts = exportDeploymentArtifacts;
function isDirEmpty(dirname) {
    const files = fs_extra_1.default.readdirSync(dirname);
    return files.length === 0;
}
//# sourceMappingURL=deployment-artifacts.js.map