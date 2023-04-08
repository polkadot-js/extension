// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DataContextProvider } from "@subwallet-webapp/contexts/DataContext";
import { InternalRequestContextProvider } from "@subwallet-webapp/contexts/InternalRequestContext";
import { QRContextProvider } from "@subwallet-webapp/contexts/QrSignerContext";
import { ScannerContextProvider } from "@subwallet-webapp/contexts/ScannerContext";
import { SigningContextProvider } from "@subwallet-webapp/contexts/SigningContext";
import { ThemeProvider } from "@subwallet-webapp/contexts/ThemeContext";
import { ModalContextProvider } from "@subwallet/react-ui";
import NotificationProvider from "@subwallet/react-ui/es/notification/NotificationProvider";
import React from "react";
import { RouterProvider } from "react-router";

import LoadingScreen from "../components/LoadingScreen";
import { router } from "./router";

export default function Popup(): React.ReactElement {
  return (
    <DataContextProvider>
      <ThemeProvider>
        <ModalContextProvider>
          <SigningContextProvider>
            <InternalRequestContextProvider>
              <ScannerContextProvider>
                <QRContextProvider>
                  <NotificationProvider>
                    <RouterProvider
                      fallbackElement={
                        <LoadingScreen className="root-loading" />
                      }
                      router={router}
                    />
                  </NotificationProvider>
                </QRContextProvider>
              </ScannerContextProvider>
            </InternalRequestContextProvider>
          </SigningContextProvider>
        </ModalContextProvider>
      </ThemeProvider>
    </DataContextProvider>
  );
}
