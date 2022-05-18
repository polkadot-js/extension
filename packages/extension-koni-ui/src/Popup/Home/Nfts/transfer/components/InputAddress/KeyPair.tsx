// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { reformatAddress } from '@subwallet/extension-koni-base/utils/utils';
import { Identicon } from '@subwallet/extension-koni-ui/components';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { IconTheme } from '@polkadot/react-identicon/types';
import { isUndefined } from '@polkadot/util';

interface Props {
  name?: string;
  address: string;
  className?: string;
  style?: Record<string, string>;
}

function getShortenText (text: string, cut = 6) {
  return `${text.slice(0, cut)}…${text.slice(-cut)}`;
}

function getName (address: string, name?: string): string {
  return isUndefined(name) ? address.length > 15 ? getShortenText(address) : address : name;
}

function KeyPair ({ address, className = '', name }: Props): React.ReactElement<Props> {
  const { icon, isEthereum, networkPrefix } = useSelector((state: RootState) => state.currentNetwork);
  const formattedAddress = reformatAddress(address, networkPrefix, isEthereum);

  return (
    <div className={`ui--KeyPair ${className}`}>
      <Identicon
        className='ui--KeyPair-icon'
        iconTheme={icon as IconTheme}
        prefix={networkPrefix}
        value={formattedAddress}
      />
      <div className='name'>
        {getName(formattedAddress, name)}
      </div>
      <div className='address'>
        {getShortenText(formattedAddress, 9)}
      </div>
    </div>
  );
}

export default React.memo(styled(KeyPair)`

`);
