// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback } from 'react';

import styled from 'styled-components';
import SideMenu from '../parts/SideMenu';
import Headers, { CompoundedHeader } from '../parts/Header';

export interface LayoutBaseWebProps  {
  children: React.ReactNode | React.ReactNode[];
  className?: string;
  withSideMenu?: boolean;
  headerList?: (keyof CompoundedHeader)[];
  onBack?: () => void;
  title?: string | React.ReactNode;

}

const StyledLayout = styled('div')(({ }) => {
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
  ...props
}: LayoutBaseWebProps) => {
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
        <div className="layout-header">
          {(headerList && !!headerList.length) && (
              headerList.map((name: keyof CompoundedHeader, index: number) =>
                renderHeader(name, index)
              )
          )}
        </div>

        <div className="layout-content-main">
          {children}
        </div>
      </div>
    </StyledLayout>
  );
};

export default BaseWeb;

