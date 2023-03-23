// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NominationInfo, StakingType } from '@subwallet/extension-base/background/KoniTypes';
import EmptyAccount from '@subwallet/extension-koni-ui/components/Account/EmptyAccount';
import { BasicInputWrapper } from '@subwallet/extension-koni-ui/components/Field/Base';
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
import React, { ForwardedRef, forwardRef, SyntheticEvent, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps, BasicInputWrapper {
  chain: string;
  onClickBookBtn?: (e: SyntheticEvent) => void;
  onClickLightningBtn?: (e: SyntheticEvent) => void;
  nominations?: NominationInfo[];
  isSingleSelect?: boolean;
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

const renderEmpty = () => <EmptyAccount />;

const Component = (props: Props, ref: ForwardedRef<InputRef>) => {
  const { chain, className = '', id = 'multi-validator-selector', isSingleSelect = false, nominations, onChange } = props;

  const { t } = useTranslation();
  const { activeModal, inactiveModal } = useContext(ModalContext);

  useExcludeModal(id);

  const items = useGetValidatorList(chain, StakingType.NOMINATED) as ValidatorDataType[];

  const nominatorValueList = useMemo(() => {
    return nominations && nominations.length ? nominations.map((item) => `${item.validatorAddress}___${item.validatorIdentity || ''}`) : [];
  }, [nominations]);

  const [viewDetailItem, setViewDetailItem] = useState<ValidatorDataType | undefined>(undefined);
  const [sortSelection, setSortSelection] = useState<string>('');
  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, selectedFilters } = useFilterModal(FILTER_MODAL_ID);

  const filterFunction = useMemo<(item: ValidatorDataType) => boolean>(() => {
    return (item) => {
      if (!selectedFilters.length) {
        return true;
      }

      // todo: logic filter here

      return false;
    };
  }, [selectedFilters]);

  const { changeValidators, onApplyChangeValidators, onCancelSelectValidator, onChangeSelectedValidator } = useSelectValidators(id, nominatorValueList, onChange, isSingleSelect);

  const closeSortingModal = useCallback(() => {
    inactiveModal(SORTING_MODAL_ID);
  }, [inactiveModal]);

  const onChangeSortOpt = useCallback((value: string) => {
    setSortSelection(value);
    closeSortingModal();
  }, [closeSortingModal]);

  const onClickItem = useCallback((value: string) => {
    onChangeSelectedValidator(value);
  }, [onChangeSelectedValidator]);

  const onClickMore = useCallback((item: ValidatorDataType) => {
    return (e: SyntheticEvent) => {
      e.stopPropagation();
      setViewDetailItem(item);
      activeModal(ValidatorDetailModalId);
    };
  }, [activeModal]);

  const renderItem = useCallback((item: ValidatorDataType) => {
    return (
      <StakingValidatorItem
        apy={'15'}
        className={'pool-item'}
        isNominated={nominatorValueList.includes(`${item.address}___${item.identity || ''}`)}
        isSelected={changeValidators.includes(`${item.address}___${item.identity || ''}`)}
        key={item.address}
        onClick={onClickItem}
        onClickMoreBtn={onClickMore(item)}
        validatorInfo={item}
      />
    );
  }, [changeValidators, nominatorValueList, onClickItem, onClickMore]);

  const onClickActionBtn = useCallback(() => {
    activeModal(FILTER_MODAL_ID);
  }, [activeModal]);

  const searchFunction = useCallback((item: ValidatorDataType, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      item.address.toLowerCase().includes(searchTextLowerCase) ||
      (item.identity
        ? item.identity.toLowerCase().includes(searchTextLowerCase)
        : false)
    );
  }, []);

  useEffect(() => {
    onApplyChangeValidators();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  return (
    <>
      <SwModal
        className={`${className} modal-full`}
        closeIcon={(
          <Icon
            phosphorIcon={CaretLeft}
            size='md'
          />
        )}
        footer={(
          <Button
            block
            icon={(
              <Icon
                phosphorIcon={CheckCircle}
                weight={'fill'}
              />
            )}
            onClick={onApplyChangeValidators}
          >
            {t(`Apply ${changeValidators.length} validators`)}
          </Button>
        )}
        id={id}
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
          enableSearchInput={true}
          filterBy={filterFunction}
          list={items}
          onClickActionBtn={onClickActionBtn}
          renderItem={renderItem}
          renderWhenEmpty={renderEmpty}
          searchFunction={searchFunction}
          searchPlaceholder={t<string>('Search validator')}
          searchableMinCharactersCount={2}
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

      <SortingModal
        id={SORTING_MODAL_ID}
        onCancel={closeSortingModal}
        onChangeOption={onChangeSortOpt}
        optionSelection={sortSelection}
        options={sortingOptions}
      />

      {viewDetailItem &&
        <ValidatorDetailModal
          status={'active'}
          validatorItem={viewDetailItem}
        />
      }

    </>
  );
};

const MultiValidatorSelector = styled(forwardRef(Component))<Props>(({ theme: { token } }: Props) => {
  return {
    '.ant-sw-modal-header': {
      paddingTop: token.paddingXS,
      paddingBottom: token.paddingLG
    },

    '.ant-sw-modal-body': {
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    },

    '.ant-sw-modal-footer': {
      margin: 0
    },

    '.pool-item:not(:last-child)': {
      marginBottom: token.marginXS
    }
  };
});

export default MultiValidatorSelector;
