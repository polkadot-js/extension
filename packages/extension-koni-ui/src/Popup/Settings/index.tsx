// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faBell, faCog, faFlask, faIdBadge, faInfoCircle, faLock, faPlug, faSlidersH } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled from 'styled-components';

import { SettingItem } from '@polkadot/extension-base/background/KoniTypes';
import { Link } from '@polkadot/extension-koni-ui/components';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import Header from '@polkadot/extension-koni-ui/partials/Header';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

interface Props extends ThemeProps {
  className?: string;
}

const settingList: SettingItem[] = [
  {
    name: 'General',
    icon: faCog,
    route: '/account/general-setting'
  },
  {
    name: 'Advanced',
    icon: faSlidersH,
    route: '',
    isDisabled: true
  },
  {
    name: 'Contacts',
    icon: faIdBadge,
    route: '',
    isDisabled: true
  },
  {
    name: 'Security & Privacy',
    icon: faLock,
    route: '',
    isDisabled: true
  },
  {
    name: 'Alerts',
    icon: faBell,
    route: '',
    isDisabled: true
  },
  {
    name: 'Networks',
    icon: faPlug,
    route: '/account/networks',
    isDisabled: true
  },
  {
    name: 'Experimental',
    icon: faFlask,
    route: '',
    isDisabled: true
  },
  {
    name: 'About',
    icon: faInfoCircle,
    route: '',
    href: 'https://linktr.ee/subwallet.app'
  }
];

function Settings ({ className }: Props): React.ReactElement {
  const { t } = useTranslation();

  const renderSettingItem = (item: SettingItem) => {
    if (item && item.href) {
      return (
        <a
          className='menu-setting-item'
          href={item.href}
          rel='noreferrer'
          target='_blank'
        >
          {/* @ts-ignore */}
          <FontAwesomeIcon icon={item.icon} />
          <div className='menu-setting-item__text'>{t<string>(item.name)}</div>
          {/* @ts-ignore */}
          <div className='menu-setting-item__toggle' />
        </a>
      );
    }

    return (
      <Link
        className='menu-setting-item'
        isDisabled={item.isDisabled}
        to={item.route}
      >
        {/* @ts-ignore */}
        <FontAwesomeIcon icon={item.icon} />
        <div className='menu-setting-item__text'>{t<string>(item.name)}</div>
        {/* @ts-ignore */}
        <div className='menu-setting-item__toggle' />
      </Link>
    );
  };

  return (
    <div className={className}>
      <Header
        showBackArrow
        showSubHeader
        subHeaderName={t<string>('Settings')}
      />
      <div className='menu-setting-item-list'>
        {settingList.map((item) => renderSettingItem(item))}
      </div>

    </div>
  );
}

export default styled(Settings)(({ theme }: Props) => `
  .menu-setting-item-list {
    padding: 25px 22px;
  }

  .menu-setting-item {
    position: relative;
    border-radius: 5px;
    display: flex;
    align-items: center;
    padding: 11px;

    .svg-inline--fa {
      color: ${theme.iconNeutralColor};
      margin-right: 11px;
      width: 15px;
    }
  }

  .menu-setting-item:hover {
    background-color: ${theme.backgroundAccountAddress};
    cursor: pointer;

    .menu-setting-item__toggle {
      color:  ${theme.textColor};
    }

    .svg-inline--fa,
    .menu-setting-item__text {
      color: ${theme.buttonTextColor2};
    }
  }

  .menu-setting-item__text {
    font-size: 15px;
    line-height: 26px;
    font-weight: 500;
    color: ${theme.textColor2};
  }

  .menu-setting-item__toggle {
    position: absolute;
    border-style: solid;
    border-width: 0 2px 2px 0;
    display: inline-block;
    padding: 3px;
    transform: rotate(-45deg);
    right: 25px;
    color: ${theme.background};
  }
`);
