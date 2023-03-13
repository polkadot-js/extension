// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Avatar } from '@subwallet/extension-koni-ui/components/Avatar';
import { BasicInputWrapper } from '@subwallet/extension-koni-ui/components/Field/index';
import { FilterModal } from '@subwallet/extension-koni-ui/components/Modal/FilterModal';
import { SortingModal } from '@subwallet/extension-koni-ui/components/Modal/SortingModal';
import StakingPoolItem from '@subwallet/extension-koni-ui/components/StakingItem/StakingPoolItem';
import { useFilterModal } from '@subwallet/extension-koni-ui/hooks/modal/useFilterModal';
import useGetValidatorList, { NominationPoolDataType } from '@subwallet/extension-koni-ui/hooks/screen/staking/useGetValidatorList';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, InputRef, SelectModal, useExcludeModal } from '@subwallet/react-ui';
import { ModalContext } from '@subwallet/react-ui/es/sw-modal/provider';
import { Book, CaretLeft, Lightning, SortAscending } from 'phosphor-react';
import React, { ForwardedRef, forwardRef, SyntheticEvent, useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

interface Props extends ThemeProps, BasicInputWrapper {
  chain: string;
  onClickBookBtn?: (e: SyntheticEvent) => void;
  onClickLightningBtn?: (e: SyntheticEvent) => void;
}

const SORTING_MODAL_ID = 'pool-sorting-modal';
const FILTER_MODAL_ID = 'pool-filter-modal';

const sortingOptions = [
  {
    label: 'Lowest commission',
    value: 'commission'
  },
  {
    label: 'Highest return',
    value: 'return'
  }
];

const filterOptions = [
  {
    label: 'Active validator',
    value: ''
  },
  {
    label: 'Waiting list',
    value: ''
  },
  {
    label: 'Locked',
    value: ''
  },
  {
    label: 'Destroying',
    value: ''
  }
];

const getFilteredList = (items: NominationPoolDataType[], filters: string[]) => {
  const filteredList: NominationPoolDataType[] = [];

  items.forEach((item) => {
    const isValidationPassed = filters.length <= 0;

    // TODO: logic filter
    if (isValidationPassed) {
      filteredList.push(item);
    }
  });

  return filteredList;
};

const Component = (props: Props, ref: ForwardedRef<InputRef>) => {
  const { chain, className = '', disabled, id = 'pool-selector', label, onChange, onClickBookBtn, onClickLightningBtn, placeholder, value } = props;
  const items = useGetValidatorList(chain, 'pool') as NominationPoolDataType[];
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const [sortSelection, setSortSelection] = useState<string>('');
  const { changeFilters, onApplyFilter, onChangeFilterOpt, selectedFilters } = useFilterModal(items, FILTER_MODAL_ID);
  const filteredList = useMemo(() => {
    return getFilteredList(items, selectedFilters);
  }, [items, selectedFilters]);

  useExcludeModal(id);

  const { t } = useTranslation();

  const _onSelectItem = useCallback((value: string) => {
    onChange && onChange({ target: { value } });
  }, [onChange]);

  const searchFunction = useCallback((item: NominationPoolDataType, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      item.address.toLowerCase().includes(searchTextLowerCase) ||
      (item.identity
        ? item.identity.toLowerCase().includes(searchTextLowerCase)
        : false)
    );
  }, []);

  const renderItem = useCallback((item: NominationPoolDataType) => {
    return (
      <StakingPoolItem
        address={item.address}
        bondedAmount={item.bondedAmount}
        className={'pool-item'}
        id={item.id}
        identity={item.identity}
        memberCount={item.memberCount}
        // eslint-disable-next-line @typescript-eslint/no-empty-function,react/jsx-no-bind
        onClickMoreBtn={() => {}}
        symbol={item.symbol}
      />
    );
  }, []);

  const closeFilterModal = () => {
    inactiveModal(FILTER_MODAL_ID);
  };

  const closeSortingModal = () => {
    inactiveModal(SORTING_MODAL_ID);
  };

  const renderSelected = (item: NominationPoolDataType) => {
    return (
      <div className={'__selected-item'}>
        <div className={'__selected-item-name common-text'}>
          {item.identity}
        </div>

        <div className={'__selected-item-right-part common-text'}>
          <Button
            icon={<Icon
              phosphorIcon={Book}
              size='sm'
            />}
            onClick={onClickBookBtn}
            size='xs'
            type='ghost'
          />
          <Button
            icon={<Icon
              phosphorIcon={Lightning}
              size='sm'
            />}
            onClick={onClickLightningBtn}
            size='xs'
            type='ghost'
          />
        </div>
      </div>
    );
  };

  const onChangeSortOpt = (value: string) => {
    setSortSelection(value);
    closeSortingModal();
  };

  return (
    <>
      <SelectModal
        className={`${className} modal-full`}
        closeIcon={<Icon
          phosphorIcon={CaretLeft}
          size='md'
        />}
        disabled={disabled}
        id={id}
        inputClassName={`${className} pool-selector-input`}
        itemKey={'address'}
        items={filteredList}
        label={label}
        onSelect={_onSelectItem}
        placeholder={placeholder || t('Select pool')}
        prefix={
          <Avatar
            size={20}
            theme={value ? isEthereumAddress(value) ? 'ethereum' : 'polkadot' : undefined}
            value={value}
          />
        }
        renderItem={renderItem}
        // eslint-disable-next-line react/jsx-no-bind
        renderSelected={renderSelected}
        rightIconProps={{
          icon: <Icon phosphorIcon={SortAscending} />,
          onClick: () => {
            activeModal(SORTING_MODAL_ID);
          }
        }}
        searchFunction={searchFunction}
        searchPlaceholder={t('Search validator')}
        searchableMinCharactersCount={2}
        selected={value || ''}
        title={t('Select pool')}
      />

      <FilterModal
        id={FILTER_MODAL_ID}
        onApplyFilter={onApplyFilter}
        // eslint-disable-next-line react/jsx-no-bind
        onCancel={closeFilterModal}
        onChangeOption={onChangeFilterOpt}
        optionSelection={changeFilters}
        options={filterOptions}
      />

      <SortingModal
        id={SORTING_MODAL_ID}
        // eslint-disable-next-line react/jsx-no-bind
        onCancel={closeSortingModal}
        // eslint-disable-next-line react/jsx-no-bind
        onChangeOption={onChangeSortOpt}
        optionSelection={sortSelection}
        options={sortingOptions}
      />
    </>
  );
};

const PoolSelector = styled(forwardRef(Component))<Props>(({ theme: { token } }: Props) => {
  return {
    '&.pool-selector-input': {
      '.__selected-item': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: token.colorTextLight1,
        whiteSpace: 'nowrap',
        overflow: 'hidden'
      },
      '.__selected-item-name': {
        textOverflow: 'ellipsis',
        fontWeight: token.headingFontWeight,
        overflow: 'hidden'
      },
      '.__selected-item-right-part': {
        color: token.colorTextLight4,
        paddingLeft: token.sizeXXS,
        marginRight: `-${token.marginSM - 2}px`
      }
    },

    '.ant-select-modal-input-wrapper': {
      height: 44,
      ' > span': {
        display: 'none'
      }
    }
  };
});

export default PoolSelector;
