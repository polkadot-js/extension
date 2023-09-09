// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType, StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { EmptyList, FilterModal, Layout, PageWrapper, SwStakingItem, TokenBalance, TokenItem, TokenPrice } from '@subwallet/extension-koni-ui/components';
import { FilterTabItemType, FilterTabs } from '@subwallet/extension-koni-ui/components/FilterTabs';
import NoContent, { PAGE_TYPE } from '@subwallet/extension-koni-ui/components/NoContent';
import Search from '@subwallet/extension-koni-ui/components/Search';
import { ALL_KEY } from '@subwallet/extension-koni-ui/constants';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { useFilterModal, useGetStakingList, useNotification, usePreCheckAction, useSelector, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { getBalanceValue, getConvertedBalanceValue } from '@subwallet/extension-koni-ui/hooks/screen/home/useAccountBalance';
import { reloadCron } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { PhosphorIcon, StakingDataType, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { sortStakingByValue, stopClickPropagation } from '@subwallet/extension-koni-ui/utils';
import { ActivityIndicator, Button, ButtonProps, Icon, ModalContext, SwList, Table, Tag } from '@subwallet/react-ui';
import capitalize from '@subwallet/react-ui/es/_util/capitalize';
import { ArrowClockwise, DotsThree, FadersHorizontal, Plus, Trophy, User, Users } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import MoreActionModal, { MORE_ACTION_MODAL } from './MoreActionModal';
import StakingDetailModal, { STAKING_DETAIL_MODAL_ID } from './StakingDetailModal';

type Props = ThemeProps

const FILTER_MODAL_ID = 'staking-filter-modal';

enum FilterValue {
  ALL = 'ALL',
  NOMINATED = 'nominated',
  POOLED = 'pooled'
}

const rightIcon = (
  <Icon
    phosphorIcon={Plus}
    size='sm'
    type='phosphor'
  />
);

const reloadIcon = (
  <Icon
    phosphorIcon={ArrowClockwise}
    size='sm'
    type='phosphor'
  />
);

interface StakingItem extends StakingDataType {
  price: number;
  key: string;
  price24h: number;
}

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState<string>('');

  const dataContext = useContext(DataContext);
  const { isWebUI } = useContext(ScreenContext);
  const { activeModal, inactiveModal } = useContext(ModalContext);

  const { data: stakingItems, priceMap } = useGetStakingList();
  const price24hMap = useSelector((state: RootState) => state.price.price24hMap);

  const { currentAccount } = useSelector((state) => state.accountState);

  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, selectedFilters } = useFilterModal(FILTER_MODAL_ID);

  const [address] = useState(currentAccount?.address);
  const [selectedItem, setSelectedItem] = useState<StakingDataType | undefined>(undefined);

  const [loading, setLoading] = React.useState<boolean>(false);
  const notify = useNotification();
  const [selectedFilterTab, setSelectedFilterTab] = useState<string>(FilterValue.ALL);

  const items = useMemo<StakingItem[]>(() => {
    const result = stakingItems
      .map((item) => (
        {
          ...item,
          key: item.staking.chain + item.staking.address + item.staking.type,
          price: priceMap[item.staking.chain] || 0,
          price24h: price24hMap[item.staking.chain] || 0
        }));

    return result.sort(sortStakingByValue);
  }, [price24hMap, priceMap, stakingItems]);

  const FILTER_OPTIONS = useMemo(() => ([
    { label: t('Nominated'), value: StakingType.NOMINATED },
    { label: t('Pooled'), value: StakingType.POOLED }
  ]), [t]);

  const filterFunction = useMemo<(item: StakingDataType) => boolean>(() => {
    return (item) => {
      if (!selectedFilters.length) {
        return true;
      }

      for (const filter of selectedFilters) {
        if (filter === FilterValue.NOMINATED) {
          if (item.staking.type === StakingType.NOMINATED) {
            return true;
          }
        } else if (filter === StakingType.POOLED) {
          if (item.staking.type === StakingType.POOLED) {
            return true;
          }
        }
      }

      return false;
    };
  }, [selectedFilters]);

  const onClickActionBtn = useCallback(() => {
    activeModal(FILTER_MODAL_ID);
  }, [activeModal]);

  const onClickRightIcon = useCallback((item: StakingDataType) => {
    setSelectedItem(item);
    activeModal(MORE_ACTION_MODAL);
  }, [activeModal]);

  const onClickItem = useCallback((item: StakingDataType) => {
    setSelectedItem(item);

    setTimeout(() => {
      activeModal(STAKING_DETAIL_MODAL_ID);
    }, 100);
  }, [activeModal]);

  const preCheck = usePreCheckAction(currentAccount?.address, false);

  const onClickStakeMore = useCallback(() => {
    navigate(`/transaction/stake/${ALL_KEY}/${ALL_KEY}`);
  }, [navigate]);

  const onClickReload = useCallback(() => {
    setLoading(true);
    notify({
      icon: <ActivityIndicator size={32} />,
      style: { top: 210 },
      direction: 'vertical',
      duration: 1.8,
      closable: false,
      message: t('Reloading')
    });

    reloadCron({ data: 'staking' })
      .then(() => {
        setLoading(false);
      })
      .catch(console.error);
  }, [notify, t]);

  const subHeaderButton: ButtonProps[] = useMemo(() => ([
    {
      icon: reloadIcon,
      disabled: loading,
      size: 'sm',
      onClick: onClickReload,
      tooltip: t('Reload')
    },
    {
      icon: rightIcon,
      onClick: preCheck(onClickStakeMore, ExtrinsicType.STAKING_BOND),
      tooltip: t('Add to bond')
    }
  ]), [loading, onClickReload, t, preCheck, onClickStakeMore]);

  const renderItem = useCallback((item: StakingDataType) => {
    return (
      <SwStakingItem
        className='staking-item'
        decimals={item.decimals}
        key={`${item.staking.chain}-${item.staking.type}-${item.staking.address}`}
        onClickItem={onClickItem}
        onClickRightIcon={onClickRightIcon}
        priceMap={priceMap}
        stakingData={item}
      />
    );
  }, [onClickItem, onClickRightIcon, priceMap]);

  const searchFunction = useCallback((item: StakingDataType, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      item.staking.nativeToken.toLowerCase().includes(searchTextLowerCase)
    );
  }, []);

  const filteredList = useMemo(() => {
    const filterTabFunction = (_item: StakingDataType) => {
      if (selectedFilterTab === FilterValue.ALL) {
        return true;
      }

      if (selectedFilterTab === FilterValue.NOMINATED) {
        return _item.staking.type === StakingType.NOMINATED;
      }

      if (selectedFilterTab === FilterValue.POOLED) {
        return _item.staking.type === StakingType.POOLED;
      }

      return false;
    };

    const _filterFunction = (_item: StakingDataType) => {
      return filterTabFunction(_item) && filterFunction(_item) && searchFunction(_item, searchInput);
    };

    return items.filter(_filterFunction);
  }, [items, selectedFilterTab, filterFunction, searchFunction, searchInput]);

  const emptyStakingList = useCallback(() => {
    return (
      <EmptyList
        emptyMessage={t('Your staking accounts will appear here!')}
        emptyTitle={t('No staking')}
        phosphorIcon={Trophy}
      />
    );
  }, [t]);

  useEffect(() => {
    if (currentAccount?.address !== address) {
      inactiveModal(MORE_ACTION_MODAL);
      inactiveModal(STAKING_DETAIL_MODAL_ID);
      setSelectedItem(undefined);
    }
  }, [address, currentAccount?.address, inactiveModal, navigate]);

  const onClickRowMoreAction = useCallback((item: StakingDataType) => {
    return (event: React.MouseEvent) => {
      stopClickPropagation(event);
      onClickRightIcon(item);
    };
  }, [onClickRightIcon]);

  const columns = useMemo(() => {
    return [
      {
        title: 'Token name',
        dataIndex: 'name',
        key: 'name',
        render: (_: any, row: StakingItem) => {
          const { staking: { chain,
            name,
            nativeToken } } = row;

          return (
            <TokenItem
              chain={chain}
              logoKey={nativeToken}
              networkKey={chain}
              subTitle={name || ''}
              symbol={nativeToken}
            />
          );
        }
      },
      {
        title: () => (
          <span
            style={{
              padding: '0 40px'
            }}
          >
            Type
          </span>
        ),
        className: '__tag-col',
        dataIndex: 'type',
        key: 'type',
        render: (_: any, row: StakingItem) => {
          const { staking: { type: stakingType } } = row;
          const tagColor = stakingType === StakingType.POOLED ? 'success' : 'warning';
          const tagIcon: PhosphorIcon = stakingType === StakingType.POOLED ? Users : User;

          return (
            <Tag
              className='staking-tag'
              color={tagColor}
              icon={<Icon phosphorIcon={tagIcon} />}
            >
              {capitalize(stakingType)}
            </Tag>
          );
        }
      },
      {
        title: 'Price',
        dataIndex: 'price',
        key: 'price',
        render: (_: any, row: StakingItem) => {
          return (
            <TokenPrice
              pastValue={row.price24h}
              value={row.price}
            />
          );
        }
      },
      {
        title: 'Bonded funds',
        dataIndex: 'bonded',
        key: 'bonded',
        render: (_: any, row: StakingItem) => {
          const { staking } = row;

          const balanceValue = getBalanceValue(staking.balance || '0', row.decimals);
          const convertedBalanceValue = getConvertedBalanceValue(balanceValue, Number(`${priceMap[staking.chain] || 0}`));

          return (
            <div className='funds-wrapper'>
              <TokenBalance
                convertedValue={convertedBalanceValue}
                symbol={staking.unit}
                value={balanceValue}
              />

              <Button
                className='extra-button'
                icon={(
                  <Icon
                    className={'right-icon'}
                    customSize={'20px'}
                    phosphorIcon={DotsThree}
                    type='phosphor'
                  />
                )}
                onClick={onClickRowMoreAction(row)}
                size='xs'
                type='ghost'
              />
            </div>
          );
        }
      }
    ];
  }, [onClickRowMoreAction, priceMap]);

  const onSearch = useCallback((value: string) => setSearchInput(value), []);

  const onRow = useCallback(
    (record: StakingDataType) => {
      return {
        onClick: () => onClickItem(record)
      };
    }, [onClickItem]);

  const onClickStake = useCallback(() => {
    preCheck(() => navigate(`/transaction/stake/${ALL_KEY}/${ALL_KEY}`), ExtrinsicType.STAKING_BOND)();
  }, [navigate, preCheck]);

  const filterTabItems = useMemo<FilterTabItemType[]>(() => {
    return [
      {
        label: t('All'),
        value: FilterValue.ALL
      },
      {
        label: t('Pooled'),
        value: FilterValue.POOLED
      },
      {
        label: t('Nominated'),
        value: FilterValue.NOMINATED
      }
    ];
  }, [t]);

  const onSelectFilterTab = useCallback((value: string) => {
    setSelectedFilterTab(value);
  }, []);

  const listSection = useMemo(() => {
    if (isWebUI) {
      return (
        <div className='web-list'>
          <div className='web-list-tool-area'>
            <FilterTabs
              className={'filter-tabs-container'}
              items={filterTabItems}
              onSelect={onSelectFilterTab}
              selectedItem={selectedFilterTab}
            />

            <Search
              actionBtnIcon={(
                <Icon
                  phosphorIcon={FadersHorizontal}
                  size='sm'
                />
              )}
              extraButton={
                <>
                  <Button
                    icon={(
                      <Icon
                        phosphorIcon={ArrowClockwise}
                        size='md'
                      />
                    )}
                    onClick={onClickReload}
                    tooltip={t('Reload')}
                    type='ghost'
                  />
                  <Button
                    icon={(
                      <Icon
                        phosphorIcon={Plus}
                        size='md'
                      />
                    )}
                    onClick={onClickStake}
                    tooltip={t('Add to bond')}
                    type='ghost'
                  />
                </>
              }
              onClickActionBtn={onClickActionBtn}
              onSearch={onSearch}
              placeholder={'Token name'}
              searchValue={searchInput}
              showActionBtn
              showExtraButton
            />
          </div>

          { filteredList.length > 0
            ? (
              <Table
                columns={columns}
                dataSource={filteredList}
                onRow={onRow}
                pagination={false}
                rowKey={'key'}
              />
            )
            : (
              <NoContent pageType={PAGE_TYPE.STAKING} />
            )}
        </div>
      );
    }

    return (
      <SwList.Section
        actionBtnIcon={(
          <Icon
            phosphorIcon={FadersHorizontal}
            size='sm'
          />
        )}
        enableSearchInput={true}
        filterBy={filterFunction}
        list={items}
        onClickActionBtn={onClickActionBtn}
        renderItem={renderItem}
        renderWhenEmpty={emptyStakingList}
        searchFunction={searchFunction}
        searchMinCharactersCount={2}
        searchPlaceholder={t<string>('Search token')}
        showActionBtn
      />
    );
  }, [columns, emptyStakingList, filterFunction, filterTabItems, filteredList, isWebUI, items, onClickActionBtn, onClickReload, onClickStake, onRow, onSearch, onSelectFilterTab, renderItem, searchFunction, searchInput, selectedFilterTab, t]);

  return (
    <PageWrapper
      className={`staking ${className}`}
      resolve={dataContext.awaitStores(['staking', 'price'])}
    >
      <Layout.Base
        showSubHeader={true}
        subHeaderBackground={'transparent'}
        subHeaderCenter={false}
        subHeaderIcons={subHeaderButton}
        subHeaderPaddingVertical={true}
        title={t('Staking')}
      >

        {listSection}

        <FilterModal
          id={FILTER_MODAL_ID}
          onApplyFilter={onApplyFilter}
          onCancel={onCloseFilterModal}
          onChangeOption={onChangeFilterOption}
          optionSelectionMap={filterSelectionMap}
          options={FILTER_OPTIONS}
        />

        {
          !!(selectedItem && selectedItem.nominatorMetadata && selectedItem.chainStakingMetadata) &&
          (
            <StakingDetailModal
              chainStakingMetadata={selectedItem.chainStakingMetadata}
              nominatorMetadata={selectedItem.nominatorMetadata}
              rewardItem={selectedItem.reward}
              staking={selectedItem.staking}
            />
          )
        }
        {
          !!(selectedItem && selectedItem.nominatorMetadata && selectedItem.chainStakingMetadata) &&
          (
            <MoreActionModal
              chainStakingMetadata={selectedItem.chainStakingMetadata}
              nominatorMetadata={selectedItem.nominatorMetadata}
              reward={selectedItem.reward}
              staking={selectedItem.staking}
            />
          )
        }
      </Layout.Base>
    </PageWrapper>
  );
}

