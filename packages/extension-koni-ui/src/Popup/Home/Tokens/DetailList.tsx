// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { TokenBalanceDetailItem } from '@subwallet/extension-koni-ui/components/TokenItem/TokenBalanceDetailItem';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { HomeContext } from '@subwallet/extension-koni-ui/contexts/screen/HomeContext';
import { DetailModal } from '@subwallet/extension-koni-ui/Popup/Home/Tokens/DetailModal';
import { DetailUpperBlock } from '@subwallet/extension-koni-ui/Popup/Home/Tokens/DetailUpperBlock';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { TokenBalanceItemType } from '@subwallet/extension-koni-ui/types/balance';
import { TokenDetailParam } from '@subwallet/extension-koni-ui/types/navigation';
import { SwNumberProps } from '@subwallet/react-ui/es/number';
import { ModalContext } from '@subwallet/react-ui/es/sw-modal/provider';
import classNames from 'classnames';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();
  const { symbol,
    tokenGroup: currentTokenGroup,
    tokenSlug: currentTokenSlug } = location.state as TokenDetailParam;
  const { accountBalance: { tokenBalanceMap, tokenGroupBalanceMap }, tokenGroupStructure: { tokenGroupMap } } = useContext(HomeContext);

  const { activeModal, inactiveModal } = useContext(ModalContext);

  const tokenBalanceValue = useMemo<SwNumberProps['value']>(() => {
    if (!!currentTokenGroup && !!tokenGroupBalanceMap[currentTokenGroup]) {
      return tokenGroupBalanceMap[currentTokenGroup].total.convertedValue;
    }

    if (!!currentTokenSlug && !!tokenBalanceMap[currentTokenSlug]) {
      return tokenBalanceMap[currentTokenSlug].total.convertedValue;
    }

    return '0';
  }, [currentTokenGroup, currentTokenSlug, tokenBalanceMap, tokenGroupBalanceMap]);

  const tokenSlugs = useMemo<string[]>(() => {
    if (!!currentTokenGroup && !!tokenGroupMap[currentTokenGroup]) {
      return tokenGroupMap[currentTokenGroup];
    }

    if (currentTokenSlug) {
      return [currentTokenSlug];
    }

    return [];
  }, [currentTokenGroup, currentTokenSlug, tokenGroupMap]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLElement>) => {
    if (event.currentTarget.scrollTop > 80) {
      setIsShrink(true);
    } else {
      setIsShrink(false);
    }
  }, []);

  const onBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

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

  useEffect(() => {
    if (currentTokenInfo) {
      activeModal(TokenDetailModalId);
    } else {
      inactiveModal(TokenDetailModalId);
    }
  }, [activeModal, currentTokenInfo, inactiveModal]);

  // todo: wait design for scrolling mode
  return (
    <>
      <div className={classNames('__upper-block-wrapper', {
        '-is-shrink': isShrink
      })}
      >
        <DetailUpperBlock
          balanceValue={tokenBalanceValue}
          className={'__static-block'}
          isShrink={false}
          onClickBack={onBack}
          symbol={symbol}
        />
        <DetailUpperBlock
          balanceValue={tokenBalanceValue}
          className={'__scrolling-block'}
          isShrink={true}
          onClickBack={onBack}
          symbol={symbol}
        />
      </div>
      <div
        className={'__scroll-container'}
        onScroll={handleScroll}
      >
        {
          tokenSlugs.map((tokenSlug) => {
            const item = tokenBalanceMap[tokenSlug];

            if (!item) {
              return null;
            }

            return (
              <TokenBalanceDetailItem
                key={item.slug}
                {...item}
                onClickDotsIcon={onClickThreeDots(item)}
              />
            );
          })
        }
      </div>

      <DetailModal
        currentTokenInfo={currentTokenInfo}
        id={TokenDetailModalId}
        onCancel={onCloseDetail}
        tokenBalanceMap={tokenBalanceMap}
      />
    </>
  );
}

const Tokens = styled(WrapperComponent)<ThemeProps>(({ theme: { extendToken, token } }: ThemeProps) => {
  return ({
    height: '100%',
    color: token.colorTextLight1,
    fontSize: token.fontSizeLG,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',

    '.__scroll-container': {
      flex: 1,
      overflow: 'auto',
      paddingLeft: token.size,
      paddingRight: token.size,
      paddingTop: 210
    },

    '.__upper-block-wrapper': {
      position: 'absolute',
      backgroundColor: token.colorBgDefault,
      height: 210,
      zIndex: 10,
      top: 0,
      left: 0,
      right: 0,
      display: 'flex',
      alignItems: 'center',
      transition: '0.1s height',
      backgroundImage: extendToken.tokensScreenInfoBackgroundColor
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
