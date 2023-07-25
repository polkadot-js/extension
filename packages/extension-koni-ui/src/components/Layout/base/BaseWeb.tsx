// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { HomeContext } from '@subwallet/extension-koni-ui/contexts/screen/HomeContext';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

import Headers, { CompoundedHeader } from '../parts/Header';
import SideMenu from '../parts/SideMenu';

export interface LayoutBaseWebProps {
  children: React.ReactNode | React.ReactNode[];
  className?: string;
  withSideMenu?: boolean;
  headerList?: (keyof CompoundedHeader)[];
  onBack?: () => void;
  title?: string | React.ReactNode;
  withBackground?: boolean
}

const StyledLayout = styled('div')<ThemeProps>(({ theme: { extendToken } }: ThemeProps) => {
  return {
    display: 'flex',
    flex: 'auto',
    position: 'relative',

    '.layout-container': {
      display: 'flex',
      flexDirection: 'column'
    },

    '.layout-sider': {
      position: 'sticky',
      top: 0,
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
    },

    '.layout-content': {
      display: 'flex',
      flexDirection: 'column',
      overflow: 'auto',
      width: '100%',
      padding: '24px 36px 80px 44px',
      background: '#0C0C0C',
      maxHeight: '100vh',
      flex: 1,
      position: 'relative',
      '.background': {
        backgroundImage: extendToken.tokensScreenSuccessBackgroundColor,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
        zIndex: -1,

        '&.-decrease': {
          backgroundImage: extendToken.tokensScreenDangerBackgroundColor
        }
      },
      '.layout-header': {
      },

      '.layout-content-main': {
        flex: 1
      }
    }
  };
});

const BaseWeb = ({ children,
  headerList,
  onBack,
  title,
  withBackground }: LayoutBaseWebProps) => {
  const { accountBalance: { totalBalanceInfo } } = useContext(HomeContext);
  const isTotalBalanceDecrease = totalBalanceInfo.change.status === 'decrease';
  const renderHeader = useCallback((name: keyof CompoundedHeader, key: number) => {
    const CurComponent = Headers[name];

    return (
      <CurComponent
        key={key}
        onBack={onBack}
        title={title}
      />
    );
  }, [onBack, title]);

  return (
    <StyledLayout className='layout-container'>
      <div className='layout-sider'>
        <SideMenu />
      </div>

      <div className='layout-content'>
        {withBackground && (
          <div className={CN('background', {
            '-decrease': isTotalBalanceDecrease
          })}
          />
        )}

        {(headerList && !!headerList.length) && (
          <div className='layout-header'>
            {headerList.map((name: keyof CompoundedHeader, index: number) =>
              renderHeader(name, index)
            )}
          </div>
        )}

        <div className='layout-content-main'>
          {children}
        </div>
      </div>
    </StyledLayout>
  );
};

export default BaseWeb;
