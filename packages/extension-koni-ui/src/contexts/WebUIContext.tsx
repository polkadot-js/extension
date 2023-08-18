// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RootState } from '@subwallet/extension-koni-ui/stores';
import { isNoAccount } from '@subwallet/extension-koni-ui/utils';
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
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
  showSidebar: boolean
  sidebarCollapsed: boolean
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>
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

const simplePages = ['/', '/welcome', '/keyring/login', '/keyring/create-password', '/keyring/migrate-password', '/create-done'];

export const WebUIContextProvider = ({ children }: WebUIContextProviderProps) => {
  const [background, setBackground] = useState<BackgroundColorMap>(BackgroundColorMap.INFO);
  const [headerType, setHeaderType] = useState(HeaderType.NONE);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showBackButtonOnHeader, setShowBackButtonOnHeader] = useState<boolean | undefined>(undefined);
  const [title, setTitle] = useState<string | React.ReactNode>('');
  const pathname = useLocation().pathname;
  const [isSettingPage, setIsSettingPage] = useState(checkSettingPage(pathname));
  const [isPortfolio, setIsPortfolio] = useState(checkPortfolioPage(pathname));
  const { accounts } = useSelector((state: RootState) => state.accountState);
  const noAccount = useMemo(() => isNoAccount(accounts), [accounts]);

  useEffect(() => {
    const pathName = pathname;

    if (simplePages.indexOf(pathName) !== -1 || noAccount) {
      setShowSidebar(false);
      setBackground(BackgroundColorMap.INFO);
      setHeaderType(HeaderType.SIMPLE);
    } else {
      setShowSidebar(true);
      !isPortfolio && setBackground(BackgroundColorMap.COMMON);

      if (pathName.startsWith('/home') || pathName === '/settings' || pathName === '/settings/list') {
        setHeaderType(HeaderType.COMMON);
      } else if (pathName.startsWith('/transaction')) {
        setHeaderType(HeaderType.COMMON_BACK);
      } else {
        setHeaderType(HeaderType.NONE);
      }
    }
  }, [isPortfolio, noAccount, pathname, setBackground, setHeaderType, setShowSidebar]);

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
        showSidebar,
        sidebarCollapsed,
        setSidebarCollapsed,
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
