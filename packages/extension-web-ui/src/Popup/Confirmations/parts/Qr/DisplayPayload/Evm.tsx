// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import DisplayPayload from '@subwallet/extension-web-ui/components/Qr/Display/DisplayPayload';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import { u8aToU8a } from '@polkadot/util';

interface Props extends ThemeProps {
  address: string;
  hashPayload: string;
  isMessage: boolean;
}

const Component: React.FC<Props> = (props: Props) => {
  const { address, hashPayload, isMessage } = props;

  const payloadU8a = useMemo((): Uint8Array => u8aToU8a(hashPayload), [hashPayload]);

  return (
    <DisplayPayload
      address={address}
      genesisHash={''}
      isEthereum={true}
      isHash={false}
      isMessage={isMessage}
      payload={payloadU8a}
    />
  );
};

const EvmQr = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default EvmQr;
