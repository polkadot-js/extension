// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BasicInputWrapper } from '@subwallet/extension-koni-ui/components/Field/index';
import { FilterModal } from '@subwallet/extension-koni-ui/components/Modal/FilterModal';
import { SortingModal } from '@subwallet/extension-koni-ui/components/Modal/SortingModal';
import { ValidatorDetailModal, ValidatorDetailModalId } from '@subwallet/extension-koni-ui/components/Modal/Staking/ValidatorDetailModal';
import StakingValidatorItem from '@subwallet/extension-koni-ui/components/StakingItem/StakingValidatorItem';
import { useFilterModal } from '@subwallet/extension-koni-ui/hooks/modal/useFilterModal';
import { useSelectValidators } from '@subwallet/extension-koni-ui/hooks/modal/useSelectValidators';
import useGetValidatorList, { ValidatorDataType } from '@subwallet/extension-koni-ui/hooks/screen/staking/useGetValidatorList';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, InputRef, SwList, SwModal, useExcludeModal } from '@subwallet/react-ui';
import { ModalContext } from '@subwallet/react-ui/es/sw-modal/provider';
import { CaretLeft, CheckCircle, FadersHorizontal, SortAscending } from 'phosphor-react';
import React, { ForwardedRef, forwardRef, SyntheticEvent, useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import EmptyAccount from "@subwallet/extension-koni-ui/components/Account/EmptyAccount";

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
    value: '1'
  },
  {
    label: 'Waiting list',
    value: '2'
  },
  {
    label: 'Locked',
    value: '3'
  },
  {
    label: 'Destroying',
    value: '4'
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

const renderEmpty = () => <EmptyAccount />;

const Component = (props: Props, ref: ForwardedRef<InputRef>) => {
  const { chain, className = '', id = 'multi-validator-selector', onChange } = props;
  const items = useGetValidatorList(chain, 'nominate') as ValidatorDataType[];
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const [viewDetailItem, setViewDetailItem] = useState<ValidatorDataType | undefined>(undefined);
  const [sortSelection, setSortSelection] = useState<string>('');
  const { changeFilters, onApplyFilter, onChangeFilterOpt, selectedFilters } = useFilterModal(items, FILTER_MODAL_ID);
  const filteredList = useMemo(() => {
    return getFilteredList(items, selectedFilters);
  }, [items, selectedFilters]);
  const { changeValidators, onApplyChangeValidators, onCancelSelectValidator, onChangeSelectedValidator } = useSelectValidators(filteredList, id, onChange);

  const { t } = useTranslation();

  useExcludeModal(id);

  const closeFilterModal = () => {
    inactiveModal(FILTER_MODAL_ID);
  };

  const closeSortingModal = () => {
    inactiveModal(SORTING_MODAL_ID);
  };

  const onChangeSortOpt = (value: string) => {
    setSortSelection(value);
    closeSortingModal();
  };

  const onClickItem = useCallback((value: string) => {
    onChangeSelectedValidator(value);
  }, [onChangeSelectedValidator]);

  const renderItem = useCallback((item: ValidatorDataType) => (
    <StakingValidatorItem
      apy={'15'}
      className={'pool-item'}
      isSelected={changeValidators.includes(`${item.address}-${item.identity || ''}`)}
      key={item.address}
      validatorInfo={item}
      onClick={onClickItem}
      // eslint-disable-next-line react/jsx-no-bind
      onClickMoreBtn={(e: SyntheticEvent) => {
        e.stopPropagation();
        setViewDetailItem(item);
        activeModal(ValidatorDetailModalId);
      }}
    />
  ), [activeModal, changeValidators, onClickItem]);

  const onClickActionBtn = () => {
    activeModal(FILTER_MODAL_ID);
  };

  const searchFunction = useCallback((item: ValidatorDataType, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      item.address.toLowerCase().includes(searchTextLowerCase) ||
      (item.identity
        ? item.identity.toLowerCase().includes(searchTextLowerCase)
        : false)
    );
  }, []);

  const renderFooter = () => (
    <Button
      block
      icon={<Icon
        phosphorIcon={CheckCircle}
        weight={'fill'}
      />}
      // eslint-disable-next-line react/jsx-no-bind
      onClick={onApplyChangeValidators}
    >
      {t(`Apply ${changeValidators.length} validators`)}
    </Button>
  );

  return (
    <>
      <SwModal
        className={`${className} modal-full`}
        closeIcon={<Icon
          phosphorIcon={CaretLeft}
          size='md'
        />}
        footer={renderFooter()}
        id={id}
        // eslint-disable-next-line react/jsx-no-bind
        onCancel={onCancelSelectValidator}

        rightIconProps={{
          icon: <Icon phosphorIcon={SortAscending} />,
          onClick: () => {
            activeModal(SORTING_MODAL_ID);
          }
        }}
        title={t('Select validator')}
      >
        <SwList.Section
          actionBtnIcon={<Icon phosphorIcon={FadersHorizontal} />}
          className={''}
          enableSearchInput={true}
          list={filteredList}
          // eslint-disable-next-line react/jsx-no-bind
          onClickActionBtn={onClickActionBtn}
          renderItem={renderItem}
          renderWhenEmpty={renderEmpty}
          searchFunction={searchFunction}
          searchPlaceholder={t('Search validator')}
          searchableMinCharactersCount={2}
          showActionBtn
        />
      </SwModal>

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

      {viewDetailItem &&
        <ValidatorDetailModal
          commission={viewDetailItem.commission}
          decimals={0}
          earningEstimated={viewDetailItem.expectedReturn}
          minStake={viewDetailItem.minBond}
          // eslint-disable-next-line react/jsx-no-bind
          onCancel={() => inactiveModal(ValidatorDetailModalId)}
          ownStake={viewDetailItem.ownStake}
          status={'active'}
          symbol={viewDetailItem.symbol}
          validatorAddress={viewDetailItem.address}
          validatorName={viewDetailItem.identity || ''}
        />
      }

    </>
  );
};

const MultiValidatorSelector = styled(forwardRef(Component))<Props>(({ theme: { token } }: Props) => {
  return {
    '.ant-sw-modal-footer': {
      margin: 0
    },

    '.pool-item:not(:last-child)': {
      marginBottom: token.marginXS
    }
  };
});

export default MultiValidatorSelector;
