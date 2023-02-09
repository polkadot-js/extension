// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Theme, ThemeProps } from '../types';

import { faCog, faLock, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AccountContext, ActionContext, Button } from '@subwallet/extension-koni-ui/components';
import InputFilter from '@subwallet/extension-koni-ui/components/InputFilter';
import Link from '@subwallet/extension-koni-ui/components/Link';
import Menu from '@subwallet/extension-koni-ui/components/Menu';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { keyringLock } from '@subwallet/extension-koni-ui/messaging';
import AccountsTree from '@subwallet/extension-koni-ui/Popup/Accounts_old/AccountsTree';
import { noop } from '@subwallet/extension-koni-ui/util/function';
import React, { useCallback, useContext, useState } from 'react';
import styled, { ThemeContext } from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  reference: React.MutableRefObject<null>;
  onFilter?: (filter: string) => void;
  closeSetting?: () => void;
  changeAccountCallback?: (address: string) => void;
}

const createAccountPath = '/account/new';

function AccountMenuSettings ({ changeAccountCallback, className, closeSetting, onFilter, reference }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('');
  const { hierarchy } = useContext(AccountContext);

  const filteredAccount = filter
    ? hierarchy.filter((account) =>
      account.name?.toLowerCase().includes(filter.toLowerCase())
    )
    : hierarchy;

  const onAction = useContext(ActionContext);
  const themeContext = useContext(ThemeContext as React.Context<Theme>);

  const _openCreateAccount = useCallback(
    () => {
      window.localStorage.setItem('popupNavigation', createAccountPath);
      onAction(createAccountPath);
    }, [onAction]
  );

  const _onChangeFilter = useCallback((filter: string) => {
    setFilter(filter);
    onFilter && onFilter(filter);
  }, [onFilter]);

  const onLogout = useCallback(() => {
    keyringLock().then(() => {
      window.localStorage.setItem('popupNavigation', '/');
      onAction('/');
    }).catch(noop);
  }, [onAction]);

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
          <Button
            className='new-account-button'
            onClick={_openCreateAccount}
          >
            <FontAwesomeIcon
              className='new-account-icon'
              icon={faPlus}
              size={'1x'}
            />
            <span className='new-account-text'>{ t('Add Account')}</span>
          </Button>
          <div className='button-action-container'>
            <Link
              className='footer-action-button'
              onClick={onLogout}
            >
              <FontAwesomeIcon
                className={'footer-action-icon'}
                icon={faLock}
                size={'lg'}
              />
            </Link>
            <Link
              className='footer-action-button'
              to={'/account/settings'}
            >
              <FontAwesomeIcon
                className={'footer-action-icon'}
                icon={faCog}
                size={'lg'}
              />
            </Link>
          </div>
        </div>
      </div>
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
    height: 320px;
    overflow-y: auto;
    scrollbar-width: none;
    padding: 0;
    margin: 8px 0 16px;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .button-action-container {
    display: flex;
    flex-direction: row;
    align-items: center;

    .footer-action-button {
      color: ${theme.textColor2};
      background: ${theme.backgroundAccountAddress};
      width: 40px;
      height: 40px;
      border-radius: 40px;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      cursor: pointer;

      .footer-action-icon {
        width: 20px;
      }

      &:first-child {
        margin-right: 12px;
      }

      &:hover {
        color: ${theme.iconHoverColor};
      }
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

  .new-account-button {
    color: ${theme.buttonTextColor2};
    background: ${theme.backgroundAccountAddress};
    width: 150px;
    border-radius: 20px;
    padding: 7px 16px;
    height: 40px;

    .children {
      display: flex;
      flex-direction: row;
      align-items: center;

      .new-account-text {
        font-style: normal;
        font-weight: 500;
        font-size: 15px;
        line-height: 26px;
      }

      .new-account-icon {
        margin-right: 8px;
        width: 16px;
      }
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
    padding: 20px 16px;
    border-top: 2px solid ${theme.menuItemsBorder};
  }

  .account-menu-settings-items-wrapper {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .account-menu-settings__input-filter {
    width: 218px;
  }

  .account-menu-settings__input-filter > input {
    height: 40px;
  }

`));
