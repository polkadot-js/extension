// Copyright 2019-2020 @polkadot/extension-dapp authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Signer } from "@polkadot/api/types";
import { SignerPayloadRaw, SignerResult } from "@polkadot/types/types";
import type { Injected, InjectedAccount, InjectedWindow } from "@polkadot/extension-inject/types";
import Web3 from "web3";

// RxJs interface, only the bare-bones of what we need here
interface Subscriber<T> {
  subscribe: (
    cb: (value: T) => void
  ) => {
    unsubscribe(): void;
  };
}

interface SingleSourceAccount {
  address: string;
  assets: { assetId: number }[];
  name: string;
}

interface SingleSource {
  accounts$: Subscriber<SingleSourceAccount[]>;
  environment$: string[];
  signer: Signer;
}

interface SingleWindow extends InjectedWindow {
  SingleSource: SingleSource;
}
// interface SingleSourceAccount {
//     address: string;
//     assets: { assetId: number }[];
//     name: string;
//   }

//   interface SingleSource {
//     accounts$: Subscriber<SingleSourceAccount[]>;
//     environment$: string[];
//     signer: Signer;
//   }

interface Web3Window extends InjectedWindow {
  web3: Web3;
  // this is injected by metaMask
  ethereum: any;
}

// transfor the Web3 accounts into a simple address/name array
function transformAccounts(accounts: string[]): InjectedAccount[] {
  return accounts.map((acc) => {
    return { address: acc };
  });
}

// add a compat interface of SingleSource to window.injectedWeb3
function injectWeb3(win: Web3Window): void {
  let accounts: InjectedAccount[] = [];

  // we don't yet have an accounts subscribe on the interface, simply get the
  // accounts and store them, any get will resolve the last found values
  //   win.web3.accounts$.subscribe((_accounts): void => {
  //     accounts = transformAccounts(_accounts);
  //   });

  // decorate the compat interface
  win.injectedWeb3.Web3Source = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/require-await
    enable: async (origin: string): Promise<Injected> => {
      if (win.ethereum) {
        win.web3 = new Web3(win.ethereum);
        await win.ethereum.enable();
        //let mainAccount=(await win.web3.eth.getAccounts())[0]
        return {
          accounts: {
            get: async (): Promise<InjectedAccount[]> => {
              return transformAccounts(await win.web3.eth.getAccounts());
            },
            subscribe: (cb: (accounts: InjectedAccount[]) => void): (() => void) => {
              const sub = win.ethereum.on("accountsChanged", function (accounts) {
                cb(transformAccounts(accounts));
              });

              return (): void => {
                sub.unsubscribe();
              };
            },
          },
          signer: {
            signRaw: async (raw: SignerPayloadRaw): Promise<SignerResult> => {
              return { id: 0, signature: await win.web3.eth.sign(raw.data, raw.address) };
            },
          },
        };
      }
    },
    version: win.web3.version,
  };
}

// TODO
// returns the SingleSource instance, as per
// https://github.com/cennznet/singlesource-extension/blob/f7cb35b54e820bf46339f6b88ffede1b8e140de0/react-example/src/App.js#L19
export default function initWeb3Source(): Promise<boolean> {
  return new Promise((resolve): void => {
    window.addEventListener("load", (): void => {
      console.log("loading web3");
      const win = window as Window & Web3Window;

      if (win.web3) {
        injectWeb3(win);
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}
