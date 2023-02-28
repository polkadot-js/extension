// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ModalContext, SwList, SwModal } from '@subwallet/react-ui';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';
import { TokenSelectionItem } from '@subwallet/extension-koni-ui/components/TokenItem/TokenSelectionItem';
import useGetTokensBySettings from '@subwallet/extension-koni-ui/hooks/screen/home/useGetTokensBySettings';
import { _ChainAsset } from '@subwallet/chain-list/types';
import { RECEIVE_QR_MODAL } from '@subwallet/extension-koni-ui/constants/modal';

export type ChainItemType = {
  name: string,
  slug: string,
};

interface Props extends ThemeProps {
  id: string,
  address?: string,
  onChangeSelectedNetwork?: (value: string) => void;
}

function Component ({ className = '', id, address, onChangeSelectedNetwork }: Props): React.ReactElement<Props> {
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
  }, [inactiveModal]);


  const renderItem = useCallback((item: _ChainAsset) => {
    return (
      <TokenSelectionItem
        className={'token-selector-item'}
        address={address}
        name={item.symbol}
        subName={item.name}
        chain={item.originChain}
        symbol={item.symbol}
        subNetworkKey={item.originChain || ''}
        onClickQrBtn={() => {
          onChangeSelectedNetwork && onChangeSelectedNetwork(item.originChain)
          inactiveModal(id);
          activeModal(RECEIVE_QR_MODAL);
        }}
      />
    );
  }, [address]);

  return (
    <SwModal
      onCancel={onCancel}
      className={`${className} chain-selector-modal`}
      id={id}

      title={t('Select token')}
    >
      <SwList.Section list={items} renderItem={renderItem} searchFunction={searchFunction} searchPlaceholder={t('Search chain')} enableSearchInput={true} />
    </SwModal>
  );
}

export const TokensSelector = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '& .ant-sw-modal-body': {
      padding: 0,
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
    },
  });
});
