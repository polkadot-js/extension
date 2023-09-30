// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import EarningBtn from './EarningBtn';

type Props = ThemeProps;

interface TokenOptionProps {
  symbol: string;
  token: string;
  disable: boolean;
  available: boolean;
  active: boolean;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const tokenOptions = useMemo((): TokenOptionProps[] => {
    return [
      {
        active: true,
        available: true,
        disable: false,
        token: 'DOT-polkadot',
        symbol: 'DOT'
      },
      {
        active: false,
        available: false,
        disable: false,
        token: 'KSM-kusama',
        symbol: 'KSM'
      },
      {
        active: false,
        available: false,
        disable: false,
        token: 'GLMR-Moonbeam',
        symbol: 'GLMR'
      },
      {
        active: false,
        available: false,
        disable: false,
        token: 'aleph-NATIVE-AZERO',
        symbol: 'AZERO'
      }
    ];
  }, []);

  return (
    <div className={CN(className)}>
      {tokenOptions.map((item) => {
        return (
          <EarningBtn
            key={item.token}
            {...item}
          />
        );
      })}
    </div>
  );
};

const EarningTokenList = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',
    flexDirection: 'row',
    gap: token.sizeXS,
    alignItems: 'center'
  };
});

export default EarningTokenList;
