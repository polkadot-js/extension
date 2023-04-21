// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { TokenBalanceItemType } from '@subwallet/extension-koni-ui/types/balance';
import { ActivityIndicator, BalanceItem, BalanceItemProps, Icon, Number } from '@subwallet/react-ui';
import classNames from 'classnames';
import { CaretRight } from 'phosphor-react';
import React, { useContext } from 'react';
import styled, { ThemeContext } from 'styled-components';

type Props = TokenBalanceItemType & ThemeProps & {
  onPressItem?: BalanceItemProps['onPressItem'],
};

function Component (
  { className = '',
    priceChangeStatus,
    priceValue,
    price24hValue,
    symbol
  }: Props) {
  // todo: Update BalanceItem in react-ui lib
  // - loading
  // - auto detect logo, only use logoKey
  // - price change status

  const { token } = useContext(ThemeContext)

  const marginColor = priceChangeStatus === 'increase' ? token.colorSuccess : token.colorError
  const margin = !price24hValue || !priceValue ? 0 : Math.abs(price24hValue - priceValue) / price24hValue * 100;

  return (
    <div className={classNames('token-price', className, {
      '-price-decrease': priceChangeStatus === 'decrease'
    })}
    >
      <Number
        value={priceValue}
        prefix={'$'}
        decimal={0}
        decimalOpacity={0.45}
      />
      <Number
        value={margin}
        suffix='%'
        prefix={priceChangeStatus === 'decrease' ? '-' : '+'}
        className='margin-percentage'
        decimal={0}
        size={12}
        unitColor={marginColor}
        intColor={marginColor}
        decimalColor={marginColor}
      />
    </div>
  );
}

export const TokenPrice = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.ant-number': {
      fontSize: 'inherit !important',
      lineHeight: 'inherit',
      textAlign: 'end',
    },

    '.margin-percentage': {
      fontSize: token.fontSizeSM,
    },
  });
});
