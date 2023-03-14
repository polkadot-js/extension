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
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

export type ChainItemType = {
  name: string,
  slug: string,
};

interface Props extends ThemeProps {
  id: string,
  address?: string,
  onChangeSelectedNetwork?: (value: string) => void;
}

const renderEmpty = () => <EmptyAccount />;

function Component ({ address, className = '', id, onChangeSelectedNetwork }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const itemsMap = useGetTokensBySettings(address);
  const items = Object.values(itemsMap);
  const { activeModal, inactiveModal } = useContext(ModalContext);

  const searchFunction = useCallback((item: ChainItemType, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      item.name.toLowerCase().includes(searchTextLowerCase)
    );
  }, []);

  const onCancel = useCallback(() => {
    inactiveModal(id);
  }, [id, inactiveModal]);

  const renderItem = useCallback((item: _ChainAsset) => {
    return (
      <TokenSelectionItem
        address={address}
        chain={item.originChain}
        className={'token-selector-item'}
        key={`${item.symbol}-${item.originChain}`}
        name={item.symbol}
        // eslint-disable-next-line react/jsx-no-bind
        onClickQrBtn={() => {
          onChangeSelectedNetwork && onChangeSelectedNetwork(item.originChain);
          inactiveModal(id);
          activeModal(RECEIVE_QR_MODAL);
        }}
        subName={item.name}
        subNetworkKey={item.originChain || ''}
        symbol={item.symbol}
      />
    );
  }, [activeModal, address, id, inactiveModal, onChangeSelectedNetwork]);

  return (
    <SwModal
      className={`${className} chain-selector-modal`}
      id={id}
      onCancel={onCancel}

      title={t('Select token')}
    >
      <SwList.Section
        enableSearchInput={true}
        ignoreScrollbar={items.length >= 5}
        list={items}
        renderItem={renderItem}
        renderWhenEmpty={renderEmpty}
        searchFunction={searchFunction}
        searchMinCharactersCount={2}
        searchPlaceholder={t('Search chain')}
      />
    </SwModal>
  );
}

export const TokensSelector = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '& .ant-sw-modal-body': {
      padding: `${token.padding}px 0 0`,
      marginBottom: 0,
      display: 'flex'
    },

    '.ant-sw-list-section': {
      flex: 1
    },

    '.token-selector-item': {
      marginBottom: token.marginXS
    },

    '&.chain-selector-input .__selected-item': {
      color: token.colorText
    }
  });
});
