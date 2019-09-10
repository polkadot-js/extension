// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Prefix } from '@polkadot/util-crypto/address/types';

import React, { useState } from 'react';
import settings from '@polkadot/ui-settings';
import { setAddressPrefix } from '@polkadot/util-crypto';

import { Button, Dropdown, Header } from '../../components';
import { windowOpen } from '../../messaging';
import { Back } from '../../partials';

// There are probably better ways, but since we set the popup size, use that
const isPopup = window.innerWidth <= 480;
const options = settings.availablePrefixes.map(({ text, value }): { text: string; value: string } => ({
  text: value === -1
    ? 'Default (Substrate or as specified)'
    : text,
  value: `${value}`
}));

export default function Settings (): React.ReactElement<{}> {
  const [prefix, setPrefix] = useState(`${settings.prefix}`);

  // FIXME check against index, we need a better solution
  const _onChangePrefix = (value: string): void => {
    const prefix = parseInt(value, 10) as Prefix;

    setPrefix(value);
    setAddressPrefix((prefix as number) === -1 ? 42 : prefix);

    settings.set({ prefix });
  };

  return (
    <div>
      <Header label='settings' />
      <Back />
      <Dropdown
        label='display addresses formatted for'
        onChange={_onChangePrefix}
        options={options}
        value={`${prefix}`}
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
