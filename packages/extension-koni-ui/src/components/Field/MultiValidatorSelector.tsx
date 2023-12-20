// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { getValidatorLabel } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/chain-service/constants';
import { detectTranslate } from '@subwallet/extension-base/utils';
import EmptyValidator from '@subwallet/extension-koni-ui/components/Account/EmptyValidator';
import { BasicInputWrapper } from '@subwallet/extension-koni-ui/components/Field/Base';
import { FilterModal } from '@subwallet/extension-koni-ui/components/Modal/FilterModal';
import { SortingModal } from '@subwallet/extension-koni-ui/components/Modal/SortingModal';
import { ValidatorDetailModal } from '@subwallet/extension-koni-ui/components/Modal/Staking/ValidatorDetailModal';
import StakingValidatorItem from '@subwallet/extension-koni-ui/components/StakingItem/StakingValidatorItem';
import { VALIDATOR_DETAIL_MODAL } from '@subwallet/extension-koni-ui/constants';
import { useFilterModal } from '@subwallet/extension-koni-ui/hooks/modal/useFilterModal';
import { useSelectValidators } from '@subwallet/extension-koni-ui/hooks/modal/useSelectValidators';
import useGetChainStakingMetadata from '@subwallet/extension-koni-ui/hooks/screen/staking/useGetChainStakingMetadata';
import useGetNominatorInfo from '@subwallet/extension-koni-ui/hooks/screen/staking/useGetNominatorInfo';
import useGetValidatorList, { ValidatorDataType } from '@subwallet/extension-koni-ui/hooks/screen/staking/useGetValidatorList';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { getValidatorKey } from '@subwallet/extension-koni-ui/utils/transaction/stake';
import { Badge, Button, Icon, InputRef, ModalContext, SwList, SwModal, useExcludeModal } from '@subwallet/react-ui';
import { SwListSectionRef } from '@subwallet/react-ui/es/sw-list';
import BigN from 'bignumber.js';
import { CaretLeft, CheckCircle, FadersHorizontal, SortAscending } from 'phosphor-react';
import React, { ForwardedRef, forwardRef, SyntheticEvent, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import SelectValidatorInput from '../SelectValidatorInput';

interface Props extends ThemeProps, BasicInputWrapper {
  chain: string;
  from: string;
  onClickBookBtn?: (e: SyntheticEvent) => void;
  onClickLightningBtn?: (e: SyntheticEvent) => void;
  isSingleSelect?: boolean;
  setForceFetchValidator: (val: boolean) => void;
}

enum SortKey {
  COMMISSION = 'commission',
  RETURN = 'return',
  MIN_STAKE = 'min-stake',
  NOMINATING = 'nominating',
  DEFAULT = 'default'
}

interface SortOption {
  label: string;
  value: SortKey;
  desc: boolean;
}

const SORTING_MODAL_ID = 'nominated-sorting-modal';
const FILTER_MODAL_ID = 'nominated-filter-modal';

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

const defaultModalId = 'multi-validator-selector';

const Component = (props: Props, ref: ForwardedRef<InputRef>) => {
  const { chain, className = '', defaultValue, from, id = defaultModalId, isSingleSelect: _isSingleSelect = false, loading, onChange, setForceFetchValidator, value } = props;
  const { t } = useTranslation();
  const { activeModal, checkActive } = useContext(ModalContext);

  useExcludeModal(id);
  const isActive = checkActive(id);

  const items = useGetValidatorList(chain, StakingType.NOMINATED) as ValidatorDataType[];
  const nominatorMetadata = useGetNominatorInfo(chain, StakingType.NOMINATED, from);
  const chainStakingMetadata = useGetChainStakingMetadata(chain);

  const sectionRef = useRef<SwListSectionRef>(null);

  const maxCount = chainStakingMetadata?.maxValidatorPerNominator || 1;

  const isRelayChain = useMemo(() => _STAKING_CHAIN_GROUP.relay.includes(chain), [chain]);
  const nominations = useMemo(() => from ? nominatorMetadata[0]?.nominations : [], [from, nominatorMetadata]);
  const isSingleSelect = useMemo(() => _isSingleSelect || !isRelayChain, [_isSingleSelect, isRelayChain]);
  const hasReturn = useMemo(() => items[0]?.expectedReturn !== undefined, [items]);

  const sortingOptions: SortOption[] = useMemo(() => {
    const result: SortOption[] = [
      {
        desc: false,
        label: t('Lowest commission'),
        value: SortKey.COMMISSION
      }
    ];

    if (hasReturn) {
      result.push({
        desc: true,
        label: t('Highest annual return'),
        value: SortKey.RETURN
      });
    }

    if (nominations && nominations.length > 0) {
      result.push({
        desc: true,
        label: t('Nomination'),
        value: SortKey.NOMINATING
      });
    }

    result.push({
      desc: false,
      label: t('Lowest min active stake'),
      value: SortKey.MIN_STAKE
    });

    return result;
  }, [t, hasReturn, nominations]);

  const nominatorValueList = useMemo(() => {
    return nominations && nominations.length ? nominations.map((item) => getValidatorKey(item.validatorAddress, item.validatorIdentity)) : [];
  }, [nominations]);

  const [viewDetailItem, setViewDetailItem] = useState<ValidatorDataType | undefined>(undefined);
  const [sortSelection, setSortSelection] = useState<SortKey>(SortKey.DEFAULT);
  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, onResetFilter, selectedFilters } = useFilterModal(FILTER_MODAL_ID);

  const filterFunction = useMemo<(item: ValidatorDataType) => boolean>(() => {
    return (item) => {
      if (!selectedFilters.length) {
        return true;
      }

      // todo: logic filter here

      return true;
    };
  }, [selectedFilters]);

  const { changeValidators, onApplyChangeValidators, onCancelSelectValidator, onChangeSelectedValidator, onInitValidators } = useSelectValidators(id, chain, maxCount, onChange, isSingleSelect);

  const sortValidator = useCallback((a: ValidatorDataType, b: ValidatorDataType) => {
    const aKey = getValidatorKey(a.address, a.identity);
    const bKey = getValidatorKey(b.address, b.identity);

    if (nominatorValueList.includes(aKey) && !nominatorValueList.includes(bKey)) {
      return -1;
    }

    return 1;
  }, [nominatorValueList]);

  const resultList = useMemo((): ValidatorDataType[] => {
    return [...items].sort((a: ValidatorDataType, b: ValidatorDataType) => {
      switch (sortSelection) {
        case SortKey.COMMISSION:
          return a.commission - b.commission;
        case SortKey.RETURN:
          return (b.expectedReturn || 0) - (a.expectedReturn || 0);
        case SortKey.MIN_STAKE:
          return new BigN(a.minBond).minus(b.minBond).toNumber();
        case SortKey.NOMINATING:
          return sortValidator(a, b);
        case SortKey.DEFAULT:
        default:
          return 0;
      }
    });
  }, [items, sortSelection, sortValidator]);

  const fewValidators = changeValidators.length > 1;

  const applyLabel = useMemo(() => {
    const label = getValidatorLabel(chain);

    if (!fewValidators) {
      switch (label) {
        case 'dApp':
          return detectTranslate('Apply {{number}} dApp');
        case 'Collator':
          return detectTranslate('Apply {{number}} collator');
        case 'Validator':
          return detectTranslate('Apply {{number}} validator');
      }
    } else {
      switch (label) {
        case 'dApp':
          return detectTranslate('Apply {{number}} dApps');
        case 'Collator':
          return detectTranslate('Apply {{number}} collators');
        case 'Validator':
          return detectTranslate('Apply {{number}} validators');
      }
    }
  }, [chain, fewValidators]);

  const onResetSort = useCallback(() => {
    setSortSelection(SortKey.DEFAULT);
  }, []);

  const onChangeSortOpt = useCallback((value: string) => {
    setSortSelection(value as SortKey);
  }, []);

  const onClickItem = useCallback((value: string) => {
    onChangeSelectedValidator(value);
  }, [onChangeSelectedValidator]);

  const onClickMore = useCallback((item: ValidatorDataType) => {
    return (e: SyntheticEvent) => {
      e.stopPropagation();
      setViewDetailItem(item);
      activeModal(VALIDATOR_DETAIL_MODAL);
    };
  }, [activeModal]);

  const renderEmpty = useCallback(() => {
    return (
      <EmptyValidator
        isDataEmpty={items.length === 0}
        onClickReload={setForceFetchValidator}
        validatorTitle={t(handleValidatorLabel)}
      />
    );
  }, [chain, items.length, setForceFetchValidator, t]);

  const renderItem = useCallback((item: ValidatorDataType) => {
    const key = getValidatorKey(item.address, item.identity);
    const selected = changeValidators.includes(key);
    const nominated = nominatorValueList.includes(key);

    return (
      <StakingValidatorItem
        apy={item?.expectedReturn?.toString() || '0'}
        className={'pool-item'}
        isNominated={nominated}
        isSelected={selected}
        key={key}
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

  const onActiveValidatorSelector = useCallback(() => {
    activeModal(id);
  }, [activeModal, id]);

  useEffect(() => {
    const _default = nominations?.map((item) => getValidatorKey(item.validatorAddress, item.validatorIdentity)).join(',') || '';
    const selected = defaultValue || (isSingleSelect ? '' : _default);

    onInitValidators(_default, selected);
    onChange && onChange({ target: { value: selected } });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nominations, onInitValidators, isSingleSelect]);

  useEffect(() => {
    if (!isActive) {
      setSortSelection(SortKey.DEFAULT);
      setTimeout(() => {
        sectionRef.current?.setSearchValue('');
      }, 100);
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) {
      onResetFilter();
    }
  }, [isActive, onResetFilter]);

  const handleValidatorLabel = useMemo(() => {
    const label = getValidatorLabel(chain);

    return label !== 'dApp' ? label.toLowerCase() : label;
  }, [chain]);

  return (
    <>
      <SelectValidatorInput
        chain={chain}
        disabled={!chain || !from}
        label={t('Select') + ' ' + t(handleValidatorLabel)}
        loading={loading}
        onClick={onActiveValidatorSelector}
        value={value || ''}
      />
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
            disabled={!changeValidators.length}
            icon={(
              <Icon
                phosphorIcon={CheckCircle}
                weight={'fill'}
              />
            )}
            onClick={onApplyChangeValidators}
          >
            {t(applyLabel, { number: changeValidators.length })}
          </Button>
        )}
        id={id}
        onCancel={onCancelSelectValidator}
        rightIconProps={{
          icon: (
            <Badge dot={sortSelection !== SortKey.DEFAULT}>
              <Icon phosphorIcon={SortAscending} />
            </Badge>
          ),
          onClick: () => {
            activeModal(SORTING_MODAL_ID);
          }
        }}
        title={t('Select') + ' ' + t(handleValidatorLabel)}
      >
        <SwList.Section
          actionBtnIcon={<Icon phosphorIcon={FadersHorizontal} />}
          enableSearchInput={true}
          filterBy={filterFunction}
          list={resultList}
          onClickActionBtn={onClickActionBtn}
          ref={sectionRef}
          renderItem={renderItem}
          renderWhenEmpty={renderEmpty}
          searchFunction={searchFunction}
          searchMinCharactersCount={2}
          searchPlaceholder={t<string>(`Search ${handleValidatorLabel}`)}
          // showActionBtn
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
        onChangeOption={onChangeSortOpt}
        onReset={onResetSort}
        optionSelection={sortSelection}
        options={sortingOptions}
      />

      {viewDetailItem && (
        <ValidatorDetailModal
          chain={chain}
          validatorItem={viewDetailItem}
        />
      )}
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
      margin: 0,
      marginTop: token.marginXS,
      borderTop: 0,
      marginBottom: token.margin
    },

    '.pool-item:not(:last-child)': {
      marginBottom: token.marginXS
    }
  };
});

export default MultiValidatorSelector;
