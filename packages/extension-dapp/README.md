# @polkadot/extension-dapp

A basic extractor that manipulates the `window.injectedWeb3` to retrieve all the providers added to the page. It has a number of utilities -

- `web3Enable(dappName: string)` - to be called before anything else, retrieves the list of all injected extensions/providers
- `web3Accounts()` - returns alist of all the injected accounts, accross all extensions (source in meta)
- `web3FromAddress(address: string)` - Retrieves a provider for a specific address
- `web3FromSource(name: string)` - Retriebes a provider identified by the name
- `isWeb3Injected` - boolean to indicate if `injectedWeb3` was found on the page
- `web3EnablePromise` - `null` or the value of the last call to `web3Enable`

## Usage

```js
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';

// returns an array of all the injected sources
// (this needs to be called first, before other requests)
const allInjected = await web3Enable('my cool dapp');

// returns an array of { address, meta: { name, source } }
const allAccounts = await web3Accounts();

// finds an injector for an address
const injector = await web3FromAddress('5DTestUPts3kjeXSTMyerHihn1uwMfLj8vU8sqF7qYrFabHE');
// sets the signer for the address on the @polkadot/api
api.setSigner(injector.signer);
```
