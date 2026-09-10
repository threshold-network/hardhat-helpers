# hardhat-helpers

[Hardhat](https://hardhat.org) plugin from Keep Network.

## What

This plugin contains helpers for Hardhat.

## Installation

```bash
yarn add --dev @threshold-network/hardhat-helpers ethers@^6.10.0 hardhat-deploy@^1.0.4
```

Import the plugin in your `hardhat.config.js`:

```js
require("@threshold-network/hardhat-helpers")
```

Or if you are using TypeScript, in your `hardhat.config.ts`:

```ts
import "@threshold-network/hardhat-helpers"
```

## Environment extensions

This plugin extends the Hardhat Runtime Environment by adding an `helpers` field
whose type is `HardhatHelpers`.

## Usage

There are no additional steps you need to take for this plugin to work.

Install it and access `helpers` through the Hardhat Runtime Environment anywhere
you need it (tasks, scripts, tests, etc).

Example:

```js
hre.helpers.address.isValid(KeepToken.address)
```

## Maintenance and release lines

See [MAINTENANCE.md](MAINTENANCE.md) for supported runtimes, upstream carryovers,
and the release process. The Threshold-scoped versions are release candidates;
publishing is a separate step after validation and npm scope access are ready.
