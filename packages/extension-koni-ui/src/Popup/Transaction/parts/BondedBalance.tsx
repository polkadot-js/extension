// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { _getChainNativeTokenBasicInfo } from '@subwallet/extension-base/services/chain-service/utils';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Number, Typography } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import React, { useMemo } from 'react';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps & {
  label?: string;
  bondedBalance?: string | number | BigN;
  chainInfo: _ChainInfo;
}

const Component = ({ bondedBalance, chainInfo, className, label }: Props) => {
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;

  const { decimals, symbol } = useMemo(() => {
    return _getChainNativeTokenBasicInfo(chainInfo);
  }, [chainInfo]);

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
      {label || t('Bonded')}
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
