// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TokenBalance, TokenItem } from '@subwallet/extension-koni-ui/components';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { AccountSelectorModal } from '@subwallet/extension-koni-ui/components/Modal/AccountSelectorModal';
import ReceiveQrModal from '@subwallet/extension-koni-ui/components/Modal/ReceiveModal/ReceiveQrModal';
import { TokensSelectorModal } from '@subwallet/extension-koni-ui/components/Modal/ReceiveModal/TokensSelectorModal';
import NoContent, { PAGE_TYPE } from '@subwallet/extension-koni-ui/components/NoContent';
import { TokenBalanceDetailItem } from '@subwallet/extension-koni-ui/components/TokenItem/TokenBalanceDetailItem';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { HomeContext } from '@subwallet/extension-koni-ui/contexts/screen/HomeContext';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { useDefaultNavigate, useNavigateOnChangeAccount, useNotification, useReceiveQR, useSelector } from '@subwallet/extension-koni-ui/hooks';
import { DetailModal } from '@subwallet/extension-koni-ui/Popup/Home/Tokens/DetailModal';
import { DetailUpperBlock } from '@subwallet/extension-koni-ui/Popup/Home/Tokens/DetailUpperBlock';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { TokenBalanceItemType } from '@subwallet/extension-koni-ui/types/balance';
import { sortTokenByValue } from '@subwallet/extension-koni-ui/utils';
import { ModalContext } from '@subwallet/react-ui';
import { SwNumberProps } from '@subwallet/react-ui/es/number';
import CN from 'classnames';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import styled from 'styled-components';

import DetailTable from './DetailTable';

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

const searchFunc = (item: TokenBalanceItemType, searchText: string) => {
  const searchTextLowerCase = searchText.toLowerCase();
  const chainName = item.chainDisplayName?.toLowerCase() || '';
  const symbol = item.symbol.toLowerCase();

  return (
    symbol.includes(searchTextLowerCase) ||
    (chainName && chainName.includes(searchTextLowerCase))
  );
};

