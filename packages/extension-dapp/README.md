# @polkadot/extension-dapp

A basic injected that manipulates the `window.injectedWeb3` to extract all the providers added to the page.

## Usage

```js
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';

// returns an array of all the injected sources
// (this needs to be called first, before other requests)
const allInjected = await web3Enable(...my dapp name...);

// returns an array of { address, meta: { name, source } }
const allAccounts = await web3Accounts();

// finds an injector for an address
const injector = await web3FromAddress(...address...)
```
