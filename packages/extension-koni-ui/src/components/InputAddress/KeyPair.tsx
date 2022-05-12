// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Identicon from '@subwallet/extension-koni-ui/components/Identicon';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import reformatAddress from '@subwallet/extension-koni-ui/util/reformatAddress';
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
  let formattedAddress = '';

  if (address !== '-') {
    formattedAddress = reformatAddress(address, networkPrefix, isEthereum);
  }

  return (
    <div className={className}>
      <div className={'key-pair'}>
        <Identicon
          className='key-pair__icon'
          iconTheme={icon as IconTheme}
          prefix={networkPrefix}
          value={formattedAddress}
        />
        <div className='key-pair__name'>
          {getName(formattedAddress, name)}
        </div>
        <div className='key-pair__address'>
          {getShortenText(formattedAddress, 9)}
        </div>
      </div>
    </div>
  );
}

export default React.memo(styled(KeyPair)(({ theme }: ThemeProps) => `
  .key-pair {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    border-radius: 8px;
    background-color: transparent;
  }

  .key-pair__name {
    flex: 1;
    font-size: 15px;
    color: ${theme.textColor2};
    font-weight: 500;
  }

  .key-pair__address {
    color: ${theme.textColor2};
    font-weight: 400;
  }

  .key-pair:hover {
    .key-pair__name {
      color: ${theme.textColor};
    }
  }

  .key-pair__icon {
    min-width: 24px;
    width: 24px;
    height: 24px;
    margin-right: 16px;
  }

  .key-pair__icon .icon {
    width: 100%;
    height: 100%;

    svg, img {
      width: 100%;
      height: 100%;
    }
  }
`));
