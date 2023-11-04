// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson } from '@subwallet/extension-base/background/types';
import AccountItemWithName from '@subwallet/extension-koni-ui/components/Account/Item/AccountItemWithName';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ModalContext, SwList } from '@subwallet/react-ui';
import { SwListSectionRef } from '@subwallet/react-ui/es/sw-list';
import React, { useCallback, useContext, useEffect, useRef } from 'react';
import styled from 'styled-components';

import { GeneralEmptyList } from '../EmptyList';
import { BaseModal } from './BaseModal';

interface Props extends ThemeProps {
  id?: string,
  onSelectItem: (item: AccountJson) => void,
  items: AccountJson[]
}

export const AccountSelectorModalId = 'accountSelectorModalId';

const renderEmpty = () => <GeneralEmptyList />;

function Component ({ className = '', id = AccountSelectorModalId, items, onSelectItem }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { checkActive, inactiveModal } = useContext(ModalContext);
  const sectionRef = useRef<SwListSectionRef>(null);
  const isActive = checkActive(id);

  const onCancel = useCallback(() => {
    inactiveModal(id);
  }, [id, inactiveModal]);

  const searchFunction = useCallback((item: AccountJson, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      item.address.toLowerCase().includes(searchTextLowerCase) ||
      (item.name
        ? item.name.toLowerCase().includes(searchTextLowerCase)
        : false)
    );
  }, []);

  const _onSelectItem = useCallback((item: AccountJson) => {
    return () => {
      onSelectItem && onSelectItem(item);
      sectionRef.current?.setSearchValue('');
    };
  }, [onSelectItem]);

  useEffect(() => {
    if (!isActive) {
      setTimeout(() => {
        sectionRef.current?.setSearchValue('');
      }, 100);
    }
  }, [isActive]);

  const renderItem = useCallback((item: AccountJson) => {
    return (
      <AccountItemWithName
        accountName={item.name}
        address={item.address}
        avatarSize={24}
        key={item.address}
        onClick={_onSelectItem(item)}
      />
    );
  }, [_onSelectItem]);

  return (
    <BaseModal
      className={`${className} account-selector-modal`}
      fullSize
      id={id}
      onCancel={onCancel}
      title={t('Select account')}
    >
      <SwList.Section
        enableSearchInput={true}
        list={items}
        ref={sectionRef}
        renderItem={renderItem}
        renderWhenEmpty={renderEmpty}
        searchFunction={searchFunction}
        searchMinCharactersCount={2}
        searchPlaceholder={t<string>('Search account')}
      />
    </BaseModal>
  );
}

export const AccountSelectorModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
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

    '.account-item-with-name + .account-item-with-name': {
      marginTop: token.marginXS
    }
  });
});
