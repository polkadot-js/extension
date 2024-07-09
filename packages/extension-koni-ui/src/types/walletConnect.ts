// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';

export interface WalletConnectChainInfo {
  chainInfo: _ChainInfo | null;
  slug: string;
  supported: boolean;
}
