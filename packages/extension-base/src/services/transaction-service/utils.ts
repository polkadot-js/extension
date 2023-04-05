// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { ExtrinsicDataTypeMap, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { _getBlockExplorerFromChain, _isPureEvmChain } from '@subwallet/extension-base/services/chain-service/utils';

// @ts-ignore
export function parseTransactionData<T extends ExtrinsicType> (data: unknown): ExtrinsicDataTypeMap[T] {
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return data as ExtrinsicDataTypeMap[T];
}

export function getTransactionLink (chainInfo: _ChainInfo, extrinsicHash: string): string | undefined {
  const explorerLink = _getBlockExplorerFromChain(chainInfo);

  if (_isPureEvmChain(chainInfo)) {
    if (explorerLink) {
      return (`${explorerLink}${explorerLink.endsWith('/') ? '' : '/'}tx/${extrinsicHash}`);
    }
  } else {
    const explorerLink = _getBlockExplorerFromChain(chainInfo);

    if (explorerLink) {
      return (`${explorerLink}${explorerLink.endsWith('/') ? '' : '/'}extrinsic/${extrinsicHash}`);
    }
  }

  return undefined;
}
