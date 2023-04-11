// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { LoadingScreen } from "./components"
import { DataContextProvider } from "./contexts/DataContext"
import { InternalRequestContextProvider } from "./contexts/InternalRequestContext"
import { QRContextProvider } from "./contexts/QrSignerContext"
import { ScannerContextProvider } from "./contexts/ScannerContext"
import { SigningContextProvider } from "./contexts/SigningContext"
import { ThemeProvider } from "./contexts/ThemeContext"
import { ScreenContextProvider } from "./contexts/ScreenContext"
import { ModalContextProvider } from "@subwallet/react-ui"
import NotificationProvider from "@subwallet/react-ui/es/notification/NotificationProvider"
import React from "react"
import { RouterProvider } from "react-router-dom"
import "./main.css"

import { router } from "./router"
// import migrateStorageKeys from "./fallback"
import startWebRunner from "./webRunner-module"

// migrateStorageKeys()
startWebRunner()

export default function App(): React.ReactElement {
  return (
    <DataContextProvider>
      <ThemeProvider>
        <ScreenContextProvider>
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
        </ScreenContextProvider>
      </ThemeProvider>
    </DataContextProvider>
  )
}
