// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CONTACT_US, FAQS_URL, TERMS_OF_SERVICE_URL } from '@subwallet/extension-koni-ui/constants';
import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { openInNewTab } from '@subwallet/extension-koni-ui/utils';
import { Button, Icon, Image, Menu } from '@subwallet/react-ui';
import { MenuItemType } from '@subwallet/react-ui/es/menu/hooks/useItems';
import CN from 'classnames';
import { ArrowCircleLeft, ArrowCircleRight, ArrowSquareUpRight, Clock, Database, Gear, Info, MessengerLogo, Rocket, Wallet } from 'phosphor-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

export type Props = ThemeProps & {
  isCollapsed: boolean,
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>
};

type SideMenuItemType = MenuItemType;
const menuItems: SideMenuItemType[] = [
  {
    label: 'Portfolio',
    key: '/home',
    icon: (
      <Icon
        phosphorIcon={Wallet}
        weight='fill'
      />
    )
  },
  {
    label: 'Crowdloans',
    key: '/home/crowdloans',
    icon: (
      <Icon
        phosphorIcon={Rocket}
        weight='fill'
      />
    )
  },
  {
    label: 'Earning',
    key: '/home/earning',
    icon: (
      <Icon
        phosphorIcon={Database}
        weight='fill'
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
  {
    label: 'History',
    key: '/home/history',
    icon: (
      <Icon
        phosphorIcon={Clock}
        weight='fill'
      />
    )
  },
  {
    label: 'Settings',
    key: '/settings',
    icon: (
      <Icon
        phosphorIcon={Gear}
        weight='fill'
      />
    )
  }
];

const staticMenuItems: SideMenuItemType[] = [
  {
    label: 'FAQs',
    key: 'faqs',
    icon: (
      <Icon
        phosphorIcon={Info}
        weight='fill'
      />
    )
  },
  {
    label: 'Contact',
    key: 'contact',
    icon: (
      <Icon
        phosphorIcon={MessengerLogo}
        weight='fill'
      />
    )
  },
  {
    label: 'Terms of services',
    key: 'tos',
    icon: (
      <Icon
        phosphorIcon={ArrowSquareUpRight}
        weight='fill'
      />
    )
  }
];

function Component ({ className,
  isCollapsed,
  setCollapsed }: Props): React.ReactElement<Props> {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const { t } = useTranslation();
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

  const getSelectedKeys = useCallback((pathname: string) => {
    if (pathname.startsWith('/accounts') || pathname.startsWith('/transaction-done')) {
      return undefined;
    }

    if (pathname.startsWith('/settings') || pathname.startsWith('/wallet-connect')) {
      return ['/settings'];
    }

    if (pathname.startsWith('/transaction')) {
      return ['/home/staking'];
    }

    const availableKey: string[] = [
      ...menuItems.map((i) => i.key as string)
    ];
    const current = availableKey.filter((i: string) => i !== '/home' && pathname.includes(i));

    return current.length ? current : (pathname.startsWith('/home') ? ['/home'] : undefined);
  }, []);

  const onToggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, [setCollapsed]);

  useEffect(() => {
    setSelectedKeys((prev) => {
      const _selectedKeys = getSelectedKeys(pathname);

      if (_selectedKeys) {
        return _selectedKeys;
      }

      if (!_selectedKeys && !prev) {
        return ['/home'];
      }

      return prev;
    });
  }, [getSelectedKeys, pathname]);

  return (
    <div
      className={CN(className, 'side-menu', {
        '-expanded': !isCollapsed,
        '-collapsed': isCollapsed
      })}
    >
      <div className='__logo-container'>
        <Image
          shape={'square'}
          src='/images/subwallet/gradient-logo.png'
        />

        <Button
          className={'__sidebar-collapse-trigger'}
          icon={
            (
              <Icon
                phosphorIcon={isCollapsed ? ArrowCircleRight : ArrowCircleLeft}
                size={'xs'}
                weight={'fill'}
              />
            )
          }
          onClick={onToggleCollapse}
          size={'xs'}
          tooltip={isCollapsed ? t('Expanse') : t('Collapse')}
          type='ghost'
        />
      </div>

      <div className={CN('__menu-container')}>
        <Menu
          items={menuItems}
          onClick={handleNavigate}
          selectedKeys={selectedKeys}
        />
        <Menu
          items={staticMenuItems}
          onClick={handleLinks}
        />
      </div>
    </div>
  );
}

export default Component;
