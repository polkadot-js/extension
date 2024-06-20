// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { getValidatorLabel } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/earning-service/constants';
import { YieldPoolType } from '@subwallet/extension-base/types';
import { detectTranslate } from '@subwallet/extension-base/utils';
import { BaseModal, SelectValidatorInput, StakingValidatorItem } from '@subwallet/extension-web-ui/components';
import EmptyValidator from '@subwallet/extension-web-ui/components/Account/EmptyValidator';
import { BasicInputWrapper } from '@subwallet/extension-web-ui/components/Field/Base';
import { EarningValidatorDetailModal } from '@subwallet/extension-web-ui/components/Modal/Earning';
import { FilterModal } from '@subwallet/extension-web-ui/components/Modal/FilterModal';
import { SortingModal } from '@subwallet/extension-web-ui/components/Modal/SortingModal';
import { VALIDATOR_DETAIL_MODAL } from '@subwallet/extension-web-ui/constants';
import { useFilterModal, useGetPoolTargetList, useSelector, useSelectValidators, useYieldPositionDetail } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps, ValidatorDataType } from '@subwallet/extension-web-ui/types';
import { getValidatorKey } from '@subwallet/extension-web-ui/utils/transaction/stake';
import { Badge, Button, Icon, InputRef, ModalContext, SwList, useExcludeModal } from '@subwallet/react-ui';
import { SwListSectionRef } from '@subwallet/react-ui/es/sw-list';
import BigN from 'bignumber.js';
import { CaretLeft, CheckCircle, FadersHorizontal, SortAscending } from 'phosphor-react';
import React, { ForwardedRef, forwardRef, SyntheticEvent, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps, BasicInputWrapper {
  chain: string;
  from: string;
  slug: string;
  onClickBookButton?: (e: SyntheticEvent) => void;
  onClickLightningButton?: (e: SyntheticEvent) => void;
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
  const { chain, className = '', defaultValue, from
    , id = defaultModalId, isSingleSelect: _isSingleSelect = false, onChange, slug
    , setForceFetchValidator, value } = props;
  const { t } = useTranslation();
  const { activeModal, checkActive } = useContext(ModalContext);
  const chainInfoMap = useSelector((state) => state.chainStore.chainInfoMap);
  const defaultValueRef = useRef({ _default: '_', selected: '_' });

  useExcludeModal(id);
  const isActive = checkActive(id);

  const sectionRef = useRef<SwListSectionRef>(null);

  const items = useGetPoolTargetList(slug) as ValidatorDataType[];

  const networkPrefix = chainInfoMap[chain]?.substrateInfo?.addressPrefix;

  const { compound } = useYieldPositionDetail(slug, from);

  const { poolInfoMap } = useSelector((state) => state.earning);

  const poolInfo = poolInfoMap[slug];
  const maxCount = poolInfo?.statistic?.maxCandidatePerFarmer || 1;

  const nominations = useMemo(() => compound?.nominations || [], [compound]);
  const isRelayChain = useMemo(() => _STAKING_CHAIN_GROUP.relay.includes(chain), [chain]);
  const isSingleSelect = useMemo(() => _isSingleSelect || !isRelayChain, [_isSingleSelect, isRelayChain]);
  const hasReturn = useMemo(() => items[0]?.expectedReturn !== undefined, [items]);

  const maxPoolMembersValue = useMemo(() => {
    if (poolInfo.type === YieldPoolType.NATIVE_STAKING) { // todo: should also check chain group for pool
      return poolInfo.maxPoolMembers;
    }

    return undefined;
  }, [poolInfo]);

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

  const { changeValidators,
    onApplyChangeValidators,
    onCancelSelectValidator,
    onChangeSelectedValidator,
    onInitValidators } = useSelectValidators(items, id, chain, maxCount, onChange, isSingleSelect);

  const [viewDetailItem, setViewDetailItem] = useState<ValidatorDataType | undefined>(undefined);
  const [sortSelection, setSortSelection] = useState<SortKey>(SortKey.DEFAULT);
  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, onResetFilter, selectedFilters } = useFilterModal(FILTER_MODAL_ID);

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

  const nominatorValueList = useMemo(() => {
    return nominations && nominations.length
      ? nominations.map((item) => getValidatorKey(item.validatorAddress, item.validatorIdentity))
      : [];
  }, [nominations]);

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
          if (a.isCrowded && !b.isCrowded) {
            return 1;
          } else if (!a.isCrowded && b.isCrowded) {
            return -1;
          } else {
            return 0;
          }

        default:
          return 0;
      }
    });
  }, [items, sortSelection, sortValidator]);

  const filterFunction = useMemo<(item: ValidatorDataType) => boolean>(() => {
    return (item) => {
      if (!selectedFilters.length) {
        return true;
      }

      // todo: logic filter here

      return true;
    };
  }, [selectedFilters]);

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
  const handleValidatorLabel = useMemo(() => {
    const label = getValidatorLabel(chain);

    return label !== 'dApp' ? label.toLowerCase() : label;
  }, [chain]);

  const renderEmpty = useCallback(() => {
    return (
      <EmptyValidator
        isDataEmpty={items.length === 0}
        onClickReload={setForceFetchValidator}
        validatorTitle={t(handleValidatorLabel)}
      />
    );
  }, [handleValidatorLabel, items.length, setForceFetchValidator, t]);

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
        prefixAddress = {networkPrefix}
        validatorInfo={item}
      />
    );
  }, [changeValidators, networkPrefix, nominatorValueList, onClickItem, onClickMore]);

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

    if (defaultValueRef.current._default === _default && defaultValueRef.current.selected === selected) {
      return;
    }

    onInitValidators(_default, selected);
    onChange && onChange({ target: { value: selected } });

    defaultValueRef.current = { _default, selected };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nominations, onInitValidators, isSingleSelect, defaultValue]);

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

  return (
    <>
      <SelectValidatorInput
        chain={chain}
        disabled={items.length < 1}
        label={t('Select') + ' ' + t(handleValidatorLabel)}
        loading={false}
        onClick={onActiveValidatorSelector}
        value={value || ''}
      />
      <BaseModal
        className={`${className}`}
        closeIcon={(
          <Icon
            phosphorIcon={CaretLeft}
            size='md'
          />
        )}
        footer={(
          <div style={{ display: 'flex', flexDirection: 'row' }}>
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
          </div>
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
      </BaseModal>

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
        <EarningValidatorDetailModal
          chain={chain}
          maxPoolMembersValue={maxPoolMembersValue}
          validatorItem={viewDetailItem}
        />
      )}
    </>
  );
};

const EarningValidatorSelector = styled(forwardRef(Component))<Props>(({ theme: { token } }: Props) => {
  return {
    '.ant-sw-modal-body': {
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      paddingLeft: 0,
      paddingRight: 0
    },
    '.ant-sw-modal-footer': {
      margin: 0,
      borderTop: 0,
      paddingLeft: 0,
      paddingRight: 0
    },
    '.__pool-item-wrapper': {
      marginBottom: token.marginXS
    },

    '.pool-item:not(:last-child)': {
      marginBottom: token.marginXS
    }
  };
});

export default EarningValidatorSelector;
