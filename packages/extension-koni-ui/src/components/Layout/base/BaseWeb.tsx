// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext } from 'react';
import CN from 'classnames'
import styled from 'styled-components';
import SideMenu from '../parts/SideMenu';
import Headers, { CompoundedHeader } from '../parts/Header';
import { HomeContext } from '@subwallet/extension-koni-ui/contexts/screen/HomeContext';

export interface LayoutBaseWebProps  {
  children: React.ReactNode | React.ReactNode[];
  className?: string;
  withSideMenu?: boolean;
  headerList?: (keyof CompoundedHeader)[];
  onBack?: () => void;
  title?: string | React.ReactNode;
  withBackground?: boolean
}

const StyledLayout = styled('div')(({ theme: { extendToken }}) => {
  return {
    display: 'flex',
    flex: 'auto',
    position: 'relative',

    '.layout-sider': {
      position: 'sticky',
      top: 0,
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
    },

    '.layout-content': {
      overflow: 'auto',
      width: '100%',
      padding: '20px 36px 80px 44px',
      background: '#0C0C0C',
      maxHeight: '100vh',
      flex: 1,
      position: "relative",
      ".background": {
        backgroundImage: extendToken.tokensScreenSuccessBackgroundColor,
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 300,
        "&.-decrease": {
          backgroundImage: extendToken.tokensScreenDangerBackgroundColor
       },
    },
      '.layout-header': {

      },

      '.layout-content-main': {

      }
    }
  }
});

const BaseWeb = ({
  className,
  headerList,
  title,
  onBack,
  children,
  withBackground,
  ...props
}: LayoutBaseWebProps) => {
  const { accountBalance: { totalBalanceInfo }} = useContext(HomeContext);
  const isTotalBalanceDecrease = totalBalanceInfo.change.status === 'decrease';
  const renderHeader = useCallback((name: keyof CompoundedHeader, key: number) => {
    const CurComponent = Headers[name];

    return <CurComponent title={title} key={key} onBack={onBack}/>
  }, [title]);

  return (
    <StyledLayout className='layout-container'>
      <div className='layout-sider'>
        <SideMenu />
      </div>

      <div className='layout-content'>
        {withBackground && <div className={CN('background', {
          '-decrease': isTotalBalanceDecrease
        })} />}
          {(headerList && !!headerList.length) && (
            <div className="layout-header">
              {headerList.map((name: keyof CompoundedHeader, index: number) =>
                renderHeader(name, index)
              )}
            </div>
          )}

        <div className="layout-content-main">
          {children}
        </div>
      </div>
    </StyledLayout>
  );
};

export default BaseWeb;
