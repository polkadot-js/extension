// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps, WalletConnectChainInfo } from '@subwallet/extension-web-ui/types';
import { Icon, NetworkItem } from '@subwallet/react-ui';
import { Info } from 'phosphor-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps {
  item: WalletConnectChainInfo;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, item } = props;

  const { t } = useTranslation();

  return (
    <NetworkItem
      className={className}
      key={item.slug}
      name={item.chainInfo?.name || t('Unknown network')}
      networkKey={item.slug}
      networkMainLogoShape='squircle'
      networkMainLogoSize={28}
      rightItem={!item.supported && (
        <div className={'__check-icon'}>
          <Icon
            iconColor='var(--icon-color)'
            phosphorIcon={Info}
            size='md'
            type='phosphor'
            weight='fill'
          />
        </div>
      )}
    />
  );
};

const WCNetworkItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '--icon-color': token.colorWarning,

    '&.ant-network-item': {
      '.ant-network-item-name': {
        textAlign: 'left'
      },

      '.__check-icon': {
        display: 'flex',
        width: 40,
        justifyContent: 'center'
      }
    }
  };
});

export default WCNetworkItem;
