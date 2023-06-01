// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _MultiChainAsset } from '@subwallet/chain-list/types';
import { StakingItem, StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { EmptyList, FilterModal, Layout, PageWrapper, SwStakingItem, TokenItem } from '@subwallet/extension-koni-ui/components';
import Search from '@subwallet/extension-koni-ui/components/Search';
import { ALL_KEY } from '@subwallet/extension-koni-ui/constants';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { HomeContext } from '@subwallet/extension-koni-ui/contexts/screen/HomeContext';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { useFilterModal, useGetStakingList, useNotification, usePreCheckReadOnly, useSelector, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { getBalanceValue, getConvertedBalanceValue } from '@subwallet/extension-koni-ui/hooks/screen/home/useAccountBalance';
import { reloadCron } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { PhosphorIcon, StakingDataType, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { TokenBalanceItemType } from '@subwallet/extension-koni-ui/types/balance';
import { ActivityIndicator, Button, ButtonProps, Icon, ModalContext, Number as NumberItem, Popover, SwList, Table, Tag } from '@subwallet/react-ui';
import capitalize from '@subwallet/react-ui/es/_util/capitalize';
import { ArrowClockwise, DotsThree, FadersHorizontal, Plus, Trophy, User, Users } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { ThemeContext } from 'styled-components';

import MoreActionModal, { ActionList, MORE_ACTION_MODAL } from './MoreActionModal';
import StakingDetailModal, { STAKING_DETAIL_MODAL_ID } from './StakingDetailModal';

type Props = ThemeProps

const FILTER_MODAL_ID = 'staking-filter-modal';

enum FilterValue {
  NOMINATED = 'nominated',
  POOLED = 'pooled'
}

const FILTER_OPTIONS = [
  { label: 'Nominated', value: StakingType.NOMINATED },
  { label: 'Pooled', value: StakingType.POOLED }
];

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

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState<string>('');

  const { accountBalance: { tokenGroupBalanceMap } } = useContext(HomeContext);
  const assetRegistryMap = useSelector((state: RootState) => state.assetRegistry.assetRegistry);
  const multiChainAssetMap = useSelector((state: RootState) => state.assetRegistry.multiChainAssetMap);

  const dataContext = useContext(DataContext);
  const { isWebUI } = useContext(ScreenContext);
  const { activeModal, inactiveModal } = useContext(ModalContext);

  const { data: stakingItems, priceMap } = useGetStakingList();

  const { currentAccount } = useSelector((state) => state.accountState);

  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, selectedFilters } = useFilterModal(FILTER_MODAL_ID);

  const [address] = useState(currentAccount?.address);
  const [selectedItem, setSelectedItem] = useState<StakingDataType | undefined>(undefined);

  const [loading, setLoading] = React.useState<boolean>(false);
  const notify = useNotification();

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

  const preCheckReadOnly = usePreCheckReadOnly(currentAccount?.address);

  const subHeaderButton: ButtonProps[] = useMemo(() => ([
    {
      icon: reloadIcon,
      disabled: loading,
      size: 'sm',
      onClick: () => {
        setLoading(true);
        notify({
          icon: <ActivityIndicator size={32} />,
          style: { top: 210 },
          direction: 'vertical',
          duration: 1.8,
          message: t('Reloading')
        });

        reloadCron({ data: 'staking' })
          .then(() => {
            setLoading(false);
          })
          .catch(console.error);
      }
    },
    {
      icon: rightIcon,
      onClick: preCheckReadOnly(() => navigate(`/transaction/stake/${ALL_KEY}/${ALL_KEY}`))
    }
  ]), [loading, preCheckReadOnly, notify, t, navigate]);

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
    return stakingItems.filter(filterFunction).filter((item: StakingDataType) =>
      searchFunction(item, searchInput)
    );
  }, [filterFunction, searchFunction, searchInput, stakingItems]);

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

  const currentChainBalance = useCallback((staking: StakingItem) => {
    const currentChainAsset: _MultiChainAsset | _ChainAsset | undefined = Object.values(multiChainAssetMap).find((item) => item.name === staking.name) || Object.values(assetRegistryMap).find((item) => item.name === staking.name);

    if (!currentChainAsset) {
      return undefined;
    }

    const currentChainBalance: TokenBalanceItemType = tokenGroupBalanceMap[currentChainAsset.slug];

    return currentChainBalance;
  }, [assetRegistryMap, multiChainAssetMap, tokenGroupBalanceMap]);

  const { token } = useContext(ThemeContext);

  const columns = useMemo(() => {
    return [
      {
        title: 'Token name',
        dataIndex: 'name',
        key: 'name',
        render: (_, row: StakingDataType) => {
          const { staking: { chain,
            name,
            nativeToken } } = row;

          return (
            <TokenItem
              chainDisplayName={name || ''}
              logoKey={nativeToken}
              networkKey={chain}
              symbol={nativeToken}
            />
          );
        }
      },
      {
        title: 'Type',
        dataIndex: 'type',
        key: 'type',
        render: (_, row: StakingDataType) => {
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
        render: (_, row: StakingDataType) => {
          // TODO: update priceChangeStatus
          const currentChainInfo = currentChainBalance(row.staking);

          if (!currentChainInfo) {
            return <></>;
          }

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          const marginColor: string = currentChainInfo?.priceChangeStatus === 'increase' ? token?.colorSuccess : token?.colorError;
          const { price24hValue, priceValue } = currentChainInfo;
          const margin = !price24hValue || !priceValue ? 0 : Math.abs(price24hValue - priceValue) / price24hValue * 100;

          return (
            <div className={'price-wrapper'}>
              <NumberItem
                decimal={0}
                decimalOpacity={0.45}
                prefix={'$'}
                value={currentChainInfo?.priceValue}
              />
              <NumberItem
                className='margin-percentage'
                decimal={0}
                decimalColor={marginColor}
                intColor={marginColor}
                prefix={currentChainInfo?.priceChangeStatus === 'decrease' ? '-' : '+'}
                size={12}
                suffix='%'
                unitColor={marginColor}
                value={margin}
              />
            </div>
          );
        }
      },
      {
        title: 'Bonded funds',
        dataIndex: 'bonded',
        key: 'bonded',
        render: (_, row: StakingDataType) => {
          const { staking } = row;
          const currentChainInfo = currentChainBalance(row.staking);

          if (!currentChainInfo) {
            return <></>;
          }

          const balanceValue = getBalanceValue(staking.balance || '0', row.decimals);
          const convertedBalanceValue = getConvertedBalanceValue(balanceValue, Number(`${priceMap[staking.chain] || 0}`));

          return (
            <div className='funds-wrapper'>
              <div className='funds'>
                <NumberItem
                  className={'__value'}
                  decimal={0}
                  decimalOpacity={0.45}
                  suffix={staking.unit}
                  value={balanceValue}
                />
                <NumberItem
                  className={'__converted-value'}
                  decimal={0}
                  decimalOpacity={0.45}
                  intOpacity={0.45}
                  prefix='$'
                  size={12}
                  unitOpacity={0.45}
                  value={convertedBalanceValue}
                />
              </div>
              <Popover
                content={
                  <ActionList
                    chainStakingMetadata={row.chainStakingMetadata}
                    nominatorMetadata={row.nominatorMetadata}
                    reward={row.reward}
                  />
                }
                overlayInnerStyle={{
                  padding: '0',
                  background: '#1A1A1A'
                }}
                placement='bottomRight'
                showArrow={false}
                trigger='click'
              >
                <Button
                  icon={(
                    <Icon
                      className={'right-icon'}
                      phosphorIcon={DotsThree}
                      size='xs'
                      type='phosphor'
                    />
                  )}
                  onClick={(e) => e.stopPropagation()}
                  size='sm'
                  type='ghost'
                />
              </Popover>
            </div>
          );
        }
      }
    ];
  }, [currentChainBalance, token?.colorError, token?.colorSuccess]);

  const listSection = useMemo(() => {
    if (isWebUI) {
      return (
        <div className='web-list'>
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
                      size='sm'
                    />
                  )}
                  onClick={
                    () => {
                      setLoading(true);
                      notify({
                        icon: <ActivityIndicator size={32} />,
                        style: { top: 210 },
                        direction: 'vertical',
                        duration: 1.8,
                        message: t('Reloading')
                      });

                      reloadCron({ data: 'staking' })
                        .then(() => {
                          setLoading(false);
                        })
                        .catch(console.error);
                    }
                  }
                  type='ghost'
                />
                <Button
                  icon={(
                    <Icon
                      phosphorIcon={Plus}
                      size='sm'
                    />
                  )}
                  onClick={preCheckReadOnly(() => navigate(`/transaction/stake/${ALL_KEY}/${ALL_KEY}`))}
                  type='ghost'
                />
              </>
            }
            onClickActionBtn={onClickActionBtn}
            onSearch={(value: string) => setSearchInput(value)}
            placeholder={'Token name'}
            searchValue={searchInput}
            showActionBtn
            showExtraButton
          />

          <Table
            columns={columns}
            dataSource={filteredList}
            onRow={(record: StakingDataType) => {
              return {
                onClick: () => onClickItem(record)
              };
            }}
            pagination={false}
          />
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
        list={stakingItems}
        onClickActionBtn={onClickActionBtn}
        renderItem={renderItem}
        renderWhenEmpty={emptyStakingList}
        searchFunction={searchFunction}
        searchMinCharactersCount={2}
        searchPlaceholder={t<string>('Search token')}
        showActionBtn
      />
    );
  }, [columns, emptyStakingList, filterFunction, filteredList, isWebUI, navigate, notify, onClickActionBtn, onClickItem, preCheckReadOnly, renderItem, searchFunction, searchInput, stakingItems, t]);

  return (
    <PageWrapper
      className={`staking ${className}`}
      resolve={dataContext.awaitStores(['staking', 'price'])}
    >
      <Layout.Base
        {...!isWebUI && {
          title: t('Staking'),
          subHeaderBackground: 'transparent',
          subHeaderCenter: false,
          subHeaderIcons: subHeaderButton,
          subHeaderPaddingVertical: true,
          showSubHeader: true
        }}
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
    color: token.colorTextLight1,
    fontSize: token.fontSizeLG,

    '.web-list': {
      width: '100%',
      '.container': {
        marginBottom: 12
      }
    },

    '.funds-wrapper': {
      display: 'flex',
      justifyContent: 'end'
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
  });
});

export default Staking;
