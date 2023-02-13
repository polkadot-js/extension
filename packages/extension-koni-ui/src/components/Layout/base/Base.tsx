// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { SwScreenLayoutProps } from '@subwallet/react-ui';

import Footer from '@subwallet/extension-koni-ui/components/Layout/parts/Footer';
import { SelectedAccount } from '@subwallet/extension-koni-ui/components/Layout/parts/SelectedAccount';
import { SwScreenLayout } from '@subwallet/react-ui';
import Icon from '@subwallet/react-ui/es/icon';
import { SwTabBarItem } from '@subwallet/react-ui/es/sw-tab-bar';
import { Aperture, Database, Globe, MagnifyingGlass, Rocket, Wallet } from 'phosphor-react';
import React, { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface Props extends Omit<
SwScreenLayoutProps,
'tabBarItems' | 'footer' | 'headerContent' | 'selectedTabBarItem'
> {
  children: React.ReactNode | React.ReactNode[];
  showFooter?: boolean;
}

const TabBarItems: Array<Omit<SwTabBarItem, 'onClick'>> = [
  {
    icon: {
      type: 'phosphor',
      phosphorIcon: Wallet,
      weight: 'fill'
    },
    label: 'Tokens',
    key: 'tokens'
  },
  {
    icon: {
      type: 'phosphor',
      phosphorIcon: Aperture,
      weight: 'fill'
    },
    label: 'NFTs',
    key: 'nfts'
  },
  {
    icon: {
      type: 'phosphor',
      phosphorIcon: Rocket,
      weight: 'fill'
    },
    label: 'Crowdloans',
    key: 'crowdloans'
  },
  {
    icon: {
      type: 'phosphor',
      phosphorIcon: Database,
      weight: 'fill'
    },
    label: 'Staking',
    key: 'staking'
  },
  {
    icon: {
      type: 'phosphor',
      phosphorIcon: Globe,
      weight: 'fill'
    },
    label: 'History',
    key: 'history'
  }
];

const headerIcons = [
  {
    icon: (
      <Icon
        phosphorIcon={MagnifyingGlass}
        size='sm'
        type='phosphor'
      />
    )
  }
];

const Base = ({ children, showFooter, ...props }: Props) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const selectedTab = useMemo((): string => {
    const isHomePath = pathname.includes('/home');

    if (isHomePath) {
      const pathExcludeHome = pathname.split('/home')[1];
      const currentTab = pathExcludeHome.split('/')[1];

      return currentTab || '';
    } else {
      return '';
    }

    return '';
  }, [pathname]);

  const onSelectTab = useCallback(
    (key: string) => () => {
      navigate(`/home/${key}`, { relative: 'route' });
    },
    [navigate]
  );

  return (
    <SwScreenLayout
      {...props}
      footer={showFooter && <Footer />}
      headerContent={<SelectedAccount />}
      headerIcons={headerIcons}
      selectedTabBarItem={selectedTab}
      tabBarItems={TabBarItems.map((item) => ({
        ...item,
        onClick: onSelectTab(item.key)
      }))}
    >
      {children}
    </SwScreenLayout>
  );
};

export default Base;
