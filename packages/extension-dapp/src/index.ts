// Copyright 2019-2020 @polkadot/extension-dapp authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Injected, InjectedAccount, InjectedAccountWithMeta, InjectedExtension, InjectedExtensionInfo, InjectedProviderWithMeta, InjectedWindow, Unsubcall, ProviderList } from '@polkadot/extension-inject/types';

// just a helper (otherwise we cast all-over, so shorter and more readable)
const win = window as Window & InjectedWindow;

// don't clobber the existing object, but ensure non-undefined
win.injectedWeb3 = win.injectedWeb3 || {};

// true when anything has been injected and is available
function web3IsInjected (): boolean {
  return Object.keys(win.injectedWeb3).length !== 0;
}

// helper to throw a consistent error when not enabled
function throwError (method: string): never {
  throw new Error(`${method}: web3Enable(originName) needs to be called before ${method}`);
}

// internal helper to map from Array<InjectedAccount> -> Array<InjectedAccountWithMeta>
function mapAccounts (source: string, list: InjectedAccount[]): InjectedAccountWithMeta[] {
  return list.map(({ address, genesisHash, name }): InjectedAccountWithMeta => ({
    address,
    meta: { genesisHash, name, source }
  }));
}

// have we found a properly constructed window.injectedWeb3
let isWeb3Injected = web3IsInjected();

// we keep the last promise created around (for queries)
let web3EnablePromise: Promise<InjectedExtension[]> | null = null;

export { isWeb3Injected, web3EnablePromise };

// enables all the providers found on the injected window interface
export function web3Enable (originName: string): Promise<InjectedExtension[]> {
  web3EnablePromise =
    Promise
      .all(
        Object.entries(win.injectedWeb3).map(([name, { enable, version }]): Promise<[InjectedExtensionInfo, Injected | void]> => {
          return Promise.all([
            Promise.resolve({ name, version }),
            enable(originName).catch((error: Error): void => {
              console.error(`Error initializing ${name}: ${error.message}`);
            })
          ]);
        })
      )
      .then((values: [InjectedExtensionInfo, Injected | void][]): InjectedExtension[] =>
        values
          .filter(([, ext]): boolean => !!ext)
          .map(([info, ext]): InjectedExtension => {
            // if we don't have an accounts subscriber, add a single-shot version
            if (ext && !ext.accounts.subscribe) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ext.accounts.subscribe = (cb: (accounts: InjectedAccount[]) => any): Unsubcall => {
                ext.accounts.get().then(cb).catch((error: Error) => console.error(error));

                return (): void => {
                  // no ubsubscribe needed, this is a single-shot
                };
              };
            }

            const injected: Partial<InjectedExtension> = { ...info, ...ext };

            return injected as InjectedExtension;
          })
      )
      .catch((): InjectedExtension[] => [] as InjectedExtension[])
      .then((values): InjectedExtension[] => {
        const names = values.map(({ name, version }): string => `${name}/${version}`);

        isWeb3Injected = web3IsInjected();
        console.log(`web3Enable: Enabled ${values.length} extension${values.length !== 1 ? 's' : ''}: ${names.join(', ')}`);

        return values;
      });

  return web3EnablePromise;
}

// retrieve all the accounts accross all providers
export async function web3Accounts (): Promise<InjectedAccountWithMeta[]> {
  if (!web3EnablePromise) {
    return throwError('web3Accounts');
  }

  const accounts: InjectedAccountWithMeta[] = [];
  const injected = await web3EnablePromise;
  const retrieved = await Promise.all(
    injected.map(async ({ accounts, name: source }): Promise<InjectedAccountWithMeta[]> => {
      try {
        const list = await accounts.get();

        return mapAccounts(source, list);
      } catch (error) {
        // cannot handle this one
        return [];
      }
    })
  );

  retrieved.forEach((result): void => {
    accounts.push(...result);
  });

  const addresses = accounts.map(({ address }): string => address);

  console.log(`web3Accounts: Found ${accounts.length} address${accounts.length !== 1 ? 'es' : ''}: ${addresses.join(', ')}`);

  return accounts;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function web3AccountsSubscribe (cb: (accounts: InjectedAccountWithMeta[]) => any): Promise<Unsubcall> {
  if (!web3EnablePromise) {
    return throwError('web3AccountsSubscribe');
  }

  const accounts: Record<string, InjectedAccount[]> = {};

  const triggerUpdate = (): void => {
    cb(Object.entries(accounts).reduce((result, [source, list]): InjectedAccountWithMeta[] => {
      result.push(...mapAccounts(source, list));

      return result;
    }, [] as InjectedAccountWithMeta[]));
  };

  const unsubs = (await web3EnablePromise).map(({ accounts: { subscribe }, name: source }): Unsubcall =>
    subscribe((result): void => {
      accounts[source] = result;
      triggerUpdate();
    })
  );

  return (): void => {
    unsubs.forEach((unsub): void => {
      unsub();
    });
  };
}

// find a specific provider based on the name
export async function web3FromSource (source: string): Promise<InjectedExtension> {
  if (!web3EnablePromise) {
    return throwError('web3FromSource');
  }

  const sources = await web3EnablePromise;
  const found = source && sources.find(({ name }): boolean => name === source);

  if (!found) {
    throw new Error(`web3FromSource: Unable to find an injected ${source}`);
  }

  return found;
}

// find a specific provider based on an address
export async function web3FromAddress (address: string): Promise<InjectedExtension> {
  if (!web3EnablePromise) {
    return throwError('web3FromAddress');
  }

  const accounts = await web3Accounts();
  const found = address && accounts.find((account): boolean => account.address === address);

  if (!found) {
    throw new Error(`web3FromAddress: Unable to find injected ${address}`);
  }

  return web3FromSource(found.meta.source);
}

// retrieve all providers exposed by one source
export async function web3ListRpcProviders (source: string): Promise<ProviderList | null> {
  const { provider } = await web3FromSource(source);

  if (!provider) {
    console.warn(`Extension ${source} does not expose any provider`);

    return null;
  }

  return provider.listProviders();
}

// retrieve all providers exposed by one source
export async function web3UseRpcProvider (source: string, key: string): Promise<InjectedProviderWithMeta> {
  const { provider } = await web3FromSource(source);

  if (!provider) {
    throw new Error(`Extension ${source} does not expose any provider`);
  }

  const meta = await provider.startProvider(key);

  return { meta, provider };
}
