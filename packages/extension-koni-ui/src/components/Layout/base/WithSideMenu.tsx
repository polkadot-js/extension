// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

import { LayoutBaseProps } from './Base';
import SideMenu from '../parts/SideMenu';
import BalanceHeader from '../parts/Header/Balance';
import styled from 'styled-components';
import Controller from '../parts/Header/Controller';

export type SideMenuProps = Omit<
LayoutBaseProps,
'headerBackground' | 'headerIcons' | 'headerLeft' | 'headerCenter' | 'headerOnClickLeft' | 'headerPaddingVertical' | 'showHeader'
> & {
  withBalanceHeader?: boolean
  withWebHeader?: boolean
};

const WithSideMenu = (props: SideMenuProps) => {
  const {
    children,
    withBalanceHeader = false,
    withWebHeader = false,
  } = props;

  const StyledLayout = styled('div')(({}) => {
    return {
        // height: '100vh',
        // width: '100vw',
        display: 'flex',
        flex: 'auto',
        position: 'relative',

        '.layout-sider': {
          position: 'sticky',
          top: 0,
          maxHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          width: 250,
          background: '#1A1A1A',
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
  })

  return (
    <StyledLayout className='layout-container'>
      <div className='layout-sider'>
        <SideMenu />
      </div>

      <div className='layout-content'>
        <div className="layout-header">
          {(withWebHeader || withBalanceHeader) && (
            <div>
              {withWebHeader && <Controller />}
              {withBalanceHeader && <BalanceHeader />}
            </div>
          )}
        </div>

        <div className="layout-content-main">
          {children}
        </div>
      </div>
    </StyledLayout>
  );
};

export { WithSideMenu };
