// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { AccountJson } from '@subwallet/extension-base/background/types';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { AccountSelectorModal, AccountSelectorModalId } from '@subwallet/extension-koni-ui/components/Modal/AccountSelectorModal';
import ReceiveQrModal, { ReceiveSelectedResult } from '@subwallet/extension-koni-ui/components/Modal/ReceiveModal/ReceiveQrModal';
import { ReceiveTokensSelectorModalId, TokensSelectorModal } from '@subwallet/extension-koni-ui/components/Modal/ReceiveModal/TokensSelectorModal';
import { TokenBalanceDetailItem } from '@subwallet/extension-koni-ui/components/TokenItem/TokenBalanceDetailItem';
import { RECEIVE_QR_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { HomeContext } from '@subwallet/extension-koni-ui/contexts/screen/HomeContext';
import useNotification from '@subwallet/extension-koni-ui/hooks/common/useNotification';
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import { DetailModal } from '@subwallet/extension-koni-ui/Popup/Home/Tokens/DetailModal';
import { DetailUpperBlock } from '@subwallet/extension-koni-ui/Popup/Home/Tokens/DetailUpperBlock';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { TokenBalanceItemType } from '@subwallet/extension-koni-ui/types/balance';
import { SwNumberProps } from '@subwallet/react-ui/es/number';
import { getScrollbarWidth } from '@subwallet/react-ui/es/style';
import { ModalContext } from '@subwallet/react-ui/es/sw-modal/provider';
import classNames from 'classnames';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';

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
      resolve={dataContext.awaitStores(['price', 'chainStore', 'assetRegistry', 'balance'])}
    >
      <Component />
    </PageWrapper>
  );
}

const TokenDetailModalId = 'tokenDetailModalId';

