// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useGetBalance, useSelector } from '@subwallet/extension-koni-ui/hooks';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ActivityIndicator, Number, Typography } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled, { useTheme } from 'styled-components';

interface BalanceInfo {
  token: string;
  chain: string;
}

type Props = ThemeProps & {
  address: string;
  tokens: BalanceInfo[];
  label?: string;
  onBalanceReady?: (rs: boolean) => void;
  hidden?: boolean;
}

interface PartProps {
  token: string;
  chain: string;
  address: string;
  setLoading: (val: boolean) => void;
  setError: (val: string | null) => void;
  showNetwork: boolean;
  first: boolean;
  showContent: boolean;
}

const parseToLoadingMap = (tokens: BalanceInfo[]): Record<string, boolean> => {
  const result: Record<string, boolean> = {};

  tokens.forEach(({ token }) => {
    result[token] = true;
  });

  return result;
};

const parseToErrorMap = (tokens: BalanceInfo[]): Record<string, string | null> => {
  const result: Record<string, string | null> = {};

  tokens.forEach(({ token }) => {
    result[token] = null;
  });

  return result;
};

const PartComponent: React.FC<PartProps> = (props: PartProps) => {
  const { address, chain, first, setError, setLoading, showContent, showNetwork, token } = props;

  const { token: theme } = useTheme() as Theme;
  const { t } = useTranslation();

  const { chainInfoMap } = useSelector((state) => state.chainStore);

  const { error, isLoading, nativeTokenBalance, nativeTokenSlug, tokenBalance } = useGetBalance(chain, address, token, true);

  const balance = useMemo(() => {
    if (token) {
      if (nativeTokenSlug === token) {
        return nativeTokenBalance;
      } else {
        return tokenBalance;
      }
    }

    return undefined;
  }, [nativeTokenBalance, nativeTokenSlug, token, tokenBalance]);

  const suffix = useMemo(() => {
    let result = balance?.symbol || '';

    const chainInfo = chainInfoMap[chain];

    if (showNetwork && chainInfo) {
      result += ` (${chainInfo.name})`;
    }

    return result;
  }, [balance?.symbol, chain, chainInfoMap, showNetwork]);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  useEffect(() => {
    setError(error);
  }, [error, setError]);

  if (isLoading || !showContent) {
    return null;
  }

  return (
    <>
      {
        !first && (
          <span className={'__name'}>&nbsp;{t('and')}&nbsp;</span>
        )
      }
      {
        balance && (
          <Number
            decimal={balance.decimals || 18}
            decimalColor={theme.colorTextTertiary}
            intColor={theme.colorTextTertiary}
            size={14}
            suffix={suffix}
            unitColor={theme.colorTextTertiary}
            value={balance.value}
          />
        )
      }
    </>
  );
};

const Component = (props: Props) => {
  const { address, className, hidden, label, onBalanceReady, tokens } = props;

  const { t } = useTranslation();

  const loadingRef = useRef<Record<string, boolean>>(parseToLoadingMap(tokens));
  const errorRef = useRef<Record<string, string | null>>(parseToErrorMap(tokens));

  const showNetwork = useMemo(() => {
    let temp = '';

    for (const { chain } of tokens) {
      if (temp) {
        if (temp !== chain) {
          return true;
        }
      } else {
        temp = chain;
      }
    }

    return false;
  }, [tokens]);

  const [isLoading, _setIsLoading] = useState(true);
  const [error, _setError] = useState<string | null>(null);

  const setLoading = useCallback((slug: string) => {
    return (data: boolean) => {
      loadingRef.current[slug] = data;

      let _isLoading = false;

      for (const loading of Object.values(loadingRef.current)) {
        if (loading) {
          _isLoading = true;
          break;
        }
      }

      _setIsLoading(_isLoading);
    };
  }, []);

  const setError = useCallback((slug: string) => {
    return (data: string | null) => {
      errorRef.current[slug] = data;

      let _error: string | null = null;

      for (const value of Object.values(errorRef.current)) {
        if (value) {
          _error = value;
          break;
        }
      }

      _setError(_error);
    };
  }, []);

  useEffect(() => {
    onBalanceReady?.(!isLoading && !error);
  }, [error, isLoading, onBalanceReady]);

  if (!address && !tokens.length) {
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
        tokens.map(({ chain, token }, index) => {
          return (
            <PartComponent
              address={address}
              chain={chain}
              first={index === 0}
              key={token}
              setError={setError(token)}
              setLoading={setLoading(token)}
              showContent={!error && !isLoading}
              showNetwork={showNetwork}
              token={token}
            />
          );
        })
      }
    </Typography.Paragraph>
  );
};

const FreeBalanceToEarn = styled(Component)<Props>(({ theme: { token } }: Props) => {
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

export default FreeBalanceToEarn;
