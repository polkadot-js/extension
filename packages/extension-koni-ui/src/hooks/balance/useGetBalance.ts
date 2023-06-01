// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { AmountData } from '@subwallet/extension-base/background/KoniTypes';
import { _getChainNativeTokenSlug } from '@subwallet/extension-base/services/chain-service/utils';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { getFreeBalance } from '@subwallet/extension-koni-ui/messaging';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useSelector } from '../common';

const DEFAULT_BALANCE = { value: '0', symbol: '', decimals: 18 };

const useGetBalance = (chain = '', address = '', tokenSlug = '') => {
  const { t } = useTranslation();
  const chainInfoMap = useSelector((state) => state.chainStore.chainInfoMap);
  const { assetRegistry, assetSettingMap } = useSelector((state) => state.assetRegistry);

  const chainInfo = useMemo((): _ChainInfo | undefined => (chainInfoMap[chain]), [chainInfoMap, chain]);
  const nativeTokenSlug = useMemo(() => chainInfo ? _getChainNativeTokenSlug(chainInfo) : undefined, [chainInfo]);

  const [nativeTokenBalance, setNativeTokenBalance] = useState<AmountData>(DEFAULT_BALANCE);
  const [tokenBalance, setTokenBalance] = useState<AmountData>(DEFAULT_BALANCE);
  const [isRefresh, setIsRefresh] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshBalance = useCallback(() => {
    setIsRefresh({});
  }, []);

  useEffect(() => {
    let cancel = false;

    setIsLoading(true);
    setTokenBalance(DEFAULT_BALANCE);

    if (address && chain) {
      const promiseList = [] as Promise<any>[];
      const nativeTokenActive = nativeTokenSlug && assetSettingMap[nativeTokenSlug]?.visible;
      let childTokenActive = true;

      if (tokenSlug && tokenSlug !== nativeTokenSlug && !assetSettingMap[tokenSlug]?.visible) {
        childTokenActive = false;
      }

      if (nativeTokenActive && childTokenActive) {
        promiseList.push(getFreeBalance({ address, networkKey: chain })
          .then((balance) => {
            !cancel && setNativeTokenBalance(balance);
          })
          .catch((e: Error) => {
            !cancel && setError(t('Can not get balance'));
            !cancel && setNativeTokenBalance(DEFAULT_BALANCE);
            console.error(e);
          }));

        if (tokenSlug && tokenSlug !== nativeTokenSlug) {
          promiseList.push(getFreeBalance({ address, networkKey: chain, token: tokenSlug })
            .then((balance) => {
              !cancel && setTokenBalance(balance);
            })
            .catch((e: Error) => {
              !cancel && setError(t('Can not get balance'));
              !cancel && setTokenBalance(DEFAULT_BALANCE);
              console.error(e);
            }));
        }

        Promise.all(promiseList).finally(() => {
          !cancel && setIsLoading(false);
        });
      } else {
        const tokenNames = [];

        if (!nativeTokenActive && nativeTokenSlug && assetRegistry[nativeTokenSlug]) {
          tokenNames.push(assetRegistry[nativeTokenSlug].symbol);
        }

        if (!childTokenActive && tokenSlug && assetRegistry[tokenSlug]) {
          tokenNames.push(assetRegistry[tokenSlug].symbol);
        }

        !cancel && setNativeTokenBalance(DEFAULT_BALANCE);
        !cancel && setTokenBalance(DEFAULT_BALANCE);
        !cancel && setIsLoading(false);
        !cancel && setError(t('Please enable {{tokenNames}} on {{chain}}', { tokenNames: tokenNames.join(', '), chain: chainInfo?.name }));
      }
    }

    return () => {
      cancel = true;
      setIsLoading(true);
      setError(null);
    };
  }, [address, chain, nativeTokenSlug, tokenSlug, isRefresh, assetSettingMap, t, assetRegistry, chainInfo?.name]);

  return { refreshBalance, tokenBalance, nativeTokenBalance, nativeTokenSlug, isLoading, error };
};

export default useGetBalance;
