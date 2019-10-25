# 0.13.1

- Account export functionality (Thanks to https://github.com/Anze1m)
- Add a setting to switch off camera access
- Support for latest Polkadot/Substrate clients with v8 metadata & v4 transactions
- Remove support for non-operational Kusama CC1 network

# 0.12.1

- Support for Kusama CC2
- Update to to latest stable dependencies

# 0.11.1

- Cleanup metadata handling, when outdated for a node, transparently handle parsing errors
- Added Edgeware chain & metadata information
- Display addresses correctly formatted based on the ss58 chain identifiers
- Display identity icons based on chain types for known chains
- Integrate latest @polkadot/util, @polkadot-js/ui & @polkadot/api dependencies
- Updated to Babel 7.6 (build and runtime improvements)

# 0.10.1

- Support for external accounts as presented by mobile signers, e.g. the Parity Signer
- Allow the extension UI to be opened in a new tab
- Adjust embedded chain metadata to only contain actual calls (for decoding)
- Minor code maintainability enhancements

# 0.9.1

- Fix an initialization error in extension-dapp

# 0.8.1

- Add basic support for seed derivation as part of the account import. Seeds can be followed by the derivation path, and derivation is applied on creation.
- Update the polkadot-js/api version to 0.90.1, the first non-beta version with full support for Kusama

# 0.7.1

- Updated the underlying polkadot-js/api version to support the most-recent signing payload extensions, as will be available on Kusama

# 0.6.1

- Support Extrinsics v3 from substrate 2.x, this signs an extrinsic with the genesisHash

# 0.5.1

- Always check for site permissions on messages, don't assume that messages originate from the libraries provided
- Change the injected Signer interface to support the upcoming Kusama transaction format

# 0.4.1

- Transactions are now signed with expiry information, so each transaction is mortal by default
- Unneeded scrollbars on Firefox does not appear anymore (when window is popped out)
- Cater for the setting of multiple network prefixes, e.g. Kusama
- Project icon has been updated

# 0.3.1

- Signing a transaction now displays the Mortal/Immortal status
- Don't request focus for popup window (this is not available on FF)
- `yarn build:zip` now builds a source zip as well (for store purposes)

# 0.2.1

- First release to Chrome and FireFox stores, basic functionality only
