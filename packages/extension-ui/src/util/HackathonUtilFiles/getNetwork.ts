// [object Object]
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import type { Chain } from '@polkadot/extension-chains/types';

// eslint-disable-next-line header/header
export default function getNetworkInfo(chain: Chain | null | undefined)
  : { url: string, coin: string, decimals: number, ED: number, defaultFee: string } {
  const network = chain ? chain.name.replace(' Relay Chain', '') : '';

  switch (network) {
    case ('Westend'):
      return {
        coin: 'WND',
        decimals: 12,
        ED: 0.01, // existential deposit
        url: 'wss://westend-rpc.polkadot.io',
        defaultFee: '16100000000'
        // genesisHash:'0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e'
      };
    case ('Polkadot'):
      return {
        coin: 'DOT',
        decimals: 10,
        ED: 1, 
        url: 'wss://rpc.polkadot.io',
        defaultFee: '161000000'
        // genesisHash:'0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3'
      };
    case ('Kusama'):
      return {
        coin: 'KSM',
        decimals: 12,
        ED: 0.0000333333,
        url: 'wss://kusama-rpc.polkadot.io',
        defaultFee: '161000000'
        // genesisHash:'0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe'
      };
    case ('Bifrost'):
      return {
        coin: 'BNC',
        url: 'wss://bifrost.polkadot.io',
        decimals: 12,
        ED: 1, 
        defaultFee: '16100000000'
      };
    case ('Centrifuge Chain'):
      return {
        coin: 'CFG',
        url: 'wss://centrifuge.polkadot.io',
        decimals: 12,
        ED: 1, 
        defaultFee: '16100000000'
      };
    case ('Dock Mainnet'):
      return {
        coin: 'DCK',
        url: 'wss://dock-rpc.polkadot.io',
        decimals: 12,
        ED: 1, 
        defaultFee: '16100000000'
      };
    case ('Edgeware'):
      return {
        coin: 'EDG',
        url: 'wss://edgeware-rpc.polkadot.io',
        decimals: 12,
        ED: 1, 
        defaultFee: '16100000000'
      };
    case ('Equilibrium Network'):
      return {
        coin: 'EQ',
        url: 'wss://equilibrium-rpc.polkadot.io',
        decimals: 12,
        ED: 1,
        defaultFee: '16100000000'
      };
    case ('HydraDX'):
      return {
        coin: 'HDX',
        url: 'wss://hydradx-rpc.polkadot.io',
        decimals: 12,
        ED: 1,
        defaultFee: '16100000000'
      };
    case ('Karura'):
      return {
        coin: 'KAR',
        url: 'wss://karura.polkawallet.io',
        decimals: 12,
        ED: 1,
        defaultFee: '16100000000'
      };
    default:
      return {
        coin: 'WND',
        decimals: 12,
        ED: 0.01,
        url: 'wss://westend-rpc.polkadot.io',
        defaultFee: '16100000000'
        // genesisHash:'0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e'
      };
  }
}
