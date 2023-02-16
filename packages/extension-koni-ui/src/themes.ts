// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeNames } from '@subwallet/extension-base/background/KoniTypes';
import { theme as SwReactUI } from '@subwallet/react-ui';
import { ThemeConfig as _ThemeConfig } from '@subwallet/react-ui/es/config-provider/context';
import { AliasToken as _AliasToken, GlobalToken as _GlobalToken } from '@subwallet/react-ui/es/theme/interface';

export type ThemeConfig = _ThemeConfig;
export type AliasToken = _AliasToken;
export type GlobalToken = _GlobalToken;

export interface ExtraToken {
  bodyBackgroundColor: string,
}

export declare type Theme = {
  id: ThemeNames;
  name: string;
  token: GlobalToken;

  // todo: add extend token later
  extendToken: ExtraToken
};

export interface SwThemeConfig extends ThemeConfig {
  id: ThemeNames,
  name: string;

  generateExtraTokens: (token: AliasToken) => ExtraToken;

  customTokens: (token: AliasToken) => AliasToken;
}

// Todo: i18n for theme name
// Implement theme from @subwallet/react-ui
export const SW_THEME_CONFIGS: Record<ThemeNames, SwThemeConfig> = {
  [ThemeNames.DARK]: {
    id: ThemeNames.DARK,
    name: 'Dark',
    algorithm: SwReactUI.darkAlgorithm,
    customTokens: (token) => (token),
    generateExtraTokens: (token) => {
      return { bodyBackgroundColor: token.colorBgSecondary };
    }
  },
  [ThemeNames.LIGHT]: {
    id: ThemeNames.LIGHT,
    name: 'Light',
    algorithm: SwReactUI.defaultAlgorithm,
    customTokens: (token) => (token),
    generateExtraTokens: (token) => {
      return { bodyBackgroundColor: token.colorBgSecondary };
    }
  },
  [ThemeNames.SUBSPACE]: {} as SwThemeConfig
};

// Todo: Replace tokens with Subspace color schema
SW_THEME_CONFIGS[ThemeNames.SUBSPACE] = { ...SW_THEME_CONFIGS[ThemeNames.LIGHT] };

export function generateTheme ({ customTokens, generateExtraTokens, id, name }: SwThemeConfig, token: GlobalToken): Theme {
  return {
    id,
    name,
    token: customTokens(token),
    extendToken: generateExtraTokens(token)
  } as Theme;
}
