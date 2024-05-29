// Copyright 2019-2022 @polkadot/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useTranslation from '@subwallet/extension-web-ui/hooks/common/useTranslation';
import { Theme, ThemeProps } from '@subwallet/extension-web-ui/types';
import { Number, Typography } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import React from 'react';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps & {
  label?: string;
  bondedBalance?: string | number | BigN;
  decimals: number;
  symbol: string;
}

const Component = ({ bondedBalance, className, decimals, label, symbol }: Props) => {
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;

  return (
    <Typography.Paragraph className={CN(className, 'bonded-balance')}>
      <Number
        decimal={decimals}
        decimalColor={token.colorTextTertiary}
        intColor={token.colorTextTertiary}
        size={14}
        suffix={symbol}
        unitColor={token.colorTextTertiary}
        value={bondedBalance || 0}
      />
      {label || t('Staked')}
    </Typography.Paragraph>
  );
};

const BondedBalance = styled(Component)(({ theme: { token } }: Props) => {
  return ({
    display: 'flex',
    color: token.colorTextTertiary,

    '&.ant-typography': {
      marginBottom: 0
    },

    '.ant-number': {
      marginRight: '0.3em'
    }
  });
});

export default BondedBalance;
