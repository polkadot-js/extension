// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { BalanceItemProps, Number } from '@subwallet/react-ui';
import classNames from 'classnames';
import React from 'react';
import styled from 'styled-components';
import BigN from 'bignumber.js';

type Props = ThemeProps & {
  onPressItem?: BalanceItemProps['onPressItem'],
  value: BigN,
  convertedValue: BigN,
  symbol: string,
};

function Component (
  {
    className = '',
    value,
    convertedValue,
    symbol
  }: Props) {
  // todo: Update BalanceItem in react-ui lib
  // - loading
  // - auto detect logo, only use logoKey
  // - price change status

  return (
    <div className={classNames('token-group-balance-item', className)}>
      <div className={'ant-balance-item-balance-info-wrapper'}>
        <Number
          className={'__value'}
          decimal={0}
          decimalOpacity={0.45}
          value={value}
          suffix={symbol}
        />
        <Number
          className={'__converted-value'}
          decimal={0}
          decimalOpacity={0.45}
          intOpacity={0.45}
          prefix='$'
          size={12}
          unitOpacity={0.45}
          value={convertedValue}
        />
      </div>
    </div>
  );
}

export const TokenBalance = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.ant-number': {
      fontSize: 'inherit !important',
      lineHeight: 'inherit',
      textAlign: 'end',
    },

    '.__value': {
      lineHeight: token.lineHeightLG,
      fontSize: token.fontSizeLG
    },

    '.__converted-value': {
      lineHeight: token.lineHeightSM,
      fontSize: token.fontSizeSM
    },
  });
});
