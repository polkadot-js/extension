# @polkadot/extension-inject

This is a basic extension injector that manages access to the global objects available. As an extension developer, you don't need to manage access to the window object manually, by just calling  enable here, the global object is setup and managed properly. From here any dapp can access it with the `@polkadot/extension-dapp` package;

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
