// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Theme, ThemeProps } from '../types';

import { faExpand, faTasks } from '@fortawesome/free-solid-svg-icons';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import styled, { ThemeContext } from 'styled-components';

import settings from '@polkadot/ui-settings';

import { ActionContext, ActionText, Checkbox, Dropdown, Menu, MenuDivider, MenuItem, Svg, Switch, themes, ThemeSwitchContext } from '../components';
import useIsPopup from '../hooks/useIsPopup';
import useTranslation from '../hooks/useTranslation';
import { setNotification, windowOpen } from '../messaging';
import getLanguageOptions from '../util/getLanguageOptions';

interface Option {
  text: string;
  value: string;
}

interface Props extends ThemeProps {
  className?: string;
  reference: React.MutableRefObject<null>;
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
  const themeContext = useContext(ThemeContext as React.Context<Theme>);
  const setTheme = useContext(ThemeSwitchContext);
  const isPopup = useIsPopup();
  const languageOptions = useMemo(() => getLanguageOptions(), []);
  const onAction = useContext(ActionContext);

  useEffect(() => {
    settings.set({ camera: camera ? 'on' : 'off' });
  }, [camera]);

  const _onChangePrefix = useCallback(
    (value: string): void => {
      setPrefix(value);
      settings.set({ prefix: parseInt(value, 10) });
    },
    []
  );

  const _onChangeNotification = useCallback(
    (value: string): void => {
      setNotification(value).catch(console.error);

      updateNotification(value);
      settings.set({ notification: value });
    },
    []
  );

  const _onChangeTheme = useCallback(
    (checked: boolean): void => setTheme(checked ? 'dark' : 'light'),
    [setTheme]
  );

  const _onWindowOpen = useCallback(
    () => windowOpen('/').catch(console.error),
    []
  );

  const _onChangeLang = useCallback(
    (value: string): void => {
      settings.set({ i18nLang: value });
    },
    []
  );

  const _goToAuthList = useCallback(
    () => {
      onAction('auth-list');
    }, [onAction]
  );

  return (
    <Menu
      className={className}
      reference={reference}
    >
      <MenuItem
        className='setting'
        title='Theme'
      >
        <Switch
          checked={themeContext.id === themes.dark.id}
          checkedLabel={t<string>('Dark')}
          onChange={_onChangeTheme}
          uncheckedLabel={t<string>('Light')}
        />
      </MenuItem>
      <MenuItem
        className='setting'
        title={t<string>('Display address format for')}
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
        title={t<string>('Language')}
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
        title={t<string>('Notifications')}
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
        title={t<string>('External accounts and Access')}
      >
        <Checkbox
          checked={camera}
          className='checkbox camera'
          label={t<string>('Allow QR Camera Access')}
          onChange={setCamera}
        />
      </MenuItem>
      <MenuDivider />
      <MenuItem className='setting'>
        <ActionText
          className='manageWebsiteAccess'
          // @ts-ignore
          icon={faTasks}
          onClick={_goToAuthList}
          text={t<string>('Manage Website Access')}
        />
      </MenuItem>
      {isPopup && (
        <MenuItem className='setting'>
          <ActionText
            className='openWindow'
            // @ts-ignore
            icon={faExpand}
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onClick={_onWindowOpen}
            text={t<string>('Open extension in new window')}
          />
        </MenuItem>
      )}
    </Menu>
  );
}

export default React.memo(styled(MenuSettings)(({ theme }: Props) => `
  margin-top: 50px;
  right: 24px;
  user-select: none;

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
`));
