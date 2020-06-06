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
        <Title className='title'>Theme</Title>
        <Switch
          checked={themeContext.id === themes.dark.id}
          checkedLabel='Dark'
          onChange={_onChangeTheme}
          uncheckedLabel='Light'
        />
      </div>
      <div className='setting'>
        <Title className='title'>External QR accounts and Access</Title>
        <Checkbox
          checked={camera}
          className='checkbox'
          label='Allow Camera Access'
          onChange={setCamera}
        />
      </div>
      <div className='setting'>
        <Title className='title'>Display address format For:</Title>
        <Dropdown
          className='dropdown'
          label=''
          onChange={_onChangePrefix}
          options={prefixOptions}
          value={`${prefix}`}
        />
      </div>
      {isPopup && (
        <div className='setting'>
          <ActionText
            className='openWindow'
            icon={FullScreenIcon}
            onClick={windowOpen}
            text='Open extension in new window'
          />
        </div>
      )}
    </Menu>
  );
}

export default React.memo(styled(Settings)(({ theme }: Props) => `
  margin-top: 56px;
  right: 50px; // 24 + 18 + 8
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
    padding: 0 16px;
    max-width: 100%;

    > .checkbox {
      color: ${theme.textColor};
      line-height: 20px;
      font-size: 15px;
      font-weight: 600;

      label {
        color: ${theme.textColor};
      }
    }

    > .dropdown {
      background: ${theme.background};
      margin-bottom: 12px;
      margin-top: 9px;
      margin-right: 0;
      width: 100%;
    }

    > .title {
      margin: 0;
    }
  }

  .setting+.setting {
    padding-top: 18px;
    border-top: 1px solid ${theme.inputBorderColor};
  }
`));
