// Copyright 2019-2020 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useEffect } from 'react';

interface ScanType {
  isAddress: boolean;
  content: string;
  genesisHash: string;
  name?: string;
}

interface Props {
  className?: string;
  onError?: (error: Error) => void;
  onScan: (scanned: ScanType) => void;
  size?: string | number;
  style?: React.CSSProperties;
}

export const mockedAccount = {
  content: '12bxf6QJS5hMJgwbJMDjFot1sq93EvgQwyuPWENr9SzJfxtN',
  expectedBannerChain: 'Polkadot',
  genesisHash: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
  isAddress: true,
  name: 'My Polkadot Account'
};

export const QrScanAddress = ({ onScan }: Props): React.ReactElement => {
  useEffect(() => {
    onScan(mockedAccount);
  }, [onScan]);

  return <></>;
};
