// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useState } from 'react';
import settings from '@polkadot/ui-settings';
import { setSS58Format } from '@polkadot/util-crypto';

import { Button, Dropdown, Header } from '../../components';
import { windowOpen } from '../../messaging';
import { Back } from '../../partials';

interface Option {
  text: string;
  value: string;
}

// There are probably better ways, but since we set the popup size, use that
const isPopup = window.innerWidth <= 480;
const cameraOptions = settings.availableCamera.map(({ text, value }): Option => ({ text, value: `${value}` }));
const prefixOptions = settings.availablePrefixes.map(({ text, value }): Option => ({
  text: value === -1
    ? 'Default (Substrate or as specified)'
    : text,
  value: `${value}`
}));

export default function Settings (): React.ReactElement<{}> {
  const [camera, setCamera] = useState(settings.camera);
  const [prefix, setPrefix] = useState(`${settings.prefix}`);

  const _onChangeCamera = (camera: string): void => {
    setCamera(camera);

    settings.set({ camera });
  };

  // FIXME check against index, we need a better solution
  const _onChangePrefix = (value: string): void => {
    const prefix = parseInt(value, 10);

    setSS58Format(prefix === -1 ? 42 : prefix);
    setPrefix(value);

    settings.set({ prefix });
  };

  return (
    <div>
      <Header label='settings' />
      <Back />
      <Dropdown
        label='display addresses formatted for'
        onChange={_onChangePrefix}
        options={prefixOptions}
        value={`${prefix}`}
      />
      <Dropdown
        label='external QR accounts and access'
        onChange={_onChangeCamera}
        options={cameraOptions}
        value={camera}
      />
      {isPopup && (
        <Button
          label='Open extension in new window'
          onClick={windowOpen}
        />
      )}
    </div>
  );
}
