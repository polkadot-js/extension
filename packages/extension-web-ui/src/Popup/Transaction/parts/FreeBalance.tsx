// Copyright 2019-2022 @polkadot/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { useGetBalance } from '@subwallet/extension-web-ui/hooks';
import useTranslation from '@subwallet/extension-web-ui/hooks/common/useTranslation';
import { Theme, ThemeProps } from '@subwallet/extension-web-ui/types';
import { ActivityIndicator, Number, Typography } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useEffect } from 'react';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps & {
  address?: string,
  tokenSlug?: string;
  label?: string;
  chain?: string;
  onBalanceReady?: (rs: boolean) => void;
  hidden?: boolean;
  isSubscribe?: boolean;
  extrinsicType?: ExtrinsicType;
}

const Component = ({ address, chain, className, extrinsicType, hidden, isSubscribe, label, onBalanceReady,
  tokenSlug }: Props) => {
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;
  const { error, isLoading, nativeTokenBalance, nativeTokenSlug, tokenBalance } = useGetBalance(chain, address, tokenSlug, isSubscribe, extrinsicType);

  useEffect(() => {
    onBalanceReady?.(!isLoading && !error);
  }, [error, isLoading, onBalanceReady]);

  if (!address && !chain) {
    return <></>;
  }

  if (!address) {
    return (
      <Typography.Paragraph className={CN(className, 'free-balance', {
        hidden: hidden
      })}
      >
        {t('Select account to view available balance')}
      </Typography.Paragraph>
    );
  }

  return (
    <Typography.Paragraph className={CN(className, 'free-balance', {
      hidden: hidden
    })}
    >
      {!error && <span className='__label'>{label || t('Sender available balance:')}</span>}
      {isLoading && <ActivityIndicator size={14} />}
      {error && <Typography.Text className={'error-message'}>{error}</Typography.Text>}
      {
        !isLoading && !error && !!nativeTokenSlug && (
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
        !isLoading && !error && !!tokenSlug && (tokenSlug !== nativeTokenSlug) && (
          <>
            <span className={'__name'}>&nbsp;{t('and')}&nbsp;</span>
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

const FreeBalance = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',
    flexWrap: 'wrap',
    color: token.colorTextTertiary,

    '.__label': {
      marginRight: 3
    },

    '.error-message': {
      color: token.colorError
    },

    '&.ant-typography': {
      marginBottom: 0
    }
  };
});

export default FreeBalance;
