# CHANGELOG

## 0.57.1 Dev 4, 2024

Breaking Changes:

- Upgrade polkadot-js/api to 15.0.1 ([#1483](https://github.com/polkadot-js/extension/pull/1483))
    - This contains breaking changes where the api now allows the signer to alter the call data. Please reference [PR #6030](https://github.com/polkadot-js/api/pull/6030) for more information.
- Upgrade polkadot-js/phishing to 0.24.4 ([#1483](https://github.com/polkadot-js/extension/pull/1483))

Contributed:

- fix: extension does not get injected on page load ([#1486](https://github.com/polkadot-js/extension/pull/1486))

Changes:

- Upgrade @polkadot-api/merkleize-metadata to 1.1.10 ([#1484](https://github.com/polkadot-js/extension/pull/1484))
- Bump yarn to 4.5.3 ([#1485](https://github.com/polkadot-js/extension/pull/1485))


## 0.56.2 Nov 12, 2024

Changes:

- Bump dev to 0.82.1 w/ tslib ([#1476](https://github.com/polkadot-js/extension/pull/1476))
- Bump polkadot-js deps ([#1477](https://github.com/polkadot-js/extension/pull/1477))
    - polkadot/api -> 14.3.1
    - polkadot/common -> 13.2.3
    - polkadot/phishing -> 0.24.3
    - polkadot/ui -> 3.11.3
- Bump typescript to 5.5.4 ([#1478](https://github.com/polkadot-js/extension/pull/1478))


## 0.56.1 Oct 30, 2024

Changes:

- Bump all polkadot deps ([#1473](https://github.com/polkadot-js/extension/pull/1473))
    - polkadot/api -> 14.2.1
    - polkadot/common -> 13.2.2
        - Gives support for Frequency, and Polimec
    - polkadot/ui -> 3.11.2
    - polkadot/phishing -> 0.24.2


## 0.55.1 Oct 24, 2024

Changes:

- Bump dev to 0.81.2 ([#1469](https://github.com/polkadot-js/extension/pull/1469))
    - Export CJS and ESM correctly
- Bump all polkadot deps ([#1470](https://github.com/polkadot-js/extension/pull/1470))
    - polkadot/api -> 14.1.1
    - polkadot/common -> 13.2.1
    - polkadot/ui -> 3.11.1
    - polkadot/phishing -> 0.24.1
- Bump yarn to 4.5.1 ([#1471](https://github.com/polkadot-js/extension/pull/1471))


## 0.54.1 Oct 14, 2024

Changes:

- Update polkadot-js deps ([#1466](https://github.com/polkadot-js/extension/pull/1466))
    - Polkadot-js api -> 14.0.1
        - NOTE: This adds support for Extrinsic V5.
    - Polkadot-js phishing -> 0.23.7
- Bump yarn to 4.5.0 ([#1467](https://github.com/polkadot-js/extension/pull/1467))


## 0.53.1 Sep 24, 2024

Contributed:

- Ability to Reject an authentication request instead of ignoring it ([#1453](https://github.com/polkadot-js/extension/pull/1453)) (Thanks to https://github.com/Tbaut)

Changes:

- Upgrade polkadot-js deps ([#1462](https://github.com/polkadot-js/extension/pull/1462))
    - This contains breaking changes in the API that was released in [13.0.1](https://github.com/polkadot-js/api/releases/tag/v13.0.1). The release changed the way AssetId is returned from `toPayload` in the Signer interface. `Option<TAssetConversion>` is now returned as a SCALE encoded hex.


## 0.52.3 Aug 19, 2024

Changes:

- Upgrade polkadot-js/api to 12.4.1
- Upgrade polkadot-js/phishing to 0.23.4


## 0.52.2 Aug 16, 2024

NOTE: This is strictly a patch release for the store.

Changes:

- Remove Alarm permissions ([#1449](https://github.com/polkadot-js/extension/pull/1449))


## 0.52.1 Aug 14, 2024

Contributed:

- Send ping before subscriptions (Thanks to https://github.com/F-OBrien) ([#1441](https://github.com/polkadot-js/extension/pull/1441))
- Fix SignArea and ToastProvider timeout (Thanks to https://github.com/F-OBrien) ([#1444](https://github.com/polkadot-js/extension/pull/1444))

Changes:

- Bump yarn to 4.4.0 ([#1442](https://github.com/polkadot-js/extension/pull/1442))
- Enable "Chain Specific App" setting ([#1445](https://github.com/polkadot-js/extension/pull/1445))
    - This allows for ledger apps that are not included in the Polkadot Generic App to work with their specific Ledger App
- Fix setting rawMetadata as registry metadata ([#1446](https://github.com/polkadot-js/extension/pull/1446))


## 0.51.1 Aug 7, 2024

Contributed:

- Update XCM Analyser to v1.3.1 (Thanks to https://github.com/dudo50) ([#1419](https://github.com/polkadot-js/extension/pull/1419))
- Fix: ensure the service worker is awake before every port message (Thanks to https://github.com/F-OBrien) ([#1433](https://github.com/polkadot-js/extension/pull/1433))
    - NOTE: The extension-base now exposes a set of functions for port connection stability.
    - `setupPort`
    - `wakeUpServiceWorker`
    - `ensurePortConnection`

Changes:

- Bump yarn to 4.3.1 ([#1426](https://github.com/polkadot-js/extension/pull/1426))
- Add CI script to check for diffs in src vs build for store release ([#1429](https://github.com/polkadot-js/extension/pull/1429)) ([#1436](https://github.com/polkadot-js/extension/pull/1436))
- Change Connected to Connect Accounts ([#1430](https://github.com/polkadot-js/extension/pull/1430))
- Upgrade Polkadot-js deps ([#1434](https://github.com/polkadot-js/extension/pull/1434)) ([#1435](https://github.com/polkadot-js/extension/pull/1435))
    - polkadot/api 12.3.1
    - polkadot/phishing 0.23.3
    - polkadot/ui 3.8.3


## 0.50.1 July 30, 2024

Contributed:

- Update subscribed accounts when connected site authorizations are modified (Thanks to https://github.com/F-OBrien)
    - Deprecates `public udateCurrentTabsUrl` in `class State` in favor of `public updateCurrentTabsUrl`.

Changes:

- Add support for the Ledger Generic App (Thanks to https://github.com/bee344)
- Add support for the Ledger Migration App (Thanks to https://github.com/bee344)
    - Note: In order to use the ledger migration app, you must toggle the setting inside of settings. That will enable the migration app for use.
- Fix extension stuck in ... loading ... screen after service_worker got terminated (Thanks to https://github.com/bee344)


## 0.49.3 July 19, 2024

Changes:

- Fix ID used in manifest_firefox.json by adding brackets
    - The previous patch required brackets arount the ID...
    

## 0.49.2 July 18, 2024

Changes:

- Fix ID used in manifest_firefox.json
    - This is internal, and is only necessary for publishing to the store


## 0.49.1 July 15, 2024

Breaking Changes:

- Update from Manifest v2 to v3 for Chrome
- Update from Manifest v2 to v3 for Firefox

Note: These are very large breaking changes. Please review the following PR's to see exactly what has changed and for any additional information that can assist you in your migration.

([#1367](https://github.com/polkadot-js/extension/pull/1367))
([#1388](https://github.com/polkadot-js/extension/pull/1388))
([#1399](https://github.com/polkadot-js/extension/pull/1399))

Changes:

- Update xcm analyzer to 1.3.0
- Upgrade Polkadot.js Deps
    - @polkadot/common -> 13.0.2 (Introduces the interface for the new ledger app. This will be implemented in the next release)
    - @polkadot/api -> 12.2.1
    - @polkadot/phishing -> 0.23.1
    - @polkadot/ui -> 3.7.1
- Update module resolution to bundler
- Clean the manifest build process


## 0.48.2 July 3, 2024

Contributed:

- Fix: forget account for legacy account without authorizedAccounts (Thanks to https://github.com/Tbaut)

Changes:

- Adjust ui imports for deterministic bundling


## 0.48.1 June 27, 2024

- **Important** Not published to the stores, aligns with latest released packages.

Changes:

- Bump @polkadot/api to 12.0.2
    - NOTE: We are doing a minor bump because the api in this version now gives the option
    to modify payloads for `signAndSend`, `signAsync`, and `dryRun` which the extension does not use. That being said, for any user that digests that package it will be available to use as a feature.
- Bump @polkadot/phishing to 0.22.10


## 0.47.6 June 18, 2024

Changes:

- Bump @polkadot/api to 11.3.1
- Bump @polkadot/phishing to 0.22.9
- Update build process to enable review by Firefox store
    - Adds `corepack enable` to CI process
    - Removes hardcoded path to `.yarn/release` in .yarnrc.yml
    - Updates zip script to ensure correct compression


## 0.47.5 May 22, 2024

- **Important** Published only to Chrome store.

Changes:

- Bump @polkadot/api to 11.1.1
- Bump @polkadot/phishing to 0.22.8
- Bump @polkadot/dev to 0.79.3


## 0.47.4 May 8, 2024

- **Important** Not published to the stores, aligns with latest released packages.

Changes:

- Bump polkadot/api to 11.0.3 and @polkadot/phishing to 0.22.7


## 0.47.3 Apr 27, 2024

- **Important** Not published to the stores, aligns with latest released packages.

Changes:

- Bump polkadot/api to 11.0.2


## 0.47.2 Apr 23, 2024

- **Important** Not published to the stores, aligns with latest released packages.

Contributed:

- chore: upgrade web3 dep (Thanks to https://github.com/gdethier)

Changes:

- Update polkadot/api and polkadot/phishing


## 0.47.1 Apr 18, 2024

- **Important** Not published to the stores, aligns with latest released packages.

Contributed:

- feat(extrinsic-ui): extrinsic asset id (Thanks to https://github.com/ryanleecode)
- feat: display asset id in xcm format (Thanks to https://github.com/ryanleecode)

Changes:

- Update nvmrc version
- Bump yarn to 4.1.1
- Update the README with library notice
- Fix typos
- Update CI checkout and setup_node to v4
- Update polkadot/* deps


## 0.46.9 Mar 20, 2024

- **Important** Not published to the stores, aligns with latest released packages.

Contributed:

- Fix: Prevent authorization request from incorrect origin due to chrome pre-rendering fixes (Thanks to https://github.com/F-OBrien)

Changes:

- Upgrade to `@polkadot/api` 10.12.4
- Upgrade to `@polkadot/phishing` 0.22.4


## 0.46.8 Mar 13, 2024

- **Important** Not published to the stores, aligns with latest released packages.

Changes:

- Upgrade to `@polkadot/api` 10.12.2
- Upgrade to `@polkadot/phishing` 0.22.3


## 0.46.7 Feb 28, 2024

- **Important** Not published to the stores, aligns with latest released packages.

Changes:

- Upgrade to `@polkadot/api` 10.11.2
- Upgrade to `@polkadot/ui` 3.6.5
- Upgrade to `@polkadot/phishing` 0.22.2


## 0.46.6 Nov 18, 2023

- **Important** Not published to the stores, aligns with latest released packages.

Changes:

- Upgrade to `@polkadot/util` 12.6.1
- Upgrade to `@polkadot/api` 10.11.1


## 0.46.5 Jun 12, 2023

- **Important** Not published to the stores, aligns with latest released packages.

Changes:

- Adjust object index access for stricter tsconfig settings
- Upgrade to `@polkadot/api` 10.9.1
- Upgrade to `@polkadot/util` 12.3.2


## 0.46.4 Jun 5, 2023

- **Important** Not published to the stores, aligns with latest released packages.

Changes:

- Upgrade to `@polkadot/api` 10.8.1
- Upgrade to `@polkadot/util` 12.2.2


## 0.46.3 May 13, 2023

- **Important** Not published to the stores, aligns with latest released packages.

Changes:

- Add `module` to `package.json` export map (ESM-only)
- Upgrade to `@polkadot/api` 10.6.1
- Upgrade to `@polkadot/util` 12.1.1


## 0.46.2 Apr 30, 2023

- **Important** Not published to the stores, aligns with latest released packages.

Changes:

- Adjust compilation output for `__internal__` class fields
- Upgrade to `@polkadot/api` 10.5.1
- Upgrade to `@polkadot/util` 12.1.1


## 0.46.1 Apr 22, 2023

- **Important** Not published to the stores, aligns with latest released packages.

Changes:

- Upgrade to `@polkadot/api` 10.4.1
- Upgrade to `@polkadot/util` 12.0.1


## 0.45.5 Apr 1, 2023

- **Important** Not published to the stores, aligns with latest released packages.

Changes:

- Upgrade to `@polkadot/api` 10.2.2
- Upgrade to `@polkadot/util` 11.1.3


## 0.45.4 Mar 25, 2023

- **Important** Not published to the stores, aligns with latest released packages.

Changes:

- Updated to `@polkadot/api` 10.2.1
- Updated to `@polkadot/util` 11.1.2


## 0.45.3 Mar 19, 2023

- **Important** Not published to the stores, aligns with latest released packages.

Changes:

- Updated to `@polkadot/api` 10.1.4
- Updated to `@polkadot/util` 11.1.1


## 0.45.2 Mar 11, 2023

- **Important** Not published to the stores, aligns with latest released packages.

Changes:

- Use consistent `.js` imports in source files (TS moduleResolution)
- Updated to `@polkadot/api` 10.1.1
- Updated to `@polkadot/util` 11.0.2


## 0.45.1 Mar 5, 2023

- **Important** Not published to the stores, aligns with latest released packages.

Changes:

- Swap TS -> JS compiler to use tsc (from babel)
- Adjust all tests to use `node:test` runner (ESM variants)
- Updated to `@polkadot/api` 10.0.1
- Updated to `@polkadot/util` 11.0.1


## 0.44.9 Feb 19, 2023

- **Important** Not published to the stores, aligns with latest released packages.

Changes:

- Updated to `@polkadot/api` 9.14.2
- Updated to `@polkadot/util` 10.4.2


## 0.44.8 Jan 8, 2023

- **Important** Not published to the stores, aligns with latest released packages.

Changes:

- Updated to `@polkadot/api` 9.11.1
- Updated to `@polkadot/util` 10.2.3


## 0.44.7 Dec 27, 2022

- **Important** Not published to the stores, aligns with latest released packages.

Contributed:

- Fix naming of `getAllMetadata` message (Thanks to https://github.com/Nick-1979)
- Add more zh translations (Thanks to https://github.com/chendatony31)
- Typo fix (Thanks to https://github.com/Nick-1979)
- Re-add QR signing support (Thanks to https://github.com/Tbaut)
- Adjust flow of auth management screens (Thanks to https://github.com/Tbaut)
- Add links to connected accounts in header (Thanks to https://github.com/Tbaut)

Changes:

- Ensure that `EXTENSION_PREFIX` is always set as part of `@polkadot/extension-base`
- Allow for `genesisHash` filter to both `web3{Accounts, AccountsSubscribe}`
- Allow for transparent extension `ping` (as available)
- Support for new privacy-preserving `connect(<source>)` interfaces (non-default)
- Always set metadata before signing (fixes for ETH-compat chains)
- Updated to `@polkadot/api` 9.10.4
- Updated to `@polkadot/util` 10.2.1


## 0.44.6 Aug 21, 2022

- **Important** Not published to the stores, aligns with latest released packages.

Changes:

- Swap to using webpack from `@polkadot/dev`
- Upgrade to `@polkadot/api` 9.2.3
- Updated to `@polkadot/util` 10.1.5


## 0.44.5 Aug 13, 2022

- **Important** Not published to the stores, aligns with latest released packages.

Changes:

- Upgrade to `@polkadot/api` 9.2.1
- Updated to `@polkadot/util` 10.1.4


## 0.44.4 Aug 8, 2022

- **Important** Not published to the stores, aligns with latest released packages.

Contributed:

- Adjust layout for authorization modal (Thanks to https://github.com/Tbaut)

Changes:

- Upgrade to `@polkadot/api` 9.1.1
- Updated to `@polkadot/util` 10.1.3


## 0.44.3 Jul 30, 2022

- **Important** Not published to the stores, aligns with latest released packages.

Contributed:

- Adjust layout for authorization modal (Thanks to https://github.com/Tbaut)

Changes:

- Upgrade to `@polkadot/api` 9.0.1
- Updated to `@polkadot/util` 10.1.2


## 0.44.2 Jul 24, 2022

- **Important** Not published to the stores, aligns with latest released packages.

Contributed:

- Account selection/management for authorized sites (Thanks to https://github.com/Tbaut)
- UI icon & cursor adjustments for authorization (Thanks to https://github.com/roiLeo)

Changes:

- Allow for unsubscribe handling on account subscriptions
- Add error handling for user-supplied account callbacks
- Upgrade to `@polkadot/api` 8.14.1
- Updated to `@polkadot/util` 10.1.1


## 0.44.1 Jun 6, 2022

**Important** CHANGELOG entries are a rollup of details since last publish to the stores

Contributed:

- Adjust nvm version (Thanks to https://github.com/pedroapfilho)
- Add filtered account subscriptions (Thanks to https://github.com/hamidra)
- Display signed data as Ascii (Thanks to https://github.com/hamidra)
- Removal for authorized URLs (Thanks to https://github.com/Are10)
- Fix typo on https://polkadot.js.org/docs/ (Thanks to https://github.com/michaelhealyco)

Changes:

- Remove all signing via QR (imcompatible)
- Swap to React 18
- Gracefully handle promise rejections
- Don't apply shims on content pages, only apply on background
- Ensure that only latest metadata is applied (when multiple genesis)
- Rename all `*.test.ts` to `*.spec.ts` (cross-repo consistency)
- Only apply cross-browser environment globally in non-content scripts
- Ensure package path is available under ESM & CJS
- Upgrade to `@polkadot/api` 8.7.1
- Updated to `@polkadot/util` 9.4.1


## 0.43.3 Jun 4, 2022

- **Important** Not published to the stores, aligns with latest released packages.

Contributed:

- Adjust nvm version (Thanks to https://github.com/pedroapfilho)
- Add filtered account subscriptions (Thanks to https://github.com/hamidra)

Changes:

- Gracefully handle promise rejections
- Upgrade to `@polkadot/api` 8.7.1
- Updated to `@polkadot/util` 9.4.1


## 0.43.2 May 15, 2022

- **Important** Not published to the stores, aligns with latest released packages.

Contributed:

- Display signed data as Ascii (Thanks to https://github.com/hamidra)

Changes:

- Remove all signing via QR (imcompatible)
- Swap to React 18
- Upgrade to `@polkadot/api` 8.4.1
- Updated to `@polkadot/util` 9.2.1


## 0.43.1 Apr 11, 2022

- **Important** Not published to the stores, aligns with latest released packages.

- **Breaking change** In this version the commonjs outputs are moved to a sub-folder. Since the export map and main field in package.json does reflect this change, there should be no usage changes. However the packages here will all need to be on the same version for internal linkage.

Changes:

- Output commonjs files under the `cjs/**` root
- Upgrade to `@polkadot/api` 8.0.1
- Updated to `@polkadot/util` 9.0.1


## 0.42.10 Apr 4, 2022

**Important** Not published to the stores, aligns with latest released packages.

Contributed:

- Removal for authorized URLs (Thanks to https://github.com/Are10)

Changes:

- Adjust for bundlers where `import.meta.url` is undefined
- Bump `@polkadot/api` to 7.15.1
- Bump `@polkadot/util` to 8.7.1


## 0.42.9 Mar 14, 2022

**Important** Not published to the stores, aligns with latest released packages.

Changes:

- Adjust for bundlers where `import.meta.url` is undefined
- Bump `@polkadot/api` to 7.12.1
- Bump `@polkadot/util` to 8.5.1


## 0.42.7 Jan 23, 2022

**Important** Not published to the stores, aligns with latest released packages.

Changes:

- Bump `@polkadot/util` to 8.3.3
- Bump `@polkadot/api` to 7.5.1


## 0.42.6 Jan 17, 2022

**Important** Not published to the stores, aligns with latest released packages.

Changes:

- Don't apply shims on content pages, only apply on background
- Bump `@polkadot/util` to 8.3.2
- Bump `@polkadot/api` to 7.4.1


## 0.42.5 Jan 10, 2022

**Important** Not published to the stores, aligns with latest released packages.

Changes:

- Ensure that only latest metadata is applied (when multiple genesis)
- Rename all `*.test.ts` to `*.spec.ts` (cross-repo consistency)
- Only apply cross-browser environment globally in non-content scripts
- Ensure package path is available under ESM & CJS
- Bump `@polkadot/util` to 8.3.1
- Bump `@polkadot/api` to 7.3.1


## 0.42.4 Dec 27, 2021

**Important** As 0.42.3, not published to the stores, fixes dependency issue in 0.42.4.

Changes:

- Ensure `@polkadot/extension-mocks` is correctly listed as devDependency


## 0.42.3 Dec 27, 2021

**Important** Not published to the stores, aligns with latest released packages.

Contributed:

- Fix typo on https://polkadot.js.org/docs/ (Thanks to https://github.com/michaelhealyco)

Changes:

- Bump `@polkadot/util` to 8.2.2
- Bump `@polkadot/api` to 7.1.1


## 0.42.2 Dec 10, 2021

Changes:

- Fix bug introduced in 0.42.1 where account storage is not portable after the base port update


## 0.42.1 Dec 10, 2021

**Important** CHANGELOG entries are a rollup of details since last publish to the stores

Contributed:

- Allow for configuration of base ports (Thanks to https://github.com/AndreiEres)
- Adjust messaging for non-signRaw accounts (Thanks to https://github.com/BigBadAlien)
- Additional tests for Ethereum derivation (Thanks to https://github.com/joelamouche)

Changes:

- Adjust `chrome.*` location via polyfill on non-Chrome browsers
- Allow import of account via QR (where seed is provided)
- Expand error messaging for non-compatible Ledger chains
- Bump `@polkadot/util` to 8.1.2
- Bump `@polkadot/api` to 6.11.1


## 0.41.2 Nov 30, 2021

**Important** Not published to the stores, aligns with latest released packages.

Changes:

- Expand error messaging for non-compatible Ledger chains
- Bump `@polkadot/util` to 8.0.4
- Bump `@polkadot/api` to 6.10.2


## 0.41.1 Nov 8, 2021

**Important** CHANGELOG entries are a rollup of details since last publish to the stores

Contributed:

- Add search functionality (Thanks to https://github.com/Tbaut)
- Add Urdu translation (Thanks to https://github.com/itsonal)

Changes:

- Detect Ascii bytes (& display) when signing
- Correctly detect and create Ethereum-compatible chain accounts
- Ensure site authorization toggle is saved
- Optimize metadata conversion process
- Bump `@polkadot/util` to 7.8.2
- Bump `@polkadot/api` to 6.7.1


## 0.40.4 Oct 25, 2021

**Important** Not published to the stores, aligns with latest released packages.

Changes:

- Ensure site authorization toggle is saved
- Optimize metadata conversion process
- Bump `@polkadot/util` to 7.6.1
- Bump `@polkadot/api` to 6.5.1


## 0.40.3 Sep 18, 2021

**Important** Not published to the stores, aligns with latest released packages.

Changes:

- Expose `wrapBytes`, `unwrapBytes` directly from `@polkadot/util`
- Bump `@polkadot/util` to 7.4.1
- Bump `@polkadot/api` to 6.0.1


## 0.40.2 Sep 16, 2021

Changes:

- Fix polish translation (valid JSON)


## 0.40.1 Sep 16, 2021

- **Important** The signatures generated now via the extension will be a wrapped data set, i.e. `signRaw` cannot be used directly to sign transactions, rather it is only meant to be used for actual messages
**Important** CHANGELOG entries are a rollup of details since last publish to the stores

Contributed:

- Support signing of raw data via Qr (Thanks to https://github.com/Tbaut, prior 0.38.4)
- Add Polish language support (Thanks to https://github.com/ccris02, prior 0.38.8)
- Add Thai language support (Thanks to https://github.com/Chakrarin)
- Display Ethereum formatted addressed for compatible chains (Thanks to https://github.com/joelamouche)
- Allow import of Metamask addresses for compatible chains (Thanks to https://github.com/joelamouche)
- Add configurable popup location (Thanks to https://github.com/shawntabrizi)

Changes:

- Raw signing interfaces will now always place a `<Bytes>...</Bytes>` wrapper around signed data (via `wrapBytes` in `extension-dapp`)
- Adjust raw signing outputs with data wrapper
- Adjust settings menu layouts
- Cater for v14 metadata formats
- Cater for `#` in phishing Urls as part of the checks
- Bump `@polkadot/api` & `@polkadot/util` to latest versions


## 0.39.3 Aug 16, 2021

**Important** Not published to the stores, aligns with latest released packages.

Changes:

- Bump `@polkadot/api` to `5.5.1`
- Bump `@polkadot/util` to `7.2.1`


## 0.39.2 Aug 2, 2021

**Important** Not published to the stores, aligns with latest released packages.

Changes:

- Bump `@polkadot/api` to `5.3.1`
- Bump `@polkadot/util` to `7.1.1`


## 0.39.1 Jul 11, 2021

**Important** Not published to the stores, aligns with latest released packages.

Changes:

- Allow building as a completely stand-alone browser bundle (experimental)
- Bump `@polkadot/api` to `5.0.1`
- Bump `@polkadot/util` to `7.0.1`


## 0.38.8 Jun 26, 2021

**Important** Not published to the stores, aligns with latest released packages.

Contributed:

- Add pl i18n (Thanks to https://github.com/ccris02)

Changes:

- Bump `@polkadot/api` to `4.17.1`
- Bump `@polkadot/util` to `6.11.1`


## 0.38.7 Jun 26, 2021

**Important** Not published to the stores, aligns with latest released packages.

Changes:

- Bump `@polkadot/api` to `4.16.1`
- Bump `@polkadot/util` to `6.10.1`


## 0.38.6 Jun 20, 2021

**Important** Not published to the stores, aligns with latest released packages.

Changes:

- Bump `@polkadot/api` to `4.15.1`
- Bump `@polkadot/util` to `6.9.1`


## 0.38.5 Jun 14, 2021

**Important** Not published to the stores, aligns with latest released packages.

Changes:

- Raw signing interface will not re-wrap Ethereum-type messages
- Bump `@polkadot/api` to `4.14.1`
- Bump `@polkadot/util` to `6.8.1`



## 0.38.4 Jun 11, 2021

**Important** Not published to the stores, just made available to expose `{unwrap, wrap}Bytes`

Contributed:

- Support signing of raw data via Qr (Thanks to https://github.com/Tbaut)

Changes:

- Raw signing interfaces will now always place a `<Bytes>...</Bytes>` wrapper around signed data


## 0.38.3 May 31, 2021

Contributed:

- Fix Chromium not displaying accounts due to height mismatch (Thanks to https://github.com/wirednkod)


## 0.38.2 May 30, 2021

**Important** Not published to the stores, just made available to ensure users can have access to a version that uses the latest `@polkadot/{api, util}`

Changes:

- Bump `@polkadot/api` to `4.12.1`
- Bump `@polkadot/util` to `6.6.1`


## 0.38.1 May 25, 2021

Contributed:

- Support IPFS/IPNS uls (Thanks to https://github.com/carumusan)
- Batch export of all accounts (Thanks to https://github.com/BubbleBear)
- Turkish i18n (Thanks to https://github.com/zinderud)
- Support for custom signed extensions (Thanks to https://github.com/KarishmaBothara)
- Adjust background handler port mapping (Thanks to https://github.com/hlminh2000)
- Prevent 3rd party authorize abuse (Thanks to https://github.com/remon-nashid)
- Use file-saver for account export (Thanks to https://github.com/Tbaut)
- Language fixes (Thanks to https://github.com/n3wborn)

Changes:

- Support for Metadata v13 from Substrate
- Bump `@polkadot/api` & `@polkadot/util` to latest released versions
- Swap to use of ESM modules all in published packages


## 0.37.2 Feb 28, 2021

**Important** Not published to the stores, just made available to ensure users can have access to a version that uses the latest `@polkadot/{api, util}`

Contributed:

- Adjust tests to get rid of warnings (Thanks to https://github.com/Tbaut)

Changes:

- Bump `@polkadot/api` & `@polkadot/util` to latest released versions


## 0.37.1 Feb 10, 2021

Contributed:

- Ensure accounts check against raw public keys (Thanks to https://github.com/yuzhiyou1990)
- Add support for Ledger devices (Thanks to https://github.com/Tbaut)
- Add network selectors on the creation of all accounts (Thanks to https://github.com/Tbaut)
- Add explicit derivation field on seed imports (Thanks to https://github.com/Tbaut)
- Adjust slider color for dark theme (Thanks to https://github.com/Tbaut)
- Expand and cleanup tests (Thanks to https://github.com/Tbaut)
- Allow custom chains to be selected as tie-to chains (Thanks to https://github.com/Tbaut)
- Various UI adjustments for consistency (Thanks to https://github.com/Tbaut)
- Update i18n fr (Thanks to https://github.com/Tbaut)

Changes:

- Support for latest JS APIs
- Adjust phishing detection to check newly opened tabs


## 0.36.1 Jan 5, 2021

Contributed:

- Allow for the management of per-site approvals (Thanks to https://github.com/Tbaut)
- Add support for Ethereum account imports (Thanks to https://github.com/Tbaut)
- Split account derivation and from-seed creation flows (Thanks to https://github.com/Tbaut)
- Fix overlapping error labels (Thanks to https://github.com/Tbaut)
- Rework JSON restoration for consistency (Thanks to https://github.com/Tbaut)
- Leverage cache for phishing detection (Thanks to https://github.com/Tbaut)
- Allow ecdsa accounts to be injected (Thanks to https://github.com/Tbaut)
- Adjust display for overly long names (Thanks to https://github.com/Tbaut)
- Ensure that attached chain/prefix is always used on accounts (Thanks to https://github.com/Tbaut)
- Show account name (as entered) in creation screens (Thanks to https://github.com/Tbaut)
- show wrong password error on export screen (Thanks to https://github.com/Tbaut)
- Add new UI tests and fix skipped tests (Thanks to https://github.com/Tbaut)
- Additional fr translations (Thanks to https://github.com/Tbaut)

Changes:

- Swap to using Webpack 5 for reproducible builds
- Swap to using TypeScript type imports
- Hide parent/derivation-path when account is not derived


## 0.35.1 Nov 29, 2020

Contributed:

- Add i18n French (Thanks to https://github.com/Tbaut)
- Add a caps-lock warning for passwords (Thanks to https://github.com/Tbaut)
- Unify warning/error messages between components (Thanks to https://github.com/Tbaut)
- Adjust notification window for cross-platform consistency (Thanks to https://github.com/Tbaut)
- Set account visibility directly from icon click (Thanks to https://github.com/Tbaut)
- Don't indicate name errors before any value is entered (Thanks to https://github.com/Tbaut)
- Swap icons to the Font Awesome (instead of built-in) (Thanks to https://github.com/Tbaut)
- Use `@polkadot/networks` for known ss58 formats/genesis (Thanks to https://github.com/Tbaut)
- Add phishing site detection and redirection (Thanks to https://github.com/Tbaut)
- Add indicator icon for external accounts (Thanks to https://github.com/Tbaut)
- Add error boundaries across all UI components (Thanks to https://github.com/Tbaut)
- Group accounts by network, sort by name & path (Thanks to https://github.com/Tbaut)
- Fix derive suggestions to update when switching root (Thanks to https://github.com/Tbaut)
- Adjust window opening logic to be generic (Thanks to https://github.com/Tbaut)
- Add i18n language selection dropdown (Thanks to https://github.com/Tbaut)
- Adjust password expiry to extend timeperiod (Thanks to https://github.com/Tbaut)
- Rework password caching for security & robustness (Thanks to https://github.com/Tbaut)
- Share password expiry length between back/front-ends (Thanks to https://github.com/Tbaut)
- Cleanup all global styles and usage (Thanks to https://github.com/Tbaut)

Changes:

- Adjust web3Enable for better on-load detection
- Support for all latest Substrate/Polkadot types


## 0.34.1 Sep 15, 2020

Contributed:

- Add support for extension change password messaging (Thanks to https://github.com/remon-nashid)
- `web3Accounts` now allows the specification of the ss58Format (Thanks to https://github.com/Tbaut)

Changes:

- Support for latest Metadata v12 formats


## 0.33.4 Sep 9, 2020

Contributed:

- Fix back button display on create account (Thanks to https://github.com/Tbaut)

Changes:

- Reproducible builds with Webpack optimization flags


## 0.33.2 Sep 7, 2020

Changes:

- Fix zip output to correctly include all source files


## 0.33.1 Sep 7, 2020

Contributed:

- Include Subsocial ss58 (Thanks to https://github.com/F3Joule)
- Add Crab network (Thanks to https://github.com/WoeOm)
- README updates (Thanks to https://github.com/Noc2)
- Runtime checks for web3Enable params (Thanks to https://github.com/Tbaut)

Changes:

- Add option to not ask password for 15 minutes (when signing transactions)
- Derived accounts uses the parent genesisHash by default (attaches to same chain)
- Make import from seed, QR & JSON options available on first-start
- Adjust popup width, allowing full display of e.g. addresses
- Always display network selection on all accounts
- Handling signing rejections (any order) transparently
- Small overall UI and use adjustments
- Latest upstream polkadot-js dependencies
- Prepare for i18n translations with initial i18next setup
- Rendering optimizations for Extrinsic displays


## 0.32.1 Jul 27, 2020

Contributed:

- Add Kulupu to the chain lock dropdown (Thanks to https://github.com/carumusan)
- Minor README updates (Thanks to https://github.com/marceljay)

Changes:

- Allow enter on signing to screens to submit
- Update to v3 JSON file format (with kdf)
- Update Polkadot naming (dropping CC1)
- Add base known chain info to icon/ss58 display lookups
- Adjust IdentityIcon backgrounds between dark/light themes


## 0.31.1 Jun 24, 2020

Changes:

- Indicate password error when account cannot be unlocked on signing
- Support for new Polkadot/Kusama/Substrate signing payloads


## 0.30.1 Jun 8, 2020

Contributed:

- Add the ability to import JSON keystore files (Thanks to https://github.com/shawntabrizi)
- Updated to derivation documentation (Thanks to https://github.com/EthWorks)

Changes:

- Rework account creation with top-level menu
- Allow accounts to be hidden, i.e. not injected (per account setting)
- Adjust allowed mnemonic seed strengths, 12, 15, 18, 21 & 24 all allowed
- Allow accounts to be tied to a specific network genesis (along with display)
- Allow accounts to be made hidden, i.e. not injected into dapps
- Remove duplication with Default/Substrate prefixes in dropdown (equivalent, only generic displayed)
- Display child accounts when no parent has been found (orphans)
- Display derived suri alongside parent account names
- Remove all bundled metadata, update is available for dapps to keep current
- Sorting of injected accounts based on created timestamp


## 0.25.1 May 14, 2020

Contributed:

- New account creation with default derivation (Thanks to https://github.com/EthWorks)

Changes:

- Adjust `web3Enable` promise to only resolve after the document has been loaded (is interactive)
- Update `signedExtensions` to cater for new chains
- Update metadata for latest Kusama


## 0.24.1 Apr 19, 2020

Contributed:

- Allow for per root-account derivation & indicators (Thanks to https://github.com/EthWorks)
- Add consistent validation to all text inputs (Thanks to https://github.com/EthWorks)
- Make address copy interfaces easily accessible (Thanks to https://github.com/EthWorks)

Changes:

- Latest dependency updates, base types for all latest Polkadot/Substrate chains
- Rework base storage access & cross-browser interfaces for consistency
- UI consistency adjustments & code maintainability cleanups


## 0.23.1 Mar 26, 2020

Contributed:

- Extract shared background code for re-use (Thanks to https://github.com/amaurymartiny)

Changes:

- Expose available genesisHash/specVersion to the dapps using the extension
- Allow prompts for metadata from dapps before decoding
- Add latest metadata for the Kusama network


## 0.22.1 Mar 03, 20202

Contributed:

- Fix uncaught exception when tab closes without action (Thanks to https://github.com/amaurymartiny)
- Add preliminary support for provider injection, no UI config (Thanks to https://github.com/amaurymartiny)

Changes:

- Dependencies updated to latest versions


## 0.21.1 Feb 07, 20202

Changes:

- Rebuild for re-publish
- Dependencies updated to latest versions


## 0.20.1 Jan 27, 2020

Contributed:

- Redesign of all UI components and views (Thanks to https://github.com/EthWorks)

Changes:

- Account copy now respects the address formatting
- Updated to latest polkadot-js/api


## 0.14.1 Dec 10, 2019

Contributed:

- Implement ability to sign raw messages (Thanks to https://github.com/c410-f3r)

Changes:

- Support for Kusama CC3
- Allow the use of hex seeds as part of account creation


## 0.13.1 Oct 25, 2019

Contributed:

- Account export functionality (Thanks to https://github.com/Anze1m)

Changes:

- Add a setting to switch off camera access
- Support for latest Polkadot/Substrate clients with v8 metadata & v4 transactions
- Remove support for non-operational Kusama CC1 network


## 0.12.1 Oct 02, 2019

Changes:

- Support for Kusama CC2
- Update to to latest stable dependencies


## 0.11.1 Sep 20, 2019

Changes:

- Cleanup metadata handling, when outdated for a node, transparently handle parsing errors
- Added Edgeware chain & metadata information
- Display addresses correctly formatted based on the ss58 chain identifiers
- Display identity icons based on chain types for known chains
- Integrate latest @polkadot/util, @polkadot-js/ui & @polkadot/api dependencies
- Updated to Babel 7.6 (build and runtime improvements)


## 0.10.1 Sep 10, 2019

Changes:

- Support for external accounts as presented by mobile signers, e.g. the Parity Signer
- Allow the extension UI to be opened in a new tab
- Adjust embedded chain metadata to only contain actual calls (for decoding)
- Minor code maintainability enhancements


## 0.9.1 Aug 31, 2019

Changes:

- Fix an initialization error in extension-dapp


## 0.8.1 Aug 25, 2019

Changes:

- Add basic support for seed derivation as part of the account import. Seeds can be followed by the derivation path, and derivation is applied on creation.
- Update the polkadot-js/api version to 0.90.1, the first non-beta version with full support for Kusama


## 0.7.1 Aug 19, 2019

Changes:

- Updated the underlying polkadot-js/api version to support the most-recent signing payload extensions, as will be available on Kusama


## 0.6.1 Aug 03, 2019

Changes:

- Support Extrinsics v3 from substrate 2.x, this signs an extrinsic with the genesisHash


## 0.5.1 Jul 25, 2019

Changes:

- Always check for site permissions on messages, don't assume that messages originate from the libraries provided
- Change the injected Signer interface to support the upcoming Kusama transaction format


## 0.4.1 Jul 18, 2019

Changes:

- Transactions are now signed with expiry information, so each transaction is mortal by default
- Unneeded scrollbars on Firefox does not appear anymore (when window is popped out)
- Cater for the setting of multiple network prefixes, e.g. Kusama
- Project icon has been updated


## 0.3.1 Jul 14, 2019

Changes:

- Signing a transaction now displays the Mortal/Immortal status
- Don't request focus for popup window (this is not available on FF)
- `yarn build:zip` now builds a source zip as well (for store purposes)


## 0.2.1 Jul 12, 2019

Changes:

- First release to Chrome and FireFox stores, basic functionality only
