// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain/types';
import { _ChainBaseApi } from '@subwallet/extension-koni-base/services/chain-service/types';

export interface ServiceInfoV2 {
  chainInfoMap: Record<string, _ChainInfo>,
  chainApiMap: Record<string, _ChainBaseApi>,

}
