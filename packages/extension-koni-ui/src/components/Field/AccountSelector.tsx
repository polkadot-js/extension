// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson } from '@subwallet/extension-base/background/types';
import { isAccountAll } from '@subwallet/extension-base/utils';
import AccountItemWithName from '@subwallet/extension-koni-ui/components/Account/Item/AccountItemWithName';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { toShort } from '@subwallet/extension-koni-ui/util';
import { SelectModal } from '@subwallet/react-ui';
import { SelectModalProps } from '@subwallet/react-ui/es/select-modal/SelectModal';
import SwAvatar from '@subwallet/react-ui/es/sw-avatar';
import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

export type ChainItemType = {
  name: string,
  slug: string,
};

interface Props extends ThemeProps {
  id: string,
  label?: string,
  onSelectItem: SelectModalProps<AccountJson>['onSelect'],
  selectedItem: string,
}

function Component ({ className = '', id, label, onSelectItem, selectedItem }: Props): React.ReactElement<Props> {
  const items = useSelector((state: RootState) => state.accountState.accounts).filter((a) => !isAccountAll(a.address));
  const { t } = useTranslation();
  const renderChainSelected = useCallback((item: AccountJson) => {
    return (
      <div className={'__selected-item'}>
        <SwAvatar
          size={24}
          theme={isEthereumAddress(item.address) ? 'ethereum' : 'polkadot'}
          value={item.address}
        />
        <div className={'__selected-item-name common-text'}>
          {item.name}
        </div>

        <div className={'__selected-item-address common-text'}>
        ({toShort(item.address, 4, 4)})
        </div>
      </div>
    );
  }, []);

  const searchFunction = useCallback((item: AccountJson, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      item.address.toLowerCase().includes(searchTextLowerCase) ||
      (item.name
        ? item.name.toLowerCase().includes(searchTextLowerCase)
        : false)
    );
  }, []);

  const renderItem = useCallback((item: AccountJson, selected: boolean) => {
    return (
      <AccountItemWithName
        accountName={item.name}
        address={item.address}
        isSelected={selected}
      />
    );
  }, []);

  return (
    <SelectModal
      className={`${className} account-selector-modal`}
      id={id}
      inputClassName={`${className} account-selector-input`}
      itemKey={'address'}
      items={items}
      label={label}
      onSelect={onSelectItem}
      placeholder={t('Select account')}
      renderItem={renderItem}
      renderSelected={renderChainSelected}
      searchFunction={searchFunction}
      searchPlaceholder={t('Search chain')}
      searchableMinCharactersCount={2}
      selected={selectedItem}
    />
  );
}

export const AccountSelector = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '&.account-selector-input': {
      '.__selected-item': {
        display: 'flex',
        color: token.colorTextLight1,
        whiteSpace: 'nowrap',
        overflow: 'hidden'
      },
      '.__selected-item-name': {
        textOverflow: 'ellipsis',
        fontWeight: token.headingFontWeight,
        overflow: 'hidden',
        paddingLeft: token.sizeXS
      },
      '.__selected-item-address': {
        color: token.colorTextLight4,
        paddingLeft: token.sizeXXS
      }
    }
  });
});
