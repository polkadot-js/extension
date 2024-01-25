// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { THEME_BACKGROUND_COLOR } from '@subwallet/extension-web-ui/constants/localStorage';

export default function applyPreloadStyle (bodyBackground?: string): void {
  const backgroundColor = bodyBackground || localStorage.getItem(THEME_BACKGROUND_COLOR) || '#1A1A1A';

  document.body.style.backgroundColor = backgroundColor;

  localStorage.setItem(THEME_BACKGROUND_COLOR, backgroundColor);
}
