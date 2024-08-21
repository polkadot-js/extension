// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Chain } from '@subwallet/extension-chains/types';
import { ChainProps } from '@subwallet/extension-koni-ui/types';

export const convertChainToChainProps = (chain: Chain): ChainProps => {
  return {
    base58prefix: chain.ss58Format,
    decimals: chain.tokenDecimals,
    unit: chain.tokenSymbol
  };
};
