// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import './i18n/i18n';

import applyPreloadStyle from '@subwallet/extension-web-ui/preloadStyle';
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';

export default function Root (Entry: React.ComponentType, rootId = 'root'): void {
  applyPreloadStyle();
  const rootElement = document.getElementById(rootId);

  if (!rootElement) {
    throw new Error(`Unable to find element with id '${rootId}'`);
  }

  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <Suspense>
      <Entry />
    </Suspense>
  );
}