export const Staking = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '&.staking': {
      color: token.colorTextLight1,
      fontSize: token.fontSizeLG,

      '.ant-table-row': {
        cursor: 'pointer'
      },

      'td.__tag-col': {
        verticalAlign: 'top'
      },

      '.web-list': {
        width: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        '.ant-sw-list': {
          flex: 1
        },

        '.web-list-tool-area': {
          display: 'flex',
          gap: token.size,
          alignItems: 'center',
          marginBottom: 24
        }
      },

      '.funds-wrapper': {
        display: 'flex',
        justifyContent: 'end',
        marginRight: -token.margin,

        '.extra-button': {
          marginLeft: token.margin,
          '.anticon': {
            width: 'fit-content'
          }
        }
      },

      '.ant-sw-screen-layout-body': {
        display: 'flex'
      },

      '.ant-sw-list-section': {
        flex: 1
      },

      '.staking__filter_option': {
        width: '100%'
      },

      '.staking__filter_option_wrapper': {
        display: 'flex',
        flexDirection: 'column',
        gap: token.marginLG
      },

      '.staking-item': {
        marginBottom: token.marginXS
      }
    },
    '&.popover': {
      padding: token.padding,
      borderRadius: token.borderRadiusLG,
      border: '1px solid',
      backgroundColor: token.colorBgSecondary,
      borderColor: token.colorBorderBg,
      boxShadow: '4px 4px 4px 0px rgba(0, 0, 0, 0.25)',
      marginRight: 10,

      '.action-more-container': {
        gap: 0
      }
    }
  });
});

export default Staking;
