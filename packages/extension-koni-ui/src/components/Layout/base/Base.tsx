// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { SwScreenLayoutProps } from '@subwallet/react-ui';

import Footer from '@subwallet/extension-koni-ui/components/Layout/parts/Footer';
import SelectAccount from '@subwallet/extension-koni-ui/components/Layout/parts/SelectAccount';
import { SwScreenLayout } from '@subwallet/react-ui';
import { SwTabBarItem } from '@subwallet/react-ui/es/sw-tab-bar';
import { Aperture, Database, Globe, Rocket, Wallet } from 'phosphor-react';
import React, { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export interface LayoutBaseProps extends Omit<
SwScreenLayoutProps,
'tabBarItems' | 'footer' | 'headerContent' | 'selectedTabBarItem'
> {
  children: React.ReactNode | React.ReactNode[];
  showFooter?: boolean;
}

const TabBarItems: Array<Omit<SwTabBarItem, 'onClick'> & { url: string }> = [
  {
    icon: {
      type: 'phosphor',
      phosphorIcon: Wallet,
      weight: 'fill'
    },
    label: 'Tokens',
    key: 'tokens',
    url: '/home/tokens'
  },
  {
    icon: {
      type: 'phosphor',
      phosphorIcon: Aperture,
      weight: 'fill'
    },
    label: 'NFTs',
    key: 'nfts',
    url: '/home/nfts/collections'
  },
  {
    icon: {
      type: 'phosphor',
      phosphorIcon: Rocket,
      weight: 'fill'
    },
    label: 'Crowdloans',
    key: 'crowdloans',
    url: '/home/crowdloans'
  },
  {
    icon: {
      type: 'phosphor',
      phosphorIcon: Database,
      weight: 'fill'
    },
    label: 'Staking',
    key: 'staking',
    url: '/home/staking'
  },
  {
    icon: {
      type: 'phosphor',
      phosphorIcon: Globe,
      weight: 'fill'
    },
    label: 'History',
    key: 'history',
    url: '/home/history'
  }
];

const Base = ({ children, headerIcons, onBack, showFooter, ...props }: LayoutBaseProps) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const selectedTab = useMemo((): string => {
    const isHomePath = pathname.includes('/home');

    if (isHomePath) {
      const pathExcludeHome = pathname.split('/home')[1];
      const currentTab = pathExcludeHome.split('/')[1];

      return currentTab || '';
    }

    return '';
  }, [pathname]);

  const onSelectTab = useCallback(
    (url: string) => () => {
      navigate(url);
    },
    [navigate]
  );

  const defaultOnBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <SwScreenLayout
      {...props}
      footer={showFooter && <Footer />}
      headerContent={<SelectAccount />}
      headerIcons={headerIcons}
      onBack={onBack || defaultOnBack}
      selectedTabBarItem={selectedTab}
      tabBarItems={TabBarItems.map((item) => ({
        ...item,
        onClick: onSelectTab(item.url)
      }))}
    >
      {children}
    </SwScreenLayout>
  );
};

export default Base;
