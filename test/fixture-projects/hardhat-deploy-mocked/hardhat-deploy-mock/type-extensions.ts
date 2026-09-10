import type { DeploymentsExtensionMock } from "./DeploymentsMock"

declare module "hardhat-deploy/dist/types" {
  export interface DeploymentsExtension {
    calls: DeploymentsExtensionMock["calls"]
    currentOwner: DeploymentsExtensionMock["currentOwner"]
  }
}
