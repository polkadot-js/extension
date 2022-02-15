// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import { faCodeBranch, faCog, faFileExport, faFileUpload, faKey, faPlusCircle, faQrcode } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import styled from 'styled-components';

import logo from '@polkadot/extension-koni-ui/assets/sub-wallet-logo.svg';
import InputFilter from '@polkadot/extension-koni-ui/components/InputFilter';
import Link from '@polkadot/extension-koni-ui/components/Link';
import Menu from '@polkadot/extension-koni-ui/components/Menu';
import MenuSettingItem from '@polkadot/extension-koni-ui/components/MenuSettingItem';
import useIsPopup from '@polkadot/extension-koni-ui/hooks/useIsPopup';
import { windowOpen } from '@polkadot/extension-koni-ui/messaging';
import AccountsTree from '@polkadot/extension-koni-ui/Popup/Accounts/AccountsTree';
import getNetworkMap from '@polkadot/extension-koni-ui/util/getNetworkMap';

import { AccountContext, MediaContext, Svg } from '../components';
import useTranslation from '../hooks/useTranslation';

interface Props extends ThemeProps {
  className?: string;
  reference: React.MutableRefObject<null>;
  onFilter?: (filter: string) => void;
  closeSetting?: () => void;
  changeAccountCallback?: (address: string) => void;
}

const jsonPath = '/account/restore-json';
const createAccountPath = '/account/create';

function AccountMenuSettings ({ className, closeSetting, onFilter, reference, changeAccountCallback }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('');
  const { hierarchy } = useContext(AccountContext);
  const filteredAccount = filter ? hierarchy.filter((account) =>
    account.name?.toLowerCase().includes(filter) ||
    (account.genesisHash && networkMap.get(account.genesisHash)?.toLowerCase().includes(filter))
  ) : hierarchy

  const { master } = useContext(AccountContext);
  const networkMap = useMemo(() => getNetworkMap(), []);
  const mediaAllowed = useContext(MediaContext);
  const isPopup = useIsPopup();
  const isFirefox = window.localStorage.getItem('browserInfo') === 'Firefox';
  const isLinux = window.localStorage.getItem('osInfo') === 'Linux';

  const _openJson = useCallback(
    () => {
      window.localStorage.setItem('popupNavigation', jsonPath);
      windowOpen(jsonPath);
    }, []
  );

  const _openCreateAccount = useCallback(
    () => {
      window.localStorage.setItem('popupNavigation', createAccountPath);
      windowOpen(createAccountPath);
    }, []
  );

  const _onChangeFilter = useCallback((filter: string) => {
    setFilter(filter);
    onFilter && onFilter(filter);
  }, [onFilter]);

  return (
    <Menu
      className={className}
      reference={reference}
    >
      <div className='account-menu-settings-header'>
        <div className='account-menu-settings__branding'>
          <img
            className='logo'
            src={logo}
          />
          <span className='account-menu-settings__logo-text'>Accounts</span>
        </div>
        <InputFilter
          className='account-menu-settings__input-filter'
          onChange={_onChangeFilter}
          placeholder={t<string>('Search by name or network...')}
          value={filter}
          withReset
        />
      </div>
      <div className='account-menu-settings'>
        {filteredAccount.map((json, index): React.ReactNode => (
          <AccountsTree
            closeSetting={closeSetting}
            {...json}
            key={`${index}:${json.address}`}
            changeAccountCallback={changeAccountCallback}
          />
        ))}
      </div>

      <div className='koni-menu-items-container'>
        <div className='account-menu-settings-items-wrapper'>
          <MenuSettingItem className='account-menu-settings__menu-item'>
            <Link
              className='account-menu-settings__menu-item-text'
              onClick={isPopup && (isFirefox || isLinux) ? _openCreateAccount : undefined}
              to={isPopup && (isFirefox || isLinux) ? undefined : createAccountPath}
            >
              <FontAwesomeIcon icon={faPlusCircle} />
              <span>{ t('Create new account')}</span>
            </Link>
          </MenuSettingItem>
          {!!master && (
            <MenuSettingItem className='account-menu-settings__menu-item'>
              <Link
                className='account-menu-settings__menu-item-text'
                to={`/account/derive/${master.address}`}
              >
                <FontAwesomeIcon icon={faCodeBranch} />
                <span>{t('Derive from an account')}</span>
              </Link>
            </MenuSettingItem>
          )}
        </div>

        <div className='account-menu-settings-items-wrapper'>
          <MenuSettingItem className='account-menu-settings__menu-item'>
            <Link
              className='account-menu-settings__menu-item-text'
              to={'/account/export-all'}
            >
              <FontAwesomeIcon icon={faFileExport} />
              <span>{t<string>('Export all accounts')}</span>
            </Link>
          </MenuSettingItem>
          <MenuSettingItem className='account-menu-settings__menu-item'>
            <Link
              className='account-menu-settings__menu-item-text'
              to='/account/import-seed'
            >
              <FontAwesomeIcon icon={faKey} />
              <span>{t<string>('Import account from pre-existing seed')}</span>
            </Link>
          </MenuSettingItem>
          <MenuSettingItem className='account-menu-settings__menu-item'>
            <Link
              className='account-menu-settings__menu-item-text'
              onClick={isPopup && (isFirefox || isLinux) ? _openJson : undefined}
              to={isPopup && (isFirefox || isLinux) ? undefined : jsonPath}
            >
              <FontAwesomeIcon icon={faFileUpload} />
              <span>{t<string>('Restore account from backup JSON file')}</span>
            </Link>
          </MenuSettingItem>
        </div>

        <div className='account-menu-settings-items-wrapper'>
          <MenuSettingItem className='account-menu-settings__menu-item'>
            <Link
              className='account-menu-settings__menu-item-text'
              isDisabled={!mediaAllowed}
              title={!mediaAllowed
                ? t<string>('Camera access must be first enabled in the settings')
                : ''
              }
              to='/account/import-qr'
            >
              <FontAwesomeIcon icon={faQrcode} />
              <span>{t<string>('Attach external QR-signer account')}</span>
            </Link>
          </MenuSettingItem>
        </div>
      </div>
      <div className='koni-menu-items-container'>
        <MenuSettingItem className='account-menu-settings__menu-item'>
          <Link
            className='account-menu-settings__menu-item-text'
            to={'/account/settings'}
          >
            <FontAwesomeIcon icon={faCog} />
            <span>{ t('Settings')}</span>
          </Link>
        </MenuSettingItem>
      </div>
    </Menu>
  );
}

