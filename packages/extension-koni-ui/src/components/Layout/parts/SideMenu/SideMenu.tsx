// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CONTACT_US, FAQS_URL, TERMS_OF_SERVICE_URL } from '@subwallet/extension-koni-ui/constants';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { openInNewTab } from '@subwallet/extension-koni-ui/utils';
import { Image, Menu } from '@subwallet/react-ui';
import { MenuItemType } from '@subwallet/react-ui/es/menu/hooks/useItems';
import CN from 'classnames';
import { ArrowSquareUpRight, Clock, Database, Gear, Info, MessengerLogo, Rocket, Wallet } from 'phosphor-react';
import React, { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';

export type Props = ThemeProps;

type SideMenuItemType = MenuItemType;
const menuItems: SideMenuItemType[] = [
  {
    label: 'Portfolio',
    key: '/home',
    icon: (
      <Wallet
        height={20}
        weight='fill'
        width={20}
      />
    )
  },
  {
    label: 'Crowdloans',
    key: '/home/crowdloans',
    icon: (
      <Rocket
        height={20}
        weight='fill'
        width={20}
      />
    )
  },
  {
    label: 'Staking',
    key: '/home/staking',
    icon: (
      <Database
        height={20}
        weight='fill'
        width={20}
      />
    )
  },
  // {
  //   label: 'DApps',
  //   key: '/home/dapps',
  //   icon: (
  //     <Globe
  //       height={20}
  //       weight='fill'
  //       width={20}
  //     />
  //   )
  // },
  { label: 'History',
    key: '/home/history',
    icon: (
      <Clock
        height={20}
        weight='fill'
        width={20}
      />

    ) },
  {
    label: 'Settings',
    key: '/settings',
    icon: (
      <Gear
        height={20}
        weight='fill'
        width={20}
      />
    )
  }
];

const staticMenuItems: SideMenuItemType[] = [
  {
    label: 'FAQs',
    key: 'faqs',
    icon: (
      <Info
        height={20}
        weight='fill'
        width={20}
      />
    )
  },
  {
    label: 'Contact',
    key: 'contact',
    icon: (
      <MessengerLogo
        height={20}
        weight='fill'
        width={20}
      />
    )
  },
  {
    label: 'Terms of services',
    key: 'tos',
    icon: (
      <ArrowSquareUpRight
        height={20}
        weight='fill'
        width={20}
      />
    )
  }
];

function Component ({ className }: Props): React.ReactElement<Props> {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // animate sidebar
  // const [isHovered, setHovered] = useState<boolean>(true);

  const handleLinks = useCallback(({ key }: { key: string}) => {
    switch (key) {
      case 'faqs':
        openInNewTab(FAQS_URL)();
        break;
      case 'tos':
        openInNewTab(TERMS_OF_SERVICE_URL)();
        break;
      case 'contact':
        openInNewTab(CONTACT_US)();
        break;
      default:
    }
  }, []);

  const handleNavigate = useCallback(({ key }: {
    key: string
  }) => {
    navigate(`${key}`);
  }, [navigate]);

  const selectedKey = useMemo(() => {
    const availableKey: string[] = [
      ...menuItems.map((i) => i.key as string)
      // ...staticMenuItems.map((i) => i.key as string)
    ];
    const current = availableKey.filter((i: string) => i !== '/home' && pathname.includes(i));

    return current.length ? current : (pathname.startsWith('/home') ? ['/home'] : ['/settings']);
  }, [pathname]);

  return (
    <div
      className={CN(className, 'flex-col', 'side-menu-wrapper', {
        __expanded: true
        // '__expanded': isHovered
      })}
    >
      <div className='logo-container'>
        <Image
          src='/images/subwallet/gradient-logo.png'
          width={46}
        />
      </div>
      <div className={CN('menu-wrapper', 'flex-col')}>
        <Menu
          items={menuItems}
          onClick={handleNavigate}
          selectedKeys={selectedKey}
        />
        <Menu
          items={staticMenuItems}
          onClick={handleLinks}
          selectedKeys={selectedKey}
        />
      </div>
    </div>
  );
}

export default Component;
