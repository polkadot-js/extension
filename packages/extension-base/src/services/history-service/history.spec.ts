// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Web3 from 'web3';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { Vec } from '@polkadot/types';
import { EventRecord } from '@polkadot/types/interfaces';

jest.setTimeout(50000);
describe('TestFetchMultiChainHistories', () => {
  // Create Unit Test for QueryInput
  it('Fetching history', async () => {
    const provider = new WsProvider('wss://acala-rpc-1.aca-api.network');
    const _api = new ApiPromise({ provider });

    const api = await _api.isReady;

    const extrinsicHash = '0xf60631810b788390574dc697fee8e9f57230783952d4e5d3878c59f83aeac9e6';

    const block = await api.rpc.chain.getBlock('0xfd0979074f0e1bb53825eff5ac87fc57494f0d52ea15f36cab52a49f5839e58f');
    const events: Vec<EventRecord> = await api.query.system.events.at('0xfd0979074f0e1bb53825eff5ac87fc57494f0d52ea15f36cab52a49f5839e58f');

    const extrinsics = block.block.extrinsics;
    let index: number | undefined;

    extrinsics.forEach((extrinsic, _idx) => {
      if (extrinsicHash === extrinsic.hash.toHex()) {
        index = _idx;
      }
    });

    events
      // filter the specific events based on the phase and then the
      // index of our extrinsic in the block
      .filter(({ phase }) =>
        phase.isApplyExtrinsic &&
        phase.asApplyExtrinsic.eq(index)
      )
      // test the events against the specific types we are looking for
      .forEach(({ event }) => {
        if (api.events.system.ExtrinsicSuccess.is(event)) {
          console.log(`${extrinsicHash}:: ExtrinsicSuccess::`);
        } else if (api.events.system.ExtrinsicFailed.is(event)) {
          console.log(`${extrinsicHash}:: ExtrinsicFailed::`);
        }
      });
  });
  it('Fetching history evm', async () => {
    const api = new Web3(new Web3.providers.WebsocketProvider('wss://wss.api.moonbeam.network'));

    const extrinsicHash = '0x9bb6d80ff7ab6701e33271990bdb646d2ae83c6fe2edabca40fa3db658fad3e9';

    const block = await api.eth.getTransactionReceipt(extrinsicHash);

    console.log(block);
  });
});
