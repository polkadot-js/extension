// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { HandleBasicTx, PrepareExternalRequest } from '@subwallet/extension-base/background/KoniTypes';
import { _EvmApi } from '@subwallet/extension-base/services/chain-service/types';

export interface EvmExternalProps extends PrepareExternalRequest {
  from: string;
  chainId: number;
  network: _ChainInfo;
  evmApiMap: Record<string, _EvmApi>;
  callback: HandleBasicTx;
}
