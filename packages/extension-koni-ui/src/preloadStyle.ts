// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

export default function applyPreloadStyle (bodyBackground?: string): void {
  const backgroundColor = bodyBackground || localStorage.getItem('theme-background-color') || '#1A1A1A';

  document.body.style.backgroundColor = backgroundColor;

  localStorage.setItem('theme-background-color', backgroundColor);
}
