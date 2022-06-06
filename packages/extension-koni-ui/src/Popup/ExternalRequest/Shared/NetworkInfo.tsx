// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { getLogoByGenesisHash } from '@subwallet/extension-koni-ui/util/logoByGenesisHashMap';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps{
  className?: string;
  network: NetworkJson
}

const NetworkInfo = (props: Props) => {
  const { className, network } = props;
  const { chain: text, genesisHash } = network;

  return (
    <div className={CN(className)}>
      <div
        className='network-item-container'
      >
        <img
          alt='logo'
          className={'network-logo'}
          src={getLogoByGenesisHash(genesisHash)}
        />

        <span className={'network-text'}>{text}</span>
      </div>
    </div>
  );
};

export default React.memo(styled(NetworkInfo)(({ theme }: Props) => `
  .network-item-container {
    cursor: pointer;
    display: flex;
    align-items: center;
    flex-direction: column;

    .network-logo {
      min-width: 45px;
      width: 45px;
      height: 45px;
      border-radius: 100%;
      overflow: hidden;
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
      border: 1px solid #fff;
      background: #fff;
      margin-bottom: 4px;
    }

    .network-text {
      font-size: 16px;
      line-height: 26px;
      color: ${theme.textColor};
    }
  }
`));
