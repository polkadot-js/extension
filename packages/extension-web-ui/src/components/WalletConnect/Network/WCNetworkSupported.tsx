// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps, WalletConnectChainInfo } from '@subwallet/extension-web-ui/types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import WCNetworkBase from './WCNetworkBase';

interface Props extends ThemeProps {
  id: string;
  networks: WalletConnectChainInfo[];
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, id, networks } = props;

  const { t } = useTranslation();
  const networkNumber = networks.length;

  return (
    <WCNetworkBase
      className={className}
      content={t('{{number}} {{network}} support', { replace: { number: networkNumber, network: networkNumber > 1 ? 'networks' : 'network' } })}
      contentNetworks={networks}
      id={id}
      networks={networks}
      subTitle={t('{{number}} {{network}} support', { replace: { number: networkNumber, network: networkNumber > 1 ? 'networks' : 'network' } })}
      title={t('Supported networks')}
    />
  );
};

const WCNetworkSupported = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default WCNetworkSupported;
