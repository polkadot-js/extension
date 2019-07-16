# @polkadot/extension-dapp

A basic extractor that manipulates the `window.injectedWeb3` to retrieve and use all the extensions added to the page. It has a number of utilities -

- `web3Enable(dappName: string): Promise<InjectedExtension[]>` - to be called before anything else, retrieves the list of all injected extensions
- `web3Accounts(): Promise<InjectedAccountWithMeta[]>` - returns a list of all the injected accounts, accross all extensions (source in meta)
- `web3AccountsSubscribe(cb: (accounts: InjectedAccountWithMeta[]) => any): Promise<Unsubcall>` - subscribes to the accounts accross all extensions, returning a full list as changes are made
- `web3FromAddress(address: string): Promise<InjectedExtension>` - retrieves an extension for a specific address
- `web3FromSource(name: string): Promise<InjectedExtension>` - retrieves an extension identified by the name
- `web3Providers(): Promise<ProvidersWithMeta[]>` - returns a list of all providers (endpoints to be used by the api) across all extensions (source in meta)
- `isWeb3Injected: boolean` - boolean to indicate if `injectedWeb3` was found on the page
- `web3EnablePromise: Promise<InjectedExtension[]> | null` - `null` or the promise as a result of the last call to `web3Enable`

## Usage

```js
import Api from '@polkadot/api/promise';
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';

// returns an array of all the injected sources
// (this needs to be called first, before other requests)
const allInjected = await web3Enable('my cool dapp');

// returns an array of all the providers (api endpoints) available
const allProviders = await web3Providers();

// initialize the api with a provider
const api = new Api(allProviders.length ? allProviders[0].provider : defaultProvider);

// returns an array of { address, meta: { name, source } }
// meta.source contains the name of the extension that provides this account
const allAccounts = await web3Accounts();

// finds an injector for an address
const injector = await web3FromAddress('5DTestUPts3kjeXSTMyerHihn1uwMfLj8vU8sqF7qYrFabHE');

// sets the signer for the address on the @polkadot/api
api.setSigner(injector.signer);

// sign and send out transaction - notice here that the address of the account (as retrieved injected)
// is passed through as the param to the `signAndSend`, the API then calls the extension to present
// to the user and get it signed. Once completex, the api sends the tx + signature via the normal process
api.tx.balances
  .transfer('5C5555yEXUcmEJ5kkcCMvdZjUo7NGJiQJMS7vZXEeoMhj3VQ', 123456)
  .signAndSend('5DTestUPts3kjeXSTMyerHihn1uwMfLj8vU8sqF7qYrFabHE', (status) => { ... });
```
