# @polkadot/extension-dapp

A basic extractor that manipulates the `window.injectedWeb3` to retrieve all the providers added to the page. It has a number of utilities -

- `web3Enable(dappName: string): Promise<InjectedExtension[]>` - to be called before anything else, retrieves the list of all injected extensions/providers
- `web3Accounts(): Promise<InjectedAccountWithMeta[]>` - returns a list of all the injected accounts, accross all extensions (source in meta)
- `web3AccountsSubscribe(cb: (accounts: InjectedAccountWithMeta[]) => any): Promise<Unsubcall>` - subscribes to the accounts accross all extensions, returning a full list as changes are made
- `web3FromAddress(address: string): Promise<InjectedExtension>` - Retrieves a provider for a specific address
- `web3FromSource(name: string): Promise<InjectedExtension>` - Retrieves a provider identified by the name
- `isWeb3Injected: boolean` - boolean to indicate if `injectedWeb3` was found on the page
- `web3EnablePromise: Promise<InjectedExtension[]> | null` - `null` or the promise as a result of the last call to `web3Enable`

## Usage

```js
import { web3Accounts, web3Enable, web3FromAddress, web3RpcProvider } from '@polkadot/extension-dapp';

// returns an array of all the injected sources
// (this needs to be called first, before other requests)
const allInjected = await web3Enable('my cool dapp');

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

// retrieve a RPC provider from a particular source
// if the extension does not expose this provider, it will return an error.
const provider = web3RpcProvider('polkadot-js', { type: 'WsProvider', payload: 'http://locahost:9944' });
const head = await provider.send('chain_getHeader', []); // shows latest header
```
