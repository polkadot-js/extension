// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { getLogoByGenesisHash, getLogoEthereum } from '@subwallet/extension-koni-ui/util/logoByGenesisHashMap';
import CN from 'classnames';
import React, { useMemo } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps{
  className?: string;
  network: NetworkJson;
  forceEthereum?: boolean;
}

const NetworkInfo = (props: Props) => {
  const { className, forceEthereum, network } = props;
  const { chain, genesisHash } = network;

  const text = useMemo(() => {
    return forceEthereum ? 'EVM' : chain;
  }, [chain, forceEthereum]);

  const logo = useMemo(() => {
    return forceEthereum ? getLogoEthereum() : getLogoByGenesisHash(genesisHash);
  }, [genesisHash, forceEthereum]);

  return (
    <div className={CN(className)}>
      <div
        className='network-item-container'
      >
        <img
          alt='logo'
          className={'network-logo'}
          src={logo}
        />

        <span className={'network-text'}>{text}</span>
      </div>
    </div>
  );
};

export default React.memo(styled(NetworkInfo)(({ theme }: Props) => `
  display: flex;
  align-items: center;
  justify-content: center;

  .network-item-container {
    cursor: pointer;
    display: flex;
    align-items: center;
    flex-direction: row;
    justify-content: center;
    height: 40px;
    max-width: 240px;
    background: ${theme.backgroundAccountAddress};
    border-radius: 5px;
    padding: 6px 10px;

    .network-logo {
      min-width: 28px;
      width: 28px;
      height: 28px;
      border-radius: 100%;
      overflow: hidden;
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
      border: 1px solid #fff;
      background: #fff;
      margin-right: 8px;
    }

    .network-text {
      font-style: normal;
      font-weight: 400;
      font-size: 14px;
      line-height: 24px;
      color: ${theme.textColor2};
    }
  }
`));
