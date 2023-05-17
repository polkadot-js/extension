// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import DefaultLogosMap from '@subwallet/extension-koni-ui/assets/logo';
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
      description={t('Keystone will provide you QR code to scan')}
      instructionUrl={t('Connect your QR wallet')}
      logoUrl={DefaultLogosMap.keystone}
      subTitle={t('Select the SubWallet option in the “Software Wallet” menu available in your Keystone')}
      title={t('Connect your Keystone')}
    />
  );
};

const ConnectKeystone = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {

  };
});

export default ConnectKeystone;
