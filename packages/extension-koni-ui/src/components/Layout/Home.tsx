// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SelectedAccount } from '@subwallet/extension-koni-ui/components/Layout/parts/SelectedAccount';
import { SwScreenLayout } from '@subwallet/react-ui';
import Icon from '@subwallet/react-ui/es/icon';
import { SwTabBarItem } from '@subwallet/react-ui/es/sw-tab-bar';
import { Aperture, Database, Globe, List, MagnifyingGlass, Rocket, Wallet } from 'phosphor-react';
import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Props = {
  children?: React.ReactNode;
};

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

const Home = ({ children }: Props) => {
  const [selectedTab, setSelectedTab] = useState('tokens');
  const navigate = useNavigate();

  const onSelectTab = useCallback(
    (key: string) => () => {
      setSelectedTab(key);
      navigate(`/home/${key}`, { relative: 'route' });
    },
    [navigate]
  );

  return (
    <SwScreenLayout
      headerContent={<SelectedAccount />}
      headerIcons={headerIcons}
      headerLeft={
        <Icon
          phosphorIcon={List}
          size='sm'
          type='phosphor'
        />
      }
      headerPaddingVertical
      selectedTabBarItem={selectedTab}
      showHeader
      showLeftButton
      showTabBar
      tabBarItems={TabBarItems.map((item) => ({
        ...item,
        onClick: onSelectTab(item.key)
      }))}
      withDivider={false}
    >
      {children}
    </SwScreenLayout>
  );
};

export { Home };
