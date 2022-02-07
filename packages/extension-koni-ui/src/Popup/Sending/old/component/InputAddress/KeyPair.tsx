// Copyright 2017-2021 @polkadot/react-components authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';


import {isUndefined} from '@polkadot/util';
import {IconTheme} from "@polkadot/react-identicon/types";
import {reformatAddress} from "@polkadot/extension-koni-base/utils/utils";
import {Identicon} from "@polkadot/extension-koni-ui/components";
import {useSelector} from "react-redux";
import {RootState} from "@polkadot/extension-koni-ui/stores";

interface Props {
  name?: string;
  address: string;
  className?: string;
  style?: Record<string, string>;
}

function getShortenText(text: string, cut: number =  6) {
  return `${text.slice(0, cut)}…${text.slice(-cut)}`;
}

function getName(address: string, name?: string): string {
  return isUndefined(name) ? address.length > 15 ? getShortenText(address) : address : name;
}

function KeyPair ({name, address, className = '' }: Props): React.ReactElement<Props> {
  const {networkPrefix, icon, isEthereum} = useSelector((state: RootState) => state.currentNetwork);
  const formattedAddress = reformatAddress(address, networkPrefix, isEthereum);

  return (
    <div className={`ui--KeyPair ${className}`}>
      <Identicon
        className='ui--KeyPair-icon'
        prefix={networkPrefix}
        iconTheme={icon as IconTheme}
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
