// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { TokenBalanceItemType } from '@subwallet/extension-koni-ui/types/balance';
import { ActivityIndicator, BalanceItem, BalanceItemProps, Icon, Number } from '@subwallet/react-ui';
import classNames from 'classnames';
import { CaretRight } from 'phosphor-react';
import React from 'react';
import styled from 'styled-components';

type Props = TokenBalanceItemType & ThemeProps & {
  onPressItem?: BalanceItemProps['onPressItem'],
};

function Component (
  { chain,
    chainDisplayName = '',
    className = '',
    isReady,
    logoKey,
    onPressItem,
    priceValue,
    slug,
    symbol,
    total }: Props) {
  // todo: Create new Web3block item in react-ui lib
  // - loading
  // - auto detect logo, only use logoKey

  return (
    <div className={classNames('token-balance-selection-item', className)}>
      <BalanceItem
        balanceValue={total.value}
        convertedBalanceValue={total.convertedValue}
        decimal={0}
        displayToken={symbol}
        isShowSubLogo={!!chain && !slug.includes('NATIVE')}
        middleItem={
          (
            <>
              <div className={'ant-balance-item-name'}>{symbol}</div>
              <div className={'__chain-name'}>
                {chainDisplayName?.replace(' Relay Chain', '')}
              </div>
            </>
          )
        }
        name={symbol}
        networkMainLogoShape={'squircle'}
        onPressItem={onPressItem}
        price={priceValue}
        rightItem={
          (
            <>
              <div className={'ant-balance-item-balance-info-wrapper'}>
                <Number
                  decimal={0}
                  decimalOpacity={0.45}
                  prefix='$'
                  value={total.convertedValue}
                />
                <Number
                  decimal={0}
                  decimalOpacity={0.45}
                  intOpacity={0.45}
                  size={12}
                  suffix={symbol}
                  unitOpacity={0.45}
                  value={total.value}
                />
              </div>

              <div className={'__icon-wrapper'}>
                {isReady
                  ? (
                    <Icon
                      phosphorIcon={CaretRight}
                      size='sm'
                      type='phosphor'
                    />
                  )
                  : (
                    <ActivityIndicator
                      prefixCls={'ant'} // todo: add className to ActivityIndicator
                      size={20}
                    />
                  )}
              </div>
            </>
          )
        }
        subSymbol={chain}
        symbol={logoKey}
      />
    </div>
  );
}

export const TokenBalanceSelectionItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '&.-price-decrease .ant-web3-block-middle-item': {
      '.ant-number .ant-typography': {
        color: `${token.colorError} !important`
      }
    },

    '.__chain-name': {
      color: token.colorTextLight4,
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM
    },

    '.ant-loading-icon': {
      color: 'inherit !important'
    },

    '.ant-image-img': {
      height: 'auto !important'
    },
    '.__icon-wrapper': {
      width: 40,
      display: 'flex',
      justifyContent: 'center',
      color: token.colorTextLight4
    },
    '.ant-balance-item-content:hover': {
      '.__icon-wrapper': {
        color: token.colorTextLight2
      }
    }
  });
});
