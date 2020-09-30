// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Theme, ThemeProps } from '../types';

import React, { useCallback, useContext, useEffect, useState, useMemo } from 'react';
import styled, { ThemeContext } from 'styled-components';
import settings from '@polkadot/ui-settings';

import FullScreenIcon from '../assets/fullscreen.svg';
import { ActionText, Checkbox, Dropdown, Menu, MenuDivider, MenuItem, Svg, Switch, ThemeSwitchContext, themes } from '../components';
import useTranslation from '../hooks/useTranslation';
import { windowOpen } from '../messaging';
import getLanguageOptions from '../util/getLanguageOptions';

interface Option {
  text: string;
  value: string;
}

interface Props extends ThemeProps {
  className?: string;
  reference: React.MutableRefObject<null>;
}

const isPopup = window.innerWidth <= 560;
const prefixOptions = settings.availablePrefixes
  .filter(({ value }) => value !== -1)
  .map(({ text, value }): Option => ({ text, value: `${value}` }));

function MenuSettings ({ className, reference }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [camera, setCamera] = useState(settings.camera === 'on');
  const [prefix, setPrefix] = useState(`${settings.prefix === -1 ? 42 : settings.prefix}`);
  const themeContext = useContext<Theme>(ThemeContext);
  const setTheme = useContext(ThemeSwitchContext);
  const languageOptions = useMemo(() => getLanguageOptions(), []);

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

  const _onChangeTheme = useCallback(
    (checked: boolean): void => setTheme(checked ? 'dark' : 'light'),
    [setTheme]
  );

  const _onChangeLang = useCallback(
    (value: string): void => {
      settings.set({ i18nLang: value });
    },
    []
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
          checkedLabel='Dark'
          onChange={_onChangeTheme}
          uncheckedLabel='Light'
        />
      </MenuItem>
      <MenuDivider />
      <MenuItem
        className='setting'
        title={t<string>('External QR accounts and Access')}
      >
        <Checkbox
          checked={camera}
          className='checkbox'
          label={t<string>('Allow Camera Access')}
          onChange={setCamera}
        />
      </MenuItem>
      <MenuDivider />
      <MenuItem
        className='setting'
        title={t<string>('Display address format For')}
      >
        <Dropdown
          className='dropdown'
          label=''
          onChange={_onChangePrefix}
          options={prefixOptions}
          value={`${prefix}`}
        />
      </MenuItem>
      <MenuDivider />
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
      {isPopup && (
        <>
          <MenuDivider />
          <MenuItem className='setting'>
            <ActionText
              className='openWindow'
              icon={FullScreenIcon}
              onClick={windowOpen}
              text={t<string>('Open extension in new window')}
            />
          </MenuItem>
        </>
      )}
    </Menu>
  );
}

export default React.memo(styled(MenuSettings)(({ theme }: Props) => `
  margin-top: 50px;
  right: 24px;
  user-select: none;

  .openWindow {
    span {
      color: ${theme.textColor};
      font-size: ${theme.fontSize};
      font-weight: 600;
      line-height: ${theme.lineHeight};
      text-decoration: none;
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
      font-weight: 600;
      margin-bottom: 0;

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
