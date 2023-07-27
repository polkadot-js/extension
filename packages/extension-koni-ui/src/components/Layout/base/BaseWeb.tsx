// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Headers from '@subwallet/extension-koni-ui/components/Layout/parts/Header';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { WebUIContext } from '@subwallet/extension-koni-ui/contexts/WebUIContext';
import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useContext, useMemo } from 'react';
import styled from 'styled-components';

import SideMenu from '../parts/SideMenu';

export interface LayoutBaseWebProps {
  children: React.ReactNode | React.ReactNode[];
  className?: string;
}

const StyledLayout = styled('div')<ThemeProps>(({ theme: { token } }: ThemeProps) => {
  return {
    display: 'flex',
    flex: 'auto',
    position: 'relative',

    '.web-layout-background': {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: -1,
      transitionDuration: 'background-color 0.3s ease'
    },

    '.web-layout-container': {
      display: 'flex',
      flexDirection: 'column'
    },

    '.web-layout-sidebar': {
      position: 'relative',
      height: '100vh',
      top: 0,
      display: 'flex',
      flexDirection: 'column'
    },

    '.web-layout-body': {
      position: 'relative',
      height: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'auto',
      flex: 1
    },

    '.web-layout-header': {
      flex: 0,
      padding: '24px 36px 24px 44px'
    },

    '.web-layout-content': {
      flex: 1,
      height: '100%',
      overflow: 'auto',

      '&.__with-padding': {
        padding: '0px 44px'
      }
    },

    '.setting-pages .ant-sw-screen-layout-body, .setting-pages .ant-sw-screen-layout-footer': {
      margin: '0 auto',
      width: 600,
      maxWidth: '100%'
    },

    '.ant-sw-screen-layout-container': {
      backgroundColor: 'transparent'
    },

    '.ant-sw-screen-layout-body': {
      display: 'flex',
      flexDirection: 'column'
    }
  };
});

const BaseWeb = ({ children }: LayoutBaseWebProps) => {
  const { t } = useTranslation();
  const { isWebUI } = useContext(ScreenContext);
  const { background, isPortfolio, isSettingPage, showHeader, showSidebar, title } = useContext(WebUIContext);
  const headerTitle = useMemo(() => {
    if (isPortfolio) {
      return t('Portfolio');
    }

    if (isSettingPage) {
      return t('Settings');
    }

    return title;
  }, [isPortfolio, isSettingPage, t, title]);

  if (!isWebUI) {
    return <>{children}</>;
  }

  return (
    <StyledLayout className='web-layout-container'>
      <div
        className='web-layout-background'
        style={{ background }}
      />
      {showSidebar && <div className='web-layout-sidebar'>
        <SideMenu />
      </div>}

      <div className={CN('web-layout-body', { 'setting-pages': isSettingPage })}>
        {showHeader && <div className={'web-layout-header'}>
          <Headers.Controller title={headerTitle} />
        </div>}
        <div className={CN('web-layout-content', { '__with-padding': showSidebar })}>
          {children}
        </div>
      </div>
    </StyledLayout>
  );
};

export default BaseWeb;
