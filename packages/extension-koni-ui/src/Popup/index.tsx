// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import ToastProvider from '@subwallet/extension-koni-ui/components/Toast/ToastProvider';
import { DataContextProvider } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { InternalRequestContextProvider } from '@subwallet/extension-koni-ui/contexts/InternalRequestContext';
import { QRContextProvider } from '@subwallet/extension-koni-ui/contexts/QrSignerContext';
import { ScannerContextProvider } from '@subwallet/extension-koni-ui/contexts/ScannerContext';
import { SigningContextProvider } from '@subwallet/extension-koni-ui/contexts/SigningContext';
import { ThemeProvider } from '@subwallet/extension-koni-ui/contexts/ThemeContext';
import { ModalContextProvider } from '@subwallet/react-ui/es/sw-modal/provider';
import React from 'react';
import { RouterProvider } from 'react-router';

import LoadingContainer from '../components/LoadingContainer';
import { router } from './router';

export default function Popup (): React.ReactElement {
  return (
    <DataContextProvider>
      <ThemeProvider>
        <SigningContextProvider>
          <InternalRequestContextProvider>
            <ScannerContextProvider>
              <QRContextProvider>
                <ToastProvider>
                  <ModalContextProvider>
                    <RouterProvider
                      fallbackElement={<LoadingContainer />}
                      router={router}
                    />
                  </ModalContextProvider>
                </ToastProvider>
              </QRContextProvider>
            </ScannerContextProvider>
          </InternalRequestContextProvider>
        </SigningContextProvider>
      </ThemeProvider>
    </DataContextProvider>
  );
}
