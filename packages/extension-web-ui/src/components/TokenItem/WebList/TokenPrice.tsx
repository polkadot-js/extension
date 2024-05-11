// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useSelector } from '@subwallet/extension-web-ui/hooks';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { Theme } from '@subwallet/extension-web-ui/themes';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { BalanceItemProps, Number } from '@subwallet/react-ui';
import classNames from 'classnames';
import React, { Context, useContext } from 'react';
import styled, { ThemeContext } from 'styled-components';

type Props = ThemeProps & {
  onPressItem?: BalanceItemProps['onPressItem'],
  value: number,
  pastValue: number,
};

function Component (
  { className = '',
    pastValue,
    value }: Props) {
  // todo: Update BalanceItem in react-ui lib
  // - loading
  // - auto detect logo, only use logoKey
  // - price change status

  const token = useContext<Theme>(ThemeContext as Context<Theme>).token;
  const { currencyData } = useSelector((state: RootState) => state.price);
  const priceChangeStatus = (() => {
    if (value > pastValue) {
      return 'increase';
    } else if (value < pastValue) {
      return 'decrease';
    }

    return null;
  })();

  const marginColor = priceChangeStatus === 'decrease' ? token.colorError : token.colorSuccess;
  const margin = !pastValue || !value ? 0 : Math.abs(pastValue - value) / pastValue * 100;

  return (
    <div className={classNames('token-price', className, {
      '-price-decrease': priceChangeStatus === 'decrease'
    })}
    >
      <Number
        className={'__value'}
        decimal={0}
        decimalOpacity={0.45}
        prefix={(currencyData?.isPrefix && currencyData?.symbol) || ''}
        value={value}
      />
      <Number
        className={'__percentage'}
        decimal={0}
        decimalColor={marginColor}
        intColor={marginColor}
        prefix={priceChangeStatus === 'decrease' ? '-' : '+'}
        suffix='%'
        unitColor={marginColor}
        value={margin}
      />
    </div>
  );
}

export const TokenPrice = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.ant-number .ant-typography': {
      fontSize: 'inherit !important',
      lineHeight: 'inherit',
      textAlign: 'end'
    },

    '.__value': {
      lineHeight: token.lineHeightLG,
      fontSize: token.fontSizeLG
    },

    '.__percentage': {
      lineHeight: token.lineHeightSM,
      fontSize: token.fontSizeSM
    }
  });
});
