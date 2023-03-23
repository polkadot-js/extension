// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import EmptyAccount from '@subwallet/extension-koni-ui/components/Account/EmptyAccount';
import { TokenSelectionItem } from '@subwallet/extension-koni-ui/components/TokenItem/TokenSelectionItem';
import { RECEIVE_QR_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import useGetTokensBySettings from '@subwallet/extension-koni-ui/hooks/screen/home/useGetTokensBySettings';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ModalContext, SwList, SwModal } from '@subwallet/react-ui';
import React, { useCallback, useContext, useMemo } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  onSelectItem?: (item: _ChainAsset) => void,
  address?: string,
  itemFilter?: (item: _ChainAsset) => boolean
}

export const ReceiveTokensSelectorModalId = 'receiveTokensSelectorModalId';

const renderEmpty = () => <EmptyAccount />;

function Component ({ address, className = '', itemFilter, onSelectItem }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const itemsMap = useGetTokensBySettings(address);

  const items = useMemo<_ChainAsset[]>(() => {
    const _items = Object.values(itemsMap);

    if (itemFilter) {
      return _items.filter(itemFilter);
    }

    return _items;
  }, [itemFilter, itemsMap]);

  const searchFunction = useCallback((item: _ChainAsset, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      item.symbol.toLowerCase().includes(searchTextLowerCase)
    );
  }, []);

  const onCancel = useCallback(() => {
    inactiveModal(ReceiveTokensSelectorModalId);
  }, [inactiveModal]);

  const onClickQrBtn = useCallback((item: _ChainAsset) => {
    return () => {
      onSelectItem && onSelectItem(item);
      inactiveModal(ReceiveTokensSelectorModalId);
      activeModal(RECEIVE_QR_MODAL);
    };
  }, [activeModal, inactiveModal, onSelectItem]);

  const renderItem = useCallback((item: _ChainAsset) => {
    return (
      <TokenSelectionItem
        address={address}
        chain={item.originChain}
        className={'token-selector-item'}
        key={`${item.symbol}-${item.originChain}`}
        name={item.symbol}
        onClickQrBtn={onClickQrBtn(item)}
        onPressItem={onClickQrBtn(item)}
        subName={item.name}
        subNetworkKey={item.originChain || ''}
        symbol={item.symbol}
      />
    );
  }, [address, onClickQrBtn]);

  return (
    <SwModal
      className={`${className} chain-selector-modal`}
      id={ReceiveTokensSelectorModalId}
      onCancel={onCancel}
      title={t('Select token')}
    >
      <SwList.Section
        enableSearchInput={true}
        ignoreScrollbar={items.length > 5}
        list={items}
        renderItem={renderItem}
        renderWhenEmpty={renderEmpty}
        searchFunction={searchFunction}
        searchMinCharactersCount={2}
        searchPlaceholder={t<string>('Search chain')}
      />
    </SwModal>
  );
}

export const TokensSelectorModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.ant-sw-modal-content': {
      minHeight: 474
    },

    '.ant-sw-list-search-input': {
      paddingBottom: token.paddingXS
    },

    '.ant-sw-modal-body': {
      paddingLeft: 0,
      paddingRight: 0,
      paddingBottom: token.padding,
      marginBottom: 0,
      display: 'flex'
    },

    '.ant-sw-list-section': {
      flex: 1
    },

    '.ant-sw-list-section .ant-sw-list': {
      paddingBottom: 0
    },

    '.token-selector-item + .token-selector-item': {
      marginTop: token.marginXS
    }
  });
});
