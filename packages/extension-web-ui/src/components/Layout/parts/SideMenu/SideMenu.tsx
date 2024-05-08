// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MenuItem, MenuItemType } from '@subwallet/extension-web-ui/components/Layout/parts/SideMenu/MenuItem';
import { CONTACT_US, DEFAULT_SWAP_PARAMS, FAQS_URL, SWAP_TRANSACTION, TERMS_OF_SERVICE_URL } from '@subwallet/extension-web-ui/constants';
import { useSelector, useTranslation } from '@subwallet/extension-web-ui/hooks';
import usePreloadView from '@subwallet/extension-web-ui/hooks/router/usePreloadView';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { isAccountAll, openInNewTab } from '@subwallet/extension-web-ui/utils';
import { Button, Icon, Image } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowCircleLeft, ArrowCircleRight, ArrowsLeftRight, ArrowSquareUpRight, Clock, Gear, Globe, Info, MessengerLogo, Parachute, Rocket, Vault, Wallet } from 'phosphor-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLocalStorage } from 'usehooks-ts';

export type Props = ThemeProps & {
  isCollapsed: boolean,
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>
};

const swapPath = '/transaction/swap';

function Component ({ className,
  isCollapsed,
  setCollapsed }: Props): React.ReactElement<Props> {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const { t } = useTranslation();
  const currentAccount = useSelector((root) => root.accountState.currentAccount);
  const [, setSwapStorage] = useLocalStorage(SWAP_TRANSACTION, DEFAULT_SWAP_PARAMS);
  const transactionFromValue = useMemo(() => {
    return currentAccount?.address ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : '';
  }, [currentAccount?.address]);

  usePreloadView([
    'Home',
    'Tokens',
    'NftCollections',
    'Crowdloans',
    'Staking',
    'Settings'
  ]);

  const menuItems = useMemo<MenuItemType[]>(() => {
    return [
      {
        label: t('Portfolio'),
        value: '/home',
        icon: Wallet
      },
      {
        label: t('Earning'),
        value: '/home/earning',
        icon: Vault
      },
      {
        label: t('Swap'),
        value: '/transaction/swap',
        icon: ArrowsLeftRight
      },
      {
        label: t('dApps'),
        value: '/home/dapps',
        icon: Globe
      },
      {
        label: t('Mission Pools'),
        value: '/home/mission-pools',
        icon: Parachute
      },
      {
        label: t('Crowdloans'),
        value: '/home/crowdloans',
        icon: Rocket
      },
      {
        label: t('History'),
        value: '/home/history',
        icon: Clock
      },
      {
        label: t('Settings'),
        value: '/settings',
        icon: Gear
      }
    ];
  }, [t]);

  const staticMenuItems = useMemo<MenuItemType[]>(() => {
    return [
      {
        label: t('FAQs'),
        value: 'faqs',
        icon: Info
      },
      {
        label: t('Contact'),
        value: 'contact',
        icon: MessengerLogo
      },
      {
        label: t('Terms of services'),
        value: 'tos',
        icon: ArrowSquareUpRight
      }
    ];
  }, [t]);

  const handleLink = useCallback((value: string) => {
    switch (value) {
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

  const handleNavigate = useCallback((
    value: string
  ) => {
    if (value === swapPath) {
      setSwapStorage({
        ...DEFAULT_SWAP_PARAMS,
        from: transactionFromValue
      });
    }

    navigate(`${value}`);
  }, [navigate, setSwapStorage, transactionFromValue]);

  const goHome = useCallback(() => {
    navigate('/home');
  }, [navigate]);

  const getSelectedKeys = useCallback((pathname: string) => {
    if (pathname.startsWith('/accounts') || pathname.startsWith('/transaction-done')) {
      return undefined;
    }

    if (pathname.startsWith('/settings') || pathname.startsWith('/wallet-connect')) {
      return ['/settings'];
    }

    if (pathname.startsWith('/transaction')) {
      const transaction = pathname.split('/')[2];

      if (transaction === 'earn') {
        return ['/home/earning/'];
      }

      if (transaction === 'swap') {
        return [swapPath];
      }

      return ['/home/staking'];
    }

    const availableKey: string[] = [
      ...menuItems.map((i) => i.value)
    ];
    const current = availableKey.filter((i: string) => i !== '/home' && pathname.includes(i));

    return current.length ? current : (pathname.startsWith('/home') ? ['/home'] : undefined);
  }, [menuItems]);

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
      className={CN(className, {
        '-expanded': !isCollapsed,
        '-collapsed': isCollapsed
      })}
    >
      <div className='__logo-container'>
        <Image
          alt={'SubWallet'}
          onClick={goHome}
          shape={'square'}
          src='/images/subwallet/gradient-logo.png'
          style={{ cursor: 'pointer' }}
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
          tooltip={isCollapsed ? t('Expand') : t('Collapse')}
          type='ghost'
        />
      </div>

      <div className={CN('__menu-container')}>
        <div className={'side-menu'}>
          {
            menuItems.map((m) => (
              <MenuItem
                className={'side-menu-item'}
                icon={m.icon}
                isActivated={selectedKeys.includes(m.value)}
                key={m.value}
                label={m.label}
                onClick={handleNavigate}
                showToolTip={isCollapsed}
                value={m.value}
              />
            ))
          }
        </div>

        <div className={'side-menu'}>
          {
            staticMenuItems.map((m) => (
              <MenuItem
                className={'side-menu-item'}
                icon={m.icon}
                isActivated={false}
                key={m.value}
                label={m.label}
                onClick={handleLink}
                showToolTip={isCollapsed}
                value={m.value}
              />
            ))
          }
        </div>
      </div>
    </div>
  );
}

export default Component;
