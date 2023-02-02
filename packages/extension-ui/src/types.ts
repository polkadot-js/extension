// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Theme } from './components/themes';

export type { Theme };

export interface ThemeProps {
  theme: Theme;
}

export type SnackbarTypes = 'info' | 'success' | 'warning' | 'critical';