function Component (): React.ReactElement {
  const { slug: tokenGroupSlug } = useParams();
  const outletContext: {
    searchInput: string,
    setDetailTitle: React.Dispatch<React.SetStateAction<React.ReactNode>>
  } = useOutletContext();

  const searchInput = outletContext?.searchInput;
  const setDetailTitle = outletContext?.setDetailTitle;

  const notify = useNotification();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { goHome } = useDefaultNavigate();

  const { activeModal, inactiveModal } = useContext(ModalContext);
  const { isWebUI } = useContext(ScreenContext);
  const { accountBalance: { tokenBalanceMap, tokenGroupBalanceMap }, tokenGroupStructure: { tokenGroupMap } } = useContext(HomeContext);

  const assetRegistryMap = useSelector((root: RootState) => root.assetRegistry.assetRegistry);
  const multiChainAssetMap = useSelector((state: RootState) => state.assetRegistry.multiChainAssetMap);
  const currentAccount = useSelector((state: RootState) => state.accountState.currentAccount);

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
          const item = tokenBalanceMap[tokenSlug];

          if (!item) {
            return;
          }

          if (searchInput) {
            if (searchFunc(item, searchInput)) {
              items.push(item);
            }
          } else {
            items.push(item);
          }
        });

        return items.sort(sortTokenByValue);
      }

      if (tokenBalanceMap[tokenGroupSlug]) {
        if (searchInput) {
          if (!searchFunc(tokenBalanceMap[tokenGroupSlug], searchInput)) {
            return [];
          }
        }

        return [tokenBalanceMap[tokenGroupSlug]];
      }
    }

    return [] as TokenBalanceItemType[];
  }, [tokenGroupSlug, tokenGroupMap, tokenBalanceMap, searchInput]);

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
    setCurrentTokenInfo({
      slug: item.slug,
      symbol: item.symbol
    });
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

    navigate('/transaction/send-fund', tokenGroupSlug ? ({ state: { slug: tokenGroupSlug } }) : undefined);
  },
  [currentAccount, navigate, notify, t, tokenGroupSlug]
  );

  const onOpenBuyTokens = useCallback(() => {
    navigate('/buy-tokens', { state: { symbol } });
  },
  [navigate, symbol]
  );

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
    if (!tokenBalanceItems.length && !searchInput) {
      goHome();
    }
  }, [goHome, searchInput, tokenBalanceItems.length]);

  useEffect(() => {
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  const detailTitle = useMemo(() => {
    return <div className='header-content'>{t('Token')}: {symbol}</div>;
  }, [symbol, t]);

  useEffect(() => {
    setDetailTitle?.(detailTitle);
  }, [detailTitle, setDetailTitle]);

  const itemClickAction = useCallback((item: TokenBalanceItemType) => {
    return () => {
      onClickItem(item);
    };
  }, [onClickItem]);

  return (
    <div
      className={CN('token-detail-container', {
        '__web-ui': isWebUI
      })}
      onScroll={handleScroll}
      ref={containerRef}
    >
      {!isWebUI && (
        <div
          className={CN('__upper-block-wrapper', {
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
      )}

      {!tokenBalanceItems.length
        ? (
          <NoContent pageType={PAGE_TYPE.TOKEN} />
        )
        : !isWebUI
          ? (
            <div
              className={'__scroll-container'}
            >
              {
                tokenBalanceItems.map((item) => (
                  <TokenBalanceDetailItem
                    key={item.slug}
                    {...item}
                    onClick={itemClickAction(item)}
                  />
                ))
              }
            </div>
          )
          : (
            <DetailTable
              className={'__table'}
              columns={[
                {
                  title: 'Token name',
                  dataIndex: 'name',
                  key: 'name',
                  render: (_, row) => {
                    return (
                      <TokenItem
                        chain={row.chain}
                        logoKey={row.logoKey}
                        slug={row.slug}
                        subTitle={row.chainDisplayName?.replace(' Relay Chain', '') || ''}
                        symbol={row.symbol}
                      />
                    );
                  }
                },
                {
                  title: 'Transferable',
                  dataIndex: 'percentage',
                  key: 'percentage',
                  render: (_, row) => {
                    return (
                      <TokenBalance
                        convertedValue={row.free.convertedValue}
                        symbol={row.symbol}
                        value={row.free.value}
                      />
                    );
                  }
                },
                {
                  title: 'Locked',
                  dataIndex: 'price',
                  key: 'price',
                  render: (_, row) => {
                    return (
                      <TokenBalance
                        convertedValue={row.locked.convertedValue}
                        symbol={row.symbol}
                        value={row.locked.value}
                      />
                    );
                  }
                },
                {
                  title: 'Balance',
                  dataIndex: 'balance',
                  key: 'balance',
                  render: (_, row) => {
                    return (
                      <TokenBalance
                        convertedValue={row.total.convertedValue}
                        symbol={row.symbol}
                        value={row.total.value}
                      />
                    );
                  }
                }
              ]}
              dataSource={tokenBalanceItems}
              onClick={onClickItem}
            />
          )}

      <DetailModal
        currentTokenInfo={currentTokenInfo}
        id={TokenDetailModalId}
        onCancel={onCloseDetail}
        tokenBalanceMap={tokenBalanceMap}
      />

      {
        !isWebUI && (
          <>
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
          </>
        )
      }
    </div>
  );
}

const Tokens = styled(WrapperComponent)<ThemeProps>(({ theme: { extendToken, token } }: ThemeProps) => {
  return ({
    overflow: 'hidden',

    '.__table': {
      '.ant-table-row': {
        cursor: 'pointer'
      }
    },

    '.token-detail-container': {
      height: '100%',
      overflow: 'auto',
      color: token.colorTextLight1,
      fontSize: token.fontSizeLG,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: 210,
      '&.__web-ui': {
        padding: 0
      }
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

    '.token-balance-detail-item': {
      marginBottom: token.sizeXS
    }
  });
});

export default Tokens;
