// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeNames } from '@subwallet/extension-base/background/KoniTypes';
import defaultImagePlaceholder from '@subwallet/extension-koni-ui/assets/default-image-placeholder.png';
import { IconMap } from '@subwallet/extension-koni-ui/assets/logo';
import subWalletLogo from '@subwallet/extension-koni-ui/assets/sub-wallet-logo.svg';
import SwLogosMap from '@subwallet/extension-koni-ui/assets/subwallet';
import { theme as SwReactUI } from '@subwallet/react-ui';
import { ThemeConfig as _ThemeConfig, Web3LogoMap } from '@subwallet/react-ui/es/config-provider/context';
import { AliasToken as _AliasToken, GlobalToken as _GlobalToken } from '@subwallet/react-ui/es/theme/interface';
import logoMap from '@subwallet/react-ui/es/theme/themes/logoMap';

export type ThemeConfig = _ThemeConfig;
export type AliasToken = _AliasToken;
export type GlobalToken = _GlobalToken;

export interface ExtraToken {
  bodyBackgroundColor: string,
  logo: string,
  defaultImagePlaceholder: string
  tokensScreenSuccessBackgroundColor: string,
  tokensScreenDangerBackgroundColor: string,
  tokensScreenInfoBackgroundColor: string,
}

export type Theme = {
  id: ThemeNames;
  name: string;
  token: GlobalToken;

  // todo: add extend token later
  extendToken: ExtraToken,
  logoMap: Web3LogoMap,
};

export interface SwThemeConfig extends ThemeConfig {
  id: ThemeNames,
  name: string;

  generateExtraTokens: (token: AliasToken) => ExtraToken;

  customTokens: (token: AliasToken) => AliasToken;
  logoMap: Web3LogoMap
}

function genDefaultExtraTokens (token: AliasToken): ExtraToken {
  return {
    bodyBackgroundColor: token.colorBgDefault,
    logo: subWalletLogo,
    defaultImagePlaceholder,
    tokensScreenSuccessBackgroundColor: 'linear-gradient(180deg, rgba(76, 234, 172, 0.1) 16.47%, rgba(217, 217, 217, 0) 94.17%)',
    tokensScreenDangerBackgroundColor: 'linear-gradient(180deg, rgba(234, 76, 76, 0.1) 16.47%, rgba(217, 217, 217, 0) 94.17%)',
    tokensScreenInfoBackgroundColor: 'linear-gradient(180deg, rgba(0, 75, 255, 0.1) 16.47%, rgba(217, 217, 217, 0) 94.17%)'
  };
}

// todo: will standardized logoMap later
const defaultLogoMap: Web3LogoMap = {
  ...logoMap,
  network: {
    ...IconMap,
    ...SwLogosMap
  },
  symbol: {
    ...IconMap,
    ...SwLogosMap
  },
  default: SwLogosMap.default
};

// Todo: i18n for theme name
// Implement theme from @subwallet/react-ui
export const SW_THEME_CONFIGS: Record<ThemeNames, SwThemeConfig> = {
  [ThemeNames.DARK]: {
    id: ThemeNames.DARK,
    name: 'Dark',
    algorithm: SwReactUI.darkAlgorithm,
    customTokens: (token) => (token),
    generateExtraTokens: (token) => {
      return { ...genDefaultExtraTokens(token) };
    },
    logoMap: defaultLogoMap
  },
  [ThemeNames.LIGHT]: {
    id: ThemeNames.LIGHT,
    name: 'Light',
    algorithm: SwReactUI.darkAlgorithm,
    customTokens: (token) => (token),
    generateExtraTokens: (token) => {
      return { ...genDefaultExtraTokens(token) };
    },
    logoMap: defaultLogoMap
  },
  [ThemeNames.SUBSPACE]: {} as SwThemeConfig
};

// Todo: Replace tokens with Subspace color schema
SW_THEME_CONFIGS[ThemeNames.SUBSPACE] = { ...SW_THEME_CONFIGS[ThemeNames.LIGHT] };

export function generateTheme ({ customTokens,
  generateExtraTokens,
  id,
  logoMap,
  name }: SwThemeConfig, token: GlobalToken): Theme {
  return {
    id,
    name,
    token: customTokens(token),
    extendToken: generateExtraTokens(token),
    logoMap
  } as Theme;
}
