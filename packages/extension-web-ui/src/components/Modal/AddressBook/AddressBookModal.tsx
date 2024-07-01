// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AbstractAddressJson, AccountJson } from '@subwallet/extension-base/background/types';
import { BackIcon } from '@subwallet/extension-web-ui/components';
import { BaseModal } from '@subwallet/extension-web-ui/components/Modal/BaseModal';
import { useFilterModal, useFormatAddress, useGetChainInfoByGenesisHash, useSelector } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { funcSortByName, isAccountAll, reformatAddress } from '@subwallet/extension-web-ui/utils';
import { Badge, Icon, ModalContext, SwList } from '@subwallet/react-ui';
import { SwListSectionRef } from '@subwallet/react-ui/es/sw-list';
import CN from 'classnames';
import { FadersHorizontal } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { isAddress, isEthereumAddress } from '@polkadot/util-crypto';

import { AccountItemWithName } from '../../Account';
import { GeneralEmptyList } from '../../EmptyList';
import { FilterModal } from '../FilterModal';

interface Props extends ThemeProps {
  value?: string;
  id: string;
  addressPrefix?: number;
  onSelect: (val: string) => void;
  networkGenesisHash?: string;
}

enum AccountGroup {
  WALLET = 'wallet',
  CONTACT = 'contact',
  RECENT = 'recent'
}

interface FilterOption {
  label: string;
  value: AccountGroup;
}

interface AccountItem extends AbstractAddressJson {
  group: AccountGroup;
}

const renderEmpty = () => <GeneralEmptyList />;

const getGroupPriority = (item: AccountItem): number => {
  switch (item.group) {
    case AccountGroup.WALLET:
      return 2;
    case AccountGroup.CONTACT:
      return 1;
    case AccountGroup.RECENT:
    default:
      return 0;
  }
};

const checkLedger = (account: AccountJson, networkGenesisHash?: string): boolean => {
  const isEvmAddress = isEthereumAddress(account.address);

  return !networkGenesisHash || !account.isHardware || account.isGeneric || isEvmAddress || (account.availableGenesisHashes || []).includes(networkGenesisHash);
};

