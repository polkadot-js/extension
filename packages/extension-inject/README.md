# @polkadot/extension-inject

This basic extension injector lets extension developers manage the global objects available to dapps, without the need to access the window object manually. By just calling enable on this package, the global object is setup and managed properly. From that point on, any dapp can access it with the [`@polkadot/extension-dapp`](../extension-dapp) package.

## Usage

```js
import { injectExtension } from '@polkadot/extension-inject';

// this a the function that will be exposed to be callable by the dapp. It resolves a promise
// with the injected interface, (see `Injected`) when the dapp at `originName` (url) is allowed
// to access functionality
function enableFn (originName: string): Promise<Injected> {
  ...
}

// injects the extension into the page
injectExtension(enableFn, { name: 'myExtension', version: '1.0.1' });
```
