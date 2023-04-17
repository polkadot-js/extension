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
  { className = '',
    priceChangeStatus,
    total, symbol }: Props) {
  // todo: Update BalanceItem in react-ui lib
  // - loading
  // - auto detect logo, only use logoKey
  // - price change status

  return (
    <div className={classNames('token-group-balance-item', className, {
      '-price-decrease': priceChangeStatus === 'decrease'
    })}
    >
      <>
        <div className={'ant-balance-item-balance-info-wrapper'}>
          <Number
            className={'__value'}
            decimal={0}
            decimalOpacity={0.45}
            value={total.value}
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
            value={total.convertedValue}
          />
        </div>
      </>
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
