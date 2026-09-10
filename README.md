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

The root import enables all helpers and requires the OpenZeppelin Upgrades
plugin. Install a version from the matching release line below.

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

## Base helpers and optional proxy support

For projects that do not use upgradeable proxies, import the base entry point:

```ts
import "hardhat-deploy"
import "@threshold-network/hardhat-helpers/base"
```

This entry point loads the ethers plugin and the non-proxy helpers without
loading or requiring `@openzeppelin/hardhat-upgrades`. The Upgrades plugin is
an optional peer, so package managers do not install it for base-only consumers.

For proxy support, install `@openzeppelin/hardhat-upgrades` explicitly and use:

```ts
import "hardhat-deploy"
import "@threshold-network/hardhat-helpers/upgrades"
```

The `/upgrades` entry point includes `/base`. The root package import continues
to enable both. Combining these imports does not register the helpers twice.
TypeScript exposes `helpers.upgrades` only when the root or upgrades entry point
is imported into that TypeScript project.

Use OpenZeppelin Upgrades 1.22+ (1.x) with the ethers v5 / 0.6 helper line.
Use Upgrades 2.5.1+ (2.x) or 3.0.2+ (3.x) with ethers v6 / 0.7.
Keep 2.5.1 when the consumer requires its shared ProxyAdmin v4 deployment model;
3.x creates ProxyAdmin v5 instances per transparent proxy.

## Repeating proxy deployments in tests

The default duplicate-name guard remains in place. To deliberately deploy a
fresh proxy under an existing deployment name:

```ts
const [proxy, deployment] = await hre.helpers.upgrades.deployProxy("Counter", {
  initializerArgs: [42],
  redeploy: true,
})
```

`redeploy: true` creates a new proxy, with fresh storage. It replaces the named
hardhat-deploy record only after deployment and receipt collection succeed.
The old proxy remains on-chain. This is not an idempotent replay, and it does not
upgrade or copy the old proxy's state. OpenZeppelin deployment validation still
runs; errors preserve the prior record. Use `upgradeProxy` for storage-checked
upgrades of an existing proxy. Prefer separate deployment names when both
instances need to remain addressable through hardhat-deploy.

## Verification artifacts

Compile before deployment and retain the matching artifacts and build-info.
On ethers v5, the helper requires `@nomiclabs/hardhat-etherscan` 3.1.8+ and
passes `noCompile: true` to `verify:verify`. The legacy plugin can still compile
a minimal verification input in memory with `emitsArtifacts: false`.
On ethers v6, `@nomicfoundation/hardhat-verify` 2.x already reads existing build
information without invoking the main compile task; no extra flag is needed.

Both lines preserve contract names, constructor arguments, and library mappings.
Missing build information is reported without rebuilding artifacts. As before,
verification errors are logged, and already-verified responses are accepted.
Tests exercise the actual verification task and deployed bytecode, mocking only
the explorer boundary, and assert that artifact contents remain unchanged.

## Preparing an upgrade

`prepareProxyUpgrade` deploys and validates the new implementation and returns
a transaction for the ProxyAdmin owner to execute. It selects ProxyAdmin v4's
`upgrade` / `upgradeAndCall` or v5's `upgradeAndCall` as appropriate.

Preparation now leaves the canonical hardhat-deploy record unchanged. A prepared
transaction may be rejected, revert, or never execute. Deployment scripts that
previously exported the new ABI and implementation immediately after preparation
must instead reconcile the record after confirmed execution: check the on-chain
implementation, use the new ABI, and save the actual upgrade transaction hash
and receipt. Keep proposal artifacts separate from executed deployment records.
`upgradeProxy` continues to execute and persist the confirmed upgrade in one call.

See [MIGRATION.md](MIGRATION.md) for the consumer rollout and existing PRs.
