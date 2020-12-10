// Copyright 2019-2020 @polkadot/extension-dapp authors & contributors
// SPDX-License-Identifier: Apache-2.0

// import type { Signer } from "@polkadot/api/types";
import type { Injected, InjectedAccount, InjectedWindow } from '@polkadot/extension-inject/types';

import Web3 from 'web3';

import { 
  //SignerPayloadJSON, 
  SignerPayloadRaw, SignerResult } from '@polkadot/types/types';

//import { TypeRegistry } from '@polkadot/types/create';

//const registry = new TypeRegistry();

interface Web3Window extends InjectedWindow {
  web3: Web3;
  // this is injected by metaMask
  ethereum: any;
}

// transfor the Web3 accounts into a simple address/name array
function transformAccounts (accounts: string[]): InjectedAccount[] {
  return accounts.map((acc, i) => {
    return { address: acc, name: 'MetaMask Address #' + i.toString() };
  });
}

// add a compat interface of SingleSource to window.injectedWeb3
function injectWeb3 (win: Web3Window): void {
  // let accounts: InjectedAccount[] = [];

  // we don't yet have an accounts subscribe on the interface, simply get the
  // accounts and store them, any get will resolve the last found values
  //   win.web3.accounts$.subscribe((_accounts): void => {
  //     accounts = transformAccounts(_accounts);
  //   });

  // decorate the compat interface
  win.injectedWeb3.Web3Source = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/require-await
    enable: async (_: string): Promise<Injected> => {
      win.web3 = new Web3(win.ethereum);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      await win.ethereum.enable();

      // let mainAccount=(await win.web3.eth.getAccounts())[0]
      return {
        accounts: {
          get: async (): Promise<InjectedAccount[]> => {
            console.log('fetching accounts');
            console.log(await win.web3.eth.getAccounts());

            return transformAccounts(await win.web3.eth.getAccounts());
          },
          subscribe: (cb: (accounts: InjectedAccount[]) => void): (() => void) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
            const sub = win.ethereum.on('accountsChanged', function (accounts:string[]) {
              cb(transformAccounts(accounts));
            });

            return (): void => {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
              sub.unsubscribe();
            };
          }
        },
        signer: {
          // signPayload: async (payload: SignerPayloadJSON) : Promise<SignerResult> => {
          //   console.log('signPayload');
          //   const raw = registry.createType('ExtrinsicPayload', payload).toString();

          //   return { id: 0, signature: await win.web3.eth.sign(raw, payload.address) };
          // },
          signRaw: async (raw: SignerPayloadRaw): Promise<SignerResult> => {
            console.log('signraw')
            console.log('signature', await win.web3.eth.sign(raw.data, raw.address));
            return { id: 0, signature: await win.web3.eth.sign(raw.data, raw.address) };
          }
        }
      };
    },
    version: win.web3.version
  };
}

// TODO udpate descr
// returns the SingleSource instance, as per
// https://github.com/cennznet/singlesource-extension/blob/f7cb35b54e820bf46339f6b88ffede1b8e140de0/react-example/src/App.js#L19
export default function initWeb3Source (): Promise<boolean> {
  console.log('initWeb3Source');

  return new Promise((resolve): void => {
    // console.log('listening')
    // window.addEventListener("load", (): void => {
    console.log('loading web3');
    const win = window as Window & Web3Window;

    if (win.ethereum) {
      injectWeb3(win);
      resolve(true);
    } else {
      resolve(false);
    }
    // });
  });
}
