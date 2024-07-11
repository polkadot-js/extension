// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useSelector } from '@subwallet/extension-web-ui/hooks';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { TokenBalanceItemType } from '@subwallet/extension-web-ui/types/balance';
import { ActivityIndicator, BalanceItem, BalanceItemProps, Icon, Number } from '@subwallet/react-ui';
import classNames from 'classnames';
import { CaretRight } from 'phosphor-react';
import React from 'react';
import styled from 'styled-components';

type Props = TokenBalanceItemType & ThemeProps & {
  onPressItem?: BalanceItemProps['onPressItem'],
  tokenName: string;
};

function Component (
  { chain,
    chainDisplayName = '',
    className = '',
    currency,
    isReady,
    logoKey,
    onPressItem,
    priceValue,
    slug,
    symbol,
    tokenName,
    total }: Props) {
  // todo: Create new Web3block item in react-ui lib
  // - loading
  // - auto detect logo, only use logoKey
  const { isShowBalance } = useSelector((state: RootState) => state.settings);

  return (
    <div className={classNames('token-balance-selection-item', className)}>
      <BalanceItem
        balanceValue={total.value}
        convertedBalanceValue={total.convertedValue}
        decimal={0}
        displayToken={symbol}
        isShowSubLogo={true}
        middleItem={
          (
            <>
              <div className='token-info'>
                <span>{symbol}</span>
                {
                  tokenName && (
                    <span className='__token-name'>
                    &nbsp;(
                      <span className='name'>{tokenName}</span>
                    )
                    </span>
                  )
                }
              </div>
              <div className={'__chain-name'}>
                {chainDisplayName?.replace(' Relay Chain', '')}
              </div>
            </>
          )
        }
        name={symbol}
        networkMainLogoShape={'squircle'}
        onPressItem={onPressItem}
        prefix={(currency?.isPrefix && currency.symbol) || ''}
        price={priceValue}
        rightItem={
          (
            <>
              <div className={'ant-balance-item-balance-info-wrapper'}>
                <Number
                  className={'__value'}
                  decimal={0}
                  decimalOpacity={0.45}
                  hide={!isShowBalance}
                  value={total.value}
                />
                <Number
                  className={'__converted-value'}
                  decimal={0}
                  decimalOpacity={0.45}
                  hide={!isShowBalance}
                  intOpacity={0.45}
                  prefix={(currency?.isPrefix && currency.symbol) || ''}
                  size={12}
                  suffix={(!currency?.isPrefix && currency?.symbol) || ''}

                  unitOpacity={0.45}
                  value={total.convertedValue}
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
        subNetworkKey={chain}
        suffix={(!currency?.isPrefix && currency?.symbol) || ''}
        symbol={logoKey}
      />
    </div>
  );
}

export const TokenBalanceSelectionItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.ant-web3-block': {
      padding: 12
    },

    '.ant-number .ant-typography': {
      fontSize: 'inherit !important',
      lineHeight: 'inherit'
    },

    '.__value': {
      lineHeight: token.lineHeightLG,
      fontSize: token.fontSizeLG
    },

    '.__converted-value': {
      lineHeight: token.lineHeightSM,
      fontSize: token.fontSizeSM
    },

    '.ant-web3-block-middle-item': {
      overflow: 'hidden'
    },

    '.token-info': {
      display: 'flex',
      flexDirection: 'row',
      overflow: 'hidden',
      paddingRight: token.paddingXS,

      fontSize: token.fontSizeHeading5,
      lineHeight: token.lineHeightHeading5,
      fontWeight: token.fontWeightStrong,
      color: token.colorWhite,

      '.__token-name': {
        color: token.colorTextTertiary,
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',

        '.name': {
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          whiteSpace: 'nowrap'
        }
      }
    },

    '.__chain-name': {
      color: token.colorTextLight4,
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
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
