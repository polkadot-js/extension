// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import Identicon from '@polkadot/extension-koni-ui/components/Identicon';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { getLogoByNetworkKey } from '@polkadot/extension-koni-ui/util';
import reformatAddress from '@polkadot/extension-koni-ui/util/reformatAddress';
import { IconTheme } from '@polkadot/react-identicon/types';
import { isUndefined } from '@polkadot/util';
import { isEthereumAddress } from '@polkadot/util-crypto';

interface Props {
  name?: string;
  address: string;
  className?: string;
  networkPrefix: number;
  iconName?: string;
  style?: Record<string, string>;
}

function getShortenText (text: string, cut = 6) {
  return `${text.slice(0, cut)}…${text.slice(-cut)}`;
}

function getName (address: string, name?: string): string {
  return isUndefined(name) ? address.length > 15 ? getShortenText(address) : address : name;
}

function DonateReceiveItem ({ address, className = '', iconName, name, networkPrefix }: Props): React.ReactElement<Props> {
  let formattedAddress = '';
  const icon = isEthereumAddress(address) ? 'ethereum' : 'polkadot';

  if (address !== '-') {
    formattedAddress = reformatAddress(address, networkPrefix);
  }

  return (
    <div className={className}>
      <div className={'key-pair'}>
        {iconName
          ? <img
            alt='logo'
            className='key-pair__icon'
            src={getLogoByNetworkKey(iconName)}
          />
          : <Identicon
            className='key-pair__icon'
            iconTheme={icon as IconTheme}
            prefix={networkPrefix}
            value={formattedAddress}
          />
        }

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

export default React.memo(styled(DonateReceiveItem)(({ theme }: ThemeProps) => `
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
    border-radius: 50%;
    pointer-events: none;
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
