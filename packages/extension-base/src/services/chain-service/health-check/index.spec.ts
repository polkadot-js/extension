// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { checkEvmEndpoint, checkProviders, checkSubstrateEndpoint } from '@subwallet/extension-base/services/chain-service/health-check/index';

jest.setTimeout(10000);

describe('test chain health check', () => {
  const checkTimeout = 5000;

  it('test checkEvmEndpoint', async () => {
    const rs = await checkEvmEndpoint('https://mainnet.fusionnetwork.io/', checkTimeout);

    expect(rs).toBe(true);
  });
  it('test checkSubstrateEndpoint', async () => {
    const rs = await checkSubstrateEndpoint('wss://rpc.turing.oak.tech', checkTimeout);

    expect(rs).toBe(true);
  });
  it('test runHeathCheck', async () => {
    const rs = await checkProviders({
      Parity: 'wss://rpc.polkadot.io',
      OnFinality: 'wss://polkadot.api.onfinality.io/public-ws',
      Dwellir: 'wss://polkadot-rpc.dwellir.com',
      RadiumBlock: 'wss://polkadot.public.curie.radiumblock.io/ws',
      '1RPC': 'wss://1rpc.io/dot',
      PinkNode: 'wss://public-rpc.pinknode.io/polkadot'
    }, checkTimeout);

    console.log(rs);

    expect(rs.Parity).toBe(true);
    expect(rs.OnFinality).toBe(true);
  });
});
