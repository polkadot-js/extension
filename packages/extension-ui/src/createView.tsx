// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import './i18n/i18n.js';

import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';

import { View } from './components/index.js';

export default function createView (Entry: React.ComponentType, rootId = 'root'): void {
  const targetInnerWidth = 560;
  const targetInnerHeight = 600;

  // Popup window size is initially set via chrome.windows.create, however
  // it will result in different inner dimensions on Windows and Mac OS.
  // This is a hacky way to have a consistent popup size
  if (
    window.innerWidth !== targetInnerWidth ||
    window.innerHeight !== targetInnerHeight
  ) {
    const newOuterWidth =
      targetInnerWidth + (window.outerWidth - window.innerWidth);
    const newOuterHeight =
      targetInnerHeight + (window.outerHeight - window.innerHeight);

    window.resizeTo(newOuterWidth, newOuterHeight);
  }

  const rootElement = document.getElementById(rootId);

  if (!rootElement) {
    throw new Error(`Unable to find element with id '${rootId}'`);
  }

  createRoot(rootElement).render(
    <Suspense fallback='...'>
      <View>
        <HashRouter>
          <Entry />
        </HashRouter>
      </View>
    </Suspense>
  );
}
