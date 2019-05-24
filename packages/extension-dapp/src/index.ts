// Copyright 2019 @polkadot/extension-dapp authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Injected, InjectedExtension, InjectedExtensionInfo, InjectedWindow } from './types';

const objmap = (window as InjectedWindow).injectedWeb3;
const isWeb3Injected = !!objmap && Object.keys(objmap).length !== 0;

function attachWeb3 (originName: string): Promise<Array<InjectedExtension>> {
  return !isWeb3Injected
    ? Promise.resolve([])
    : Promise.all(Object.values(objmap).map(({ name, version, enable }) =>
        Promise
          .all([Promise.resolve({ name, version }), enable(originName)])
          .catch(() => {
            console.error(`Unable to enable extension ${name}/${version}`);

            return [{ name, version }, null] as [InjectedExtensionInfo, null];
          })
      ))
      .then((values) =>
        values.filter(([, result]) =>
          result !== null
        ) as Array<[InjectedExtensionInfo, Injected]>
      )
      .then((values) =>
        values.map(([info, result]) => ({
          ...info, ...result
        }))
      )
      .catch(() => []);
}

export default attachWeb3;
export { attachWeb3, isWeb3Injected };
