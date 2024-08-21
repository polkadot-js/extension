// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CMD, CRYPTO_ETHEREUM, CRYPTO_SR25519, ETHEREUM_ID, SUBSTRATE_ID } from '@subwallet/extension-web-ui/constants';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import { numberToU8a, u8aConcat, u8aToU8a } from '@polkadot/util';
import { decodeAddress, isEthereumAddress } from '@polkadot/util-crypto';

import BytesQr from './BytesQr';

interface Props extends ThemeProps{
  address: string;
  isHash: boolean;
  genesisHash: string;
  payload: Uint8Array;
  isEthereum: boolean;
  isMessage: boolean;
  size?: string | number;
  style?: React.CSSProperties;
}

const Component = (props: Props) => {
  const { address, className, genesisHash, isEthereum, isHash, isMessage, payload, size = 264, style } = props;

  const cmd = useMemo(() => {
    if (isEthereum) {
      if (isMessage) {
        return isHash ? CMD.ETHEREUM.SIGN_HASH : CMD.ETHEREUM.SIGN_MESSAGE;
      } else {
        return CMD.ETHEREUM.SIGN_TRANSACTION;
      }
    } else {
      if (isMessage) {
        return CMD.SUBSTRATE.SIGN_MSG;
      } else {
        return isHash ? CMD.SUBSTRATE.SIGN_HASH : CMD.SUBSTRATE.SIGN_IMMORTAL;
      }
    }
  }, [isEthereum, isHash, isMessage]);

  const data = useMemo(() => {
    if (isEthereum) {
      return u8aConcat(ETHEREUM_ID, numberToU8a(cmd), decodeAddress(address), u8aToU8a(payload));
    } else {
      const isEvm = isEthereumAddress(address);
      const crypto = isEvm ? CRYPTO_ETHEREUM : CRYPTO_SR25519;

      return u8aConcat(SUBSTRATE_ID, crypto, new Uint8Array([cmd]), decodeAddress(address), u8aToU8a(payload), u8aToU8a(genesisHash));
    }
  }, [address, cmd, payload, genesisHash, isEthereum]);

  if (!data) {
    return null;
  }

  return (
    <BytesQr
      className={className}
      size= {size}
      style= {style}
      value= {data}
    />
  );
};

const DisplayPayload = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default DisplayPayload;
