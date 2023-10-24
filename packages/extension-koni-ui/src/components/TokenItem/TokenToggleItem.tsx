// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { AssetSetting } from '@subwallet/extension-base/background/KoniTypes';
import TokenItemFooter from '@subwallet/extension-koni-ui/Popup/Settings/Tokens/component/TokenItemFooter';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import TokenItem from '@subwallet/react-ui/es/web3-block/token-item';
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps & {
  assetSettingMap: Record<string, AssetSetting>,
  tokenInfo: _ChainAsset
}

const Component: React.FC<Props> = (props: Props) => {
  const { assetSettingMap, className, tokenInfo } = props;
  const navigate = useNavigate();

  const renderTokenRightItem = useCallback((tokenInfo: _ChainAsset) => {
    const assetSetting = assetSettingMap[tokenInfo.slug];

    return (
      <TokenItemFooter
        assetSetting={assetSetting}
        navigate={navigate}
        tokenInfo={tokenInfo}
      />
    );
  }, [assetSettingMap, navigate]);

  return (
    <TokenItem
      className={className}
      dividerPadding={56}
      isShowSubLogo={true}
      key={tokenInfo.slug}
      name={tokenInfo.symbol}
      rightItem={renderTokenRightItem(tokenInfo)}
      subName={''}
      subNetworkKey={tokenInfo.originChain}
      symbol={tokenInfo.slug.toLowerCase()}
      withDivider={true}
    />
  );
};

const TokenToggleItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.ant-web3-block': {
      cursor: 'default',
      padding: `${token.padding - 2}px ${token.paddingSM}px ${token.paddingXS - 2}px`,

      '.ant-web3-block-right-item': {
        marginRight: `-${token.padding + 2}px`
      }
    },

    '.ant-logo': {
      marginRight: token.marginXXS
    },

    '.-sub-logo .ant-image-img': {
      width: `${token.size}px !important`,
      height: `${token.size}px !important`
    },

    '.ant-network-item-sub-name': {
      display: 'none'
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

export default TokenToggleItem;
