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
import CN from 'classnames';
import { FadersHorizontal } from 'phosphor-react';
import React, { useCallback, useContext, useState } from 'react';
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
  const currentAccount = useSelector((state: RootState) => state.accountState.currentAccount);
  const { accountBalance: { tokenGroupBalanceMap,
    totalBalanceInfo }, tokenGroupStructure: { sortedTokenGroups } } = useContext(HomeContext);
  const [{ selectedAcc, selectedNetwork }, setReceiveSelectedResult] = useState<ReceiveSelectedResult>({});

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

  const onClickManageToken = useCallback(() => {
    navigate('/settings/tokens/manage');
  }, [navigate]);

  return (
    <>
      <div className={CN('__upper-block-wrapper', {
        '-is-shrink': isShrink,
        '-decrease': isTotalBalanceDecrease
      })}
      >
        <UpperBlock
          className={CN(
            {
              '__static-block': !isShrink,
              '__scrolling-block': isShrink
            }
          )}
          isPriceDecrease={isTotalBalanceDecrease}
          isShrink={isShrink}
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
    },

    '.token-account-selector, .receive-token-selector': {
      display: 'none'
    }
  });
});

export default Tokens;
