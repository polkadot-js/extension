// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { wrapBytes } from '@subwallet/extension-dapp';
import DisplayPayload from '@subwallet/extension-web-ui/components/Qr/Display/DisplayPayload';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import { ExtrinsicPayload } from '@polkadot/types/interfaces';

interface Props extends ThemeProps {
  address: string;
  genesisHash: string;
  payload: ExtrinsicPayload | string;
}

const Component: React.FC<Props> = (props: Props) => {
  const { address, genesisHash, payload } = props;

  const payloadU8a = useMemo(() => typeof payload === 'string' ? wrapBytes(payload) : payload.toU8a(), [payload]);
  const isMessage = useMemo(() => typeof payload === 'string', [payload]);

  return (
    <DisplayPayload
      address={address}
      genesisHash={genesisHash}
      isEthereum={false}
      isHash={false}
      isMessage={isMessage}
      payload={payloadU8a}
    />
  );
};

const SubstrateQr = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default SubstrateQr;
