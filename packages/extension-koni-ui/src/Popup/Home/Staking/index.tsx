// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType, StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { EmptyList, FilterModal, Layout, PageWrapper, SwStakingItem } from '@subwallet/extension-koni-ui/components';
import { DEFAULT_STAKE_PARAMS, STAKE_TRANSACTION } from '@subwallet/extension-koni-ui/constants';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { useFilterModal, useGetStakingList, useNotification, usePreCheckAction, useSelector, useSetCurrentPage, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { reloadCron } from '@subwallet/extension-koni-ui/messaging';
import { StakingDataType, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isAccountAll, sortStakingByValue } from '@subwallet/extension-koni-ui/utils';
import { ActivityIndicator, ButtonProps, Icon, ModalContext, SwList } from '@subwallet/react-ui';
import { ArrowClockwise, Database, FadersHorizontal, Plus, PlusCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

import MoreActionModal, { MORE_ACTION_MODAL } from './MoreActionModal';
import StakingDetailModal, { STAKING_DETAIL_MODAL_ID } from './StakingDetailModal';

type Props = ThemeProps

const FILTER_MODAL_ID = 'staking-filter-modal';

enum FilterValue {
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

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  useSetCurrentPage('/home/staking');
  const navigate = useNavigate();
  const { t } = useTranslation();

  const dataContext = useContext(DataContext);
  const { activeModal, inactiveModal } = useContext(ModalContext);

  const { data: stakingItems, priceMap } = useGetStakingList();

  const { currentAccount } = useSelector((state) => state.accountState);

  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, selectedFilters } = useFilterModal(FILTER_MODAL_ID);

  const [address] = useState(currentAccount?.address);
  const [selectedItem, setSelectedItem] = useState<StakingDataType | undefined>(undefined);

  const [loading, setLoading] = React.useState<boolean>(false);
  const notify = useNotification();

  const [, setStorage] = useLocalStorage(STAKE_TRANSACTION, DEFAULT_STAKE_PARAMS);

  const items = useMemo(() => {
    const result = stakingItems.map((item) => ({ ...item, price: priceMap[item.staking.chain] || 0 }));

    return result.sort(sortStakingByValue);
  }, [priceMap, stakingItems]);

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
    const address = currentAccount ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : '';

    setStorage({
      ...DEFAULT_STAKE_PARAMS,
      from: address
    });

    navigate('/transaction/stake');
  }, [currentAccount, navigate, setStorage]);

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
          closable: false,
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
      onClick: preCheck(onClickStakeMore, ExtrinsicType.STAKING_BOND)
    }
  ]), [loading, preCheck, notify, t, onClickStakeMore]);

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

  const emptyButtonProps = useMemo((): ButtonProps => {
    return {
      icon: (
        <Icon
          phosphorIcon={PlusCircle}
          weight='fill'
        />
      ),
      children: t('Start staking'),
      shape: 'circle',
      size: 'xs',
      onClick: preCheck(onClickStakeMore, ExtrinsicType.STAKING_BOND)
    };
  }, [onClickStakeMore, preCheck, t]);

  const emptyStakingList = useCallback(() => {
    return (
      <EmptyList
        buttonProps={emptyButtonProps}
        emptyMessage={t('You can stake in-app easily')}
        emptyTitle={t('No staking found')}
        phosphorIcon={Database}
      />
    );
  }, [emptyButtonProps, t]);

  useEffect(() => {
    if (currentAccount?.address !== address) {
      inactiveModal(MORE_ACTION_MODAL);
      inactiveModal(STAKING_DETAIL_MODAL_ID);
      setSelectedItem(undefined);
    }
  }, [address, currentAccount?.address, inactiveModal, navigate]);

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
