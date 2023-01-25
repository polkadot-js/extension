// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DataContextProvider } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { store } from '@subwallet/extension-koni-ui/stores';
import React from 'react';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router';

import LoadingContainer from '../components/LoadingContainer';
import { router } from './router';

export default function Popup (): React.ReactElement {
  return (
    <Provider store={store}>
      <DataContextProvider>
        <RouterProvider
          fallbackElement={<LoadingContainer />}
          router={router}
        />
      </DataContextProvider>
    </Provider>
  );
}