function Component (): React.ReactElement {
  const [isShrink, setIsShrink] = useState<boolean>(false);
  const { goHome } = useDefaultNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const topBlockRef = useRef<HTMLDivElement>(null);
  const assetRegistryMap = useSelector((root: RootState) => root.assetRegistry.assetRegistry);
  const multiChainAssetMap = useSelector((state: RootState) => state.assetRegistry.multiChainAssetMap);
  const { slug: tokenGroupSlug } = useParams();
  const { accountBalance: { tokenBalanceMap, tokenGroupBalanceMap }, tokenGroupStructure: { tokenGroupMap } } = useContext(HomeContext);
  const currentAccount = useSelector((state: RootState) => state.accountState.currentAccount);
  const isAllAccount = useSelector((state: RootState) => state.accountState.isAllAccount);
  const notify = useNotification();
  const { t } = useTranslation();
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const [{ selectedAccount, selectedNetwork }, setReceiveSelectedResult] = useState<ReceiveSelectedResult>(
    { selectedAccount: currentAccount?.address });
  const navigate = useNavigate();

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

        return items;
      }

      if (tokenBalanceMap[tokenGroupSlug]) {
        return [tokenBalanceMap[tokenGroupSlug]];
      }
    }

    return [] as TokenBalanceItemType[];
  }, [tokenGroupSlug, tokenGroupMap, tokenBalanceMap]);

  useEffect(() => {
    setIsShrink(false);
  }, [tokenGroupSlug]);

  useEffect(() => {
    if (!tokenBalanceItems.length) {
      goHome();
    }
  }, [goHome, tokenBalanceItems.length]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLElement>) => {
    const topPosition = event.currentTarget.scrollTop;

    if (topPosition > 60) {
      setIsShrink((value) => {
        if (!value && topBlockRef.current && containerRef.current) {
          const containerProps = containerRef.current.getBoundingClientRect();

          topBlockRef.current.style.position = 'fixed';
          topBlockRef.current.style.transition = 'all 0s';
          topBlockRef.current.style.opacity = '0';
          topBlockRef.current.style.paddingTop = '0';
          topBlockRef.current.style.top = `${containerProps.top}px`;
          topBlockRef.current.style.left = `${containerProps.left}px`;
          topBlockRef.current.style.right = `${containerProps.right}px`;
          topBlockRef.current.style.width = `${containerProps.width - getScrollbarWidth()}px`;

          setTimeout(() => {
            if (topBlockRef.current) {
              topBlockRef.current.style.transition = 'opacity, padding-top 0.27s ease';
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
          topBlockRef.current.style.right = '100%';
          topBlockRef.current.style.transition = 'all 0s';
          topBlockRef.current.style.opacity = '0';

          setTimeout(() => {
            if (topBlockRef.current) {
              topBlockRef.current.style.transition = 'opacity 0.27s ease';
              topBlockRef.current.style.opacity = '1';
            }
          }, 100);
        }

        return false;
      });
    }
  }, []);

  const [currentTokenInfo, setCurrentTokenInfo] = useState<CurrentSelectToken| undefined>(undefined);

  const onCloseDetail = useCallback(() => {
    setCurrentTokenInfo(undefined);
  }, []);

  const onClickThreeDots = useCallback((item: TokenBalanceItemType) => {
    return () => {
      setCurrentTokenInfo({
        slug: item.slug,
        symbol: item.symbol
      });
    };
  }, []);

  const onOpenSendFund = useCallback(() => {
    if (currentAccount && currentAccount.isReadOnly) {
      notify({
        message: t('The account you are using is read-only, you cannot send assets with it'),
        type: 'info',
        duration: 3
      });

      return;
    }

    navigate('/transaction/send-fund', tokenGroupSlug ? ({ state: { slug: tokenGroupSlug } }) : undefined);
  },
  [currentAccount, navigate, notify, t, tokenGroupSlug]
  );

  const onOpenBuyTokens = useCallback(() => {
    navigate('/buy-tokens', { state: { symbol } });
  },
  [navigate, symbol]
  );

  const onOpenReceive = useCallback(() => {
    if (isAllAccount) {
      activeModal(AccountSelectorModalId);
    } else {
      if (tokenBalanceItems.length === 1) {
        setReceiveSelectedResult((prev) => ({ ...prev, selectedNetwork: tokenBalanceItems[0].chain }));
        activeModal(RECEIVE_QR_MODAL);

        return;
      }

      activeModal(ReceiveTokensSelectorModalId);
    }
  }, [activeModal, isAllAccount, tokenBalanceItems]);

  const openSelectAccount = useCallback((account: AccountJson) => {
    setReceiveSelectedResult({ selectedAccount: account.address });

    if (tokenBalanceItems.length === 1) {
      setReceiveSelectedResult((prev) => ({ ...prev, selectedNetwork: tokenBalanceItems[0].chain }));
      activeModal(RECEIVE_QR_MODAL);
    } else {
      activeModal(ReceiveTokensSelectorModalId);
    }

    inactiveModal(AccountSelectorModalId);
  }, [activeModal, inactiveModal, tokenBalanceItems]);

  const openSelectToken = useCallback((item: _ChainAsset) => {
    setReceiveSelectedResult((prevState) => ({ ...prevState, selectedNetwork: item.originChain }));
  }, []);

  const tokensSelectorFiller = useMemo<((item: _ChainAsset) => boolean) | undefined>(() => {
    if (tokenBalanceItems.length < 2) {
      return undefined;
    }

    const acceptSlugs = tokenBalanceItems.map((t) => t.slug);

    return (item: _ChainAsset) => acceptSlugs.includes(item.slug);
  }, [tokenBalanceItems]);

  useEffect(() => {
    if (currentTokenInfo) {
      activeModal(TokenDetailModalId);
    } else {
      inactiveModal(TokenDetailModalId);
    }
  }, [activeModal, currentTokenInfo, inactiveModal]);

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
          onClickBack={goHome}
          onOpenBuyTokens={onOpenBuyTokens}
          onOpenReceive={onOpenReceive}
          onOpenSendFund={onOpenSendFund}
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
              onClickDotsIcon={onClickThreeDots(item)}
            />
          ))
        }
      </div>

      <DetailModal
        currentTokenInfo={currentTokenInfo}
        id={TokenDetailModalId}
        onCancel={onCloseDetail}
        tokenBalanceMap={tokenBalanceMap}
      />

      <AccountSelectorModal
        onSelectItem={openSelectAccount}
      />

      <TokensSelectorModal
        address={selectedAccount || currentAccount?.address}
        itemFilter={tokensSelectorFiller}
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
      paddingTop: 206,
      marginRight: -getScrollbarWidth()
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

    '.token-balance-detail-item': {
      marginBottom: token.sizeXS
    }
  });
});

export default Tokens;
