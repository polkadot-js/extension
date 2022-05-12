// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { convertToEvmAddress, filterAddressByNetworkKey } from '@subwallet/extension-koni-base/utils/utils';

describe('test extension base utils', () => {
  test('test extension base utils SS58 to H160', () => {
    expect(convertToEvmAddress('5EXZi1V69J9CymncgsvoaTsTcRRRH2AjKA3D9T1pesT5G839')).toEqual('0x6Cf4a8eA35ea3d46CCcb30dFbBC52BB77CD6e07b');
    expect(convertToEvmAddress('5FEdUhBmtK1rYifarmUXYzZhi6fmLbC6SZ7jcNvGuC2gaa2r')).toEqual('0x8c4669eD3Ec78C466cf765B342452c6B212Fb451');
  });

  test('test extension base utils filter ethereum address', () => {
    // const newAddress = convertEthereumAddress('5CdENHW9om68xs3esPRvWbeUxcYwDXBePJ3fB96gkQgBLC2i', 'moonbase');
    const addresses = ['0x25B12Fe4D6D7ACca1B4035b26b18B4602cA8b10F', '5Dq5eVtCewu7kWpCEDuGEYN7c37nxwmn4UcCn2tEfNso7uLf', '5EXZi1V69J9CymncgsvoaTsTcRRRH2AjKA3D9T1pesT5G839', '5FEdUhBmtK1rYifarmUXYzZhi6fmLbC6SZ7jcNvGuC2gaa2r'];

    expect((filterAddressByNetworkKey(addresses, 'moonriver'))).toEqual(['0x25B12Fe4D6D7ACca1B4035b26b18B4602cA8b10F']);
  });

  // test('merge provider', () => {
  //   const customNetwork = {
  //     key: 'polkadot',
  //     chain: 'Polkadot Relay Chain',
  //     genesisHash: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
  //     icon: 'polkadot',
  //     ss58Format: 0,
  //     providers: {},
  //     active: true,
  //     currentProvider: 'custom',
  //     currentProviderMode: 'ws',
  //     customProviders: {
  //       custom: 'wss://rpc.polkadot.io'
  //     },
  //     groups: ['RELAY_CHAIN'],
  //     nativeToken: 'DOT',
  //     decimals: 10
  //   } as NetworkJson;
  //
  //   const predefinedNetwork = {
  //     key: 'polkadot',
  //     chain: 'Polkadot Relay Chain',
  //     genesisHash: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
  //     icon: 'polkadot',
  //     ss58Format: 0,
  //     providers: {
  //       Parity: 'wss://rpc.polkadot.io'
  //       // 'Geometry Labs': 'wss://polkadot.geometry.io/websockets', // https://github.com/polkadot-js/apps/pull/6746
  //       // Dwellir: 'wss://polkadot-rpc.dwellir.com',
  //       // 'light client': 'light://substrate-connect/polkadot',
  //       // Pinknode: 'wss://rpc.pinknode.io/polkadot/explorer' // https://github.com/polkadot-js/apps/issues/5721
  //     },
  //     active: true,
  //     currentProvider: 'Parity',
  //     currentProviderMode: 'ws',
  //     groups: ['RELAY_CHAIN'],
  //     nativeToken: 'DOT',
  //     decimals: 10
  //   } as NetworkJson;
  //
  //   const { parsedCustomProviders, parsedProviderKey } = mergeNetworkProviders(customNetwork, predefinedNetwork);
  //
  //   predefinedNetwork.customProviders = parsedCustomProviders;
  //   predefinedNetwork.currentProvider = parsedProviderKey as string;
  //
  //   console.log(predefinedNetwork);
  // });
});
