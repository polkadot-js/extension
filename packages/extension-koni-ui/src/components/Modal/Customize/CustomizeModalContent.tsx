// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { NetworkEmptyList } from '@subwallet/extension-koni-ui/components';
import ChainItemFooter from '@subwallet/extension-koni-ui/components/ChainItemFooter';
import { CUSTOMIZE_MODAL } from '@subwallet/extension-koni-ui/constants';
import useChainInfoWithState, { ChainInfoWithState } from '@subwallet/extension-koni-ui/hooks/chain/useChainInfoWithState';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { NetworkItem, SwList } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback } from 'react';
import styled from 'styled-components';

type Props = ThemeProps;

const renderEmpty = () => <NetworkEmptyList modalId={CUSTOMIZE_MODAL} />;

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;
  const { t } = useTranslation();
  const chainInfoList = useChainInfoWithState();

  const renderChainItem = useCallback((chainInfo: ChainInfoWithState) => {
    const connectSymbol = `__${chainInfo.connectionStatus}__`;

    return (
      <NetworkItem
        className={'network_item__container'}
        isShowSubLogo={true}
        key={chainInfo.slug}
        name={chainInfo.name}
        networkKey={chainInfo.slug}
        rightItem={<ChainItemFooter chainInfo={chainInfo} />}
        subSymbol={connectSymbol}
      />
    );
  }, []);

  const chainSearchFunc = useCallback((item: _ChainInfo, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      item.name.toLowerCase().includes(searchTextLowerCase)
    );
  }, []);

  return (
    <SwList.Section
      className={CN(className)}
      displayRow
      enableSearchInput
      list={chainInfoList}
      renderItem={renderChainItem}
      renderWhenEmpty={renderEmpty}
      rowGap={'8px'}
      searchFunction={chainSearchFunc}
      searchMinCharactersCount={2}
      searchPlaceholder={t<string>('Network name')}
    />
  );
};

const CustomizeModalContent = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.ant-sw-list-search-input': {
      paddingBottom: token.paddingXS
    },

    '.ant-network-item-content': {
      paddingTop: token.paddingXS,
      paddingBottom: token.paddingXS
    },

    '.ant-network-item-name': {
      overflow: 'hidden',
      textWrap: 'nowrap',
      textOverflow: 'ellipsis',
      paddingRight: token.paddingXS
    },

    '.manage_chain__empty_container': {
      marginTop: 20,
      display: 'flex',
      flexWrap: 'wrap',
      gap: token.padding,
      flexDirection: 'column',
      alignContent: 'center'
    },

    '.manage_chain__empty_text_container': {
      display: 'flex',
      flexDirection: 'column',
      alignContent: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap'
    },

    '.manage_chain__empty_title': {
      fontWeight: token.headingFontWeight,
      textAlign: 'center',
      fontSize: token.fontSizeLG,
      color: token.colorText
    },

    '.manage_chain__empty_subtitle': {
      marginTop: 6,
      textAlign: 'center',
      color: token.colorTextTertiary
    },

    '.manage_chain__empty_icon_wrapper': {
      display: 'flex',
      justifyContent: 'center'
    }
  };
});

export default CustomizeModalContent;
