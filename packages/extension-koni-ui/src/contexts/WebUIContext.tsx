// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface WebUIContextProviderProps {
  children: React.ReactNode | React.ReactNode[]
}

export enum BackgroundColorMap {
  COMMON = 'common',
  INFO = 'info',
  INCREASE = 'increase',
  DECREASE = 'decrease',
}

export enum HeaderType {
  NONE= 'none',
  COMMON= 'common',
  COMMON_BACK= 'common-back',
  SIMPLE= 'simple',
}

type WebUIContext = {
  background: string
  setBackground: (background: BackgroundColorMap) => void
  title: string | React.ReactNode
  setTitle: (title: string | React.ReactNode) => void
  headerType: HeaderType
  setHeaderType: (showHeader: HeaderType) => void
  showSidebar: boolean
  setShowSidebar: (showSidebar: boolean) => void
  isSettingPage: boolean,
  isPortfolio: boolean
  showBackButtonOnHeader?: boolean
  setShowBackButtonOnHeader: (show?: boolean) => void
}

export const WebUIContext = React.createContext({} as WebUIContext);

function checkSettingPage (pathname: string) {
  return pathname.startsWith('/settings') || pathname.startsWith('/wallet-connect');
}

function checkPortfolioPage (pathname: string) {
  return pathname.startsWith('/home/tokens') || pathname.startsWith('/home/nfts');
}

export const WebUIContextProvider = ({ children }: WebUIContextProviderProps) => {
  const [background, setBackground] = useState<BackgroundColorMap>(BackgroundColorMap.INFO);
  const [headerType, setHeaderType] = useState(HeaderType.NONE);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showBackButtonOnHeader, setShowBackButtonOnHeader] = useState<boolean | undefined>(undefined);
  const [title, setTitle] = useState<string | React.ReactNode>('');
  const pathname = useLocation().pathname;
  const [isSettingPage, setIsSettingPage] = useState(checkSettingPage(pathname));
  const [isPortfolio, setIsPortfolio] = useState(checkPortfolioPage(pathname));

  useEffect(() => {
    setIsSettingPage(checkSettingPage(pathname));
    setIsPortfolio(checkPortfolioPage(pathname));
  }, [pathname]);

  return (
    <WebUIContext.Provider
      value={{
        background,
        setBackground,
        title,
        setTitle,
        headerType,
        setHeaderType,
        showSidebar,
        setShowSidebar,
        isSettingPage,
        isPortfolio,
        showBackButtonOnHeader,
        setShowBackButtonOnHeader
      }}
    >
      {children}
    </WebUIContext.Provider>
  );
};
