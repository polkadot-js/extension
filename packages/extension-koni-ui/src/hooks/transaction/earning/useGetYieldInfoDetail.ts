// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPositionInfo } from '@subwallet/extension-base/types';
import { isSameAddress } from '@subwallet/extension-base/utils';
import { isAccountAll } from '@subwallet/extension-koni-ui/utils';
import { useMemo } from 'react';

import { useSelector } from '../../common';

const useGetYieldInfoDetail = (slug: string, address?: string) => {
  const { yieldPosition } = useSelector((state) => state.yieldPool);

  return useMemo((): YieldPositionInfo | undefined => {
    if (address) {
      if (isAccountAll(address)) {
        return undefined;
      } else {
        return yieldPosition.find((item) => {
          return isSameAddress(item.address, address) && item.slug === slug;
        });
      }
    } else {
      return undefined;
    }
  }, [address, yieldPosition, slug]);
};

export default useGetYieldInfoDetail;
