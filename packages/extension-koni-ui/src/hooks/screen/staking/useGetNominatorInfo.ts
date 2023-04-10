// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NominatorMetadata, StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { isSameAddress } from '@subwallet/extension-base/utils';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export default function useGetNominatorInfo (chain?: string, type?: StakingType, address?: string): NominatorMetadata[] {
  const { nominatorMetadataList } = useSelector((state: RootState) => state.staking);

  return useMemo(() => {
    if (!chain && !type) {
      return [];
    }

    const result: NominatorMetadata[] = [];

    if (address) {
      nominatorMetadataList.forEach((nominatorMetadata) => {
        if (nominatorMetadata.chain === chain && nominatorMetadata.type === type && isSameAddress(nominatorMetadata.address, address)) {
          result.push(nominatorMetadata);
        }
      });
    } else {
      nominatorMetadataList.forEach((nominatorMetadata) => {
        if (nominatorMetadata.chain === chain && nominatorMetadata.type === type) {
          result.push(nominatorMetadata);
        }
      });
    }

    return result;
  }, [address, chain, nominatorMetadataList, type]);
}
