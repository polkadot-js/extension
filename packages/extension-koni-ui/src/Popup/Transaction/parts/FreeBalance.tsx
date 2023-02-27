// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { TransactionContext } from '@subwallet/extension-koni-ui/Popup/Transaction/Transaction';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Number, Typography } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps

const Component = ({ className }: Props) => {
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;
  const chainInfoMap = useSelector((root: RootState) => root.chainStore.chainInfoMap);
  const transactionContext = useContext(TransactionContext);
  const chainInfo = useMemo(() => (chainInfoMap[transactionContext.chain]), [chainInfoMap, transactionContext.chain]);

  return (
    <Typography.Paragraph className={CN(className, 'free-balance')}>
      {t('Sender available balance:')}
      <Number
        decimal={chainInfo?.substrateInfo?.decimals || chainInfo?.evmInfo?.decimals || 18}
        decimalColor={token.colorTextTertiary}
        intColor={token.colorTextTertiary}
        size={14}
        suffix={chainInfo?.substrateInfo?.symbol || chainInfo?.evmInfo?.symbol || ''}
        unitColor={token.colorTextTertiary}
        value={transactionContext.freeBalance || 0}
      />
    </Typography.Paragraph>
  );
};

const FreeBalance = styled(Component)(({ theme: { token } }: Props) => {
  return ({
    display: 'flex',
    color: token.colorTextTertiary,

    '&.ant-typography': {
      marginBottom: 0
    },

    '.ant-number': {
      marginLeft: '0.3em'
    }
  });
});

export default FreeBalance;
