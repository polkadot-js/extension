// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { AmountData, AmountDataWithId, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { _getChainNativeTokenSlug } from '@subwallet/extension-base/services/chain-service/utils';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { cancelSubscription, getFreeBalance, subscribeFreeBalance, updateAssetSetting } from '@subwallet/extension-koni-ui/messaging';
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';

import { useSelector } from '../common';

const DEFAULT_BALANCE = { value: '0', symbol: '', decimals: 18 };

const useGetBalance = (chain = '', address = '', tokenSlug = '', isSubscribe = false, extrinsicType?: ExtrinsicType) => {
  const { t } = useTranslation();
  const { chainInfoMap, chainStateMap } = useSelector((state) => state.chainStore);
  const { assetRegistry, assetSettingMap } = useSelector((state) => state.assetRegistry);

  const chainInfo = useMemo((): _ChainInfo | undefined => (chainInfoMap[chain]), [chainInfoMap, chain]);
  const nativeTokenSlug = useMemo(() => chainInfo ? _getChainNativeTokenSlug(chainInfo) : undefined, [chainInfo]);

  const [nativeTokenBalance, setNativeTokenBalance] = useState<AmountData>(DEFAULT_BALANCE);
  const [tokenBalance, setTokenBalance] = useState<AmountData>(DEFAULT_BALANCE);
  const [isRefresh, setIsRefresh] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isChainActive = chainStateMap[chain]?.active;
  const nativeTokenActive = nativeTokenSlug && assetSettingMap[nativeTokenSlug]?.visible;
  const isTokenActive = assetSettingMap[tokenSlug]?.visible;

  const refreshBalance = useCallback(() => {
    setIsRefresh({});
  }, []);

  useEffect(() => {
    let cancel = false;

    setIsLoading(true);
    setTokenBalance(DEFAULT_BALANCE);

    let timeout: NodeJS.Timeout | undefined;
    const idMap: Record<string, string> = {};

    if (address && chain) {
      timeout = setTimeout(() => {
        const promiseList = [] as Promise<any>[];
        let childTokenActive = true;

        if (tokenSlug && tokenSlug !== nativeTokenSlug && !isTokenActive) {
          childTokenActive = false;
        }

        if (isChainActive) {
          if (!childTokenActive) {
            promiseList.push(updateAssetSetting({
              tokenSlug,
              assetSetting: {
                visible: true
              },
              autoEnableNativeToken: true
            }));
          } else if (nativeTokenSlug && !nativeTokenActive) {
            promiseList.push(updateAssetSetting({
              tokenSlug: nativeTokenSlug,
              assetSetting: {
                visible: true
              }
            }));
          }

          const onCreateHandleResultSubscribe = (setter: Dispatch<SetStateAction<AmountData>>) => {
            return (res: AmountDataWithId) => {
              const { id, ...balance } = res;

              !cancel && setter(balance);

              if (!cancel) {
                idMap[id] = id;
              }
            };
          };

          const onCreateHandleResult = (setter: Dispatch<SetStateAction<AmountData>>) => {
            return (balance: AmountData) => {
              !cancel && setter(balance);
            };
          };

          const onCreateHandleError = (setter: Dispatch<SetStateAction<AmountData>>) => {
            return (e: Error) => {
              !cancel && setError(t('Unable to get balance. Please re-enable the network'));
              !cancel && setter(DEFAULT_BALANCE);
              console.error(e);
            };
          };

          const onNativeBalance = onCreateHandleResult(setNativeTokenBalance);
          const onTokenBalance = onCreateHandleResult(setTokenBalance);

          const onNativeBalanceSubscribe = onCreateHandleResultSubscribe(setNativeTokenBalance);
          const onTokenBalanceSubscribe = onCreateHandleResultSubscribe(setTokenBalance);

          const onNativeError = onCreateHandleError(setNativeTokenBalance);
          const onTokenError = onCreateHandleError(setTokenBalance);

          if (isSubscribe) {
            promiseList.push(subscribeFreeBalance({ address, networkKey: chain, extrinsicType }, onNativeBalanceSubscribe)
              .then(onNativeBalanceSubscribe)
              .catch(onNativeError));
          } else {
            promiseList.push(getFreeBalance({ address, networkKey: chain, extrinsicType })
              .then(onNativeBalance)
              .catch(onNativeError));
          }

          if (tokenSlug && tokenSlug !== nativeTokenSlug) {
            if (isSubscribe) {
              promiseList.push(
                subscribeFreeBalance({ address, networkKey: chain, token: tokenSlug, extrinsicType }, onTokenBalanceSubscribe)
                  .then(onTokenBalanceSubscribe)
                  .catch(onTokenError)
              );
            } else {
              promiseList.push(
                getFreeBalance({ address, networkKey: chain, token: tokenSlug, extrinsicType })
                  .then(onTokenBalance)
                  .catch(onTokenError)
              );
            }
          }

          Promise.all(promiseList).finally(() => {
            !cancel && setIsLoading(false);
          });
        } else {
          const tokenNames = [];

          if (!isChainActive && nativeTokenSlug && assetRegistry[nativeTokenSlug]) {
            tokenNames.push(assetRegistry[nativeTokenSlug].symbol);
          }

          if (!isChainActive && tokenSlug && tokenSlug !== nativeTokenSlug && assetRegistry[tokenSlug]) {
            tokenNames.push(assetRegistry[tokenSlug].symbol);
          }

          !cancel && setNativeTokenBalance(DEFAULT_BALANCE);
          !cancel && setTokenBalance(DEFAULT_BALANCE);
          !cancel && setIsLoading(false);
          !cancel && setError(t('Please enable {{tokenNames}} on {{chain}}', { tokenNames: tokenNames.join(', '), chain: chainInfo?.name }));
        }
      }, 600);
    }

    return () => {
      cancel = true;
      clearTimeout(timeout);
      setIsLoading(true);
      setError(null);
      Object.keys(idMap).forEach((id) => {
        cancelSubscription(id).catch(console.error);
      });
    };
  }, [isRefresh, address, assetRegistry, chain, chainInfo?.name, isChainActive, isSubscribe, isTokenActive, nativeTokenActive, nativeTokenSlug, t, tokenSlug, extrinsicType]);

  return { refreshBalance, tokenBalance, nativeTokenBalance, nativeTokenSlug, isLoading, error };
};

export default useGetBalance;
