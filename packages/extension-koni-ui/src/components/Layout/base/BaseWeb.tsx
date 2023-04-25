// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout, SwScreenLayoutProps } from '@subwallet/react-ui';

import React, { useCallback, useEffect, useState } from 'react';
import { HomeContext } from '@subwallet/extension-koni-ui/contexts/screen/HomeContext';

import styled from 'styled-components';
import SideMenu from '../parts/SideMenu';
import Headers, { CompoundedHeader } from '../parts/Header';
import { useTokenGroup, useAccountBalance, useGetChainSlugsByAccountType } from '@subwallet/extension-koni-ui/hooks';

export interface LayoutBaseProps extends Omit<
SwScreenLayoutProps,
'tabBarItems' | 'footer' | 'headerContent' | 'selectedTabBarItem'
> {
  children: React.ReactNode | React.ReactNode[];
  showFooter?: boolean;
  className?: string;
  //
  withSideMenu?: boolean;
  headerList?: (keyof CompoundedHeader)[]
}

const BaseWeb = ({
  children,
  withSideMenu,
  headerIcons,
  onBack,
  showFooter,
  className,
  headerList,
  title,
  ...props
}: LayoutBaseProps) => {
  const chainsByAccountType = useGetChainSlugsByAccountType();
  const tokenGroupStructure = useTokenGroup(chainsByAccountType);
  const accountBalance = useAccountBalance(tokenGroupStructure.tokenGroupMap);

  const LayoutContainer = styled(Layout)`
    padding: 20px 36px 80px 44px;
    background: #0C0C0C;
    height: 100%;
    overflow: auto;
  `

  const renderHeader = useCallback((name: keyof CompoundedHeader, key: number) => {
    const CurComponent = Headers[name];

    return <CurComponent title={title} key={key} onBack={onBack}/>
  }, [title]);

  return (
    <Layout style={{
      height: '100%'
    }}>
      <HomeContext.Provider value={{
          tokenGroupStructure,
          accountBalance
        }}
      >
        <Layout.Sider width={250}>
          <SideMenu />
        </Layout.Sider>

        <LayoutContainer>
          {(headerList && headerList.length) && (
              headerList.map((name: keyof CompoundedHeader, index: number) =>
                renderHeader(name, index)
              )
          )}
          <Layout.Content>
            {children}
          </Layout.Content>
        </LayoutContainer>
      </HomeContext.Provider>
    </Layout>
  );
};

export default BaseWeb;
