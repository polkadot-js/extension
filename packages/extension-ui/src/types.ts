// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Contact } from '@polkadot/extension-base/background/types';

import { Theme } from './components/themes';

export { Theme };

export interface ThemeProps {
  theme: Theme;
}

export interface ContactProps extends ThemeProps {
  contact: Contact;
  canEdit?: boolean;
}
