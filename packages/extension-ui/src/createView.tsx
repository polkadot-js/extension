// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { View, defaultTheme, Fonts } from './components';

export default function createView (Entry: React.ComponentType, rootId = 'root'): void {
  const rootElement = document.getElementById(rootId);

  if (!rootElement) {
    throw new Error(`Unable to find element with id '${rootId}'`);
  }

  ReactDOM.render(
    <Suspense fallback='...'>
      <Fonts />
      <ThemeProvider theme={defaultTheme}>
        <View>
          <HashRouter>
            <Entry />
          </HashRouter>
        </View>
      </ThemeProvider>
    </Suspense>,
    rootElement
  );
}
