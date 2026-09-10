# Maintenance

This fork maintains the Keep Network Hardhat helpers for Threshold consumers.
The original MIT license and git history are retained.

## Release lines

| Branch            | Package line | Runtime                                                  |
| ----------------- | ------------ | -------------------------------------------------------- |
| `releases/v0.6.0` | `0.6.x`      | ethers v5, Hardhat 2, OpenZeppelin Upgrades 1.x          |
| `main`            | `0.7.x`      | ethers v6, Hardhat 2, OpenZeppelin Upgrades 2.5.1 or 3.x |

Both lines accept hardhat-deploy 0.11 and 1.x. Deploy 1.0.4 needs a newer
Hardhat than the legacy v5 fixture; CI exercises Hardhat 2.29.0 for that lane.
The locked v5 fixture runs on Node 16 and the deploy-v1 fixture on Node 24.
The v6 fixtures run on Node 24. This is not a Hardhat 3/Rocketh port.

The v5 baseline is the fork's existing `v0.6.0-pre.21` tag, including its
`prepare` script. It preserves the changes published after pre.15. Upstream
[#56](https://github.com/keep-network/hardhat-helpers/pull/56) contributes the
expanded deploy peer range; its verification fix is already in this baseline.
Do not roll existing pre.18/pre.20/pre.21 consumers back to the older PR base.

The v6 implementation carries the helper source changes from
[keep-core #4315](https://github.com/threshold-network/keep-core/pull/4315)
at `1d78355dad2cc80e9bc4a06b694b5c87b021d132`, with source-level TypeScript
corrections and focused regression tests. It retains legacy receipt JSON and
explicit ProxyAdmin v4/v5 ABI selection. Consumers on the old OpenZeppelin
line still need the legacy upgrade transaction fallback.

## Upstream carryovers

Reviewed all four open PRs and seven open issues on 2026-09-10.

| Upstream                                                                                                                                     | Disposition                                                                                                                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [PR #56](https://github.com/keep-network/hardhat-helpers/pull/56)                                                                            | Applied to the v5 line; deploy-v1 compatibility is also declared on v6.                                                                                                                                                                              |
| [PR #53](https://github.com/keep-network/hardhat-helpers/pull/53)                                                                            | V6 receipt conversion is carried by the #4315 implementation, preserving the existing serialized artifact format and adding regression coverage.                                                                                                     |
| [Issue #48](https://github.com/keep-network/hardhat-helpers/issues/48)                                                                       | V6 generics accept BaseContract-derived TypeChain interfaces while retaining Contract as the default return type.                                                                                                                                    |
| [Issues #18](https://github.com/keep-network/hardhat-helpers/issues/18) and [#47](https://github.com/keep-network/hardhat-helpers/issues/47) | Consolidated in [fork #4](https://github.com/threshold-network/hardhat-helpers/issues/4). Real-chain deployment, upgrades, validation, authorization, receipts, and failure coverage now run in both CI stacks.                                      |
| [Issue #49](https://github.com/keep-network/hardhat-helpers/issues/49)                                                                       | Prefer the v6 transaction API and retain the fallback required by supported older plugins. The removal request in [fork #1](https://github.com/threshold-network/hardhat-helpers/issues/1) is not currently applicable; retain tested compatibility. |
| [Issue #39](https://github.com/keep-network/hardhat-helpers/issues/39)                                                                       | [Fork #5](https://github.com/threshold-network/hardhat-helpers/issues/5) is addressed with noCompile on legacy etherscan 3.1.8+, existing-artifact verification on v6, and regression tests.                                                         |
| [Issue #38](https://github.com/keep-network/hardhat-helpers/issues/38)                                                                       | [Fork #3](https://github.com/threshold-network/hardhat-helpers/issues/3) is addressed with explicit redeploy mode, persisted-record coverage, and the default duplicate guard.                                                                       |
| [Issue #22](https://github.com/keep-network/hardhat-helpers/issues/22)                                                                       | [Fork #2](https://github.com/threshold-network/hardhat-helpers/issues/2) is addressed with base and upgrades entry points, optional peers, and isolated runtime/type checks.                                                                         |
| [PR #55](https://github.com/keep-network/hardhat-helpers/pull/55)                                                                            | Version-only 0.7.2 release bookkeeping. Its runtime changes are already in main; the fork advances to its own 0.7.3 prerelease.                                                                                                                      |
| [PR #10](https://github.com/keep-network/hardhat-helpers/pull/10)                                                                            | Not carried: obsolete CI authentication experiment that removes build/test steps and pushes test commits.                                                                                                                                            |

## Packaging and consumers

The package name is `@threshold-network/hardhat-helpers`. `prepare` and
`prepack` both compile the TypeScript source; `dist` must be present in the
packed artifact. Prefer the built tarball or a published version. A source Git dependency must
use an immutable full commit hash and a tested build runtime: the locked v5
source build uses Node 16, even when the packed plugin runs on Node 24. Existing imports can be preserved
with a package alias during the namespace transition.

CI tests the locked stack and the deploy-v1 consumer stack and uploads built
tarballs. The manual package workflow only builds artifacts. The inherited
workflow that published to the Keep namespace has been replaced. Publishing
requires confirmed access to the Threshold npm scope and a deliberate
version/tag choice: use a v5-specific tag for 0.6 and a v6-specific tag for 0.7
until the consumer release plan establishes the default. No package is
published automatically by merging these changes.

Coordinate [keep-core #4326](https://github.com/threshold-network/keep-core/pull/4326)
with the v5 line and [#4315](https://github.com/threshold-network/keep-core/pull/4315)
with the v6 line. Update dependency declarations and lockfiles together.
A helper release only replaces the helper patch: the migration's patches for
OpenZeppelin, TypeChain, and Threshold contracts remain separate. Validate
actual packed producer/consumer deployments before removing downstream
patches or enabling publication of executable deployment scripts.

## Upgrade transaction compatibility decision

As checked on 2026-09-10, OpenZeppelin
[PR #874](https://github.com/OpenZeppelin/openzeppelin-upgrades/pull/874) remains
open. Even its published
[4.1.0 implementation](https://github.com/OpenZeppelin/openzeppelin-upgrades/blob/%40openzeppelin%2Fhardhat-upgrades%404.1.0/packages/plugin-hardhat/src/upgrade-proxy.ts)
assigns the upgrade transaction to `deployTransaction`. There is no verified
release boundary at which this compatibility path can be removed.

The ethers v6 helper therefore prefers `deploymentTransaction()` when present
and falls back to `deployTransaction`. Unit tests cover both shapes, and real
upgrades exercise the fallback with supported 2.5.1 and 3.0.2 plugins. Raising the
minimum to 3.x would also change new transparent-proxy admin behavior and would
not remove the need for this adapter. Revisit only after an upstream release
changes the return contract and all supported consumers have migrated.

## Regression coverage

The pinned solc-js 0.8.17 compiler runs locally without compiler downloads.
On-chain fixtures cover initialization, state preservation, admin ownership,
unauthorized upgrades, incompatible storage, reverted upgrade calls, persisted
receipts, and explicit fresh proxy deployment. The v6 matrix executes prepared
transactions against both shared v4 and per-proxy v5 admins. Preparation never
updates the canonical record ahead of execution.

The base-only consumer test blocks loading the optional Upgrades plugin and
checks its absence from the TypeScript declaration graph. A second consumer
combines root/base/upgrades imports and exercises the resulting environment.
Runtime dependencies used by base helpers are declared explicitly.
