// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Avatar } from '@subwallet/extension-koni-ui/components/Avatar';
import { BasicInputWrapper } from '@subwallet/extension-koni-ui/components/Field/index';
import { FilterModal } from '@subwallet/extension-koni-ui/components/Modal/FilterModal';
import { SortingModal } from '@subwallet/extension-koni-ui/components/Modal/SortingModal';
import { useSelectModalInputHelper } from '@subwallet/extension-koni-ui/hooks/form/useSelectModalInputHelper';
import { useFilterModal } from '@subwallet/extension-koni-ui/hooks/modal/useFilterModal';
import useGetValidatorList, { ValidatorDataType } from '@subwallet/extension-koni-ui/hooks/screen/staking/useGetValidatorList';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, InputRef, ModalContext, SelectModal, useExcludeModal } from '@subwallet/react-ui';
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

const SORTING_MODAL_ID = 'nominated-sorting-modal';
const FILTER_MODAL_ID = 'nominated-filter-modal';

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

const getFilteredList = (items: ValidatorDataType[], filters: string[]) => {
  const filteredList: ValidatorDataType[] = [];

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
  const { chain, className = '', disabled, id = 'validator-selector', label, onClickBookBtn, onClickLightningBtn, placeholder, value } = props;
  const items = useGetValidatorList(chain, 'nominate') as ValidatorDataType[];
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const [sortSelection, setSortSelection] = useState<string>('');
  const { changeFilters, onApplyFilter, onChangeFilterOpt, selectedFilters } = useFilterModal(items, FILTER_MODAL_ID);
  const filteredList = useMemo(() => {
    return getFilteredList(items, selectedFilters);
  }, [items, selectedFilters]);
  const { onSelect } = useSelectModalInputHelper(props, ref);

  useExcludeModal(id);

  const { t } = useTranslation();

  const searchFunction = useCallback((item: ValidatorDataType, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      item.address.toLowerCase().includes(searchTextLowerCase) ||
      (item.identity
        ? item.identity.toLowerCase().includes(searchTextLowerCase)
        : false)
    );
  }, []);

  const renderItem = useCallback((item: ValidatorDataType) => {
    return (
      // <StakingValidatorItem
      //   address={item.address}
      //   className={'pool-item'}
      //   identity={item.identity}
      //   symbol={item.symbol}
      //   commission={item.commission}
      //   // eslint-disable-next-line @typescript-eslint/no-empty-function,react/jsx-no-bind
      //   onClickMoreBtn={() => {}}
      // />
      <div>Need update this component</div>
    );
  }, []);

  const closeFilterModal = () => {
    inactiveModal(FILTER_MODAL_ID);
  };

  const closeSortingModal = useCallback(
    () => {
      inactiveModal(SORTING_MODAL_ID);
    },
    [inactiveModal]
  );

  const renderSelected = useCallback(
    (item: ValidatorDataType) => {
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
    },
    [onClickBookBtn, onClickLightningBtn]
  );

  const onChangeSortOpt = useCallback(
    (value: string) => {
      setSortSelection(value);
      closeSortingModal();
    },
    [closeSortingModal]
  );

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
        inputClassName={`${className} validator-selector-input`}
        itemKey={'address'}
        items={filteredList}
        label={label}
        onSelect={onSelect}
        placeholder={placeholder || t('Select validator')}
        prefix={
          <Avatar
            size={20}
            theme={value ? isEthereumAddress(value) ? 'ethereum' : 'polkadot' : undefined}
            value={value}
          />
        }
        renderItem={renderItem}
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
        title={t('Select validator')}
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
        onCancel={closeSortingModal}
        onChangeOption={onChangeSortOpt}
        optionSelection={sortSelection}
        options={sortingOptions}
      />
    </>
  );
};

const ValidatorSelector = styled(forwardRef(Component))<Props>(({ theme: { token } }: Props) => {
  return {
    '&.validator-selector-input': {
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
        paddingLeft: token.sizeXXS
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

export default ValidatorSelector;
