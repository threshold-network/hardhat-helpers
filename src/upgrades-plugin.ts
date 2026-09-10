import "./base"
import "@openzeppelin/hardhat-upgrades"
import { extendEnvironment } from "hardhat/config"
import { lazyObject } from "hardhat/plugins"
import upgrades, { HardhatUpgradesHelpers } from "./upgrades"

declare module "./type-extensions" {
  export interface HardhatHelpers {
    upgrades: HardhatUpgradesHelpers
  }
}

extendEnvironment((hre) => {
  hre.helpers.upgrades = lazyObject(() => upgrades(hre))
})
