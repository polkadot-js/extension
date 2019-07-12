# @polkadot/extension

[![Greenkeeper badge](https://badges.greenkeeper.io/polkadot-js/extension.svg)](https://greenkeeper.io/)

A very simple scaffolding browser extension that injects a [@polkadot/api](https://github.com/polkadot-js/api) Signer into a page, along with any associated accounts, allowing for use by any dapp. This is an extensible POC implementation of a Polkadot/Substrate browser signer.

As it stands, it does one thing: it _only_ manages accounts and allows the signing of transactions with those accounts. It does not inject providers for use by dapps at this early point, nor does it perform wallet functions where it constructs and submits txs to the network.

## Running

Currently is not packaged since it is under heavy development. As such you need to build it yourself. To use -

1. Build via `yarn build` or `yarn watch`
2. Install the extension
  - Chrome:
    - go to `chrome://extensions/`
    - ensure you have the Development flag set
    - "Load unpacked" and point to `packages/extension/build`
    - if developing, after making changes - refresh the extension
  - Firefox:
    - go to `about:debugging#addons`
    - check "Enable add-on debugging"
    - click on "Load Temporary Add-on" and point to `packages/extension/build/manifest.json`
    - if developing, after making changes - reload the extension
3. When visiting `https://polkadot.js.org/apps/` it will inject the extension

Once added, you can create an account (via a generated seed) or import via an existing seed. The [apps UI](https://github.com/polkadot-js/apps/), when loaded, will show these accounts as `<account name> (extension)`

## Development

The repo is split into a number of packages -

- [extension](packages/extension/) - All the injection and background processing logic (the main entry)
- [extension-ui](packages/extension-ui/) - The UI components for the extension, do build up the popup
- [extension-dapp](packages/extension-dapp/) - A convenience wrapper to work with the injected objects, simplifying data extraction for any dapp that wishes to integrate the extension (or any extension that supports the interface)
- [extension-inject](packages/extension-inject/) - A convience wrapper that allows extension developers to inject their extension for use by dapp developers

## Dapp developers

The actual in-depth technical breakdown is given in the next section for any dapp developer wishing to work with the raw objects injected into the window. However convenience wrappers are provided that allows for any dapp to use this extension (or any other extension that conforms to the interface) without
having to manage any additional info.

This approach is used to support multiple external signers in for instance [apps](https://github.com/polkadot-js/apps/). You can read more about the conenience wrapper [@polkadot/extension-dapp](packages/extension-dapp/) along with usage samples.

## Technical

The extension injection interfaces are generic, i.e. it is designed to allow any extension developer to easily inject extensions (that conforms to a specific interface) and at the same time it allows for any dapp developer to easily enable the interfaces from multiple extensions at the same time. It is not an all-or-nothing approch, but rather it is an ecosystem where the user can choose which extensions fit his style best.

From a dapp developer perspective, the only work needed is to include the [@polkadot/extension-dapp](packages/extension-dapp/) package and call the appropriate enabling function to retrieve all the extensions and their associated interfaces.

From an extension developer perspective, the only work required is to enable the extension via the razor-thin [@polkadot/extension-inject](packages/extension-inject/) wrapper. Any dapp using the above interfaces will have access.

When there is more than one extension, each will populate an entry above, so from an extension implementation perspective, the structure should not be overridded. The `Injected` interface, as returned via `enable`, contains the following and is what any compliant extension supplies -

```js
interface Injected {
  // the interface for Accounts, as detailed below
  readonly accounts: Accounts;
  // the standard Signer interface for the API, as detailed below
  readonly signer: Signer;
  // not injected as of yet, subscriptable provider for polkadot-js API injection,
  // this can be passed to the API itself upon construction in the dapp
  // readonly provider: Provider
}

interface Account = {
  // ss-58 encoded address
  readonly address: string;
  // (optional) name for display
  readonly name?: string;
};

// exposes accounts
interface Accounts {
  // retrieves the list of accounts for right now
  get: () => Promise<Account[]>;
  // (optional) subscribe to all accounts, updating as they change
  subscribe?: (cb: (accounts: Account[]) => any) => () => void
}

// a signer that communicates with the extension via sendMessage
interface Signer extends SignerInterface {
  // no specific signer extensions, exposes the `sign` interface for use by
  // the polkadot-js API, confirming the the Signer interface for this API
}
```

# Technical information

This information may change and evolve. It is therefore recommended that all access is done via the `-dapp` and `-inject` packages, which removes the need to work with the lower-level targets.

The extension injects `injectedWeb3` into the global `window` object, exposing the following: (This is meant to be generic accross extensions, allowing any dapp to utilize multiple signers, as they are available)

```js
window.injectedWeb3 = {
  // this is the name for this extension, there could be multiples injected,
  // each with their own keys, here `polkadot-js` is for this extension
  'polkadot-js': {
    // semver for the package
    version: '0.1.0',

    // this is called to enable the injection, and returns an injected
    // object containing the accounts, signer and provider interfaces
    // (or it will reject if not authorized)
    enable (originName: string): Promise<Injected>
  }
}
```

The app can use all or any of these, depending on needs. To instantiate the `@polkadot/api` signer (allowing the extension to sign messages) can be done via (assuming a known, single extension) -

```js
import { ApiPromise } from '@polkadot/api';

const pjsx = await window.injectedWeb3['polkadot-js'].enable('my dapp');
const accounts = await pjsx.accounts.get();
const api = await Api.create({ signer: pjsx.signer });
```

Generally, you would probably want to have access to all extensions available and have a slighly higher-level interface to work with. For these cases, [extension-dapp](packages/extension-dapp/) provides a cleaner interface around the injected object, making it simpler to work with from a dapp perspective.
