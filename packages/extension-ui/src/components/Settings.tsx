// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useState, useEffect } from 'react';
import Menu from './Menu';
import Title from './Title';
import Checkbox from './Checkbox';
import ActionText from './ActionText';
import Svg from './Svg';
import { setSS58Format } from '@polkadot/util-crypto';
import settings from '@polkadot/ui-settings';
import styled from 'styled-components';
import Dropdown from './Dropdown';
import { windowOpen } from '../messaging';
import FullScreenIcon from '../assets/fullscreen.svg';

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

export default function Settings (): React.ReactElement {
  const [camera, setCamera] = useState(settings.camera === 'on');
  const [prefix, setPrefix] = useState(`${settings.prefix}`);

  useEffect(() => {
    if (camera) {
      settings.set({ camera: 'on' });
    } else {
      settings.set({ camera: 'off' });
    }
  }, [camera]);

  // FIXME check against index, we need a better solution
  const _onChangePrefix = (value: string): void => {
    const prefix = parseInt(value, 10);

    setSS58Format(prefix === -1 ? 42 : prefix);
    setPrefix(value);

    settings.set({ prefix });
    location.reload();
  };

  return (
    <SettingsMenu>
      <Setting>
        <SettingTitle>External QR accounts and Access</SettingTitle>
        <CheckboxSetting
          checked={camera}
          onChange={setCamera}
          label='Allow Camera Access'
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
            onClick={windowOpen}
            text='Open extension in new window'
            icon={FullScreenIcon}
          />
        </Setting>
      )}
    </SettingsMenu>
  );
}

const SettingsMenu = styled(Menu)`
  margin-top: 56px;
  right: 30px;
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
