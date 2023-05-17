// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransactionHistoryItem } from '@subwallet/extension-base/background/KoniTypes';
import { ChainService } from '@subwallet/extension-base/services/chain-service';

import { Vec } from '@polkadot/types';
import { EventRecord } from '@polkadot/types/interfaces';

export enum HistoryRecoverStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  API_INACTIVE = 'API_INACTIVE',
  LACK_INFO = 'LACK_INFO',
  FAIL_DETECT = 'FAIL_DETECT',
  UNKNOWN = 'UNKNOWN'
}

const substrateRecover = async (history: TransactionHistoryItem, chainService: ChainService): Promise<HistoryRecoverStatus> => {
  const { blockHash, chain, extrinsicHash } = history;

  try {
    const substrateApi = chainService.getSubstrateApi(chain);

    if (substrateApi) {
      const _api = await substrateApi.isReady;
      const api = _api.api;

      if (!blockHash) {
        console.log(`Fail to find extrinsic ${extrinsicHash} on ${chain}: No block hash`);

        return HistoryRecoverStatus.LACK_INFO;
      }

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

        return HistoryRecoverStatus.FAIL_DETECT;
      }

      const events = allEvents
        .filter(({ phase }) =>
          phase.isApplyExtrinsic &&
          phase.asApplyExtrinsic.eq(index)
        );

      for (const { event } of events) {
        if (api.events.system.ExtrinsicSuccess.is(event)) {
          return HistoryRecoverStatus.SUCCESS;
        } else if (api.events.system.ExtrinsicFailed.is(event)) {
          return HistoryRecoverStatus.FAILED;
        }
      }

      return HistoryRecoverStatus.FAIL_DETECT;
    } else {
      console.error(`Fail to update history ${chain}-${extrinsicHash}: Api not active`);

      return HistoryRecoverStatus.API_INACTIVE;
    }
  } catch (e) {
    console.error(`Fail to update history ${chain}-${extrinsicHash}:`, (e as Error).message);

    return HistoryRecoverStatus.UNKNOWN;
  }
};

const evmRecover = async (history: TransactionHistoryItem, chainService: ChainService): Promise<HistoryRecoverStatus> => {
  const { chain, extrinsicHash } = history;

  try {
    const evmApi = chainService.getEvmApi(chain);

    if (evmApi) {
      const _api = await evmApi.isReady;
      const api = _api.api;
      const block = await api.eth.getTransactionReceipt(extrinsicHash);

      return block.status ? HistoryRecoverStatus.SUCCESS : HistoryRecoverStatus.FAILED;
    } else {
      console.error(`Fail to update history ${chain}-${extrinsicHash}: Api not active`);

      return HistoryRecoverStatus.API_INACTIVE;
    }
  } catch (e) {
    console.error(`Fail to update history ${chain}-${extrinsicHash}:`, (e as Error).message);

    return HistoryRecoverStatus.UNKNOWN;
  }
};

// undefined: Cannot check status
// true: Transaction success
// false: Transaction failed
export const historyRecover = async (history: TransactionHistoryItem, chainService: ChainService): Promise<HistoryRecoverStatus> => {
  const { chainType } = history;

  if (chainType) {
    const checkFunction = chainType === 'substrate' ? substrateRecover : evmRecover;

    return await checkFunction(history, chainService);
  } else {
    return HistoryRecoverStatus.LACK_INFO;
  }
};
