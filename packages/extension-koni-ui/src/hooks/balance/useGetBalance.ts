// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { AmountData } from '@subwallet/extension-base/background/KoniTypes';
import { _getChainNativeTokenSlug } from '@subwallet/extension-base/services/chain-service/utils';
import { getFreeBalance } from '@subwallet/extension-koni-ui/messaging';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useSelector } from '../common';

const useGetBalance = (chain = '', address = '', tokenSlug = '') => {
  const { chainInfoMap } = useSelector((state) => state.chainStore);
  const { assetSettingMap } = useSelector((state) => state.assetRegistry);

  const chainInfo = useMemo((): _ChainInfo | undefined => (chainInfoMap[chain]), [chainInfoMap, chain]);
  const nativeTokenSlug = useMemo(() => chainInfo ? _getChainNativeTokenSlug(chainInfo) : undefined, [chainInfo]);

  const [nativeTokenBalance, setNativeTokenBalance] = useState<AmountData>({ value: '0', symbol: '', decimals: 18 });
  const [tokenBalance, setTokenBalance] = useState<AmountData>({ value: '0', symbol: '', decimals: 18 });
  const [isRefresh, setIsRefresh] = useState({});

  const refreshBalance = useCallback(() => {
    setIsRefresh({});
  }, []);

  useEffect(() => {
    let cancel = false;

    if (address && chain && nativeTokenSlug && assetSettingMap[nativeTokenSlug]?.visible) {
      getFreeBalance({ address, networkKey: chain })
        .then((balance) => {
          !cancel && setNativeTokenBalance(balance);
        })
        .catch(console.error);

      if (tokenSlug && tokenSlug !== nativeTokenSlug && assetSettingMap[tokenSlug]?.visible) {
        getFreeBalance({ address, networkKey: chain, token: tokenSlug })
          .then((balance) => {
            !cancel && setTokenBalance(balance);
          })
          .catch(console.error);
      }
    }

    return () => {
      cancel = true;
    };
  }, [address, chain, nativeTokenSlug, tokenSlug, isRefresh, assetSettingMap]);

  return { refreshBalance, tokenBalance, nativeTokenBalance, nativeTokenSlug };
};

export default useGetBalance;
