// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { SignerPayload } from '@polkadot/api/types';
import { ExtrinsicPayload } from '@polkadot/types/interfaces';

import React, { useState } from 'react';
import { QrDisplayPayload, QrScanSignature } from '@polkadot/react-qr';
import { u8aToHex } from '@polkadot/util';

import { Button, Box } from '../../components';

interface Props {
  children?: React.ReactNode;
  className?: string;
  onSignature: (signature: string) => void;
  payload: ExtrinsicPayload;
  request: SignerPayload;
}

export default function Qr ({ children, className, onSignature, payload, request }: Props): React.ReactElement<Props> {
  const [showScan, setShowScan] = useState(false);
  const onShowQr = (): void => setShowScan(true);
  const onScan = (signature: Uint8Array): void => onSignature(u8aToHex(signature));

  return (
    <Box className={className}>
      {children}
      {showScan
        ? <QrScanSignature onScan={onScan} />
        : <QrDisplayPayload
          address={request.address}
          cmd={3}
          payload={payload.toU8a()}
        />
      }
      {!showScan && (
        <Button
          label='Scan signature via camera'
          onClick={onShowQr}
        />
      )}
    </Box>
  );
}