export default React.memo(styled(AccountMenuSettings)(({ theme }: Props) => `
  margin-top: 50px;
  right: 5px;
  user-select: none;

  .account-menu-settings {
    max-height: 148px;
    overflow-y: auto;
    scrollbar-width: none;
    padding: 0 15px;
    margin-bottom: 8px;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .account-menu-settings__logo-text {
    font-size: 20px;
    line-height: 32px;
    font-weight: 500;
    color: ${theme.textColor};
  }

  .account-menu-settings__branding {
      display: flex;
      justify-content: center;
      align-items: center;
      color: ${theme.labelColor};
      font-family: ${theme.fontFamily};
      text-align: center;
      margin-right: 15px;

      .logo {
        height: 32px;
        width: 32px;
        margin-right: 10px;
      }
  }

  .account-menu-settings-header {
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    border-bottom:2px solid ${theme.menuItemsBorder};
  }

  .openWindow, .manageWebsiteAccess{
    span {
      color: ${theme.textColor};
      font-size: ${theme.fontSize};
      line-height: ${theme.lineHeight};
      text-decoration: none;
      vertical-align: middle;
    }

    ${Svg} {
      background: ${theme.textColor};
      height: 20px;
      top: 4px;
      width: 20px;
    }
  }

  > .setting {
    > .checkbox {
      color: ${theme.textColor};
      line-height: 20px;
      font-size: 15px;
      margin-bottom: 0;

      &.ledger {
        margin-top: 0.2rem;
      }

      label {
        color: ${theme.textColor};
      }
    }

    > .dropdown {
      background: ${theme.background};
      margin-bottom: 0;
      margin-top: 9px;
      margin-right: 0;
      width: 100%;
    }
  }

  .account-menu-settings__menu-item {
    padding: 0;

    .svg-inline--fa {
      color: ${theme.iconNeutralColor};
      margin-right: 0.3rem;
      width: 0.875em;
    }
  }

  .account-menu-settings__menu-item-text {
    font-size: 15px;
    line-height: 30px;
    color: ${theme.textColor2};
    > span {
      font-weight: 400;
    }
  }

  .account-menu-settings__menu-item:hover {
    .menuItem__text {
      color: ${theme.textColor};
    }

    .svg-inline--fa {
      color: ${theme.iconHoverColor};
    }
  }

  .koni-menu-items-container {
    padding: 0 15px;

    &:last-child {
      padding: 0 27px;
      margin: 8px 0
    }
  }

  .account-menu-settings-items-wrapper {
    border-radius: 8px;
    border: 2px solid ${theme.menuItemsBorder};
    padding: 8px 12px;
    margin-bottom: 8px;
  }

  .account-menu-settings-items-wrapper:last-child {
    margin-bottom: 0;
  }

  .account-menu-settings__input-filter {
    width: 100%;
  }

  .account-menu-settings__input-filter > input {
    height: 40px;
  }
`));
