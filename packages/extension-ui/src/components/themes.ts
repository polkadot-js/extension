// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

export declare type Theme = 'light' | 'dark';

export const themes = ['light', 'dark'] as const;

export function chooseTheme (): Theme {
  const preferredTheme = localStorage.getItem('theme');

  if (preferredTheme) {
    return preferredTheme === 'dark'
      ? 'dark'
      : 'light';
  }

  return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}
