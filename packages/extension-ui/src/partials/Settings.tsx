// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useCallback, useContext, useState, useEffect } from 'react';
import styled, { ThemeContext } from 'styled-components';
import { setSS58Format } from '@polkadot/util-crypto';
import settings from '@polkadot/ui-settings';

import FullScreenIcon from '../assets/fullscreen.svg';
import { ActionText, Checkbox, Dropdown, Menu, Svg, Switch, ThemeSwitchContext, Title, themes } from '../components';
import { windowOpen } from '../messaging';

interface Option {
  text: string;
  value: string;
}

const isPopup = window.innerWidth <= 480;
const prefixOptions = settings.availablePrefixes.map(({ text, value }): Option => ({
  text: value === -1
    ? 'Default'
    : text,
  value: `${value}`
}));

export default function Settings ({ reference }: { reference: React.MutableRefObject<null> }): React.ReactElement {
  const [camera, setCamera] = useState(settings.camera === 'on');
  const [prefix, setPrefix] = useState(`${settings.prefix}`);
  const themeContext = useContext(ThemeContext);
  const setTheme = useContext(ThemeSwitchContext);

  useEffect(() => {
    settings.set({ camera: camera ? 'on' : 'off' });
  }, [camera]);

  // FIXME check against index, we need a better solution
  const _onChangePrefix = useCallback(
    (value: string): void => {
      const prefix = parseInt(value, 10);

      setSS58Format(prefix === -1 ? 42 : prefix);
      setPrefix(value);

      settings.set({ prefix });

      // FIXME We don't want to reload here
      location.reload();
    },
    []
  );

  const _onChangeTheme = useCallback(
    (checked: boolean): void => setTheme(checked ? 'dark' : 'light'),
    [setTheme]
  );

  return (
    <SettingsMenu reference={reference}>
      <Setting>
        <SettingTitle>Theme</SettingTitle>
        <Switch
          checked={themeContext.id === themes.dark.id}
          checkedLabel='Dark'
          onChange={_onChangeTheme}
          uncheckedLabel='Light'
        />
      </Setting>
      <Setting>
        <SettingTitle>External QR accounts and Access</SettingTitle>
        <CheckboxSetting
          checked={camera}
          label='Allow Camera Access'
          onChange={setCamera}
        />
      </Setting>
      <Setting>
        <SettingTitle>Display address format For:</SettingTitle>
        <DropdownSetting
          label=''
          onChange={_onChangePrefix}
          options={prefixOptions}
          value={`${prefix}`}
        />
      </Setting>
      {isPopup && (
        <Setting>
          <OpenInNewWindowButton
            icon={FullScreenIcon}
            onClick={windowOpen}
            text='Open extension in new window'
          />
        </Setting>
      )}
    </SettingsMenu>
  );
}

const SettingsMenu = styled(Menu)`
  margin-top: 56px;
  right: 24px;
  user-select: none;
`;

const CheckboxSetting = styled(Checkbox)`
  font-size: 15px;
  font-weight: 600;
  line-height: 20px;
  color: ${({ theme }): string => theme.textColor};
  label {
    color: ${({ theme }): string => theme.textColor};
  }
`;

const DropdownSetting = styled(Dropdown)`
  background: ${({ theme }): string => theme.background};
  margin-top: 9px;
  margin-bottom: 12px;
  width : 100%;
  margin-right: 0;
`;

const SettingTitle = styled(Title)`
  margin: 0;
`;

const Setting = styled.div`
  padding: 0 16px;
  max-width: 100%;
  & + & {
    padding-top: 18px;
    border-top: 1px solid ${({ theme }): string => theme.inputBorderColor};
  }
`;

const OpenInNewWindowButton = styled(ActionText)`
  span {
    color: ${({ theme }): string => theme.textColor};
    text-decoration: none;
    font-weight: 600;
    font-size: ${({ theme }): string => theme.fontSize};
    line-height: ${({ theme }): string => theme.lineHeight};
  }

  ${Svg} {
    width: 20px;
    height: 20px;
    top: 4px;
    background: ${({ theme }): string => theme.textColor};
  }
`;
