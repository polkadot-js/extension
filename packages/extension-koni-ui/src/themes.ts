// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeTypes } from '@subwallet/extension-base/background/KoniTypes';
import subWalletLogo from '@subwallet/extension-koni-ui/assets/sub-wallet-logo.svg';
import { GlobalToken } from '@subwallet/react-ui/es/theme/interface';

export declare type Theme = {
  id: string;
  name: string;
  token: Partial<GlobalToken>;

  // todo: add extend token later
  extendToken: {
    bodyBackgroundColor: string,
    logo: string
  };
};

export function chooseTheme (theme: ThemeTypes, token: GlobalToken): Theme {
  const defaultTheme: Theme = {
    id: 'dark',
    name: 'Dark',
    token: { ...token },
    extendToken: {
      bodyBackgroundColor: token.colorBgSecondary,
      logo: subWalletLogo
    }
  };

  if (theme.valueOf() === ThemeTypes.LIGHT) {
    return {
      ...defaultTheme,
      id: 'light',
      name: 'Light',
      extendToken: {
        bodyBackgroundColor: '#fff',
        logo: subWalletLogo
      }
    };
  }

  if (theme.valueOf() === ThemeTypes.SUBSPACE) {
    return {
      ...defaultTheme,
      id: 'subspace',
      name: 'Subspace'
    };
  }

  return defaultTheme;
}
