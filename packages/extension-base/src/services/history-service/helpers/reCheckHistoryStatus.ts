// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransactionHistoryItem } from '@subwallet/extension-base/background/KoniTypes';
import { ChainService } from '@subwallet/extension-base/services/chain-service';

import { Vec } from '@polkadot/types';
import { EventRecord } from '@polkadot/types/interfaces';

const substrateCheck = async (history: TransactionHistoryItem, chainService: ChainService): Promise<boolean | undefined> => {
  const { blockNumber, chain, extrinsicHash } = history;

  try {
    const substrateApi = chainService.getSubstrateApi(chain);

    if (substrateApi) {
      const _api = await substrateApi.isReady;
      const api = _api.api;
      const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
      const block = await api.rpc.chain.getBlock(blockHash);
      const allEvents: Vec<EventRecord> = await api.query.system.events.at(blockHash);

      const extrinsics = block.block.extrinsics;
      let index: number | undefined;

      extrinsics.forEach((extrinsic, _idx) => {
        if (extrinsicHash === extrinsic.hash.toHex()) {
          index = _idx;
        }
      });

      if (index === undefined) {
        console.log(`Fail to find extrinsic ${extrinsicHash} on ${chain}`);

        return undefined;
      }

      const events = allEvents
        .filter(({ phase }) =>
          phase.isApplyExtrinsic &&
          phase.asApplyExtrinsic.eq(index)
        );

      for (const { event } of events) {
        if (api.events.system.ExtrinsicSuccess.is(event)) {
          return true;
        } else if (api.events.system.ExtrinsicFailed.is(event)) {
          return false;
        }
      }

      return undefined;
    } else {
      console.error(`Fail to update history ${chain}-${extrinsicHash}:`, 'Api not active');

      return undefined;
    }
  } catch (e) {
    console.error(`Fail to update history ${chain}-${extrinsicHash}:`, (e as Error).message);

    return undefined;
  }
};

const evmCheck = async (history: TransactionHistoryItem, chainService: ChainService): Promise<boolean | undefined> => {
  const { chain, extrinsicHash } = history;

  try {
    const evmApi = chainService.getEvmApi(chain);

    if (evmApi) {
      const _api = await evmApi.isReady;
      const api = _api.api;
      const block = await api.eth.getTransactionReceipt(extrinsicHash);

      return block.status;
    } else {
      console.error(`Fail to update history ${chain}-${extrinsicHash}:`, 'Api not active');

      return undefined;
    }
  } catch (e) {
    console.error(`Fail to update history ${chain}-${extrinsicHash}:`, (e as Error).message);

    return undefined;
  }
};

// undefined: Cannot check status
// true: Transaction success
// false: Transaction failed
export const historyCheck = async (history: TransactionHistoryItem, chainService: ChainService): Promise<boolean | undefined> => {
  const { chainType } = history;

  if (chainType) {
    const checkFunction = chainType === 'substrate' ? substrateCheck : evmCheck;

    return await checkFunction(history, chainService);
  } else {
    return undefined;
  }
};
