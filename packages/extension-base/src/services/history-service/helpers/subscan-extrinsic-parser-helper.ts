// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType, TransactionHistoryItem } from '@subwallet/extension-base/background/KoniTypes';
import { ExtrinsicItem, ExtrinsicParam } from '@subwallet/extension-base/services/subscan-service/types';

import { encodeAddress } from '@polkadot/util-crypto';

export type ExtrinsicParserFunction = (item: TransactionHistoryItem) => TransactionHistoryItem | null;

export function getExtrinsicParserKey (extrinsicItem: ExtrinsicItem) {
  return `${extrinsicItem.call_module}.${extrinsicItem.call_module_function}`;
}

function paramJsonParse (item: TransactionHistoryItem): ExtrinsicParam[] {
  try {
    return JSON.parse(item.data || '[]') as ExtrinsicParam[];
  } catch (e) {
    return [];
  }
}

function balanceTransferParserFunction (item: TransactionHistoryItem): TransactionHistoryItem | null {
  const params: ExtrinsicParam[] = paramJsonParse(item);

  params.forEach((p) => {
    if (p.name === 'dest') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const toPublicKey = (p.value.id || p.value.Id) as string;

      if (toPublicKey) {
        item.to = encodeAddress(toPublicKey, 42);
      }
    } else if (p.name === 'value') {
      if (item.amount) {
        item.amount.value = p.value as string;
      }
    }
  });

  item.type = ExtrinsicType.TRANSFER_BALANCE;

  if (!item.to) {
    return null;
  }

  return item;
}

// todo: will support other type later
export const subscanExtrinsicParserMap: Record<string, ExtrinsicParserFunction> = {
  'balances.transfer': balanceTransferParserFunction,
  'balances.transfer_keep_alive': balanceTransferParserFunction,
  'balances.transfer_allow_death': balanceTransferParserFunction
};

export const supportedExtrinsicParser = Object.keys(subscanExtrinsicParserMap);
