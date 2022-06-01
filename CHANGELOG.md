# CHANGELOG

## 0.4.3 (Koni)
Build date: May 31, 2022.

Update:
- Custom network, Custom Endpoint (#36)
- Integrate SubSpace Token (#301)

Bug Fixed:
- Display 2 popup connect when connect to https://portal.astar.network... (#285)
- Bug happens when viewing Transaction History after Delete token (#296)
- Other defects related to Import EVM Tokens (#266)
- Bug Send NFT when balance is too low (#265)

## 0.4.2 (Koni)
Build date: May 20, 2022.

Update:
- Add Moonbeam and Moonriver staking data (#104)
- Integrate Genshiro & Equilibrium (#174)
- Integrate new cross-chain tokens on Karura (RMRK, ARIS, QTZ, ...) (#184)
- Add more Astar EVM tokens (#186)
- Improve import Private key feature (#208)

Bug Fixed:
- Fix when select aUSD (Acala) to transfer (#282)
- Fix the balance display incorrect after transfer Sub-token successfully (#283)
- Fix can't connect account in case user created account successfully while popup connect wallet is displaying (#231)
- Fix some style bug in (#258)
- Fix display multi popup connect wallet (#227)
- Fix tooltip not showing on the popup view on firefox browser (#224)

## 0.4.1 (Koni)
Build date: May 11, 2022.

Update:
- Support import ERC20 and ERC721 for EVM Networks (#160)
- Implement new Send Fund UI with support send tokens, send EVM assets (#32, #143, #118)
- Add option allow accept all website on create account screen (#198)
- Update Centrifuge Parachain info (#203)
- Update logo of $CHRWNA, $CHAO (#193,#195)

Bug Fixed:
- Fix extension error when entering Substrate's seed phrase but selecting EVM account (#192)
- Fix bug can not load NFT (#200)
- Fix bug can not send EVM NFT (#209)
- Fix bug display incorrect screen when connection is lost (#225)
- Fix bug and improve some experience (#168)
- Fix bug not update them when change them from popup view (#228)

## 0.3.6 (Koni)
Build date: Apr 22, 2022.
Update:
- Split background.js and extension.js into multi file for loading faster and can be submit to Firefox store (#80)
- Update Centrifuge Parachain info (#203)
- Support ERC20 tokens of Moonfit on Moonbase (#201)

## 0.3.5 (Koni)
Build date: Apr 18, 2022.
Bug Fixed:
- Fix Astar issues on display NFT because wrong IPFS

## 0.3.4 (Koni)
Build date: Apr 16, 2022.

Update:
- Improve custom access screen (issue #91)
- Update stable coin tokens and others in some networks (issue #117,#170)
  - Statemine
  - Moonbeam
  - Moonriver
  - Karura
  - Bifrost

Bug Fixed:
- Fix network list is incorrect in case importing an account from seed phase when there is no account yet (issue #120)
- Fix grammar error and type issue of button (issue #156,#166)
- Fix some network in wrong group (issue #180)


## 0.3.3 (Koni)
Build date: Apr 08, 2022.

Update:
- Support get Shiden balance and tokens (issue #136)
- Improve NFT display with extending mode (issue #109)

Bug Fixed:
- Some problems related to NFT function (issue #105)
- Not have website list in website access screen

## 0.3.2 (Koni)
Build date: Apr 07, 2022. 

Update:
- Improve the custom access screen (issue #91)
- Display Astar(EVM) tokens balances and ERC20 tokens (issue #92)
- Update the new Settings screen (issue #85)
- Integrate Astar NFT (issue #44)
  - AstarDegens
  - Astarians
  - AstarBots
  - AstarGhost
  - Astar Kevin
  - Astar Punk X
  - Astar Invisible Friends
  - Astar MetaLion Kingdom
  - Astar Karafuru

## 0.3.1 (Koni)
Build date: Apr 05, 2022. Complete External security audit

Update:
- Display Moonbeam / Moonriver NFT (issue #33)
- Send & Receive Moonbeam / Moonriver NFT (issue #34)
- Support EVM Account for Astar Network (issue #92)
- Support Ledger: Attach account, show balance, receive assets (issue #43)
- Integrate Bit.Country NFT: Display, Send, Receive (issue #52)
- Improve experience when clicking the disconnect icon (issue #86)
- Improved import JSON file from Polkadot {.js}: Single Account and All Account (Issue #88 & #90)

Bug Fixed:
- Fix some bugs with AlephZero balance (issue #50)
- Fix some small bugs

## 0.2.9 (Koni)
Build date: Mar 22, 2022. Complete external security audit
Update:
- Show Moonbase and Moonriver tokens balance
- Show Bifrost cross-chain tokens Balance: DOT, KAR, KSM, kUSD, PHA, RMRK, ZLK
- Improve some UX tasks

Bug Fixed:
- Display RMRK 2.0
- Staking balance 

## 0.2.8 (Koni)
Build date: Mar 18, 2022. Complete External Security Audit
**Update:**
- Send and Receive NFT: Acala, RMRK, Quartz, Statemine
- Support RMRK 2.0 NFT for Singular
- Show Karura and Acala tokens balances: LCDOT, LDOT, DOT,aUSD, kUSD
- Show Karura and Acala cross-chain assets: BNC, KINT, KSM, LKSM, PHA, TAI, kBTC, vsKSM, RMRK
- Import Private key for EVM account from Metamask
- Hide account balance 
- Customize avatar for All account

**Bug Fixed:**
- Bug when search account
- Temporary remove Export all account feature

## 0.2.7 (Koni)
**Update:**
- Support $GLMR, $MOVR
- Shows balance amount in multiple formats
- Update Transactions history screen using SubQuery data
- Update export Private key for Metamask
- Improve NFT display performance
- Add Bit.Country Testnet

**Bug Fixed:**
- Fix request access UI
- Fix Scan Address Qr UI
- Fix RMRK's NFT display error by wrong metadata

---

## 0.2.6 (Koni)
**Update:**

- Update Crowdloan Status
- Update Crowdloan Link
- Add Donate button
- Add Moonbase Alpha Testnet
- Update Sign and Request access screen
- Some small UI update
- Improve performance for Staking tab
- Remove require enter account name when creating an account

**Bug Fixed:**

- Karura's NFT display error
---

## 0.2.5 (Koni)
Changes:
- Add crowdloan funds status
- Support SubSquid Graphql
- Update style Authorize, Metadata, Signing, Export All, Export, Forget screen
- ...

## 0.2.3 (Koni)
Build date: Feb 21, 2022. Complete internal security audit

Update:
- Add Rococo explorer with Subscan
- Add ParaID for Polkadex to view Polkadot crowdloan contributed

---

## 0.2.2 (Koni)
Build date: Feb 19, 2022. Complete internal security audit

Update:
- Added the feature to track the balances of multiple accounts in one wallet
- Integration Quartz Network's NFT 
- Integration Layer 1 blockchain built on Substrate Aleph Zero
- Displays Staking information of some networks in the Polkadot and Kusama ecosystem

Bugs Fixed:
- Extension Crash due to memory overflow when loading NFT data
- Unstable NFT data display when switching between multiple accounts

---

## 0.2.1 (Koni)

Build date: Feb 10, 2022. Complete internal security audit

Update:
- Update new architecture
- Update new layout
- Integration RMRK's NFT display feature
- Integration Unique's NFT display feature
- Integration Acala's NFT display feature
- Add Polkadot and Kusama staking display feature

---

## 0.1.0 (Koni)

Build date: Jan 25, 2022. Complete internal security audit

Update:
- Packaged according to the standards of Firefox Extension
- Add loading screen with SubWallet logo
- Add mechanism to update Crowdloan data every second

Bugs Fixed:
- No warning when entering the wrong password when restoring from JSON file

---

## 0.0.3 (Koni) 

Build date: Jan 16, 2022. Complete internal security audi

Update
- Crowdloan Balance Management
- Add Rococo Relaychain Testnet
- Add another network in supported networks
- Supported Brave, MS Edge, and Firefox

---

## 0.0.2 (Koni)
Build date: Jan 10, 2022. Complete internal security audit

Update
- Add option: Show zero balance when choosing to Allow use on any chain
- Add screen: Transactions result when Send Fund
- Add button view transaction on Subscan.io on Transactions result
- Add Westend Relaychain Test Network
- Add searchable for choose network input when creating new account
- Add tooltip for send, receive and swap in the homepage
- Update the wallet address format in the chain list
- Update new style and Logo
- Improved text color contrast
- And some small change

Bugs Fixed
- Do not automatically jump to the new account screen after restoring from the JSON file
- No drop down to the selection screen when clicking input title in the send fund screen
- Missing icon corner and border corner
- Wrong slider state displayed in the screen manage Website Access
- Logical error when searching for a network that has not combined both filter conditions.
- Can't use the feature: Transfer the full account balance, reap the sender
- And some UI bugs

---

## 0.0.1 (Koni) 
Build date: Jan 05, 2022 with basic features

Update:
- Create an account
- Restore and import account
- Receive and send fund
- Manage an account balance
- And much more

--- 

## 0.42.5 Jan 10, 2022

**Important** Not published to the stores, aligns with latest released packages.

Changes:

- Ensure that only latest metadata is applied (when multiple genesis)
- Rename all `*.ignore-component-test.spec.ts` to `*.spec.ts` (cross-repo consistency)
- Only apply cross-browser environment globally in non-content scripts
- Ensure package path is availble under ESM & CJS
- Bump `@polkadot/util` to 8.3.1
- Bump `@polkadot/api` to 7.3.1


## 0.42.4 Dec 27, 2021

**Important** As 0.42.3, not published to the stores, fixes dependency issue in 0.42.4.

Changes:

- Ensure `@subwallet/extension-mocks` is correctly listed as devDependency


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
