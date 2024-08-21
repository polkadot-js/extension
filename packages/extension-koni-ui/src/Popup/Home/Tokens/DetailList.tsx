// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { AccountSelectorModal } from '@subwallet/extension-koni-ui/components/Modal/AccountSelectorModal';
import ReceiveQrModal from '@subwallet/extension-koni-ui/components/Modal/ReceiveModal/ReceiveQrModal';
import { TokensSelectorModal } from '@subwallet/extension-koni-ui/components/Modal/ReceiveModal/TokensSelectorModal';
import BannerGenerator from '@subwallet/extension-koni-ui/components/StaticContent/BannerGenerator';
import { TokenBalanceDetailItem } from '@subwallet/extension-koni-ui/components/TokenItem/TokenBalanceDetailItem';
import { DEFAULT_SWAP_PARAMS, DEFAULT_TRANSFER_PARAMS, SWAP_TRANSACTION, TRANSFER_TRANSACTION } from '@subwallet/extension-koni-ui/constants';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { HomeContext } from '@subwallet/extension-koni-ui/contexts/screen/HomeContext';
import { useDefaultNavigate, useGetBannerByScreen, useNavigateOnChangeAccount, useNotification, useReceiveQR, useSelector } from '@subwallet/extension-koni-ui/hooks';
import { DetailModal } from '@subwallet/extension-koni-ui/Popup/Home/Tokens/DetailModal';
import { DetailUpperBlock } from '@subwallet/extension-koni-ui/Popup/Home/Tokens/DetailUpperBlock';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { BuyTokenInfo, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { TokenBalanceItemType } from '@subwallet/extension-koni-ui/types/balance';
import { getAccountType, isAccountAll, sortTokenByValue } from '@subwallet/extension-koni-ui/utils';
import { ModalContext } from '@subwallet/react-ui';
import { SwNumberProps } from '@subwallet/react-ui/es/number';
import classNames from 'classnames';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

import { isEthereumAddress } from '@polkadot/util-crypto';

type Props = ThemeProps;

type CurrentSelectToken = {
  symbol: string;
  slug: string;
}

function WrapperComponent ({ className = '' }: ThemeProps): React.ReactElement<Props> {
  const dataContext = useContext(DataContext);

  return (
    <PageWrapper
      className={`tokens ${className}`}
      resolve={dataContext.awaitStores(['price', 'chainStore', 'assetRegistry', 'balance', 'swap'])}
    >
      <Component />
    </PageWrapper>
  );
}

const TokenDetailModalId = 'tokenDetailModalId';

function Component (): React.ReactElement {
  const { slug: tokenGroupSlug } = useParams();

  const notify = useNotification();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { goHome } = useDefaultNavigate();

  const { activeModal, inactiveModal } = useContext(ModalContext);
  const { accountBalance: { tokenBalanceMap, tokenGroupBalanceMap }, tokenGroupStructure: { tokenGroupMap } } = useContext(HomeContext);

  const assetRegistryMap = useSelector((root: RootState) => root.assetRegistry.assetRegistry);
  const multiChainAssetMap = useSelector((state: RootState) => state.assetRegistry.multiChainAssetMap);
  const currentAccount = useSelector((state: RootState) => state.accountState.currentAccount);
  const accounts = useSelector((state: RootState) => state.accountState.accounts);
  const { tokens } = useSelector((state: RootState) => state.buyService);
  const swapPairs = useSelector((state) => state.swap.swapPairs);
  const chainInfoMap = useSelector((root) => root.chainStore.chainInfoMap);
  const [, setStorage] = useLocalStorage(TRANSFER_TRANSACTION, DEFAULT_TRANSFER_PARAMS);
  const [, setSwapStorage] = useLocalStorage(SWAP_TRANSACTION, DEFAULT_SWAP_PARAMS);
  const { banners, dismissBanner, onClickBanner } = useGetBannerByScreen('token_detail', tokenGroupSlug);

  const transactionFromValue = useMemo(() => {
    return currentAccount?.address ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : '';
  }, [currentAccount?.address]);

  const fromAndToTokenMap = useMemo<Record<string, string[]>>(() => {
    const result: Record<string, string[]> = {};

    swapPairs.forEach((pair) => {
      if (!result[pair.from]) {
        result[pair.from] = [pair.to];
      } else {
        result[pair.from].push(pair.to);
      }
    });

    return result;
  }, [swapPairs]);

  const filterFromAssetInfo = useMemo(() => {
    const filteredAccounts = accounts.filter((account) => !isAccountAll(account.address));

    const isAllEthereum = (filteredAccounts.length > 0 && filteredAccounts.every((account) => isEthereumAddress(account.address))) || (currentAccount && !isAccountAll(currentAccount.address) && isEthereumAddress(currentAccount.address));
    const isAllNonEthereum = (filteredAccounts.length > 0 && filteredAccounts.every((account) => !isEthereumAddress(account.address))) || (currentAccount && !isAccountAll(currentAccount.address) && !isEthereumAddress(currentAccount.address));

    const filteredAssets = Object.keys(fromAndToTokenMap).map((slug) => assetRegistryMap[slug]);

    const filteredAssetsByChain = filteredAssets.filter((chainAsset) => {
      const chainInfo = chainInfoMap[chainAsset.originChain];

      if (isAllEthereum && _isChainEvmCompatible(chainInfo)) {
        return true;
      }

      if (isAllNonEthereum && !_isChainEvmCompatible(chainInfo)) {
        return true;
      }

      return false;
    });

    const filteredAssetsList = ((isAllNonEthereum || isAllEthereum) ? filteredAssetsByChain : filteredAssets);

    const filteredAssetsByTokenGroup = filteredAssetsList.filter((chainAsset) => chainAsset.slug === tokenGroupSlug || chainAsset.multiChainAsset === tokenGroupSlug);

    return filteredAssetsByTokenGroup;
  }, [accounts, assetRegistryMap, chainInfoMap, currentAccount, fromAndToTokenMap, tokenGroupSlug]);

  const containerRef = useRef<HTMLDivElement>(null);
  const topBlockRef = useRef<HTMLDivElement>(null);

  const { accountSelectorItems,
    onOpenReceive,
    openSelectAccount,
    openSelectToken,
    selectedAccount,
    selectedNetwork,
    tokenSelectorItems } = useReceiveQR(tokenGroupSlug);

  useNavigateOnChangeAccount('/home/tokens');

  const symbol = useMemo<string>(() => {
    if (tokenGroupSlug) {
      if (multiChainAssetMap[tokenGroupSlug]) {
        return multiChainAssetMap[tokenGroupSlug].symbol;
      }

      if (assetRegistryMap[tokenGroupSlug]) {
        return assetRegistryMap[tokenGroupSlug].symbol;
      }
    }

    return '';
  }, [tokenGroupSlug, assetRegistryMap, multiChainAssetMap]);

  const buyInfos = useMemo(() => {
    const slug = tokenGroupSlug || '';
    const slugs = tokenGroupMap[slug] ? tokenGroupMap[slug] : [slug];
    const result: BuyTokenInfo[] = [];

    for (const [slug, buyInfo] of Object.entries(tokens)) {
      if (slugs.includes(slug)) {
        const supportType = buyInfo.support;

        if (isAccountAll(currentAccount?.address || '')) {
          const support = accounts.some((account) => supportType === getAccountType(account.address));

          if (support) {
            result.push(buyInfo);
          }
        } else {
          if (currentAccount?.address && (supportType === getAccountType(currentAccount?.address))) {
            result.push(buyInfo);
          }
        }
      }
    }

    return result;
  }, [accounts, currentAccount?.address, tokenGroupMap, tokenGroupSlug, tokens]);

  const tokenBalanceValue = useMemo<SwNumberProps['value']>(() => {
    if (tokenGroupSlug) {
      if (tokenGroupBalanceMap[tokenGroupSlug]) {
        return tokenGroupBalanceMap[tokenGroupSlug].total.convertedValue;
      }

      if (tokenBalanceMap[tokenGroupSlug]) {
        return tokenBalanceMap[tokenGroupSlug].total.convertedValue;
      }
    }

    return '0';
  }, [tokenGroupSlug, tokenBalanceMap, tokenGroupBalanceMap]);

  const tokenBalanceItems = useMemo<TokenBalanceItemType[]>(() => {
    if (tokenGroupSlug) {
      if (tokenGroupMap[tokenGroupSlug]) {
        const items: TokenBalanceItemType[] = [];

        tokenGroupMap[tokenGroupSlug].forEach((tokenSlug) => {
          if (tokenBalanceMap[tokenSlug]) {
            items.push(tokenBalanceMap[tokenSlug]);
          }
        });

        return items.sort(sortTokenByValue);
      }

      if (tokenBalanceMap[tokenGroupSlug]) {
        return [tokenBalanceMap[tokenGroupSlug]];
      }
    }

    return [] as TokenBalanceItemType[];
  }, [tokenGroupSlug, tokenGroupMap, tokenBalanceMap]);

  const [currentTokenInfo, setCurrentTokenInfo] = useState<CurrentSelectToken| undefined>(undefined);
  const [isShrink, setIsShrink] = useState<boolean>(false);

  const handleScroll = useCallback((event: React.UIEvent<HTMLElement>) => {
    const topPosition = event.currentTarget.scrollTop;

    if (topPosition > 60) {
      setIsShrink((value) => {
        if (!value && topBlockRef.current && containerRef.current) {
          const containerProps = containerRef.current.getBoundingClientRect();

          topBlockRef.current.style.position = 'fixed';
          topBlockRef.current.style.opacity = '0';
          topBlockRef.current.style.paddingTop = '0';
          topBlockRef.current.style.top = `${Math.floor(containerProps.top)}px`;
          topBlockRef.current.style.left = `${containerProps.left}px`;
          topBlockRef.current.style.right = `${containerProps.right}px`;
          topBlockRef.current.style.width = `${containerProps.width}px`;

          setTimeout(() => {
            if (topBlockRef.current) {
              topBlockRef.current.style.paddingTop = '8px';
              topBlockRef.current.style.opacity = '1';
            }
          }, 100);
        }

        return true;
      });
    } else {
      setIsShrink((value) => {
        if (value && topBlockRef.current) {
          topBlockRef.current.style.position = 'absolute';
          topBlockRef.current.style.top = '0';
          topBlockRef.current.style.left = '0';
          topBlockRef.current.style.right = '0';
          topBlockRef.current.style.width = '100%';
          topBlockRef.current.style.opacity = '0';

          setTimeout(() => {
            if (topBlockRef.current) {
              topBlockRef.current.style.opacity = '1';
            }
          }, 100);
        }

        return false;
      });
    }
  }, []);

  const handleResize = useCallback(() => {
    const topPosition = containerRef.current?.scrollTop || 0;

    if (topPosition > 60) {
      if (topBlockRef.current && containerRef.current) {
        const containerProps = containerRef.current.getBoundingClientRect();

        topBlockRef.current.style.top = `${Math.floor(containerProps.top)}px`;
        topBlockRef.current.style.left = `${containerProps.left}px`;
        topBlockRef.current.style.right = `${containerProps.right}px`;
        topBlockRef.current.style.width = `${containerProps.width}px`;
      }
    } else {
      if (topBlockRef.current) {
        topBlockRef.current.style.top = '0';
        topBlockRef.current.style.left = '0';
        topBlockRef.current.style.right = '0';
        topBlockRef.current.style.width = '100%';
      }
    }
  }, []);

  const onCloseDetail = useCallback(() => {
    setCurrentTokenInfo(undefined);
  }, []);

  const onClickItem = useCallback((item: TokenBalanceItemType) => {
    return () => {
      if (item.isReady) {
        setCurrentTokenInfo({
          slug: item.slug,
          symbol: item.symbol
        });
      }
    };
  }, []);

  const onOpenSendFund = useCallback(() => {
    if (currentAccount && currentAccount.isReadOnly) {
      notify({
        message: t('The account you are using is watch-only, you cannot send assets with it'),
        type: 'info',
        duration: 3
      });

      return;
    }

    setStorage({
      ...DEFAULT_TRANSFER_PARAMS,
      from: transactionFromValue,
      defaultSlug: tokenGroupSlug || ''
    });

    navigate('/transaction/send-fund');
  },
  [currentAccount, navigate, notify, setStorage, t, tokenGroupSlug, transactionFromValue]
  );

  const onOpenBuyTokens = useCallback(() => {
    let symbol = '';

    if (buyInfos.length) {
      if (buyInfos.length === 1) {
        symbol = buyInfos[0].slug;
      } else {
        symbol = buyInfos[0].symbol;
      }
    }

    navigate('/buy-tokens', { state: { symbol } });
  },
  [buyInfos, navigate]
  );

  const onOpenSwap = useCallback(() => {
    if (currentAccount && currentAccount.isReadOnly) {
      notify({
        message: t('The account you are using is watch-only, you cannot send assets with it'),
        type: 'info',
        duration: 3
      });

      return;
    }

    const filteredAccounts = accounts.filter((account) => !isAccountAll(account.address));

    const isAllLedger = (filteredAccounts.length > 0 && filteredAccounts.every((account) => account.isHardware)) || (currentAccount && !isAccountAll(currentAccount.address) && (currentAccount.isHardware));

    if ((currentAccount && currentAccount.isHardware) || (isAllLedger)) {
      notify({
        message: 'The account you are using is Ledger account, you cannot use this feature with it',
        type: 'error',
        duration: 3
      });

      return;
    }

    setSwapStorage({
      ...DEFAULT_SWAP_PARAMS,
      from: transactionFromValue,
      defaultSlug: tokenGroupSlug || ''
    });
    navigate('/transaction/swap');
  }, [accounts, currentAccount, navigate, notify, setSwapStorage, t, tokenGroupSlug, transactionFromValue]);

  useEffect(() => {
    if (currentTokenInfo) {
      activeModal(TokenDetailModalId);
    } else {
      inactiveModal(TokenDetailModalId);
    }
  }, [activeModal, currentTokenInfo, inactiveModal]);

  useEffect(() => {
    setIsShrink(false);
  }, [tokenGroupSlug]);

  useEffect(() => {
    if (!tokenBalanceItems.length) {
      goHome();
    }
  }, [goHome, tokenBalanceItems.length]);

  useEffect(() => {
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  return (
    <div
      className={'token-detail-container'}
      onScroll={handleScroll}
      ref={containerRef}
    >
      <div
        className={classNames('__upper-block-wrapper', {
          '-is-shrink': isShrink
        })}
        ref={topBlockRef}
      >
        <DetailUpperBlock
          balanceValue={tokenBalanceValue}
          className={'__static-block'}
          isShrink={isShrink}
          isSupportBuyTokens={!!buyInfos.length}
          isSupportSwap={!!filterFromAssetInfo.length}
          onClickBack={goHome}
          onOpenBuyTokens={onOpenBuyTokens}
          onOpenReceive={onOpenReceive}
          onOpenSendFund={onOpenSendFund}
          onOpenSwap={onOpenSwap}
          symbol={symbol}
        />
      </div>
      <div
        className={'__scroll-container'}
      >
        {
          tokenBalanceItems.map((item) => (
            <TokenBalanceDetailItem
              key={item.slug}
              {...item}
              onClick={onClickItem(item)}
            />
          ))
        }

        <div className={'token-detail-banner-wrapper'}>
          {!!banners.length && (<BannerGenerator
            banners={banners}
            dismissBanner={dismissBanner}
            onClickBanner={onClickBanner}
          />)}
        </div>
      </div>

      <DetailModal
        currentTokenInfo={currentTokenInfo}
        id={TokenDetailModalId}
        onCancel={onCloseDetail}
        tokenBalanceMap={tokenBalanceMap}
      />

      <AccountSelectorModal
        items={accountSelectorItems}
        onSelectItem={openSelectAccount}
      />

      <TokensSelectorModal
        address={selectedAccount}
        items={tokenSelectorItems}
        onSelectItem={openSelectToken}
      />

      <ReceiveQrModal
        address={selectedAccount}
        selectedNetwork={selectedNetwork}
      />
    </div>
  );
}

const Tokens = styled(WrapperComponent)<ThemeProps>(({ theme: { extendToken, token } }: ThemeProps) => {
  return ({
    overflow: 'hidden',

    '.token-detail-container': {
      height: '100%',
      overflow: 'auto',
      color: token.colorTextLight1,
      fontSize: token.fontSizeLG,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: 206
    },

    '.__scroll-container': {
      flex: 1,
      paddingLeft: token.size,
      paddingRight: token.size
    },

    '.__upper-block-wrapper': {
      position: 'absolute',
      backgroundColor: token.colorBgDefault,
      zIndex: 10,
      height: 206,
      paddingTop: 8,
      top: 0,
      left: 0,
      right: 0,
      display: 'flex',
      alignItems: 'center',
      backgroundImage: extendToken.tokensScreenInfoBackgroundColor,
      transition: 'opacity, padding-top 0.27s ease',

      '&.-is-shrink': {
        height: 128
      }
    },

    '.tokens-upper-block': {
      flex: 1
    },

    '.__scrolling-block': {
      display: 'none'
    },

    '.token-balance-detail-item, .token-detail-banner-wrapper': {
      marginBottom: token.sizeXS
    }
  });
});

export default Tokens;
