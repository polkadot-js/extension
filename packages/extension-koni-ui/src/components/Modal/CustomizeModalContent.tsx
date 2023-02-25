// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { _getChainNativeTokenBasicInfo } from '@subwallet/extension-base/services/chain-service/utils';
import ChainItemFooter from '@subwallet/extension-koni-ui/components/ChainItemFooter';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { NetworkItem, SwList } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

type Props = ThemeProps

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);
  const chainStateMap = useSelector((state: RootState) => state.chainStore.chainStateMap);

  const chainInfoList = useMemo(() => {
    return Object.values(chainInfoMap);
  }, [chainInfoMap]);

  const renderNetworkItem = useCallback((chainInfo: _ChainInfo) => {
    const chainState = chainStateMap[chainInfo.slug];

    return (
      <ChainItemFooter
        chainInfo={chainInfo}
        chainState={chainState}
      />
    );
  }, [chainStateMap]);

  const renderChainItem = useCallback((chainInfo: _ChainInfo) => {
    const { symbol } = _getChainNativeTokenBasicInfo(chainInfo);

    return (
      <NetworkItem
        className={'network_item__container'}
        isShowSubLogo={true}
        key={chainInfo.slug}
        name={chainInfo.name}
        rightItem={renderNetworkItem(chainInfo)}
        symbol={symbol.toLowerCase()}
      />
    );
  }, [renderNetworkItem]);

  const chainSearchFunc = useCallback((item: _ChainInfo, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      item.name.toLowerCase().includes(searchTextLowerCase)
    );
  }, []);

  return (
    <div className={CN(className)}>
      {/* // todo: i18n this */}
      <div className={'__group-label'}>Chains</div>

      <SwList.Section
        displayRow
        enableSearchInput
        list={chainInfoList}
        renderItem={renderChainItem}
        rowGap={'8px'}
        searchFunction={chainSearchFunc}
        searchMinCharactersCount={2}
        searchPlaceholder='Chain name' // todo: i18n this
      />
    </div>
  );
};

const CustomizeModalContent = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default CustomizeModalContent;
