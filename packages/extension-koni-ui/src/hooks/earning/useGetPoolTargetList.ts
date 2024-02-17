// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _getAssetDecimals, _getAssetSymbol } from '@subwallet/extension-base/services/chain-service/utils';
import { useSelector } from '@subwallet/extension-koni-ui/hooks';
import { NominationPoolDataType, PoolTargetData, ValidatorDataType } from '@subwallet/extension-koni-ui/types';
import { useMemo } from 'react';

const useGetPoolTargetList = (slug: string): PoolTargetData[] => {
  const { poolInfoMap, poolTargetsMap } = useSelector((state) => state.earning);
  const { assetRegistry } = useSelector((state) => state.assetRegistry);

  return useMemo(() => {
    const poolTargets = poolTargetsMap[slug];
    const poolInfo = poolInfoMap[slug];

    if (!poolTargets || !poolInfo) {
      return [];
    }

    const assetInfo = assetRegistry[poolInfo.metadata.inputAsset];
    const decimals = _getAssetDecimals(assetInfo);
    const symbol = _getAssetSymbol(assetInfo);

    const result: PoolTargetData[] = [];

    for (const poolTarget of poolTargets) {
      if ('id' in poolTarget) {
        const nominationPoolItem: NominationPoolDataType = {
          ...poolTarget,
          decimals,
          symbol,
          idStr: poolTarget.id.toString()
        };

        result.push(nominationPoolItem);
      } else {
        const validatorItem: ValidatorDataType = {
          ...poolTarget,
          decimals,
          symbol
        };

        result.push(validatorItem);
      }
    }

    return result;
  }, [assetRegistry, poolInfoMap, poolTargetsMap, slug]);
};

export default useGetPoolTargetList;
