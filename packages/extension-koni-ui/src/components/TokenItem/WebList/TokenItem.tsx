// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { TokenBalanceItemType } from '@subwallet/extension-koni-ui/types/balance';
import { ActivityIndicator, BalanceItem, BalanceItemProps, Icon, Logo, Number, Typography, Web3Block } from '@subwallet/react-ui';
import classNames from 'classnames';
import { CaretRight } from 'phosphor-react';
import React from 'react';
import styled from 'styled-components';

type Props = ThemeProps & Omit<TokenBalanceItemType,
"slug" |
"chain" |
"chainDisplayName" |
"isTestnet" |
"priceValue" |
"price24hValue" |
"priceChangeStatus" |
"free" |
"locked" |
"total" |
"isReady"
> & {
  onPressItem?: BalanceItemProps['onPressItem'],
} ;

function Component (
  props: Props) {
  const {
    className = '',
    logoKey,
    symbol
  } = props
  // todo: Update BalanceItem in react-ui lib
  // - loading
  // - auto detect logo, only use logoKey
  // - price change status

  return (
    <div className={classNames('token-item-container', className)}>
      <Logo
        size={40}
        network={symbol}
        token={logoKey}
        shape={'squircle'}
        isShowSubLogo={false}
      />
      <div className='token-item-information'>
        <Typography.Text className='token-item-information__title'>
          {symbol}
        </Typography.Text>
        <Typography.Text className='token-item-information__sub-title'>
          {logoKey}
        </Typography.Text>
      </div>
    </div>
  );
}

export const TokenItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '&.token-item-container': {
      display: 'flex',

      '.token-item-information': {
        marginLeft: 10,
        display: 'flex',
        flexDirection: 'column',

        '&__title': {},

        '&__sub-title': {
          fontSize: 12,
          opacity: 0.65,
          textAlign: 'start'
        }
      }
    }
  })
});
