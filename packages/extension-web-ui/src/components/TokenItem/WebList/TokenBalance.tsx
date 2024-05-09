// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useSelector } from '@subwallet/extension-web-ui/hooks';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Number } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import classNames from 'classnames';
import React from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  value: BigN,
  convertedValue: BigN,
  symbol?: string,
  autoHideBalance?: boolean,
};

function Component (
  { autoHideBalance = true,
    className = '',
    convertedValue,
    symbol, value }: Props) {
  const isShowBalance = useSelector((state) => state.settings.isShowBalance);
  const { currencyData } = useSelector((state: RootState) => state.price);
  const hideBalance = autoHideBalance ? !isShowBalance : undefined;

  return (
    <div className={classNames(className)}>
      <Number
        className={'__value'}
        decimal={0}
        decimalOpacity={0.45}
        hide={hideBalance}
        suffix={symbol}
        value={value}
      />
      <Number
        className={'__converted-value'}
        decimal={0}
        decimalOpacity={0.45}
        hide={hideBalance}
        intOpacity={0.45}
        prefix={(currencyData?.isPrefix && currencyData?.symbol) || ''}
        unitOpacity={0.45}
        value={convertedValue}
      />
    </div>
  );
}

export const TokenBalance = styled(Component)<Props>(({ theme: { token } }: Props) => {
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

    '.__converted-value': {
      lineHeight: token.lineHeightSM,
      fontSize: token.fontSizeSM
    }
  });
});
