// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useState } from 'react';
import settings from '@polkadot/ui-settings';

import { Dropdown, Header } from '../../components';
import { Back } from '../../partials';

const options = settings.availablePrefixes.map(({ text, value }): { text: string; value: string } => ({
  text: value === -1
    ? 'Substrate (default)'
    : text,
  value: `${value}`
}));

export default function Settings (): React.ReactElement<{}> {
  const [prefix, setPrefix] = useState(`${settings.prefix}`);

  const _onChangePrefix = (value: string): void => {
    const prefix = parseInt(value, 10);

    settings.set({ prefix });
    setPrefix(value);
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
    </div>
  );
}