const Component: React.FC<Props> = (props: Props) => {
  const { addressPrefix, className, id, networkGenesisHash, onSelect, value = '' } = props;

  const { t } = useTranslation();

  const { activeModal, checkActive, inactiveModal } = useContext(ModalContext);

  const isActive = checkActive(id);

  const { accounts, contacts, recent } = useSelector((state) => state.accountState);

  const formatAddress = useFormatAddress(addressPrefix);

  const chainInfo = useGetChainInfoByGenesisHash(networkGenesisHash);
  const chain = chainInfo?.slug || '';
  const filterModal = useMemo(() => `${id}-filter-modal`, [id]);

  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, onResetFilter, selectedFilters } = useFilterModal(filterModal);

  const sectionRef = useRef<SwListSectionRef>(null);

  const filterOptions: FilterOption[] = useMemo(() => ([
    {
      label: t('Your wallet'),
      value: AccountGroup.WALLET
    },
    {
      label: t('Saved contacts'),
      value: AccountGroup.CONTACT
    },
    {
      label: t('Recent'),
      value: AccountGroup.RECENT
    }
  ]), [t]);

  const items = useMemo((): AccountItem[] => {
    const result: AccountItem[] = [];

    (!selectedFilters.length || selectedFilters.includes(AccountGroup.RECENT)) && recent.forEach((acc) => {
      const chains = acc.recentChainSlugs || [];

      if (chains.includes(chain)) {
        const address = isAddress(acc.address) ? reformatAddress(acc.address) : acc.address;

        result.push({ ...acc, address: address, group: AccountGroup.RECENT });
      }
    });

    (!selectedFilters.length || selectedFilters.includes(AccountGroup.CONTACT)) && contacts.forEach((acc) => {
      const address = isAddress(acc.address) ? reformatAddress(acc.address) : acc.address;

      result.push({ ...acc, address: address, group: AccountGroup.CONTACT });
    });

    (!selectedFilters.length || selectedFilters.includes(AccountGroup.WALLET)) && accounts.filter((acc) => !isAccountAll(acc.address)).forEach((acc) => {
      const address = isAddress(acc.address) ? reformatAddress(acc.address) : acc.address;

      if (checkLedger(acc, networkGenesisHash)) {
        result.push({ ...acc, address: address, group: AccountGroup.WALLET });
      }
    });

    return result
      .sort(funcSortByName)
      .sort((a, b) => getGroupPriority(b) - getGroupPriority(a));
  }, [accounts, chain, contacts, networkGenesisHash, recent, selectedFilters]);

  const searchFunction = useCallback((item: AccountItem, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      item.address.toLowerCase().includes(searchTextLowerCase) ||
      (item.name
        ? item.name.toLowerCase().includes(searchTextLowerCase)
        : false)
    );
  }, []);

  const onClose = useCallback(() => {
    inactiveModal(id);
    onResetFilter();
  }, [id, inactiveModal, onResetFilter]);

  const onSelectItem = useCallback((item: AccountItem) => {
    const address = reformatAddress(item.address, addressPrefix);

    return () => {
      inactiveModal(id);
      onSelect(address);
      onResetFilter();
    };
  }, [addressPrefix, id, inactiveModal, onResetFilter, onSelect]);

  const renderItem = useCallback((item: AccountItem) => {
    const address = formatAddress(item);
    const isRecent = item.group === AccountGroup.RECENT;
    let selected: boolean;

    if (isEthereumAddress(value)) {
      selected = value.toLowerCase() === address.toLowerCase();
    } else {
      selected = value === address;
    }

    return (
      <AccountItemWithName
        accountName={item.name}
        address={address}
        addressPreLength={isRecent ? 9 : 4}
        addressSufLength={isRecent ? 9 : 4}
        avatarSize={24}
        fallbackName={false}
        isSelected={selected}
        key={`${item.address}_${item.group}`}
        onClick={onSelectItem(item)}
      />
    );
  }, [formatAddress, onSelectItem, value]);

  const groupSeparator = useCallback((group: AccountItem[], idx: number, groupKey: string) => {
    const _group = groupKey as AccountGroup;

    let groupLabel = _group;

    switch (_group) {
      case AccountGroup.WALLET:
        groupLabel = t('Your wallet');
        break;
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

  const openFilter = useCallback(() => {
    activeModal(filterModal);
  }, [activeModal, filterModal]);

  const applyFilter = useCallback(() => {
    onApplyFilter();
    activeModal(id);
  }, [activeModal, id, onApplyFilter]);

  const cancelFilter = useCallback(() => {
    onCloseFilterModal();
    activeModal(id);
  }, [activeModal, id, onCloseFilterModal]);

  useEffect(() => {
    if (!isActive) {
      setTimeout(() => {
        sectionRef.current?.setSearchValue('');
      }, 100);
    }
  }, [isActive, sectionRef]);

  return (
    <>
      <BaseModal
        className={CN(className)}
        fullSizeOnMobile
        id={id}
        onCancel={onClose}
        title={t('Address book')}
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
      </BaseModal>
      <FilterModal
        closeIcon={<BackIcon />}
        id={filterModal}
        onApplyFilter={applyFilter}
        onCancel={cancelFilter}
        onChangeOption={onChangeFilterOption}
        optionSelectionMap={filterSelectionMap}
        options={filterOptions}
        title={t('Filter address')}
      />
    </>
  );
};

const AddressBookModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '--row-gap': `${token.sizeXS}px`,

    '.ant-sw-modal-body': {
      display: 'flex',
      paddingLeft: 0,
      paddingRight: 0
    },

    '.ant-sw-list-section': {
      flex: 1
    },

    '.address-book-group-separator': {
      fontWeight: token.fontWeightStrong,
      fontSize: 11,
      lineHeight: '20px',
      textTransform: 'uppercase',

      '.address-book-group-label': {
        color: token.colorTextBase
      },

      '.address-book-group-counter': {
        color: token.colorTextTertiary
      }
    }
  };
});

export default AddressBookModal;
