// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson } from '@subwallet/extension-base/background/types';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import { AccountExportPasswordModal, AccountItemWithName, GeneralEmptyList } from '@subwallet/extension-koni-ui/components';
import { BasicInputWrapper } from '@subwallet/extension-koni-ui/components/Field/Base';
import ExportAllSelectItem from '@subwallet/extension-koni-ui/components/Layout/parts/SelectAccount/ExportAllSelectItem';
import { FilterModal } from '@subwallet/extension-koni-ui/components/Modal/FilterModal';
import { EXPORT_ACCOUNTS_PASSWORD_MODAL, SELECT_ACCOUNT_MODAL } from '@subwallet/extension-koni-ui/constants';
import { useFilterModal, useGoBackSelectAccount } from '@subwallet/extension-koni-ui/hooks';
import { useSelectAccount } from '@subwallet/extension-koni-ui/hooks/modal/useSelectAccount';
import { AccountSignMode, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { getSignMode, isAccountAll, searchAccountFunction } from '@subwallet/extension-koni-ui/utils';
import { Button, Icon, InputRef, ModalContext, SwList, SwModal } from '@subwallet/react-ui';
import { SwListSectionRef } from '@subwallet/react-ui/es/sw-list';
import { CaretLeft, Export, FadersHorizontal } from 'phosphor-react';
import React, { ForwardedRef, forwardRef, SyntheticEvent, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps, BasicInputWrapper {
  items: AccountJson[];
  isSingleSelect?: boolean;
}

const filterOptions = [
  {
    label: 'Normal account',
    value: AccountSignMode.PASSWORD
  },
  {
    label: 'QR signer account',
    value: AccountSignMode.QR
  },
  {
    label: 'Ledger account',
    value: AccountSignMode.LEDGER
  },
  {
    label: 'Watch-only account',
    value: AccountSignMode.READ_ONLY
  }
];
const renderEmpty = () => <GeneralEmptyList />;
const FILTER_MODAL_ID = 'export-account-filter-modal';
const defaultModalId = 'multi-export-account-selector';
const modalId = SELECT_ACCOUNT_MODAL;

const Component = (props: Props, ref: ForwardedRef<InputRef>) => {
  const { className = '',
    id = defaultModalId,
    isSingleSelect = false,
    items,
    onChange } = props;
  const { t } = useTranslation();
  const { activeModal, checkActive } = useContext(ModalContext);
  const onBack = useGoBackSelectAccount(id);

  const isActive = checkActive(modalId);

  const sectionRef = useRef<SwListSectionRef>(null);

  const getAllAddress = useMemo(() => {
    const addresses: string[] = [];

    items.forEach((obj) => {
      addresses.push(obj.address);
    });

    return addresses;
  }, [items]);
  const { changeAccounts, onChangeSelectedAccounts } = useSelectAccount(getAllAddress, id, onChange, isSingleSelect);

  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, onResetFilter, selectedFilters } = useFilterModal(FILTER_MODAL_ID);

  const filterFunction = useMemo<(item: AccountJson) => boolean>(() => {
    return (item) => {
      const signMode = getSignMode(item);

      if (!selectedFilters.length) {
        return true;
      }

      for (const filter of selectedFilters) {
        if (filter === '') {
          return true;
        }

        if (filter === AccountSignMode.LEDGER && signMode === AccountSignMode.LEDGER) {
          return true;
        } else if (filter === AccountSignMode.QR && signMode === AccountSignMode.QR) {
          return true;
        } else if (filter === AccountSignMode.READ_ONLY && signMode === AccountSignMode.READ_ONLY) {
          return true;
        } else if (filter === AccountSignMode.PASSWORD && signMode === AccountSignMode.PASSWORD) {
          return true;
        }
      }

      return false;
    };
  }, [selectedFilters]);

  const onClickItem = useCallback((value: string) => {
    onChangeSelectedAccounts(value);
  }, [onChangeSelectedAccounts]);

  const onAccountSelect = useCallback((address: string) => {
    return () => {
      onChangeSelectedAccounts(address);
    };
  }, [onChangeSelectedAccounts]);

  const renderItem = useCallback((item: AccountJson) => {
    const selected = changeAccounts.includes(item.address);
    const currentAccountIsAll = isAccountAll(item.address);

    if (currentAccountIsAll) {
      return (
        <AccountItemWithName
          address={ALL_ACCOUNT_KEY}
          className='all-account-selection'
          isSelected={selected}
          key={ALL_ACCOUNT_KEY}
          onClick={onAccountSelect(ALL_ACCOUNT_KEY)}
          showUnselectIcon
        />
      );
    }

    return (
      <ExportAllSelectItem
        accountName={item.name || ''}
        address={item.address}
        className={className}
        genesisHash={item.genesisHash}
        isSelected={selected}
        key={item.address}
        onClick={onClickItem}
        showUnSelectedIcon
      />
    );
  }, [changeAccounts, className, onAccountSelect, onClickItem]);

  const onClickFilterButton = useCallback(
    (e?: SyntheticEvent) => {
      e && e.stopPropagation();
      activeModal(FILTER_MODAL_ID);
    },
    [activeModal]
  );

  useEffect(() => {
    if (!isActive) {
      onResetFilter();
      onChangeSelectedAccounts('');
    }
  }, [isActive, onChangeSelectedAccounts, onResetFilter]);

  const exportAllAccounts = useCallback(() => {
    activeModal(EXPORT_ACCOUNTS_PASSWORD_MODAL);
  }, [activeModal]);

  const getNumberAccount = useMemo(() => {
    if (changeAccounts.includes(ALL_ACCOUNT_KEY)) {
      return changeAccounts.length - 1;
    } else {
      return changeAccounts.length;
    }
  }, [changeAccounts]);

  const getListAccount = useMemo(() => {
    if (changeAccounts.includes(ALL_ACCOUNT_KEY)) {
      return changeAccounts.filter((item) => item !== ALL_ACCOUNT_KEY);
    } else {
      return changeAccounts;
    }
  }, [changeAccounts]);

  const isDiableExport = useMemo(() => {
    if (changeAccounts.length > 0) {
      return false;
    }

    return true;
  }, [changeAccounts]);

  return (
    <>
      <SwModal
        className={`${className}`}
        closeIcon={(
          <Icon
            phosphorIcon={CaretLeft}
            size='md'
          />
        )}
        footer={(
          <Button
            block
            disabled={isDiableExport}
            icon={(
              <Icon
                phosphorIcon={Export}
                weight={'fill'}
              />
            )}
            onClick={exportAllAccounts}
          >
            {getNumberAccount > 1 ? t(`Export ${getNumberAccount} accounts`) : t(`Export ${getNumberAccount} account`)}
          </Button>
        )}
        id={id}
        onCancel={onBack}
        title={t('Export account')}
      >
        <SwList.Section
          actionBtnIcon={<Icon phosphorIcon={FadersHorizontal} />}
          enableSearchInput
          filterBy={filterFunction}
          list={items}
          onClickActionBtn={onClickFilterButton}
          ref={sectionRef}
          renderItem={renderItem}
          renderWhenEmpty={renderEmpty}
          searchFunction={searchAccountFunction}
          searchMinCharactersCount={2}
          searchPlaceholder={t<string>('Account name')}
          showActionBtn
        />
      </SwModal>

      <FilterModal
        id={FILTER_MODAL_ID}
        onApplyFilter={onApplyFilter}
        onCancel={onCloseFilterModal}
        onChangeOption={onChangeFilterOption}
        optionSelectionMap={filterSelectionMap}
        options={filterOptions}
      />
      <AccountExportPasswordModal
        addresses={getListAccount}
      />
    </>
  );
};

const ExportAllSelector = styled(forwardRef(Component))<Props>(({ theme: { token } }: Props) => {
  return {
    '.ant-sw-modal-body': {
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      paddingBottom: 0
    },

    '.ant-sw-modal-footer': {
      margin: 0,
      marginTop: token.marginXS,
      borderTop: 0,
      paddingLeft: 0,
      paddingRight: 0
    },
    '.ant-sw-list-search-input': {
      paddingBottom: token.paddingXS,
      paddingRight: 0,
      paddingLeft: 0
    },
    '.ant-sw-list': {
      paddingRight: 0,
      paddingLeft: 0
    },

    '.all-account-selection': {
      '.account-item-name': {
        fontSize: token.fontSizeLG
      }

    }
  };
});

export default ExportAllSelector;
