// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { GlobalToken } from '@subwallet/react-ui/es/theme/interface';

export declare type Theme = {
  id: string;
  name: string;
  token: Partial<GlobalToken>;

  // todo: add extend token later
  extendToken?: Record<string, unknown>;
};

const darkTheme: Theme = {
  id: 'dark',
  name: 'Dark',
  token: {}
};

const lightTheme: Theme = {
  ...darkTheme,
  id: 'light',
  name: 'Light'
};

export const themes: Record<string, Theme> = {
  dark: darkTheme,
  light: lightTheme
};

function generateTheme (id: string, name: string, baseTheme: 'dark' | 'light', token: Theme['token']) {
  themes[id] = {
    ...themes[baseTheme],
    id,
    name,
    token
  };
}

// Generate Subspace theme
generateTheme('subspace', 'Subspace', 'light', {});

export declare type AvailableThemes = keyof typeof themes;

export function chooseTheme (): AvailableThemes {
  const preferredTheme = localStorage.getItem('theme') as string;

  if (themes[preferredTheme]) {
    return preferredTheme;
  }

  return 'dark';
}

export function getThemeOptions (): Array<{ value: string, text: string }> {
  return Object.values(themes).map((v) => ({ text: v.name, value: v.id }));
}
