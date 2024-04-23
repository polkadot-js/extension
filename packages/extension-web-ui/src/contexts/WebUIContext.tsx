// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RootState } from '@subwallet/extension-web-ui/stores';
import { isNoAccount } from '@subwallet/extension-web-ui/utils';
import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
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
  COMMON_BACK_TO_HOME= 'common-back-to-home',
  SIMPLE= 'simple',
}

type WebUIContext = {
  background: string;
  setBackground: (background: BackgroundColorMap) => void;
  title: string | React.ReactNode;
  setTitle: (title: string | React.ReactNode) => void;
  headerType: HeaderType;
  setHeaderType: React.Dispatch<React.SetStateAction<HeaderType>>;
  showSidebar: boolean;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isSettingPage: boolean;
  isPortfolio: boolean;
  showBackButtonOnHeader?: boolean;
  setShowBackButtonOnHeader: (show?: boolean) => void;
  onBack?: VoidFunction;
  setOnBack: (func?: VoidFunction) => void;
  setWebBaseClassName: React.Dispatch<React.SetStateAction<string>>;
  webBaseClassName: string;
}

export const WebUIContext = React.createContext({} as WebUIContext);

function checkSettingPage (pathname: string) {
  return pathname.startsWith('/settings') || pathname.startsWith('/wallet-connect');
}

function checkPortfolioPage (pathname: string) {
  return pathname.startsWith('/home/tokens') || pathname.startsWith('/home/nfts') || pathname.startsWith('/home/statistics') || pathname.startsWith('/home/inscriptions');
}

function checkEarningDonePage (pathname: string) {
  return pathname.startsWith('/earning-done');
}

const simplePages = [
  '/',
  '/welcome',
  '/keyring/login',
  '/keyring/create-password',
  '/keyring/migrate-password',
  '/create-done',
  '/earning-preview',
  '/earning-preview/pools',
  '/crowdloan-unlock-campaign/check-contributions',
  '/crowdloan-unlock-campaign/contributions-result',
  '/not-found',
  '/unsafe-access'
];

export const WebUIContextProvider = ({ children }: WebUIContextProviderProps) => {
  const [background, setBackground] = useState<BackgroundColorMap>(BackgroundColorMap.INFO);
  const [headerType, setHeaderType] = useState(HeaderType.NONE);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showBackButtonOnHeader, setShowBackButtonOnHeader] = useState<boolean | undefined>(undefined);
  const [title, setTitle] = useState<string | React.ReactNode>('');
  const [onBack, _setOnBack] = useState<VoidFunction | undefined>(undefined);
  const [webBaseClassName, setWebBaseClassName] = useState<string>('');
  const pathname = useLocation().pathname;
  const { accounts } = useSelector((state: RootState) => state.accountState);
  const noAccount = useMemo(() => isNoAccount(accounts), [accounts]);
  const isSettingPage = useMemo(() => checkSettingPage(pathname), [pathname]);
  const isPortfolio = useMemo(() => checkPortfolioPage(pathname), [pathname]);

  const setOnBack = useCallback((func?: VoidFunction) => {
    if (!func) {
      _setOnBack(undefined);

      return;
    }

    _setOnBack(() => {
      return func;
    });
  }, []);

  useLayoutEffect(() => {
    const pathName = pathname;

    if (simplePages.indexOf(pathName) !== -1 || noAccount || checkEarningDonePage(pathname)) {
      setShowSidebar(false);
      setBackground(BackgroundColorMap.INFO);
      setHeaderType(HeaderType.SIMPLE);
    } else {
      setShowSidebar(true);
      !isPortfolio && setBackground(BackgroundColorMap.COMMON);

      if (isPortfolio) {
        setHeaderType(HeaderType.COMMON);
      } else if (pathName.startsWith('/home') ||
        pathName === '/settings' ||
        pathName === '/settings/list' ||
        pathName === '/dapps' ||
        pathName === '/mission-pools'
      ) {
        if (showBackButtonOnHeader) {
          setHeaderType(HeaderType.COMMON_BACK);
        } else {
          setHeaderType(HeaderType.COMMON);
        }
      } else if (pathName.startsWith('/transaction-done')) {
        setHeaderType(HeaderType.COMMON_BACK_TO_HOME);
      } else if (pathName.startsWith('/transaction')) {
        setHeaderType(HeaderType.COMMON_BACK);
      } else {
        setHeaderType(HeaderType.NONE);
      }
    }
  }, [isPortfolio, noAccount, pathname, setBackground, setHeaderType, setShowSidebar, showBackButtonOnHeader]);

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
        sidebarCollapsed,
        setSidebarCollapsed,
        isSettingPage,
        isPortfolio,
        showBackButtonOnHeader,
        setShowBackButtonOnHeader,
        onBack,
        setOnBack,
        webBaseClassName,
        setWebBaseClassName
      }}
    >
      {children}
    </WebUIContext.Provider>
  );
};
