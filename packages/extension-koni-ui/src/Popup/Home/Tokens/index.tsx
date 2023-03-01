// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { ReceiveAccountSelector } from '@subwallet/extension-koni-ui/components/Modal/ReceiveModal/ReceiveAccountSelector';
import ReceiveQrModal from '@subwallet/extension-koni-ui/components/Modal/ReceiveModal/ReceiveQrModal';
import { TokensSelector } from '@subwallet/extension-koni-ui/components/Modal/ReceiveModal/TokensSelector';
import { TokenGroupBalanceItem } from '@subwallet/extension-koni-ui/components/TokenItem/TokenGroupBalanceItem';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { HomeContext } from '@subwallet/extension-koni-ui/contexts/screen/HomeContext';
import { UpperBlock } from '@subwallet/extension-koni-ui/Popup/Home/Tokens/UpperBlock';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { TokenBalanceItemType } from '@subwallet/extension-koni-ui/types/balance';
import { TokenDetailParam } from '@subwallet/extension-koni-ui/types/navigation';
import { Button, Icon, ModalContext } from '@subwallet/react-ui';
import { getScrollbarWidth } from '@subwallet/react-ui/es/style';
import classNames from 'classnames';
import { FadersHorizontal } from 'phosphor-react';
import React, { useCallback, useContext, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps;

type ReceiveSelectedResult = {
  selectedAcc?: string;
  selectedNetwork?: string;
};

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
  const { activeModal } = useContext(ModalContext);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const topBlockRef = useRef<HTMLDivElement>(null);
  const currentAccount = useSelector((state: RootState) => state.accountState.currentAccount);
  const { accountBalance: { tokenGroupBalanceMap,
    totalBalanceInfo }, tokenGroupStructure: { sortedTokenGroups } } = useContext(HomeContext);
  const [{ selectedAcc, selectedNetwork }, setReceiveSelectedResult] = useState<ReceiveSelectedResult>({});

  const handleScroll = useCallback((event: React.UIEvent<HTMLElement>) => {
    const topPosition = event.currentTarget.scrollTop;

    if (topPosition > 80) {
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
              topBlockRef.current.style.opacity = '1';
              topBlockRef.current.style.paddingTop = '32px';
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

  const isTotalBalanceDecrease = totalBalanceInfo.change.status === 'decrease';

  const onClickItem = useCallback((item: TokenBalanceItemType) => {
    return () => {
      navigate('/home/token-detail-list', { state: {
        symbol: item.symbol,
        tokenGroup: item.slug
      } as TokenDetailParam });
    };
  }, [navigate]);

  const onClickManageToken = useCallback(() => {
    navigate('/settings/tokens/manage');
  }, [navigate]);

  return (
    <div
      className={'tokens-screen-container'}
      onScroll={handleScroll}
      ref={containerRef}
    >
      <div
        className={classNames('__upper-block-wrapper', {
          '-is-shrink': isShrink,
          '-decrease': isTotalBalanceDecrease
        })}
        ref={topBlockRef}
      >
        <UpperBlock
          isPriceDecrease={isTotalBalanceDecrease}
          isShrink={isShrink}
          totalChangePercent={totalBalanceInfo.change.percent}
          totalChangeValue={totalBalanceInfo.change.value}
          totalValue={totalBalanceInfo.convertedValue}
        />
      </div>
      <div
        className={'__scroll-container'}
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
            onClick={onClickManageToken}
            size={'xs'}
            type={'ghost'}
          >
            {/* todo: i18n this */}
            Manage token list
          </Button>
        </div>
      </div>
      <ReceiveAccountSelector
        className='token-account-selector'
        id='receive-account-selector'
        // eslint-disable-next-line react/jsx-no-bind
        onSelectItem={(address: string) => {
          setReceiveSelectedResult({ selectedAcc: address });
          activeModal('receive-token-selector');
        }}
        selectedItem=''
      />

      <TokensSelector
        address={selectedAcc || currentAccount?.address}
        className='receive-token-selector'
        id='receive-token-selector'
        // eslint-disable-next-line react/jsx-no-bind
        onChangeSelectedNetwork={(value) => setReceiveSelectedResult((prevState) => ({ ...prevState, selectedNetwork: value }))}
      />

      <ReceiveQrModal
        address={selectedAcc}
        selectedNetwork={selectedNetwork}
      />
    </div>
  );
}

const Tokens = styled(WrapperComponent)<ThemeProps>(({ theme: { extendToken, token } }: ThemeProps) => {
  return ({
    overflow: 'hidden',

    '.tokens-screen-container': {
      height: '100%',
      color: token.colorTextLight1,
      fontSize: token.fontSizeLG,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      overflowX: 'hidden',
      paddingTop: 210,
      marginRight: -getScrollbarWidth()
    },

    '.__scroll-container': {
      paddingLeft: token.size,
      paddingRight: token.size
    },

    '.__upper-block-wrapper': {
      backgroundColor: token.colorBgDefault,
      position: 'absolute',
      paddingTop: '32px',
      height: 210,
      zIndex: 10,
      top: 0,
      left: 0,
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      backgroundImage: extendToken.tokensScreenSuccessBackgroundColor,

      '&.-is-shrink': {
        height: 104
      },

      '&.-decrease': {
        backgroundImage: extendToken.tokensScreenDangerBackgroundColor
      }
    },

    '.tokens-upper-block': {
      flex: 1
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
    },

    '.token-account-selector, .receive-token-selector': {
      display: 'none'
    }
  });
});

export default Tokens;
