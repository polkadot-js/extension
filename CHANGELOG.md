# 0.10.0-beta.x

- Support for external accounts, as presented by mobile signers, e.g. the Parity Signer

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
- Unneeded scrollbars on Firefox does not apper anymore (when window is popped out)
- Cater for the setting of multiple network prefixes, e.g. Kusama
- Project icon has been updated

# 0.3.1

- Signing a transaction now displays the Mortal/Immortal status
- Don't request focus for popup window (this is not available on FF)
- `yarn build:zip` now builds a source zip as well (for store purposes)

# 0.2.1

- First release to Chrome and FireFox stores, basic functionality only
