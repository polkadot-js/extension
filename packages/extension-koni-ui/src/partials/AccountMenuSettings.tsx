// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import { faUsb } from '@fortawesome/free-brands-svg-icons';
import { faCog, faFileUpload, faKey, faPlusCircle, faQrcode, faSeedling } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import logo from '@subwallet/extension-koni-ui/assets/sub-wallet-logo.svg';
import InputFilter from '@subwallet/extension-koni-ui/components/InputFilter';
import Link from '@subwallet/extension-koni-ui/components/Link';
import Menu from '@subwallet/extension-koni-ui/components/Menu';
import MenuSettingItem from '@subwallet/extension-koni-ui/components/MenuSettingItem';
import useIsPopup from '@subwallet/extension-koni-ui/hooks/useIsPopup';
import { useLedger } from '@subwallet/extension-koni-ui/hooks/useLedger';
import { windowOpen } from '@subwallet/extension-koni-ui/messaging';
import AccountsTree from '@subwallet/extension-koni-ui/Popup/Accounts/AccountsTree';
import React, { useCallback, useContext, useState } from 'react';
import styled from 'styled-components';

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
const ledgerPath = '/account/import-ledger';

function AccountMenuSettings ({ changeAccountCallback, className, closeSetting, onFilter, reference }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('');
  const { isLedgerCapable, isLedgerEnabled } = useLedger();
  const { hierarchy } = useContext(AccountContext);
  const filteredAccount = filter
    ? hierarchy.filter((account) =>
      account.name?.toLowerCase().includes(filter.toLowerCase())
    )
    : hierarchy;

  // const { master } = useContext(AccountContext);
  const mediaAllowed = useContext(MediaContext);
  const isPopup = useIsPopup();
  const isFirefox = window.localStorage.getItem('browserInfo') === 'Firefox';
  const isLinux = window.localStorage.getItem('osInfo') === 'Linux';

  const _openJson = useCallback(
    () => {
      window.localStorage.setItem('popupNavigation', jsonPath);
      windowOpen(jsonPath).catch((e) => console.log('error', e));
    }, []
  );

  const _onOpenLedgerConnect = useCallback(
    (): void => {
      window.localStorage.setItem('popupNavigation', ledgerPath);
      windowOpen(ledgerPath).catch(console.error);
    }, []
  );

  const _openCreateAccount = useCallback(
    () => {
      window.localStorage.setItem('popupNavigation', createAccountPath);
      windowOpen(createAccountPath).catch((e) => console.log('error', e));
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
          placeholder={t<string>('Search by name...')}
          value={filter}
          withReset
        />
      </div>
      <div className='account-menu-settings'>
        {filteredAccount.map((json, index): React.ReactNode => (
          <AccountsTree
            closeSetting={closeSetting}
            {...json}
            changeAccountCallback={changeAccountCallback}
            key={`${index}:${json.address}`}
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
              {/* @ts-ignore */}
              <FontAwesomeIcon icon={faPlusCircle} />
              <span>{ t('Create new account')}</span>
            </Link>
          </MenuSettingItem>
          {/* {!!master && ( */}
          {/*  <MenuSettingItem className='account-menu-settings__menu-item'> */}
          {/*    <Link */}
          {/*      className='account-menu-settings__menu-item-text' */}
          {/*      to={`/account/derive/${master.address}`} */}
          {/*    > */}
          {/*      /!* @ts-ignore *!/ */}
          {/*      <FontAwesomeIcon icon={faCodeBranch} /> */}
          {/*      <span>{t('Derive from an account')}</span> */}
          {/*    </Link> */}
          {/*  </MenuSettingItem> */}
          {/* )} */}
        </div>

        <div className='account-menu-settings-items-wrapper'>
          {/* <MenuSettingItem className='account-menu-settings__menu-item'> */}
          {/*  <Link */}
          {/*    className='account-menu-settings__menu-item-text' */}
          {/*    to={'/account/export-all'} */}
          {/*  > */}
          {/*    /!* @ts-ignore *!/ */}
          {/*    <FontAwesomeIcon icon={faFileExport} /> */}
          {/*    <span>{t<string>('Export all accounts')}</span> */}
          {/*  </Link> */}
          {/* </MenuSettingItem> */}
          <MenuSettingItem className='account-menu-settings__menu-item'>
            <Link
              className='account-menu-settings__menu-item-text'
              to='/account/import-seed'
            >
              {/* @ts-ignore */}
              <FontAwesomeIcon icon={faSeedling} />
              <span>{t<string>('Import account from Seed Phrase')}</span>
            </Link>
          </MenuSettingItem>
          <MenuSettingItem className='account-menu-settings__menu-item'>
            <Link
              className='account-menu-settings__menu-item-text'
              to='/account/import-metamask-private-key'
            >
              {/* @ts-ignore */}
              <FontAwesomeIcon icon={faKey} />
              <span>{t<string>('Import private key from MetaMask')}</span>
            </Link>
          </MenuSettingItem>
          <MenuSettingItem className='account-menu-settings__menu-item'>
            <Link
              className='account-menu-settings__menu-item-text'
              onClick={isPopup && (isFirefox || isLinux) ? _openJson : undefined}
              to={isPopup && (isFirefox || isLinux) ? undefined : jsonPath}
            >
              {/* @ts-ignore */}
              <FontAwesomeIcon icon={faFileUpload} />
              <span>{t<string>('Restore account from Polkadot{.js}')}</span>
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
              {/* @ts-ignore */}
              <FontAwesomeIcon icon={faQrcode} />
              <span>{t<string>('Attach external QR-signer account')}</span>
            </Link>
          </MenuSettingItem>

          <MenuSettingItem className='account-menu-settings__menu-item ledger'>
            {isLedgerEnabled
              ? (
                <Link
                  className='account-menu-settings__menu-item-text'
                  isDisabled={!isLedgerCapable}
                  title={ (!isLedgerCapable && t<string>('Ledger devices can only be connected with Chrome browser')) || ''}
                  to={ledgerPath}
                >
                  <FontAwesomeIcon
                    // @ts-ignore
                    icon={faUsb}
                    rotation={270}
                  />
                  <span>{ t<string>('Attach ledger account')}</span>
                </Link>
              )
              : (
                <Link
                  className='account-menu-settings__menu-item-text'
                  onClick={_onOpenLedgerConnect}
                >
                  <FontAwesomeIcon
                  // @ts-ignore
                    icon={faUsb}
                    rotation={270}
                  />
                  <span>{ t<string>('Connect Ledger device')}</span>
                </Link>
              )
            }
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
              to='/account/scan-qr'
            >
              {/* @ts-ignore */}
              <FontAwesomeIcon icon={faQrcode} />
              <span>{t<string>('Scan QR')}</span>
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
            {/* @ts-ignore */}
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
    max-height: 260px;
    overflow-y: auto;

    &:last-child {
      padding: 0 27px;
      margin: 8px 0
    }

    &::-webkit-scrollbar {
      display: none;
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
    width: 218px;
  }

  .account-menu-settings__input-filter > input {
    height: 40px;
  }
`));
