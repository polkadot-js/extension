// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain/types';
import { _getCustomAssets } from '@subwallet/extension-base/services/chain-service/utils';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useSelector } from 'react-redux';

export default function useFetchCustomToken (): _ChainAsset[] {
  const assetRegistry = useSelector((state: RootState) => state.assetRegistry);

  const customAssetMap = _getCustomAssets(assetRegistry);

  return Object.values(customAssetMap);
}
