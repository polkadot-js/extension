// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface WebUIContextProviderProps {
  children: React.ReactNode | React.ReactNode[]
}

export enum BackgroundColorMap {
  NO_SIDEBAR = 'linear-gradient(rgba(0, 75, 255, 0.1) 5%, rgba(217, 217, 217, 0) 33%)',
  COMMON = '#0C0C0C',
  INCREASE = 'linear-gradient(180deg, rgba(76, 234, 172, 0.10) 5%, rgba(217, 217, 217, 0.00) 33%)',
  DECREASE = 'linear-gradient(180deg, rgba(234, 76, 76, 0.10) 5%, rgba(217, 217, 217, 0.00) 33%)'
}

export enum HeaderType {
  NONE= 'none',
  COMMON= 'common',
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
}

export const WebUIContext = React.createContext({} as WebUIContext);

function checkSettingPage (pathname: string) {
  return pathname.startsWith('/settings') || pathname.startsWith('/wallet-connect');
}

function checkPortfolioPage (pathname: string) {
  return pathname.startsWith('/home/tokens') || pathname.startsWith('/home/nfts');
}

export const WebUIContextProvider = ({ children }: WebUIContextProviderProps) => {
  const [background, setBackground] = useState<BackgroundColorMap>(BackgroundColorMap.NO_SIDEBAR);
  const [headerType, setHeaderType] = useState(HeaderType.NONE);
  const [showSidebar, setShowSidebar] = useState(true);
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
        isPortfolio
      }}
    >
      {children}
    </WebUIContext.Provider>
  );
};
