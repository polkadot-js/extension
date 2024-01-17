// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps, WalletConnectChainInfo } from '@subwallet/extension-web-ui/types';
import React, { useMemo } from 'react';
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

  const connectedNetworks = useMemo(() => networks.filter((network) => network.supported), [networks]);

  const showNetworks = useMemo((): WalletConnectChainInfo[] => {
    const connectedNetworks = networks.filter((network) => network.supported);
    const unSupportNetworks = networks.filter((network) => !network.supported);

    const unSupportNetwork: WalletConnectChainInfo | null = unSupportNetworks.length
      ? (
        {
          supported: false,
          chainInfo: {
            slug: '',
            name: t('{{number}} unknown network', { replace: { number: unSupportNetworks.length } })
          },
          slug: ''
        }
      )
      : null;

    return [...connectedNetworks, ...(unSupportNetwork ? [unSupportNetwork] : [])];
  }, [networks, t]);

  const networkNumber = connectedNetworks.length;

  return (
    <WCNetworkBase
      className={className}
      content={t('{{number}} networks connected', { replace: { number: networkNumber } })}
      contentNetworks={connectedNetworks}
      id={id}
      networks={showNetworks}
      subTitle={t('{{number}} networks selected', { replace: { number: networkNumber } })}
      title={t('Selected networks')}
    />
  );
};

const WCNetworkSelected = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default WCNetworkSelected;
