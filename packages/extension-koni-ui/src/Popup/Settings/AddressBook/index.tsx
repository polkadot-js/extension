// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AddressJson } from '@subwallet/extension-base/background/types';
import { AccountItemBase, AccountItemWithName, AddContactModal, BackIcon, EditContactModal, FilterModal, GeneralEmptyList, Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import { ADD_ADDRESS_BOOK_MODAL, EDIT_ADDRESS_BOOK_MODAL } from '@subwallet/extension-koni-ui/constants';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { useFilterModal, useFormatAddress, useSelector } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { funcSortByName, reformatAddress } from '@subwallet/extension-koni-ui/utils';
import { Badge, ButtonProps, Icon, ModalContext, SwList } from '@subwallet/react-ui';
import { SwListSectionRef } from '@subwallet/react-ui/es/sw-list';
import CN from 'classnames';
import { FadersHorizontal, Plus } from 'phosphor-react';
import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { isAddress } from '@polkadot/util-crypto';

type Props = ThemeProps;

enum AccountGroup {
  CONTACT = 'contact',
  RECENT = 'recent'
}

interface FilterOption {
  label: string;
  value: AccountGroup;
}

interface AccountItem extends AddressJson {
  group: AccountGroup;
}

const searchFunction = (item: AccountItem, searchText: string) => {
  const searchTextLowerCase = searchText.toLowerCase();

  return (
    item.address.toLowerCase().includes(searchTextLowerCase) ||
    (item.name
      ? item.name.toLowerCase().includes(searchTextLowerCase)
      : false)
  );
};

const getGroupPriority = (item: AccountItem): number => {
  switch (item.group) {
    case AccountGroup.CONTACT:
      return 1;
    case AccountGroup.RECENT:
    default:
      return 0;
  }
};

const renderEmpty = () => <GeneralEmptyList />;

const FILTER_MODAL_ID = 'manage-address-book-filter-modal';

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;
  const { isWebUI } = useContext(ScreenContext);

  const { t } = useTranslation();
  const navigate = useNavigate();

  const { activeModal } = useContext(ModalContext);

  const { contacts, recent } = useSelector((state) => state.accountState);

  const sectionRef = useRef<SwListSectionRef>(null);

  const { filterSelectionMap,
    onApplyFilter,
    onChangeFilterOption,
    onCloseFilterModal,
    selectedFilters } = useFilterModal(FILTER_MODAL_ID);
  const formatAddress = useFormatAddress();

  const items = useMemo((): AccountItem[] => {
    const result: AccountItem[] = [];

    (!selectedFilters.length || selectedFilters.includes(AccountGroup.CONTACT)) && contacts.forEach((acc) => {
      const address = isAddress(acc.address) ? reformatAddress(acc.address) : acc.address;

      result.push({ ...acc, address: address, group: AccountGroup.CONTACT });
    });

    (!selectedFilters.length || selectedFilters.includes(AccountGroup.RECENT)) && recent.forEach((acc) => {
      const address = isAddress(acc.address) ? reformatAddress(acc.address) : acc.address;

      result.push({ ...acc, address: address, group: AccountGroup.RECENT });
    });

    return result.sort(funcSortByName).sort((a, b) => getGroupPriority(b) - getGroupPriority(a));
  }, [contacts, recent, selectedFilters]);

  const filterOptions: FilterOption[] = useMemo(() => ([
    {
      label: t('Saved contacts'),
      value: AccountGroup.CONTACT
    },
    {
      label: t('Recent'),
      value: AccountGroup.RECENT
    }
  ]), [t]);

  const [selectedItem, setSelectedItem] = useState<AddressJson | undefined>();

  const openAddContact = useCallback(() => {
    activeModal(ADD_ADDRESS_BOOK_MODAL);
  }, [activeModal]);

  const subHeaderIcons = useMemo((): ButtonProps[] => [
    {
      icon: (
        <Icon
          phosphorIcon={Plus}
          size='md'
        />
      ),
      onClick: openAddContact,
      tooltip: isWebUI ? t('Add contact') : undefined
    }
  ], [isWebUI, openAddContact, t]);

  const openFilter = useCallback(() => {
    activeModal(FILTER_MODAL_ID);
  }, [activeModal]);

  const groupSeparator = useCallback((group: AccountItem[], idx: number, groupKey: string) => {
    const _group = groupKey as AccountGroup;

    let groupLabel = '';

    switch (_group) {
      case AccountGroup.CONTACT:
        groupLabel = t('Saved contacts');
        break;
      case AccountGroup.RECENT:
        groupLabel = t('Recent');
        break;
    }

    return (
      <div className='address-book-group-separator'>
        <span className='address-book-group-label'>{groupLabel}</span>
        <span className='address-book-group-counter'>&nbsp;({group.length})</span>
      </div>
    );
  }, [t]);

  const onSelectItem = useCallback((item: AccountItem) => {
    return () => {
      setSelectedItem(item);
      setTimeout(() => {
        activeModal(EDIT_ADDRESS_BOOK_MODAL);
      }, 10);
    };
  }, [activeModal]);

  const renderItem = useCallback((item: AccountItem) => {
    const address = formatAddress(item);

    if (item.group === AccountGroup.RECENT) {
      return (
        <AccountItemBase
          address={address}
          addressPreLength={8}
          addressSufLength={8}
          avatarSize={24}
          key={item.address}
          onClick={onSelectItem(item)}
        />
      );
    }

    return (
      <AccountItemWithName
        accountName={item.name}
        address={address}
        avatarSize={24}
        key={item.address}
        onClick={onSelectItem(item)}
      />
    );
  }, [formatAddress, onSelectItem]);

  const goBack = useCallback(() => {
    navigate('/settings/list');
  }, [navigate]);

  return (
    <PageWrapper className={CN(className)}>
      <Layout.WithSubHeaderOnly
        onBack={goBack}
        subHeaderIcons={subHeaderIcons}
        title={t('Manage address book')}
      >
        <SwList.Section
          actionBtnIcon={(
            <Badge dot={!!selectedFilters.length}>
              <Icon
                phosphorIcon={FadersHorizontal}
                size='sm'
                type='phosphor'
                weight='fill'
              />
            </Badge>
          )}
          displayRow={true}
          enableSearchInput={true}
          groupBy='group'
          groupSeparator={groupSeparator}
          list={items}
          onClickActionBtn={openFilter}
          ref={sectionRef}
          renderItem={renderItem}
          renderWhenEmpty={renderEmpty}
          rowGap='var(--row-gap)'
          searchFunction={searchFunction}
          searchMinCharactersCount={2}
          searchPlaceholder={t<string>('Account name')}
          showActionBtn={true}
        />
        <FilterModal
          closeIcon={<BackIcon />}
          id={FILTER_MODAL_ID}
          onApplyFilter={onApplyFilter}
          onCancel={onCloseFilterModal}
          onChangeOption={onChangeFilterOption}
          optionSelectionMap={filterSelectionMap}
          options={filterOptions}
          title={t('Filter')}
        />
        <AddContactModal />
        {selectedItem && <EditContactModal addressJson={selectedItem} />}
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  );
};

const ManageAddressBook = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '--row-gap': `${token.sizeXS}px`,

    '.ant-sw-screen-layout-body': {
      paddingTop: token.padding,
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    },

    '.ant-sw-list-section': {
      flex: 1,
      marginBottom: token.margin
    },

    '.ant-account-item-address': {
      fontWeight: token.fontWeightStrong,
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      color: token.colorTextBase
    }
  };
});

export default ManageAddressBook;
