// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AppOnlineContentContextProvider } from '@subwallet/extension-koni-ui/contexts/AppOnlineContentProvider';
import { AppPopupModalContextProvider } from '@subwallet/extension-koni-ui/contexts/AppPopupModalContext';
import { DataContextProvider } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { InjectContextProvider } from '@subwallet/extension-koni-ui/contexts/InjectContext';
import { ScannerContextProvider } from '@subwallet/extension-koni-ui/contexts/ScannerContext';
import { ThemeProvider } from '@subwallet/extension-koni-ui/contexts/ThemeContext';
import { ModalContextProvider } from '@subwallet/react-ui';
import NotificationProvider from '@subwallet/react-ui/es/notification/NotificationProvider';
import React from 'react';
import { RouterProvider } from 'react-router';

import LoadingScreen from '../components/LoadingScreen';
import { router } from './router';

export default function Popup (): React.ReactElement {
  return (
    <DataContextProvider>
      <ThemeProvider>
        <ModalContextProvider>
          <ScannerContextProvider>
            <NotificationProvider>
              <AppPopupModalContextProvider>
                <AppOnlineContentContextProvider>
                  <InjectContextProvider>
                    <RouterProvider
                      fallbackElement={<LoadingScreen className='root-loading' />}
                      router={router}
                    />
                  </InjectContextProvider>
                </AppOnlineContentContextProvider>
              </AppPopupModalContextProvider>
            </NotificationProvider>
          </ScannerContextProvider>
        </ModalContextProvider>
      </ThemeProvider>
    </DataContextProvider>
  );
}
