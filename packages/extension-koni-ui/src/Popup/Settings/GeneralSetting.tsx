// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useContext, useMemo, useState } from 'react';
import styled, { ThemeContext } from 'styled-components';

import { saveTheme, setNotification } from '@polkadot/extension-koni-ui/messaging';
import Header from '@polkadot/extension-koni-ui/partials/Header';
import getLanguageOptions from '@polkadot/extension-koni-ui/util/getLanguageOptions';
import settings from '@polkadot/ui-settings';

import { Dropdown, HorizontalLabelToggle, MenuItem, themes, ThemeSwitchContext } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { Theme } from '../../types';

interface Props extends ThemeProps {
  className?: string;
}

const notificationOptions = ['Extension', 'PopUp', 'Window']
  .map((item) => ({ text: item, value: item.toLowerCase() }));

function GeneralSetting ({ className }: Props): React.ReactElement {
  const { t } = useTranslation();
  const [notification, updateNotification] = useState(settings.notification);
  const [language, updateLanguage] = useState(settings.i18nLang === 'default' ? 'en' : settings.i18nLang);
  const themeContext = useContext(ThemeContext as React.Context<Theme>);
  const setTheme = useContext(ThemeSwitchContext);
  const languageOptions = useMemo(() => getLanguageOptions(), []);

  const _onChangeNotification = useCallback(
    (value: string): void => {
      setNotification(value).catch(console.error);

      updateNotification(value);
      settings.set({ notification: value });
    },
    []
  );

  const _onChangeTheme = useCallback(
    (checked: boolean): void => {
      saveTheme(checked ? 'dark' : 'light', () => {
        setTheme(checked ? 'dark' : 'light');
      }).catch((e) => console.log('There is problem when saveTheme', e));
    },
    [setTheme]
  );

  const _onChangeLang = useCallback(
    (value: string): void => {
      updateLanguage(value);
      settings.set({ i18nLang: value });
    },
    []
  );

  return (
    <>
      <div className={className}>
        <Header
          showBackArrow
          showSubHeader
          subHeaderName={t<string>('General Setting')}
          to='/account/settings'
        />
        <MenuItem
          className='setting'
          title='Theme'
        >
          <HorizontalLabelToggle
            checkedLabel={t<string>('Dark')}
            className='settings__theme-setting'
            toggleFunc={_onChangeTheme}
            uncheckedLabel={t<string>('Light')}
            value={themeContext.id === themes.dark.id}
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
            value={language}
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
      </div>
    </>
  );
}

export default styled(GeneralSetting)(({ theme }: Props) => `
  margin-top: -25px;
  padding-top: 25px;

  .settings__theme-setting {
    padding-top: 14px;
    .horizontal-label {
      font-size: 18px;
      line-height: 30px;
    }
  }

  .menu-items-wrapper {
    display: flex;
    align-items: center;
  }

  .settings-menu-divider {
    padding-top: 0;
  }

  .manage-website-access, .setting__action-text {
    > span {
      font-size: 16px;
      line-height: 26px;
      color: ${theme.textColor2};
      font-weight: 400;
    }
  }

  .checkbox {
    margin: 6px 0 14px 0;
  }

  &::-webkit-scrollbar {
    display: none;
  }
`);
