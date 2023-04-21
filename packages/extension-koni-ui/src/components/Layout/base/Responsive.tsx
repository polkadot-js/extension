// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useContext } from 'react';

import { LayoutBaseProps } from './Base';
import { SideMenuProps } from './WithSideMenu';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import Layout from '../Layout';

type Props = (LayoutBaseProps | SideMenuProps) & {
  MobileLayout: (props: LayoutBaseProps | SideMenuProps ) => JSX.Element;
};

const ResponsiveMenu = ({ children, MobileLayout, ...rest }: Props) => {
  const { isWebUI } = useContext(ScreenContext);

  if (isWebUI) {
    return (
      <Layout.WithSideMenu
        {...rest}
      >
        {children}
      </Layout.WithSideMenu>
    )
  }

  return (
    <MobileLayout
      {...rest}
    >
      {children}
    </MobileLayout>
  )
};

export { ResponsiveMenu };
