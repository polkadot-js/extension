// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Theme, ThemeProps } from '../types';

import { faCodeFork, faCog, faEye, faFileUpload, faKey, faPlusCircle, faQrcode } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AccountContext, MediaContext, Svg } from '@subwallet/extension-koni-ui/components';
import InputFilter from '@subwallet/extension-koni-ui/components/InputFilter';
import Link from '@subwallet/extension-koni-ui/components/Link';
import Menu from '@subwallet/extension-koni-ui/components/Menu';
import MenuSettingItem from '@subwallet/extension-koni-ui/components/MenuSettingItem';
import useIsPopup from '@subwallet/extension-koni-ui/hooks/useIsPopup';
import { useLedger } from '@subwallet/extension-koni-ui/hooks/useLedger';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { windowOpen } from '@subwallet/extension-koni-ui/messaging';
import AccountsTree from '@subwallet/extension-koni-ui/Popup/Accounts/AccountsTree';
import React, { useCallback, useContext, useState } from 'react';
import styled, { ThemeContext } from 'styled-components';

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

const transitionTime = '0.3s';

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
  const themeContext = useContext(ThemeContext as React.Context<Theme>);

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
            alt={'logo'}
            className='logo'
            src={themeContext.logo}
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
        {!filteredAccount.length && (
          <div className='no-account-warning'>
            <span className='no-account-text'>
              {t('No results found. Please change your search criteria and try again.')}
            </span>
          </div>
        )}
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
              <FontAwesomeIcon icon={faPlusCircle} />
              <span>{t<string>('Import account from Seed Phrase')}</span>
            </Link>
          </MenuSettingItem>
          <MenuSettingItem className='account-menu-settings__menu-item'>
            <Link
              className='account-menu-settings__menu-item-text'
              to='/account/import-metamask-private-key'
            >
              <FontAwesomeIcon icon={faKey} />
              <span>{t<string>('Import private key from MetaMask')}</span>
            </Link>
          </MenuSettingItem>
          <MenuSettingItem className='account-menu-settings__menu-item'>
            <Link
              className='account-menu-settings__menu-item-text'
              isDisabled={!mediaAllowed}
              title={!mediaAllowed
                ? t<string>('Camera access must be first enabled in the settings')
                : ''
              }
              to='/account/import-secret-qr'
            >
              <FontAwesomeIcon icon={faQrcode} />
              <span>{t<string>('Import account by QR code')}</span>
            </Link>
          </MenuSettingItem>
          <MenuSettingItem className='account-menu-settings__menu-item'>
            <Link
              className='account-menu-settings__menu-item-text'
              onClick={isPopup && (isFirefox || isLinux) ? _openJson : undefined}
              to={isPopup && (isFirefox || isLinux) ? undefined : jsonPath}
            >
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
              to='/account/attach-qr-signer'
            >
              <FontAwesomeIcon icon={faQrcode} />
              <span>{t<string>('Attach QR-signer (Parity Signer, Keystone)')}</span>
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
                    icon={faCodeFork}
                    rotation={270}
                  />
                  <span>{ t<string>('Connect Ledger device')}</span>
                </Link>
              )
              : (
                <Link
                  className='account-menu-settings__menu-item-text'
                  onClick={_onOpenLedgerConnect}
                >
                  <FontAwesomeIcon
                    icon={faCodeFork}
                    rotation={270}
                  />
                  <span>{ t<string>('Connect Ledger device')}</span>
                </Link>
              )
            }
          </MenuSettingItem>
          <MenuSettingItem className='account-menu-settings__menu-item'>
            <Link
              className='account-menu-settings__menu-item-text'
              isDisabled={!mediaAllowed}
              title={!mediaAllowed
                ? t<string>('Camera access must be first enabled in the settings')
                : ''
              }
              to='/account/attach-read-only'
            >
              <FontAwesomeIcon icon={faEye} />
              <span>{t<string>('Attach readonly account')}</span>
            </Link>
          </MenuSettingItem>
        </div>
      </div>
      <Link
        className='setting-button'
        to={'/account/settings'}
      >
        <FontAwesomeIcon
          className='setting-icon'
          fontSize={24}
          icon={faCog}
        />
        <span className='setting-label'>{t('Settings')}</span>
      </Link>
    </Menu>
  );
}

export default React.memo(styled(AccountMenuSettings)(({ theme }: Props) => `
  margin-top: 50px;
  right: 5px;
  user-select: none;

  .no-account-warning {
    margin: 0 8px;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;

    .no-account-text {
      font-style: normal;
      font-weight: 400;
      font-size: 14px;
      line-height: 24px;
      color: ${theme.textColor2};
    }
  }

  .account-menu-settings {
    height: 140px;
    overflow-y: auto;
    scrollbar-width: none;
    padding: 0 16px;

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
      margin-right: 12px;
      width: 16px;
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
    padding: 8px 16px 14px;
    max-height: 365px;
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
    // padding: 8px 12px; -2px because border
    padding: 6px 10px;
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

  .setting-button {
    position: absolute;
    padding: 8px;
    bottom: 16px;
    right: 16px;
    height: 40px;
    width: 40px;
    border-radius: 40px;
    background: ${theme.secondaryColor};
    display: flex;
    align-items: center;
    overflow: hidden;
    transition: all ease-in-out ${transitionTime};

    .setting-icon {
      transition: all ease-in-out ${transitionTime};
      color: ${theme.textColor};
      transform: rotate(0deg);
    }

    .setting-label {
      margin-left: 8px;
      opacity: 0;
      color: ${theme.textColor};
      font-size: 15px;
      line-height: 26px;
      font-weight: 500;
      transition: all ease-in-out ${transitionTime};
    }
  }

  .setting-button:hover {
    width: 118px;

    .setting-icon {
      transform: rotate(360deg);
    }

    .setting-label {
      opacity: 1;
    }
  }

`));
