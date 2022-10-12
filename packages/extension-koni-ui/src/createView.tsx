// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import './i18n/i18n';

import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { HashRouter } from 'react-router-dom';

import { View } from './components';

export default function createView (Entry: React.ComponentType, rootId = 'root'): void {
  const rootElement = document.getElementById(rootId);

  if (!rootElement) {
    throw new Error(`Unable to find element with id '${rootId}'`);
  }

  ReactDOM.render(
    <Suspense fallback='...'>
      <View>
        <HashRouter>
          <Entry />
        </HashRouter>
      </View>
    </Suspense>,
    rootElement
  );
}
