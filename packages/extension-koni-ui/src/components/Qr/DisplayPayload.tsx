// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import QrDisplay from '@subwallet/extension-koni-ui/components/Qr/QrDisplay';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import { createSignPayload } from '@polkadot/react-qr/util';
import { u8aConcat, u8aToU8a } from '@polkadot/util';
import { decodeAddress } from '@polkadot/util-crypto';

interface Props extends ThemeProps{
  address: string;
  className?: string;
  cmd: number;
  genesisHash: Uint8Array | string;
  payload: Uint8Array;
  isEthereum: boolean;
  size?: string | number;
  style?: React.CSSProperties;
}

const ETHEREUM_ID = new Uint8Array([0x45]);
const ETHEREUM_TX_CMD = new Uint8Array([0x01]);

const DisplayPayload = (props: Props) => {
  const { address, className, cmd, genesisHash, isEthereum, payload, size, style } = props;

  const data = useMemo(() => {
    if (isEthereum) {
      return u8aConcat(ETHEREUM_ID, ETHEREUM_TX_CMD, decodeAddress(address), u8aToU8a(payload));
    } else {
      return createSignPayload(address, cmd, payload, genesisHash);
    }
  }, [address, cmd, payload, genesisHash, isEthereum]);

  if (!data) {
    return null;
  }

  return (
    <QrDisplay
      className={className}
      size= {size}
      style= {style}
      value= {data}
    />
  );
};

export default React.memo(styled(DisplayPayload)(({ theme }: Props) => `

`));
