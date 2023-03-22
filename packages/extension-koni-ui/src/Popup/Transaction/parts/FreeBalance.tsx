// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AmountData } from '@subwallet/extension-base/background/KoniTypes';
import { _getChainNativeTokenSlug } from '@subwallet/extension-base/services/chain-service/utils';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { getFreeBalance } from '@subwallet/extension-koni-ui/messaging';
import { TransactionContext } from '@subwallet/extension-koni-ui/Popup/Transaction/Transaction';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Number, Typography } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps & {
  address?: string,
  tokenSlug?: string;
  label?: string;
  chain?: string;
}

const Component = ({ address, chain, className, label, tokenSlug }: Props) => {
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;
  const [nativeTokenBalance, setNativeTokenBalance] = useState<AmountData>({ value: '0', symbol: '', decimals: 18 });
  const [tokenBalance, setTokenBalance] = useState<AmountData>({ value: '0', symbol: '', decimals: 18 });
  const chainInfoMap = useSelector((root: RootState) => root.chainStore.chainInfoMap);
  const transactionContext = useContext(TransactionContext);
  const chainInfo = useMemo(() => (chainInfoMap[transactionContext.chain]), [chainInfoMap, transactionContext.chain]);
  const nativeTokenSlug = chainInfo ? _getChainNativeTokenSlug(chainInfo) : undefined;

  useEffect(() => {
    let cancel = false;

    if (address && chain && nativeTokenSlug) {
      getFreeBalance({ address, networkKey: chain })
        .then((balance) => {
          !cancel && setNativeTokenBalance(balance);
        })
        .catch(console.error);

      if (tokenSlug && tokenSlug !== nativeTokenSlug) {
        getFreeBalance({ address, networkKey: chain, token: tokenSlug })
          .then((balance) => {
            !cancel && setTokenBalance(balance);
          })
          .catch(console.error);
      }
    }

    return () => {
      cancel = true;
    };
  }, [address, chain, nativeTokenSlug, tokenSlug]);

  if (!address && !chain) {
    return <></>;
  }

  return (
    <Typography.Paragraph className={CN(className, 'free-balance')}>
      {label || t('Sender available balance:')}
      {
        !!nativeTokenSlug && (
          <Number
            decimal={nativeTokenBalance.decimals || 18}
            decimalColor={token.colorTextTertiary}
            intColor={token.colorTextTertiary}
            size={14}
            suffix={nativeTokenBalance.symbol}
            unitColor={token.colorTextTertiary}
            value={nativeTokenBalance.value}
          />
        )
      }
      {
        !!tokenSlug && (tokenSlug !== nativeTokenSlug) && (
          <>
            <span className={'__name'}>{t('and')}</span>
            <Number
              decimal={tokenBalance?.decimals || 18}
              decimalColor={token.colorTextTertiary}
              intColor={token.colorTextTertiary}
              size={14}
              suffix={tokenBalance?.symbol}
              unitColor={token.colorTextTertiary}
              value={tokenBalance.value}
            />
          </>
        )
      }
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

    '.ant-number, .__name': {
      marginLeft: '0.3em'
    }
  });
});

export default FreeBalance;
