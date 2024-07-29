// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { getValidatorLabel } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { YieldPoolType } from '@subwallet/extension-base/types';
import { fetchStaticData } from '@subwallet/extension-base/utils';
import { StakingPoolItem } from '@subwallet/extension-koni-ui/components';
import EmptyValidator from '@subwallet/extension-koni-ui/components/Account/EmptyValidator';
import { Avatar } from '@subwallet/extension-koni-ui/components/Avatar';
import { BasicInputWrapper } from '@subwallet/extension-koni-ui/components/Field/Base';
import { EarningPoolDetailModal } from '@subwallet/extension-koni-ui/components/Modal/Earning';
import { EarningPoolDetailModalId } from '@subwallet/extension-koni-ui/components/Modal/Earning/EarningPoolDetailModal';
import { FilterModal } from '@subwallet/extension-koni-ui/components/Modal/FilterModal';
import { SortingModal } from '@subwallet/extension-koni-ui/components/Modal/SortingModal';
import { useFilterModal, useGetPoolTargetList, useSelector, useYieldPositionDetail } from '@subwallet/extension-koni-ui/hooks';
import { NominationPoolDataType, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ActivityIndicator, Badge, Button, Icon, InputRef, ModalContext, SelectModal, Tooltip, useExcludeModal } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import { Book, CaretLeft, FadersHorizontal, SortAscending, ThumbsUp } from 'phosphor-react';
import React, { ForwardedRef, forwardRef, SyntheticEvent, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

interface Props extends ThemeProps, BasicInputWrapper {
  slug: string;
  chain: string;
  from: string;
  onClickBookButton?: (e: SyntheticEvent) => void;
  setForceFetchValidator: (val: boolean) => void;
}

enum SortKey {
  MEMBER = 'member',
  TOTAL_POOLED = 'total-pooled',
  DEFAULT = 'default'
}

interface SortOption {
  label: string;
  value: SortKey;
  desc: boolean;
}

interface FilterOption {
  label: string;
  value: NominationPoolDataType['state'];
}

const SORTING_MODAL_ID = 'pool-sorting-modal';
const FILTER_MODAL_ID = 'pool-filter-modal';

const Component = (props: Props, ref: ForwardedRef<InputRef>) => {
  const { chain, className = '', defaultValue, disabled,
    from,
    id = 'pool-selector',
    label, loading, onChange,
    onClickBookButton,
    placeholder,
    setForceFetchValidator,
    slug, statusHelp,
    value } = props;

  useExcludeModal(id);

  const { t } = useTranslation();

  const { activeModal, checkActive, inactiveModal } = useContext(ModalContext);
  const chainInfoMap = useSelector((state) => state.chainStore.chainInfoMap);

  const isActive = checkActive(id);

  const items = useGetPoolTargetList(slug) as NominationPoolDataType[];
  const networkPrefix = chainInfoMap[chain]?.substrateInfo?.addressPrefix;
  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, onResetFilter, selectedFilters } = useFilterModal(FILTER_MODAL_ID);
  const { compound } = useYieldPositionDetail(slug, from);
  const { poolInfoMap } = useSelector((state) => state.earning);
  const [defaultPoolMap, setDefaultPoolMap] = useState<Record<string, number[]>>({});

  const maxPoolMembersValue = useMemo(() => {
    const poolInfo = poolInfoMap[slug];

    if (poolInfo.type === YieldPoolType.NOMINATION_POOL) {
      return poolInfo.maxPoolMembers;
    }

    return undefined;
  }, [poolInfoMap, slug]);

  const sortingOptions: SortOption[] = useMemo(() => {
    return [
      {
        desc: false,
        label: t('Lowest total member'),
        value: SortKey.MEMBER
      },
      {
        desc: true,
        label: t('Highest total staked'),
        value: SortKey.TOTAL_POOLED
      }
    ];
  }, [t]);

  const filterOptions: FilterOption[] = useMemo(() => ([
    {
      label: t('Open'),
      value: 'Open'
    },
    {
      label: t('Locked'),
      value: 'Locked'
    },
    {
      label: t('Destroying'),
      value: 'Destroying'
    },
    {
      label: t('Blocked'),
      value: 'Blocked'
    }
  ]), [t]);

  const [viewDetailItem, setViewDetailItem] = useState<NominationPoolDataType | undefined>(undefined);
  const [sortSelection, setSortSelection] = useState<SortKey>(SortKey.DEFAULT);

  const nominationPoolValueList = useMemo((): string[] => {
    return compound?.nominations.map((item) => item.validatorAddress) || [];
  }, [compound?.nominations]);

  const defaultSelectPool = defaultPoolMap?.[chain];

  const resultList = useMemo((): NominationPoolDataType[] => {
    const recommendedSessionHeader: NominationPoolDataType = { address: '', bondedAmount: '', decimals: 0, id: -1, idStr: '-1', isProfitable: false, memberCounter: 0, roles: { bouncer: '', depositor: '', nominator: '', root: '' }, state: 'Open', symbol: '', name: 'Recommended', isSessionHeader: true, disabled: true };
    const othersSessionHeader: NominationPoolDataType = { address: '', bondedAmount: '', decimals: 0, id: -2, idStr: '-2', isProfitable: false, memberCounter: 0, roles: { bouncer: '', depositor: '', nominator: '', root: '' }, state: 'Open', symbol: '', name: 'Others', isSessionHeader: true, disabled: true };

    const filteredItems = [...items]
      .filter((value) => {
        const filters = selectedFilters as NominationPoolDataType['state'][];

        if (filters.length) {
          return filters.includes(value.state);
        } else {
          return true;
        }
      })
      .map((item) => {
        const disabled = item.isCrowded || item.state === 'Blocked';

        return { ...item, disabled };
      })
      .sort((a: NominationPoolDataType, b: NominationPoolDataType) => {
        switch (sortSelection) {
          case SortKey.MEMBER:
            return a.memberCounter - b.memberCounter;
          case SortKey.TOTAL_POOLED:
            return new BigN(b.bondedAmount).minus(a.bondedAmount).toNumber();

          default:
            if (sortSelection === SortKey.DEFAULT) {
              if (defaultPoolMap?.[chain] && defaultPoolMap?.[chain].length) {
                const isRecommendedA = defaultPoolMap?.[chain].includes(a.id);
                const isRecommendedB = defaultPoolMap?.[chain].includes(b.id);

                if (isRecommendedA && !isRecommendedB) {
                  return -1;
                } else if (!isRecommendedA && isRecommendedB) {
                  return 1;
                }
              }

              if (a.disabled && !b.disabled) {
                return 1;
              } else if (!a.disabled && b.disabled) {
                return -1;
              }

              return 0;
            } else {
              return 0;
            }
        }
      })
      .map((item) => {
        if (defaultPoolMap?.[chain] && defaultPoolMap?.[chain].includes(item.id)) {
          return { ...item, isRecommend: true };
        }

        return item;
      });

    const recommendedExistedLength = filteredItems.filter((item) => item.isRecommend).length;
    const otherExistedLength = filteredItems.filter((item) => !item.isRecommend).length;

    if (recommendedExistedLength > 0 && otherExistedLength > 0) {
      return [recommendedSessionHeader, ...filteredItems.filter((item) => item.isRecommend), othersSessionHeader, ...filteredItems.filter((item) => !item.isRecommend)];
    } else if (recommendedExistedLength > 0) {
      return [...filteredItems.filter((item) => item.isRecommend)];
    } else if (otherExistedLength > 0) {
      return [...filteredItems.filter((item) => !item.isRecommend)];
    } else {
      return [];
    }
  }, [chain, defaultPoolMap, items, selectedFilters, sortSelection]);

  const isDisabled = useMemo(() =>
    disabled ||
      !!nominationPoolValueList.length ||
      !items.length
  , [disabled, items.length, nominationPoolValueList.length]
  );

  const _onSelectItem = useCallback((value: string) => {
    onChange && onChange({ target: { value } });
  }, [onChange]);

  const searchFunction = useCallback((item: NominationPoolDataType, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      item.id >= 0 && (item.address.toLowerCase().includes(searchTextLowerCase) || (item.name ? item.name.toLowerCase().includes(searchTextLowerCase) : false))
    );
  }, []);

  const onClickMore = useCallback((item: NominationPoolDataType) => {
    return (e: SyntheticEvent) => {
      e.stopPropagation();
      setViewDetailItem(item);
      activeModal(EarningPoolDetailModalId);
    };
  }, [activeModal]);

  const renderItem = useCallback((item: NominationPoolDataType) => {
    if (item.isSessionHeader) {
      return (
        <div
          className={'__session-header'}
          key={item.name}
        >{item.name?.toUpperCase()}
          {item.name?.includes('Recommended')
            ? (
              <Icon
                className={'__selected-icon'}
                iconColor='#4cd9ac'
                phosphorIcon={ThumbsUp }
                size='xs'
                weight='fill'
              />
            )
            : null}
        </div>
      );
    }

    return (
      item.isCrowded
        ? (
          <Tooltip
            key={item.id}
            placement={'top'}
            title={t('This pool has reached the maximum number of members. Select another to continue')}
          >
            <div
              className={'__pool-item-wrapper'}
              key={item.id}
            >
              <StakingPoolItem
                {...item}
                className={'pool-item'}
                onClickMoreBtn={onClickMore(item)}
                prefixAddress={networkPrefix}
              />
            </div>
          </Tooltip>
        )
        : (
          item.state === 'Blocked'
            ? (
              <Tooltip
                key={item.id}
                placement={'top'}
                title={t('This pool is blocked. Select another to continue')}
              >
                <div
                  className={'__pool-item-wrapper'}
                  key={item.id}
                >
                  <StakingPoolItem
                    {...item}
                    className={'pool-item'}
                    onClickMoreBtn={onClickMore(item)}
                    prefixAddress={networkPrefix}
                  />
                </div>
              </Tooltip>
            )
            : (
              <StakingPoolItem
                {...item}
                className={'pool-item'}
                key={item.id}
                onClickMoreBtn={onClickMore(item)}
                prefixAddress={networkPrefix}
              />
            )
        )
    );
  }, [networkPrefix, onClickMore, t]);

  const renderEmpty = useCallback(() => {
    return (
      <EmptyValidator
        isDataEmpty={items.length === 0}
        onClickReload={setForceFetchValidator}
        validatorTitle={t(getValidatorLabel(chain).toLowerCase())}
      />
    );
  }, [chain, items.length, setForceFetchValidator, t]);

  const renderSelected = useCallback((item: NominationPoolDataType) => {
    const isCheckRecommend = defaultPoolMap?.[chain]?.includes(item.id);

    return (
      <div className={'__selected-item'}>
        <div className={'__selected-item-name common-text'}>
          {isCheckRecommend
            ? (
              <>
                {item.name}
                <div className={'__title-suffix'}>&nbsp;(Recommended)</div>
              </>
            )
            : (
              item.name || `Pool #${item.id}`
            )}
        </div>
      </div>
    );
  }, [chain, defaultPoolMap]);

  const onChangeSortOpt = useCallback((value: string) => {
    setSortSelection(value as SortKey);
  }, []);

  const onResetSort = useCallback(() => {
    setSortSelection(SortKey.DEFAULT);
  }, []);

  const onClickActionBtn = useCallback(() => {
    activeModal(FILTER_MODAL_ID);
  }, [activeModal]);

  const onCloseDetail = useCallback(() => {
    inactiveModal(EarningPoolDetailModalId);
  }, [inactiveModal]);

  useEffect(() => {
    fetchStaticData<Record<string, number[]>>('nomination-pool-recommendation').then((earningPoolRecommendation) => {
      setDefaultPoolMap(earningPoolRecommendation);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const defaultSelectedPool = defaultValue || nominationPoolValueList[0] || `${defaultSelectPool?.[0] || ''}`;

    onChange && onChange({ target: { value: defaultSelectedPool } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nominationPoolValueList, items]);

  useEffect(() => {
    if (!isActive) {
      setSortSelection(SortKey.DEFAULT);
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) {
      onResetFilter();
    }
  }, [isActive, onResetFilter]);

  return (
    <>
      <SelectModal
        actionBtnIcon={(
          <Badge dot={!!selectedFilters.length}>
            <Icon phosphorIcon={FadersHorizontal} />
          </Badge>
        )}
        className={`${className} modal-full`}
        closeIcon={(
          <Icon
            phosphorIcon={CaretLeft}
            size='md'
          />
        )}
        disabled={isDisabled}
        id={id}
        inputClassName={`${className} pool-selector-input`}
        itemKey={'idStr'}
        items={resultList}
        label={label}
        loading={loading}
        onClickActionBtn={onClickActionBtn}
        onSelect={_onSelectItem}
        placeholder={placeholder || t('Select pool')}
        prefix={(
          <Avatar
            size={20}
            theme={value ? isEthereumAddress(value) ? 'ethereum' : 'polkadot' : undefined}
            value={value}
          />
        )}
        renderItem={renderItem}
        renderSelected={renderSelected}
        renderWhenEmpty={renderEmpty}
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
        searchFunction={searchFunction}
        searchMinCharactersCount={2}
        searchPlaceholder={t<string>('Search validator')}
        selected={value || ''}
        showActionBtn
        statusHelp={statusHelp}
        suffix={loading
          ? (
            <div>
              <ActivityIndicator size={20} />
            </div>
          )
          : (
            <div className='select-pool-suffix'>
              <Button
                disabled={isDisabled}
                icon={(
                  <Icon
                    phosphorIcon={Book}
                    size='sm'
                  />
                )}
                onClick={onClickBookButton}
                size='xs'
                type='ghost'
              />
            </div>
          )}
        title={t('Select pool')}
      />

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

      <EarningPoolDetailModal
        chain={chain}
        detailItem={viewDetailItem}
        maxPoolMembersValue={maxPoolMembersValue}
        onCancel={onCloseDetail}
      />
    </>
  );
};

const EarningPoolSelector = styled(forwardRef(Component))<Props>(({ theme: { token } }: Props) => {
  return {
    '.ant-sw-modal-header': {
      paddingTop: token.paddingXS,
      paddingBottom: token.paddingLG
    },

    '.ant-sw-modal-content': {
      paddingBottom: token.padding
    },

    '.__session-header': {
      fontSize: token.fontSizeSM,
      color: token.colorTextSecondary,
      fontWeight: token.fontWeightStrong,
      marginBottom: -token.marginXXS,
      marginTop: token.marginXXS,
      lineHeight: token.lineHeightSM
    },

    '.__selected-icon': {
      paddingLeft: token.paddingXXS
    },

    '.ant-sw-list-search-input': {
      paddingBottom: token.paddingXS
    },

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
      '.ant-select-modal-input-wrapper': {
        paddingTop: 0,
        paddingBottom: token.paddingXXS
      }
    },

    '.__title-suffix': {
      fontSize: token.fontSizeSM,
      fontWeight: token.bodyFontWeight,
      lineHeight: token.lineHeightSM,
      color: token.colorTextTertiary
    },

    '.__selected-item-name.common-text': {
      display: 'flex',
      alignItems: 'baseline'
    },

    '.ant-select-modal-input-wrapper': {
      height: 44
    },

    '.select-pool-suffix': {
      marginRight: -token.marginSM + 2
    }
  };
});

export default EarningPoolSelector;
