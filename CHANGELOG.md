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
