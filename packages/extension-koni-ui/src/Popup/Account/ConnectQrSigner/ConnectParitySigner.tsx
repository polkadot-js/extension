// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { LogosMap } from '@subwallet/extension-koni-ui/assets';
import ConnectQrSigner from '@subwallet/extension-koni-ui/Popup/Account/ConnectQrSigner/index';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

type Props = ThemeProps;

const Component: React.FC<ThemeProps> = () => {
  const { t } = useTranslation();

  return (
    <ConnectQrSigner
      description={t('Parity Signer')}
      instructionUrl={''}
      logoUrl={LogosMap.parity}
      subTitle={t('Open Parity Signer on your phone to connect wallet')}
      title={t('Connect Parity Signer')}
    />
  );
};

const ConnectParitySigner = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {

  };
});

export default ConnectParitySigner;
