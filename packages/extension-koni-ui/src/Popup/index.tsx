// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DataContextProvider } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { InternalRequestContextProvider } from '@subwallet/extension-koni-ui/contexts/InternalRequestContext';
import { QRContextProvider } from '@subwallet/extension-koni-ui/contexts/QrSignerContext';
import { ScannerContextProvider } from '@subwallet/extension-koni-ui/contexts/ScannerContext';
import { SigningContextProvider } from '@subwallet/extension-koni-ui/contexts/SigningContext';
import { ThemeProvider } from '@subwallet/extension-koni-ui/contexts/ThemeContext';
import { ModalContextProvider } from '@subwallet/react-ui';
import NotificationProvider from '@subwallet/react-ui/es/notification/NotificationProvider';
import React from 'react';
import { RouterProvider } from 'react-router';

import LoadingScreen from '../components/LoadingScreen';
import { router } from './router';
import { ScreenContextProvider } from '../contexts/ScreenContext';
import './main.css'

export default function Popup (): React.ReactElement {
  return (
    <DataContextProvider>
      <ScreenContextProvider>
        <ThemeProvider>
          <ModalContextProvider>
            <SigningContextProvider>
              <InternalRequestContextProvider>
                <ScannerContextProvider>
                  <QRContextProvider>
                    <NotificationProvider>
                      <RouterProvider
                        fallbackElement={<LoadingScreen className='root-loading' />}
                        router={router}
                      />
                    </NotificationProvider>
                  </QRContextProvider>
                </ScannerContextProvider>
              </InternalRequestContextProvider>
            </SigningContextProvider>
          </ModalContextProvider>
        </ThemeProvider>
      </ScreenContextProvider>
    </DataContextProvider>
  );
}
