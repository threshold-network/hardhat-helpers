# Consumer migration

Inventory and existing PRs checked on 2026-09-10. The intended transition is a
hard switch to `@threshold-network/hardhat-helpers`, including imports and
lockfiles. The package versions below are candidates, not published releases.

## Release first

Merge and release the tested fork changes on their respective lines:

- [Fork PR #6](https://github.com/threshold-network/hardhat-helpers/pull/6):
  `0.6.0-pre.22`, ethers v5, OpenZeppelin Upgrades 1.x.
- [Fork PR #7](https://github.com/threshold-network/hardhat-helpers/pull/7):
  `0.7.3-pre.0`, ethers v6, OpenZeppelin Upgrades 2.5.1 or 3.x.

Publish the compiled packages under separate v5/v6 dist-tags after scope access
and the consumer release checks are satisfied. Consumers should pin an explicit
version. The manual workflow currently produces tarballs, without publishing.
Use those tarballs to validate consumers before publication. Avoid a source Git
install as the general rollout mechanism: preparing the old v5 source dependency
can require Node 16 even when its compiled distribution works on Node 24.

## Existing consumer PRs

| Consumer                   | Packages to update                                                                          | Existing PR                                                              | Target                               |
| -------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------ |
| keep-core                  | `solidity/ecdsa`, `solidity/random-beacon`                                                  | [#4326](https://github.com/threshold-network/keep-core/pull/4326)        | v5 release                           |
| tbtc-v2                    | `solidity`, `system-tests`, `cross-chain/{arbitrum,base,bob,optimism,polygon,starknet,sui}` | [#1142](https://github.com/threshold-network/tbtc-v2/pull/1142)          | v5 release                           |
| solidity-contracts         | root package                                                                                | [#193](https://github.com/threshold-network/solidity-contracts/pull/193) | v5 release                           |
| keep-core ethers migration | both Solidity packages on the migration branch                                              | [#4315](https://github.com/threshold-network/keep-core/pull/4315)        | v6 release, retaining Upgrades 2.5.1 |

The first three PRs currently only replace the dependency value with the fork's
`v0.6.0-pre.21` Git tag. That does not include the pending fixes, rename imports,
or update lockfiles. Extend those PRs instead of opening competing migrations.
Do not move main/dev consumers onto the v6 package merely because #4315 exists:
it remains unmerged and has additional migration requirements.

The old `yearn` workspace uses helpers v0.1.0 and hardhat-deploy 0.8. Its extraction
is already covered by [tbtc-v2 #1143](https://github.com/threshold-network/tbtc-v2/pull/1143)
and the archived `threshold-network/tbtc-v2-yearn` repository. Preserve its
reproducible historical dependency set unless that integration is reactivated.

Other Keep consumers include `coverage-pools` (helpers 0.6.0-pre.17) and
`sortition-pools` (helpers 0.2). Include them if those repositories move under
Threshold maintenance. The older sortition development stack needs its own
Hardhat/deploy compatibility update; a package-string replacement is insufficient.

## Changes and validation in each consumer

1. Replace the old dependency key with `@threshold-network/hardhat-helpers` and
   the exact matching release version. Keep OpenZeppelin Upgrades installed
   explicitly for proxy users. On v5, resolve legacy etherscan to at least 3.1.8.
2. Rename all config/script/test imports, type imports, workspace resolutions,
   and patch references. Use the root import for the existing full plugin;
   choose `/base` only for consumers that do not need proxy helpers.
3. Remove a helper patch only after confirming that its complete behavior is
   in the release. #4315 also has OpenZeppelin, TypeChain, and Threshold-contract
   patches; a helper release does not replace them.
4. Regenerate every affected lockfile using that consumer's package manager.
   Check for a remaining transitive Keep helper copy; fix the owning dependency
   rather than treating a second installed copy as a completed migration.
5. Run a clean immutable/frozen install, TypeScript build, and the consumer's
   existing contract/deployment tests. Exercise proxy deploy/upgrade, receipt
   exports, and named signers. For #4315, retain its producer/consumer artifact
   gates and shared ProxyAdmin v4 checks.
6. For v6 prepared upgrades, update scripts that used preparation to publish an
   executed deployment record. Record the new ABI, implementation, receipt, and
   hash only after the admin transaction is confirmed.

Merge each consumer PR after its release is installable and its checks pass.
Publishing a package alone does not update any existing dependency or import.

## Work already in flight

Piotr's lint-config vendoring is in
[tbtc-v2 #1144](https://github.com/threshold-network/tbtc-v2/pull/1144) and
[solidity-contracts #194](https://github.com/threshold-network/solidity-contracts/pull/194).
Local-network-config vendoring is in
[keep-core #4325](https://github.com/threshold-network/keep-core/pull/4325) and
[tbtc-v2 #1141](https://github.com/threshold-network/tbtc-v2/pull/1141).
The latter currently addresses Starknet; the main Solidity package still lists
the dependency and needs a separate usage check.

The Electrum JS fork is already present; the tbtc-v2 switch is
[#1140](https://github.com/threshold-network/tbtc-v2/pull/1140).
`backend-services` also points at the Keep Electrum JS repository and needs its
own migration. The existing `keep-common` work is now an in-tree merge in
[keep-core #4327](https://github.com/threshold-network/keep-core/pull/4327), and
TSS work is in [tss-lib #11](https://github.com/threshold-network/tss-lib/pull/11).
