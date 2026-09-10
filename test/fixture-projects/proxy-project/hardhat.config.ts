import { subtask } from "hardhat/config"
import { TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD } from "hardhat/builtin-tasks/task-names"
import type { HardhatUserConfig } from "hardhat/types"
import "hardhat-deploy"
import "@nomiclabs/hardhat-etherscan"
import "../../../src/index"

// Use a pinned solc-js build so integration tests need no compiler download.
subtask(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD).setAction(async () => ({
  compilerPath: require.resolve("solc/soljson.js"),
  isSolcJs: true,
  version: "0.8.17",
  longVersion: require("solc").version(),
}))

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: { hardhat: { saveDeployments: true } },
  etherscan: {
    apiKey: "offline-test-key",
    customChains: [
      {
        network: "hardhat",
        chainId: 31337,
        urls: {
          apiURL: "https://example.invalid/api",
          browserURL: "https://example.invalid",
        },
      },
    ],
  },
}

export default config
