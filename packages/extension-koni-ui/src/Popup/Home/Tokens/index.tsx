// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { TokenGroupBalanceItem } from '@subwallet/extension-koni-ui/components/TokenItem/TokenGroupBalanceItem';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { HomeContext } from '@subwallet/extension-koni-ui/contexts/screen/HomeContext';
import { UpperBlock } from '@subwallet/extension-koni-ui/Popup/Home/Tokens/UpperBlock';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { TokenBalanceItemType } from '@subwallet/extension-koni-ui/types/balance';
import { TokenDetailParam } from '@subwallet/extension-koni-ui/types/navigation';
import { Button, Icon } from '@subwallet/react-ui';
import classNames from 'classnames';
import { FadersHorizontal } from 'phosphor-react';
import React, { useCallback, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps;

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

function Component (): React.ReactElement {
  const [isShrink, setIsShrink] = useState<boolean>(false);
  const navigate = useNavigate();
  const { accountBalance: { tokenGroupBalanceMap,
    totalBalanceInfo }, tokenGroupStructure: { sortedTokenGroups } } = useContext(HomeContext);

  const handleScroll = useCallback((event: React.UIEvent<HTMLElement>) => {
    if (event.currentTarget.scrollTop > 80) {
      setIsShrink(true);
    } else {
      setIsShrink(false);
    }
  }, []);

  const isTotalBalanceDecrease = totalBalanceInfo.change.status === 'decrease';

  const onClickItem = useCallback((item: TokenBalanceItemType) => {
    return () => {
      navigate('/home/token-detail-list', { state: {
        symbol: item.symbol,
        tokenGroup: item.slug
      } as TokenDetailParam });
    };
  }, [navigate]);

  return (
    <>
      <div className={classNames('__upper-block-wrapper', {
        '-is-shrink': isShrink,
        '-decrease': isTotalBalanceDecrease
      })}
      >
        <UpperBlock
          className={'__static-block'}
          isPriceDecrease={isTotalBalanceDecrease}
          isShrink={false}
          totalChangePercent={totalBalanceInfo.change.percent}
          totalChangeValue={totalBalanceInfo.change.value}
          totalValue={totalBalanceInfo.convertedValue}
        />
        <UpperBlock
          className={'__scrolling-block'}
          isPriceDecrease={isTotalBalanceDecrease}
          isShrink={true}
          totalChangePercent={totalBalanceInfo.change.percent}
          totalChangeValue={totalBalanceInfo.change.value}
          totalValue={totalBalanceInfo.convertedValue}
        />
      </div>
      <div
        className={'__scroll-container'}
        onScroll={handleScroll}
      >
        {
          sortedTokenGroups.map((tokenGroupKey) => {
            const item = tokenGroupBalanceMap[tokenGroupKey];

            if (!item) {
              return null;
            }

            return (
              <TokenGroupBalanceItem
                key={item.slug}
                {...item}
                onPressItem={onClickItem(item)}
              />
            );
          })
        }
        <div className={'__scroll-footer'}>
          <Button
            icon={<Icon phosphorIcon={FadersHorizontal} />}
            size={'xs'}
            type={'ghost'}
          >
            {/* todo: i18n this */}
            Manage token list
          </Button>
        </div>
      </div>
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
    paddingTop: 112,

    '.__scroll-container': {
      flex: 1,
      overflow: 'auto',
      paddingTop: 106,
      paddingLeft: token.size,
      paddingRight: token.size
    },

    '.__upper-block-wrapper': {
      position: 'absolute',
      backgroundColor: token.colorBgDefault,
      height: 218,
      zIndex: 10,
      top: 0,
      left: 0,
      right: 0,
      display: 'flex',
      alignItems: 'center',
      transition: '0.1s height',
      backgroundImage: extendToken.tokensScreenSuccessBackgroundColor,

      '&.-is-shrink': {
        height: 112
      },

      '&.-decrease': {
        backgroundImage: extendToken.tokensScreenDangerBackgroundColor
      }
    },

    '.tokens-upper-block': {
      flex: 1
    },

    '.__scrolling-block': {
      display: 'none'
    },

    '.__scroll-footer': {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: token.size
    },

    '.token-group-balance-item': {
      marginBottom: token.sizeXS
    },

    '.__upper-block-wrapper.-is-shrink': {
      '.__static-block': {
        display: 'none'
      },

      '.__scrolling-block': {
        display: 'flex'
      }
    }
  });
});

export default Tokens;
