// Copyright 2019 @polkadot/extension-dapp authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { InjectedAccount, InjectedAccountWithMeta, InjectedExtension, InjectedWindow, Unsubcall } from './types';

// our extension adaptor for other kinds of extensions
import compatInjector from './compat';

// just a helper (otherwise we cast all-over, so shorter and more readable)
const win = window as InjectedWindow;

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
function mapAccounts (source: string, list: Array<InjectedAccount>): Array<InjectedAccountWithMeta> {
  return list.map(({ address, name }) => ({
    address,
    meta: { name, source }
  }));
}

// have we found a properly constructed window.injectedWeb3
let isWeb3Injected = web3IsInjected();

// we keep the last promise created around (for queries)
let web3EnablePromise: Promise<Array<InjectedExtension>> | null = null;

export { isWeb3Injected, web3EnablePromise };

// enables all the providers found on the injected window interface
export function web3Enable (originName: string): Promise<Array<InjectedExtension>> {
  web3EnablePromise = compatInjector().then(() =>
    Promise.all(
      Object.entries(win.injectedWeb3).map(([name, { enable, version }]) =>
        Promise.all([
          Promise.resolve({ name, version }),
          enable(originName).catch((error: Error) => {
            console.error(`Error initializing ${name}: ${error.message}`);
          })
        ])
      )
    )
    .then((values) =>
      values
        .filter(([, ext]) => ext)
        .map(([info, ext]) => {
          // if we don't have an accounts subscriber, add a single-shot version
          if (ext && !ext.accounts.subscribe) {
            ext.accounts.subscribe = (cb: (accounts: Array<InjectedAccount>) => any): Unsubcall => {
              ext.accounts.get().then(cb).catch(console.error);

              return (): void => {
                // no ubsubscribe needed, this is a single-shot
              };
            };
          }

          return { ...info, ...ext } as InjectedExtension;
        })
    )
    .catch(() => [] as Array<InjectedExtension>)
    .then((values) => {
      const names = values.map(({ name, version }) => `${name}/${version}`);

      isWeb3Injected = web3IsInjected();
      console.log(`web3Enable: Enabled ${values.length} extension${values.length !== 1 ? 's' : ''}: ${names.join(', ')}`);

      return values;
    })
  );

  return web3EnablePromise;
}

// retrieve all the accounts accross all providers
export async function web3Accounts (): Promise<Array<InjectedAccountWithMeta>> {
  if (!web3EnablePromise) {
    return throwError('web3Accounts');
  }

  const accounts: Array<InjectedAccountWithMeta> = [];
  const injected = await web3EnablePromise;
  const retrieved = await Promise.all(
    injected.map(async ({ accounts, name: source }) => {
      try {
        const list = await accounts.get();

        return mapAccounts(source, list);
      } catch (error) {
        // cannot handle this one
        return [];
      }
    })
  );

  retrieved.forEach((result) => accounts.push(...result));

  const addresses = accounts.map(({ address }) => address);

  console.log(`web3Accounts: Found ${accounts.length} address${accounts.length !== 1 ? 'es' : ''}: ${addresses.join(', ')}`);

  return accounts;
}

export async function web3AccountsSubscribe (cb: (accounts: Array<InjectedAccountWithMeta>) => any): Promise<Unsubcall> {
  if (!web3EnablePromise) {
    return throwError('web3AccountsSubscribe');
  }

  const accounts: { [source: string]: Array<InjectedAccount> } = {};
  const triggerUpdate = (): void => {
    cb(Object.entries(accounts).reduce((result, [source, list]) => {
      result.push(...mapAccounts(source, list));

      return result;
    }, [] as Array<InjectedAccountWithMeta>));
  };

  const unsubs = (await web3EnablePromise).map(({ accounts: { subscribe }, name: source }) =>
    subscribe((result) => {
      accounts[source] = result;
      triggerUpdate();
    })
  );

  return (): void => {
    unsubs.forEach((unsub) => unsub());
  };
}

// find a specific provider based on an address
export async function web3FromAddress (address: string): Promise<InjectedExtension> {
  if (!web3EnablePromise) {
    return throwError('web3FromAddress');
  }

  const accounts = await web3Accounts();
  const found = address && accounts.find((account) => account.address === address);

  if (!found) {
    throw new Error(`web3FromAddress: Unable to find injected ${address}`);
  }

  return web3FromSource(found.meta.source);
}

// find a specific provider based on the name
export async function web3FromSource (source: string): Promise<InjectedExtension> {
  if (!web3EnablePromise) {
    return throwError('web3FromSource');
  }

  const sources = await web3EnablePromise;
  const found = source && sources.find(({ name }) => name === source);

  if (!found) {
    throw new Error(`web3FromSource: Unable to find an injected ${source}`);
  }

  return found;
}
