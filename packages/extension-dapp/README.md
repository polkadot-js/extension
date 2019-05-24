# @polkadot/extension-dapp

A basic injected that manipulates the `window.injectedWeb3` to extract all the providers added to the page.

## Usage

```js
import { attachWeb3, isWeb3Injected } from '@polkadot/extension-dapp';

const allInjected = await attachWeb3(... dapp name...);
```
