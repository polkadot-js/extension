// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {_AssetType, _ChainInfo} from '@subwallet/chain-list/types';
import { _getNftTypesSupportedByChain } from '@subwallet/extension-base/services/chain-service/utils';

export interface NftTypeOption {
  label: string,
  value: _AssetType
}

export default function useGetNftTypeSupported (chainInfo: _ChainInfo): NftTypeOption[] {
  if (!chainInfo) {
    return [];
  }

  const nftTypes = _getNftTypesSupportedByChain(chainInfo);
  const result: NftTypeOption[] = [];

  nftTypes.forEach((nftType) => {
    result.push({
      label: nftType.toString(),
      value: nftType
    });
  });

  return result;
}
