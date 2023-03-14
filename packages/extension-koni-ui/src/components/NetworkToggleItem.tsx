// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { _ChainConnectionStatus, _ChainState } from '@subwallet/extension-base/services/chain-service/types';
import ChainItemFooter from '@subwallet/extension-koni-ui/components/ChainItemFooter';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { BackgroundIcon, NetworkItem } from '@subwallet/react-ui';
import { WifiHigh, WifiSlash } from 'phosphor-react';
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps & {
  chainInfo: _ChainInfo,
  chainStateMap: Record<string, _ChainState>

}

const Component: React.FC<Props> = (props: Props) => {
  const { chainInfo, chainStateMap, className } = props;
  const navigate = useNavigate();
  const { token } = useTheme() as Theme;
  const chainState = chainStateMap[chainInfo.slug];

  const getConnectionStatusIcon = useCallback(() => {
    if (chainState.connectionStatus === _ChainConnectionStatus.CONNECTED.valueOf()) {
      return <BackgroundIcon
        backgroundColor={token.colorSuccess}
        phosphorIcon={WifiHigh}
      />;
    }

    return <BackgroundIcon
      backgroundColor={token.colorIcon}
      phosphorIcon={WifiSlash}
    />;
  }, [chainState.connectionStatus, token.colorIcon, token.colorSuccess]);

  const renderNetworkRightItem = useCallback((chainInfo: _ChainInfo) => {
    return (
      <ChainItemFooter
        chainInfo={chainInfo}
        chainState={chainState}
        navigate={navigate}
        showDetailNavigation={true}
      />
    );
  }, [chainState, navigate]);

  return (
    <NetworkItem
      className={className}
      dividerPadding={56}
      isShowSubLogo={false}
      key={chainInfo.slug}
      name={chainInfo.name}
      networkKey={chainInfo.slug}
      networkMainLogoSize={36}
      rightItem={renderNetworkRightItem(chainInfo)}
      subIcon={getConnectionStatusIcon()}
      withDivider={true}
    />
  );
};

const NetworkToggleItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.ant-web3-block': {
      cursor: 'default',
      padding: `${token.padding - 2}px ${token.paddingSM}px ${token.paddingXS - 2}px`,

      '.ant-web3-block-right-item': {
        marginRight: `-${token.padding + 2}px`
      }
    },

    '.manage_tokens__right_item_container': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },

    '.ant-divider': {
      borderBlockStartColor: token.colorBgDivider
    }
  };
});

export default NetworkToggleItem;
