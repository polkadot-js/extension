// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faExpand, faTasks } from '@fortawesome/free-solid-svg-icons';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { settings } from '@polkadot/ui-settings';

import { ActionContext, ActionText, Checkbox, chooseTheme, Dropdown, Menu, MenuDivider, MenuItem, Switch, ThemeSwitchContext } from '../components/index.js';
import { useIsPopup, useTranslation } from '../hooks/index.js';
import { setNotification, windowOpen } from '../messaging.js';
import { styled } from '../styled.js';
import getLanguageOptions from '../util/getLanguageOptions.js';

interface Option {
  text: string;
  value: string;
}

interface Props {
  className?: string;
  reference: React.RefObject<HTMLDivElement | null>;
}

const notificationOptions = ['Extension', 'PopUp', 'Window']
  .map((item) => ({ text: item, value: item.toLowerCase() }));

const prefixOptions = settings.availablePrefixes
  .filter(({ value }) => value !== -1)
  .map(({ text, value }): Option => ({ text, value: `${value}` }));

function MenuSettings ({ className, reference }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [camera, setCamera] = useState(settings.camera === 'on');
  const [prefix, setPrefix] = useState(`${settings.prefix === -1 ? 42 : settings.prefix}`);
  const [notification, updateNotification] = useState(settings.notification);
  const [theme, setTheme] = useState(chooseTheme());
  const setThemeContext = useContext(ThemeSwitchContext);
  const isPopup = useIsPopup();
  const languageOptions = useMemo(() => getLanguageOptions(), []);
  const onAction = useContext(ActionContext);
  const _ledgerAppOptions = settings.availableLedgerApp;

  useEffect(() => {
    settings.set({ camera: camera ? 'on' : 'off' });
  }, [camera]);

  const _onChangePrefix = useCallback(
    (value: string): void => {
      setPrefix(value);
      settings.set({ prefix: parseInt(value, 10) });
    }, []
  );

  const _onChangeNotification = useCallback(
    (value: string): void => {
      setNotification(value).catch(console.error);

      updateNotification(value);
      settings.set({ notification: value });
    }, []
  );

  const _onSetTheme = useCallback(
    (checked: boolean): void => {
      const theme = checked ? 'dark' : 'light';

      setThemeContext(theme);
      setTheme(theme);
    },
    [setThemeContext]
  );

  const _onWindowOpen = useCallback(
    (): void => {
      windowOpen('/').catch(console.error);
    }, []
  );

  const _onChangeLang = useCallback(
    (value: string): void => {
      settings.set({ i18nLang: value });
    }, []
  );

  const _onChangeLedgerApp = useCallback(
    (value: string): void => {
      settings.set({ ledgerApp: value });
    }, []
  );

  const _goToAuthList = useCallback(
    () => {
      onAction('auth-list');
    }, [onAction]
  );

  return (
    <Menu
      className={className}
      ref={reference}
    >
      <MenuItem
        className='setting'
        title='Theme'
      >
        <Switch
          checked={theme === 'dark'}
          checkedLabel={t('Dark')}
          onChange={_onSetTheme}
          uncheckedLabel={t('Light')}
        />
      </MenuItem>
      <MenuItem
        className='setting'
        title={t('Display address format for')}
      >
        <Dropdown
          className='dropdown'
          label=''
          onChange={_onChangePrefix}
          options={prefixOptions}
          value={`${prefix}`}
        />
      </MenuItem>
      <MenuItem
        className='setting'
        title={t('Ledger App')}
      >
        <Dropdown
          className='dropdown'
          label=''
          onChange={_onChangeLedgerApp}
          options={_ledgerAppOptions}
          value={settings.ledgerApp}
        />
      </MenuItem>
      <MenuItem
        className='setting'
        title={t('Language')}
      >
        <Dropdown
          className='dropdown'
          label=''
          onChange={_onChangeLang}
          options={languageOptions}
          value={settings.i18nLang}
        />
      </MenuItem>
      <MenuItem
        className='setting'
        title={t('Notifications')}
      >
        <Dropdown
          className='dropdown'
          label=''
          onChange={_onChangeNotification}
          options={notificationOptions}
          value={notification}
        />
      </MenuItem>
      <MenuItem
        className='setting'
        title={t('External accounts and Access')}
      >
        <Checkbox
          checked={camera}
          className='checkbox camera'
          label={t('Allow QR Camera Access')}
          onChange={setCamera}
        />
      </MenuItem>
      <MenuDivider />
      <MenuItem className='setting'>
        <ActionText
          className='manageWebsiteAccess'
          icon={faTasks}
          onClick={_goToAuthList}
          text={t('Manage Website Access')}
        />
      </MenuItem>
      {isPopup && (
        <MenuItem className='setting'>
          <ActionText
            className='openWindow'
            icon={faExpand}
            onClick={_onWindowOpen}
            text={t('Open extension in new window')}
          />
        </MenuItem>
      )}
    </Menu>
  );
}

export default React.memo(styled(MenuSettings)<Props>`
  margin-top: 50px;
  right: 24px;
  user-select: none;

  .openWindow, .manageWebsiteAccess{
    span {
      color: var(--textColor);
      font-size: var(--fontSize);
      line-height: var(--lineHeight);
      text-decoration: none;
      vertical-align: middle;
    }

    .Comp--Svg {
      background: var(--textColor);
      height: 20px;
      top: 4px;
      width: 20px;
    }
  }

  > .setting {
    > .checkbox {
      color: var(--textColor);
      line-height: 20px;
      font-size: 15px;
      margin-bottom: 0;

      &.ledger {
        margin-top: 0.2rem;
      }

      label {
        color: var(--textColor);
      }
    }

    > .dropdown {
      background: var(--background);
      margin-bottom: 0;
      margin-top: 9px;
      margin-right: 0;
      width: 100%;
    }
  }
`);
