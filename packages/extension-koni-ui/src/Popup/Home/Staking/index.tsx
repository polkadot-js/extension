// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { EmptyList, FilterModal, Layout, PageWrapper, SwStakingItem } from '@subwallet/extension-koni-ui/components';
import { ALL_KEY } from '@subwallet/extension-koni-ui/constants';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { useFilterModal, useGetStakingList, useNotification, usePreCheckReadOnly, useSelector, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { reloadCron } from '@subwallet/extension-koni-ui/messaging';
import { StakingDataType, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ActivityIndicator, Button, ButtonProps, Icon, ModalContext, SwList } from '@subwallet/react-ui';
import { ArrowClockwise, FadersHorizontal, Plus, Trophy } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import MoreActionModal, { MORE_ACTION_MODAL } from './MoreActionModal';
import StakingDetailModal, { STAKING_DETAIL_MODAL_ID } from './StakingDetailModal';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import Search from '@subwallet/extension-koni-ui/components/Search';

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

const rightIcon = <Icon
  phosphorIcon={Plus}
  size='sm'
  type='phosphor'
/>;

const reloadIcon = <Icon
  phosphorIcon={ArrowClockwise}
  size='sm'
  type='phosphor'
/>;

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState<string>('')

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

  const listSection = useMemo(() => {
    if (isWebUI) {
      return (
        <div className='web-list'>
          <Search
            searchValue={searchInput}
            placeholder={"Token name"}
            onSearch={(value: string) => setSearchInput(value)}
            onClickActionBtn={onClickActionBtn}
            actionBtnIcon={<Icon phosphorIcon={FadersHorizontal} size='sm'/>}
            showActionBtn
            showExtraButton
            extraButton={
              <>
                <Button
                  type="ghost"
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
                  icon={<Icon phosphorIcon={ArrowClockwise} size="sm" />}
                />
                <Button
                  type="ghost"
                  onClick={preCheckReadOnly(() => navigate(`/transaction/stake/${ALL_KEY}/${ALL_KEY}`))}
                  icon={<Icon phosphorIcon={Plus} size="sm" />}
                />
              </>
            }
          />
          <SwList
            filterBy={filterFunction}
            list={stakingItems}
            searchBy={searchFunction}
            searchTerm={searchInput}
            renderItem={renderItem}
            renderWhenEmpty={emptyStakingList}
          />
        </div>
      )
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
    )
  }, [isWebUI, searchInput, selectedFilters])

  return (
    <PageWrapper
      className={`staking ${className}`}
      resolve={dataContext.awaitStores(['staking', 'price'])}
    >
      <Layout.Base
        {...!isWebUI && {
          title: t('Staking'),
          subHeaderBackground:'transparent',
          subHeaderCenter:false,
          subHeaderIcons:subHeaderButton,
          subHeaderPaddingVertical:true,
          showSubHeader:true,
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
        marginBottom: 12,
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
  });
});

export default Staking;
