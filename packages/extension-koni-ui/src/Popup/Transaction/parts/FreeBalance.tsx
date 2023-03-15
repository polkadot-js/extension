// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _getChainNativeTokenSlug } from '@subwallet/extension-base/services/chain-service/utils';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { TransactionContext } from '@subwallet/extension-koni-ui/Popup/Transaction/Transaction';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Number, Typography } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps & {
  label?: string;
  tokenSlug?: string;
}

const Component = ({ className, label, tokenSlug }: Props) => {
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;
  const balanceMap = useSelector((state: RootState) => state.balance.balanceMap);
  const chainInfoMap = useSelector((root: RootState) => root.chainStore.chainInfoMap);
  const transactionContext = useContext(TransactionContext);
  const chainInfo = useMemo(() => (chainInfoMap[transactionContext.chain]), [chainInfoMap, transactionContext.chain]);
  const assetRegistryMap = useSelector((root: RootState) => root.assetRegistry.assetRegistry);
  const nativeTokenSlug = chainInfo ? _getChainNativeTokenSlug(chainInfo) : undefined;

  const nativeChainAsset = useMemo(() => {
    return nativeTokenSlug ? assetRegistryMap[nativeTokenSlug] : undefined;
  }, [assetRegistryMap, nativeTokenSlug]);

  const nativeTokenBalance: string = (() => {
    if (nativeTokenSlug && balanceMap[nativeTokenSlug]) {
      return balanceMap[nativeTokenSlug].free || '0';
    }

    return '0';
  })();

  const currentChainAsset = useMemo(() => {
    return tokenSlug ? assetRegistryMap[tokenSlug] : undefined;
  }, [assetRegistryMap, tokenSlug]);

  const currentTokenBalance: string = (() => {
    if (tokenSlug && balanceMap[tokenSlug]) {
      return balanceMap[tokenSlug].free || '0';
    }

    return '0';
  })();

  return (
    <Typography.Paragraph className={CN(className, 'free-balance')}>
      {label || t('Sender available balance:')}
      {
        !!nativeTokenSlug && (
          <Number
            decimal={nativeChainAsset?.decimals || 18}
            decimalColor={token.colorTextTertiary}
            intColor={token.colorTextTertiary}
            size={14}
            suffix={nativeChainAsset?.symbol}
            unitColor={token.colorTextTertiary}
            value={nativeTokenBalance}
          />
        )
      }
      {
        !!tokenSlug && (tokenSlug !== nativeTokenSlug) && (
          <>
            <span className={'__name'}>{t('and')}</span>
            <Number
              decimal={currentChainAsset?.decimals || 18}
              decimalColor={token.colorTextTertiary}
              intColor={token.colorTextTertiary}
              size={14}
              suffix={currentChainAsset?.symbol}
              unitColor={token.colorTextTertiary}
              value={currentTokenBalance}
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
