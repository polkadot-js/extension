// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import { faExpand, faList } from '@fortawesome/free-solid-svg-icons';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import styled, { ThemeContext } from 'styled-components';

import ActionText from '@polkadot/extension-koni-ui/components/ActionText';
import Checkbox from '@polkadot/extension-koni-ui/components/Checkbox';
import HorizontalLabelToggle from '@polkadot/extension-koni-ui/components/HorizontalLabelToggle';
import MenuDivider from '@polkadot/extension-koni-ui/components/MenuDivider';
import MenuItem from '@polkadot/extension-koni-ui/components/MenuItem';
import SimpleDropdown from '@polkadot/extension-koni-ui/components/SimpleDropdown';
import useIsPopup from '@polkadot/extension-koni-ui/hooks/useIsPopup';
import { setNotification, windowOpen } from '@polkadot/extension-koni-ui/messaging';
import Header from '@polkadot/extension-koni-ui/partials/Header';
import getLanguageOptions from '@polkadot/extension-koni-ui/util/getLanguageOptions';
import settings from '@polkadot/ui-settings';

import { ActionContext, themes, ThemeSwitchContext } from '../components';
import useTranslation from '../hooks/useTranslation';
import { Theme } from '../types';

interface Props extends ThemeProps {
  className?: string;
}

const notificationOptions = ['Extension', 'PopUp', 'Window']
  .map((item) => ({ text: item, value: item.toLowerCase() }));

function Settings ({ className }: Props): React.ReactElement {
  const { t } = useTranslation();
  const [camera, setCamera] = useState(settings.camera === 'on');
  const [notification, updateNotification] = useState(settings.notification);
  const themeContext = useContext(ThemeContext as React.Context<Theme>);
  const setTheme = useContext(ThemeSwitchContext);
  const isPopup = useIsPopup();
  const languageOptions = useMemo(() => getLanguageOptions(), []);
  const onAction = useContext(ActionContext);

  useEffect(() => {
    settings.set({ camera: camera ? 'on' : 'off' });
  }, [camera]);

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
    <>
      <div className={className}>
        <Header
          showBackArrow
          showSubHeader
          subHeaderName={t<string>('Settings')}
        />
        <MenuItem
          className='setting'
          title='Theme'
        >
          <HorizontalLabelToggle
            checkedLabel={t<string>('Dark')}
            className='kn-theme-setting'
            toggleFunc={_onChangeTheme}
            uncheckedLabel={t<string>('Light')}
            value={themeContext.id === themes.dark.id}
          />
        </MenuItem>
        <MenuItem
          className='setting'
          title={t<string>('Language')}
        >
          <SimpleDropdown
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
          <SimpleDropdown
            className='dropdown'
            label=''
            onChange={_onChangeNotification}
            options={notificationOptions}
            value={notification}
          />
        </MenuItem>
        {/* </div> */}

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
        <MenuDivider className='settings-menu-divider' />
        <MenuItem className='setting'>
          <ActionText
            className='manage-website-access'
            icon={faList}
            onClick={_goToAuthList}
            text={t<string>('Manage Website Access')}
          />
        </MenuItem>
        {isPopup && (
          <MenuItem className='setting'>
            <ActionText
              className='openWindow'
              icon={faExpand}
              onClick={_onWindowOpen}
              text={t<string>('Open extension in new window')}
            />
          </MenuItem>
        )}
      </div>
    </>
  );
}

export default styled(Settings)(({ theme }: Props) => `
  margin-top: -25px;
  padding-top: 25px;

  .kn-theme-setting {
    .kn-label {
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

  .manage-website-access, .openWindow {
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

  // .setting {
  //   > span {
  //     font-size: 16px;
  //     line-height: 26px;
  //   }
  // }

  &::-webkit-scrollbar {
    display: none;
  }
`);
