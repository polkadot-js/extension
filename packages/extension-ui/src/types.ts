// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Theme } from './components/themes';

export { Theme };

export interface ThemeProps {
  theme: Theme;
}

export interface Contracts {
  name?: string;
  address?: string;
  memo?: string;
  type?: string;
}
