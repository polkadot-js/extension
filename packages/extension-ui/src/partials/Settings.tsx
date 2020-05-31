// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Theme, ThemeProps } from '../types';

import React, { useCallback, useContext, useState, useEffect } from 'react';
import styled, { ThemeContext } from 'styled-components';
import settings from '@polkadot/ui-settings';

import FullScreenIcon from '../assets/fullscreen.svg';
import { ActionText, Checkbox, Dropdown, Menu, Svg, Switch, ThemeSwitchContext, Title, themes } from '../components';
import { windowOpen } from '../messaging';

interface Option {
  text: string;
  value: string;
}

interface Props extends ThemeProps {
  className?: string;
  reference: React.MutableRefObject<null>;
}

const isPopup = window.innerWidth <= 480;
const prefixOptions = settings.availablePrefixes
  .filter(({ value }) => value !== -1)
  .map(({ text, value }): Option => ({ text, value: `${value}` }));

function Settings ({ className, reference }: Props): React.ReactElement<Props> {
  const [camera, setCamera] = useState(settings.camera === 'on');
  const [prefix, setPrefix] = useState(`${settings.prefix === -1 ? 42 : settings.prefix}`);
  const themeContext = useContext<Theme>(ThemeContext);
  const setTheme = useContext(ThemeSwitchContext);

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

  return (
    <Menu
      className={className}
      reference={reference}
    >
      <div className='setting'>
        <SettingTitle>Theme</SettingTitle>
        <Switch
          checked={themeContext.id === themes.dark.id}
          checkedLabel='Dark'
          onChange={_onChangeTheme}
          uncheckedLabel='Light'
        />
      </div>
      <div className='setting'>
        <SettingTitle>External QR accounts and Access</SettingTitle>
        <CheckboxSetting
          checked={camera}
          label='Allow Camera Access'
          onChange={setCamera}
        />
      </div>
      <div className='setting'>
        <SettingTitle>Display address format For:</SettingTitle>
        <DropdownSetting
          label=''
          onChange={_onChangePrefix}
          options={prefixOptions}
          value={`${prefix}`}
        />
      </div>
      {isPopup && (
        <div className='setting'>
          <OpenInNewWindowButton
            icon={FullScreenIcon}
            onClick={windowOpen}
            text='Open extension in new window'
          />
        </div>
      )}
    </Menu>
  );
}

const CheckboxSetting = styled(Checkbox)`
  font-size: 15px;
  font-weight: 600;
  line-height: 20px;
  color: ${({ theme }: ThemeProps) => theme.textColor};
  label {
    color: ${({ theme }: ThemeProps) => theme.textColor};
  }
`;

const DropdownSetting = styled(Dropdown)`
  background: ${({ theme }: ThemeProps) => theme.background};
  margin-top: 9px;
  margin-bottom: 12px;
  width : 100%;
  margin-right: 0;
`;

const SettingTitle = styled(Title)`
  margin: 0;
`;

const OpenInNewWindowButton = styled(ActionText)`
  span {
    color: ${({ theme }: ThemeProps) => theme.textColor};
    text-decoration: none;
    font-weight: 600;
    font-size: ${({ theme }: ThemeProps) => theme.fontSize};
    line-height: ${({ theme }: ThemeProps) => theme.lineHeight};
  }

  ${Svg} {
    width: 20px;
    height: 20px;
    top: 4px;
    background: ${({ theme }: ThemeProps) => theme.textColor};
  }
`;

export default React.memo(styled(Settings)`
  margin-top: 56px;
  right: 24px;
  user-select: none;

  .setting {
    padding: 0 16px;
    max-width: 100%;
  }

  .setting+.setting {
    padding-top: 18px;
    border-top: 1px solid ${({ theme }: Props): string => theme.inputBorderColor};
  }
`);
