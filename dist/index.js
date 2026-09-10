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
exports.TASK_EXPORT_DEPLOYMENT_ARTIFACTS = void 0;
const config_1 = require("hardhat/config");
const plugins_1 = require("hardhat/plugins");
const emoji_1 = require("hardhat/internal/cli/emoji");
const path = __importStar(require("path"));
const account_1 = __importDefault(require("./account"));
const address = __importStar(require("./address"));
const contracts_1 = __importDefault(require("./contracts"));
const deployment_artifacts_1 = require("./deployment-artifacts");
const etherscan_1 = __importDefault(require("./etherscan"));
const forking_1 = __importDefault(require("./forking"));
const number = __importStar(require("./number"));
const ownable_1 = __importDefault(require("./ownable"));
const time_1 = __importDefault(require("./time"));
const signers_1 = __importDefault(require("./signers"));
const snapshot_1 = __importDefault(require("./snapshot"));
const upgrades_1 = __importDefault(require("./upgrades"));
require("./type-extensions");
require("hardhat-deploy/dist/src/type-extensions");
require("@openzeppelin/hardhat-upgrades/dist/type-extensions");
config_1.extendEnvironment((hre) => {
    if (hre.hardhatArguments.emoji) {
        emoji_1.enableEmoji();
    }
    hre.helpers = plugins_1.lazyObject(() => {
        return {
            account: plugins_1.lazyObject(() => {
                return account_1.default(hre);
            }),
            address: plugins_1.lazyObject(() => {
                return address;
            }),
            contracts: plugins_1.lazyObject(() => {
                return contracts_1.default(hre);
            }),
            etherscan: plugins_1.lazyObject(() => {
                return etherscan_1.default(hre);
            }),
            forking: plugins_1.lazyObject(() => {
                return forking_1.default(hre);
            }),
            number: plugins_1.lazyObject(() => {
                return number;
            }),
            ownable: plugins_1.lazyObject(() => {
                return ownable_1.default(hre);
            }),
            time: plugins_1.lazyObject(() => {
                return time_1.default(hre);
            }),
            signers: plugins_1.lazyObject(() => {
                return signers_1.default(hre);
            }),
            snapshot: plugins_1.lazyObject(() => {
                return snapshot_1.default(hre);
            }),
            upgrades: plugins_1.lazyObject(() => {
                return upgrades_1.default(hre);
            }),
        };
    });
});
config_1.extendConfig((config, userConfig) => {
    var _a;
    const exportUserConfig = userConfig.deploymentArtifactsExport;
    if (config.deploymentArtifactsExport === undefined) {
        config.deploymentArtifactsExport = {};
    }
    let defaultDestinationDir = (_a = exportUserConfig === null || exportUserConfig === void 0 ? void 0 : exportUserConfig.default) !== null && _a !== void 0 ? _a : "artifacts";
    if (path.isAbsolute(defaultDestinationDir)) {
        defaultDestinationDir = defaultDestinationDir;
    }
    else {
        defaultDestinationDir = path.normalize(path.join(config.paths.root, defaultDestinationDir));
    }
    const networks = Object.keys(config.networks);
    networks.forEach((networkName) => {
        if (exportUserConfig === undefined ||
            exportUserConfig[networkName] === undefined) {
            config.deploymentArtifactsExport[networkName] = defaultDestinationDir;
        }
        else {
            let networkDestinationDir = exportUserConfig[networkName];
            if (path.isAbsolute(networkDestinationDir)) {
                networkDestinationDir = networkDestinationDir;
            }
            else {
                networkDestinationDir = path.normalize(path.join(config.paths.root, networkDestinationDir));
            }
            config.deploymentArtifactsExport[networkName] = networkDestinationDir;
        }
    });
});
exports.TASK_EXPORT_DEPLOYMENT_ARTIFACTS = "export-deployment-artifacts";
config_1.task(exports.TASK_EXPORT_DEPLOYMENT_ARTIFACTS)
    .setDescription("Exports deployment artifacts for the current network to a configured path")
    .setAction(async (args, hre) => {
    deployment_artifacts_1.exportDeploymentArtifacts(hre);
});
//# sourceMappingURL=index.js.map