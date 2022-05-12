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
});
