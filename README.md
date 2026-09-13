# hardhat-plugin

[Hardhat](https://hardhat.org) plugin from Keep Network.

## What

This plugin contains helpers for Hardhat.

## Installation

```bash
yarn add --dev @keep-network/hardhat-helpers ethers@^5.0.32 hardhat-deploy@^0.8.11
```

Import the plugin in your `hardhat.config.js`:

```js
require("@keep-network/hardhat-helpers")
```

Or if you are using TypeScript, in your `hardhat.config.ts`:

```ts
import "@keep-network/hardhat-helpers"
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

## Development dependencies

Use Node.js 20 (see `.nvmrc`) and Yarn Classic. Install with
`yarn install --frozen-lockfile`, then run `yarn build`, `yarn test`, and
`yarn format`.

The lockfile retains the existing Hardhat 2, ethers 6, and hardhat-deploy 0.11
stack. Some upstream packages pin vulnerable transitive dependencies, so
`package.json` contains selective resolutions:

- Hardhat, its verification plugin, and OpenZeppelin use Undici 6.28.1 because
  the required security fixes are unavailable on Undici 5.
- hardhat-deploy keeps Axios 0.x, while Defender clients keep Axios 1.x.
  Ethers' WebSocket dependencies likewise retain their respective 7.x and 8.x
  branches, and typescript-estree retains minimatch 9.
- Hardhat's archive and identifier helpers use adm-zip 0.6 and UUID 11, which
  retain the CommonJS APIs it calls. UUID 12 is not a compatible replacement.
- The remaining resolutions update Elliptic, Sentry's cookie parser, Mocha's
  serializer and diff formatter, and solc's temporary-file helper. Cognito is
  refreshed within its existing 6.x range to support patched js-cookie 3;
  forcing js-cookie 3 beneath older Cognito versions breaks cookie storage.
  The serializer and cookie-storage versions require Node.js 20 or later.

Yarn reports range warnings for these intentional overrides. Keep the focused
dependency tests passing when changing them, and remove an override once its
parent accepts a patched version. The resolutions apply to this checkout;
consumers must maintain their own dependency trees.

Elliptic 6.6.1 fixes the reported critical malformed-signing vulnerability.
[GHSA-848j-6mx2-7j84](https://github.com/advisories/GHSA-848j-6mx2-7j84) remains
open because no patched upstream version is available. Do not treat a
successful install as a clean security audit. Yarn's registry audit also flags
the npm name `eslint-config-keep`; this checkout instead resolves the unchanged
GitHub configuration at commit `0c27ade54e725f980e971c3d91ea88bab76b2330`,
not the npm package covered by that malware advisory.
