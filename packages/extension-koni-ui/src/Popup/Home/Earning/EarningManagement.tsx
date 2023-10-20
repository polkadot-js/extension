// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { APIItemState, NominatorMetadata, StakingRewardItem, StakingType, YieldPoolInfo, YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/background/KoniTypes';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import { YieldAction } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { BaseModal, EarningCalculatorModal, EarningInfoModal, EarningMoreActionModal, EarningToolbar, EmptyList, HorizontalEarningItem, YieldPositionDetailModal, YieldStakingDetailModal } from '@subwallet/extension-koni-ui/components';
import { ActionListType } from '@subwallet/extension-koni-ui/components/Modal/Earning/EarningMoreActionModal';
import Search from '@subwallet/extension-koni-ui/components/Search';
import { BN_TEN, BN_ZERO, CANCEL_UN_YIELD_TRANSACTION, CLAIM_YIELD_TRANSACTION, DEFAULT_CANCEL_UN_YIELD_PARAMS, DEFAULT_CLAIM_YIELD_PARAMS, DEFAULT_FAST_WITHDRAW_YIELD_PARAMS, DEFAULT_UN_YIELD_PARAMS, DEFAULT_WITHDRAW_YIELD_PARAMS, DEFAULT_YIELD_PARAMS, EARNING_INFO_MODAL, EARNING_MORE_ACTION_MODAL, FAST_WITHDRAW_YIELD_TRANSACTION, STAKING_CALCULATOR_MODAL, TRANSACTION_YIELD_CANCEL_UNSTAKE_MODAL, TRANSACTION_YIELD_CLAIM_MODAL, TRANSACTION_YIELD_FAST_WITHDRAW_MODAL, TRANSACTION_YIELD_UNSTAKE_MODAL, TRANSACTION_YIELD_WITHDRAW_MODAL, UN_YIELD_TRANSACTION, WITHDRAW_YIELD_TRANSACTION, YIELD_POSITION_DETAIL_MODAL, YIELD_STAKING_DETAIL_MODAL, YIELD_TRANSACTION } from '@subwallet/extension-koni-ui/constants';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { WebUIContext } from '@subwallet/extension-koni-ui/contexts/WebUIContext';
import { useAutoNavigateEarning, useFilterModal, useGroupYieldPosition, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isAccountAll } from '@subwallet/extension-koni-ui/utils';
import { Button, ButtonProps, Divider, Icon, ModalContext, SwList, SwSubHeader } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { FadersHorizontal, Plus, PlusCircle, PlusMinus, Question, Vault } from 'phosphor-react';
import React, { SyntheticEvent, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

import Transaction from '../../Transaction/Transaction';
import YieldCancelUnstake from '../../Transaction/variants/Yield/YieldCancelUnstake';
import YieldClaimReward from '../../Transaction/variants/Yield/YieldClaimReward';
import YieldUnstake from '../../Transaction/variants/Yield/YieldUnstake';
import YieldWithdraw from '../../Transaction/variants/Yield/YieldWithdraw';
import YieldWithdrawPosition from '../../Transaction/variants/Yield/YieldWithdrawPosition';

type Props = ThemeProps;

const FILTER_MODAL_ID = 'earning-filter-modal';

enum SortKey {
  TOTAL_VALUE = 'total-value',
}

interface SortOption {
  label: string;
  value: SortKey;
  desc: boolean;
}

const searchFunction = (item: YieldPoolInfo, searchText: string) => {
  const searchTextLowerCase = searchText.toLowerCase();

  if (!item.name && !searchTextLowerCase) {
    return true;
  }

  return (
    item.name?.toLowerCase().includes(searchTextLowerCase)
  );
};

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();
  const navigate = useNavigate();

  const { poolInfo: poolInfoMap } = useSelector((state: RootState) => state.yieldPool);
  const { currentAccount } = useSelector((state: RootState) => state.accountState);
  const { chainStateMap } = useSelector((state: RootState) => state.chainStore);
  const { assetRegistry } = useSelector((state: RootState) => state.assetRegistry);
  const stakingRewardMap = useSelector((state: RootState) => state.staking.stakingRewardMap);

  const { activeModal, inactiveModal } = useContext(ModalContext);
  const { isWebUI } = useContext(ScreenContext);

  useAutoNavigateEarning();

  const groupYieldPosition = useGroupYieldPosition();

  const [, setYieldStorage] = useLocalStorage(YIELD_TRANSACTION, DEFAULT_YIELD_PARAMS);
  const [, setUnYieldStorage] = useLocalStorage(UN_YIELD_TRANSACTION, DEFAULT_UN_YIELD_PARAMS);
  const [, setCancelUnYieldStorage] = useLocalStorage(CANCEL_UN_YIELD_TRANSACTION, DEFAULT_CANCEL_UN_YIELD_PARAMS);
  const [, setWithdrawStorage] = useLocalStorage(WITHDRAW_YIELD_TRANSACTION, DEFAULT_WITHDRAW_YIELD_PARAMS);
  const [, setFastWithdrawStorage] = useLocalStorage(FAST_WITHDRAW_YIELD_TRANSACTION, DEFAULT_FAST_WITHDRAW_YIELD_PARAMS);
  const [, setClaimStorage] = useLocalStorage(CLAIM_YIELD_TRANSACTION, DEFAULT_CLAIM_YIELD_PARAMS);

  const [selectedSlug, setSelectedSlug] = useState('');
  const [sortSelection, setSortSelection] = useState<SortKey>(SortKey.TOTAL_VALUE);
  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, selectedFilters } = useFilterModal(FILTER_MODAL_ID);
  const location = useLocation();
  const { setTitle } = useContext(WebUIContext);
  const [searchInput, setSearchInput] = useState<string>('');
  const [isShowAdditionActionInActionsModal, setShowAdditionActionInActionsModal] = useState<boolean>(false);

  const selectedYieldPosition = useMemo(() => groupYieldPosition.find((item) => item.slug === selectedSlug), [groupYieldPosition, selectedSlug]);
  const selectedYieldPoolInfo = useMemo((): YieldPoolInfo | undefined => poolInfoMap[selectedSlug], [poolInfoMap, selectedSlug]);

  const selectedStakingRewardItem = useMemo(() => {
    let nominationPoolReward: StakingRewardItem | undefined;

    if (isAccountAll(currentAccount?.address || '')) {
      nominationPoolReward = {
        state: APIItemState.READY,
        name: '',
        chain: '',
        address: ALL_ACCOUNT_KEY,
        type: StakingType.POOLED
      } as StakingRewardItem;

      stakingRewardMap.forEach((stakingReward: StakingRewardItem) => {
        if (nominationPoolReward && stakingReward.chain === selectedYieldPoolInfo?.chain && stakingReward.type === StakingType.POOLED) {
          nominationPoolReward.name = stakingReward.name;
          nominationPoolReward.chain = stakingReward.chain;

          nominationPoolReward.unclaimedReward = stakingReward.unclaimedReward;
        }
      });
    } else {
      nominationPoolReward = stakingRewardMap.find((rewardItem) => rewardItem.address === selectedYieldPosition?.address && rewardItem.chain === selectedYieldPoolInfo?.chain && rewardItem.type === StakingType.POOLED);
    }

    return nominationPoolReward;
  }, [currentAccount?.address, selectedYieldPoolInfo?.chain, selectedYieldPosition?.address, stakingRewardMap]);

  const sortOptions = useMemo((): SortOption[] => {
    return [
      {
        desc: true,
        label: t('Total value staked'),
        value: SortKey.TOTAL_VALUE
      }
    ];
  }, [t]);

  const filterFunction = useMemo<(item: YieldPositionInfo) => boolean>(() => {
    return (item) => {
      if (!selectedFilters.length) {
        return true;
      }

      for (const filter of selectedFilters) {
        if (filter === '') {
          return true;
        }

        const poolInfo = poolInfoMap[item.slug];

        if (filter === YieldPoolType.NOMINATION_POOL) {
          if (poolInfo.type === YieldPoolType.NOMINATION_POOL) {
            return true;
          }
        } else if (filter === YieldPoolType.NATIVE_STAKING) {
          if (poolInfo.type === YieldPoolType.NATIVE_STAKING) {
            return true;
          }
        } else if (filter === YieldPoolType.LIQUID_STAKING) {
          if (poolInfo.type === YieldPoolType.LIQUID_STAKING) {
            return true;
          }
        } else if (filter === YieldPoolType.LENDING) {
          if (poolInfo.type === YieldPoolType.LENDING) {
            return true;
          }
        } else if (filter === YieldPoolType.PARACHAIN_STAKING) {
          if (poolInfo.type === YieldPoolType.PARACHAIN_STAKING) {
            return true;
          }
        } else if (filter === YieldPoolType.SINGLE_FARMING) {
          if (poolInfo.type === YieldPoolType.SINGLE_FARMING) {
            return true;
          }
        }
      }

      return false;
    };
  }, [poolInfoMap, selectedFilters]);

  const onChangeSortOpt = useCallback((value: string) => {
    setSortSelection(value as SortKey);
  }, []);

  const onResetSort = useCallback(() => {
    setSortSelection(SortKey.TOTAL_VALUE);
  }, []);

  const onClickCalculatorBtn = useCallback((item: YieldPositionInfo) => {
    return () => {
      setSelectedSlug(item.slug);
      activeModal(STAKING_CALCULATOR_MODAL);
    };
  }, [activeModal]);

  const onClickInfoBtn = useCallback((item: YieldPositionInfo) => {
    return () => {
      setSelectedSlug(item.slug);
      activeModal(EARNING_INFO_MODAL);
    };
  }, [activeModal]);

  const onClickStakeBtn = useCallback((item: YieldPositionInfo) => {
    return () => {
      const poolInfo = poolInfoMap[item.slug];

      setSelectedSlug(item.slug);

      const address = currentAccount ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : '';

      setYieldStorage({
        ...DEFAULT_YIELD_PARAMS,
        method: poolInfo.slug,
        from: address,
        chain: poolInfo.chain,
        asset: poolInfo.inputAssets[0]
      });

      navigate('/transaction/earn');
    };
  }, [currentAccount, navigate, poolInfoMap, setYieldStorage]);

  const onClickClaimBtn = useCallback((item: YieldPositionInfo) => {
    return () => {
      const poolInfo = poolInfoMap[item.slug];

      setSelectedSlug(item.slug);

      const address = currentAccount ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : '';

      setClaimStorage({
        ...DEFAULT_CLAIM_YIELD_PARAMS,
        method: poolInfo.slug,
        from: address,
        chain: poolInfo.chain,
        asset: poolInfo.inputAssets[0]
      });

      if (isWebUI) {
        activeModal(TRANSACTION_YIELD_CLAIM_MODAL);
      } else {
        navigate('/transaction/yield-claim');
      }
    };
  }, [activeModal, currentAccount, isWebUI, navigate, poolInfoMap, setClaimStorage]);

  const onClickUnStakeBtn = useCallback((item: YieldPositionInfo) => {
    return () => {
      const poolInfo = poolInfoMap[item.slug];

      setSelectedSlug(item.slug);

      const address = currentAccount ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : '';

      setUnYieldStorage({
        ...DEFAULT_UN_YIELD_PARAMS,
        from: address,
        chain: poolInfo.chain,
        method: poolInfo.slug,
        asset: poolInfo.inputAssets[0]
      });

      if (isWebUI) {
        activeModal(TRANSACTION_YIELD_UNSTAKE_MODAL);
      } else {
        navigate('/transaction/un-yield');
      }
    };
  }, [activeModal, currentAccount, isWebUI, navigate, poolInfoMap, setUnYieldStorage]);

  const onClickCancelUnStakeBtn = useCallback((item: YieldPositionInfo) => {
    return () => {
      const poolInfo = poolInfoMap[item.slug];

      setSelectedSlug(item.slug);

      const address = currentAccount ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : '';

      setCancelUnYieldStorage({
        ...DEFAULT_CANCEL_UN_YIELD_PARAMS,
        from: address,
        chain: poolInfo.chain,
        method: poolInfo.slug,
        asset: poolInfo.inputAssets[0]
      });

      if (isWebUI) {
        activeModal(TRANSACTION_YIELD_CANCEL_UNSTAKE_MODAL);
      } else {
        navigate('/transaction/cancel-un-yield');
      }
    };
  }, [activeModal, currentAccount, isWebUI, navigate, poolInfoMap, setCancelUnYieldStorage]);

  const onClickWithdrawBtn = useCallback((item: YieldPositionInfo) => {
    return () => {
      const poolInfo = poolInfoMap[item.slug];

      setSelectedSlug(item.slug);

      const address = currentAccount ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : '';

      const isStaking = [YieldPoolType.NATIVE_STAKING, YieldPoolType.NOMINATION_POOL].includes(poolInfo.type);

      if (isStaking) {
        setWithdrawStorage({
          ...DEFAULT_WITHDRAW_YIELD_PARAMS,
          from: address,
          chain: poolInfo.chain,
          method: poolInfo.slug,
          asset: poolInfo.inputAssets[0]
        });

        if (isWebUI) {
          activeModal(TRANSACTION_YIELD_WITHDRAW_MODAL);
        } else {
          navigate('/transaction/withdraw-yield');
        }
      } else {
        setFastWithdrawStorage({
          ...DEFAULT_FAST_WITHDRAW_YIELD_PARAMS,
          from: address,
          chain: poolInfo.chain,
          method: poolInfo.slug,
          asset: poolInfo.inputAssets[0]
        });

        if (isWebUI) {
          activeModal(TRANSACTION_YIELD_FAST_WITHDRAW_MODAL);
        } else {
          navigate('/transaction/yield-withdraw-position');
        }
      }
    };
  }, [activeModal, currentAccount, isWebUI, navigate, poolInfoMap, setFastWithdrawStorage, setWithdrawStorage]);

  const onClickItem = useCallback((item: YieldPositionInfo) => {
    return () => {
      const poolInfo = poolInfoMap[item.slug];

      setSelectedSlug(item.slug);

      if ([YieldPoolType.NATIVE_STAKING, YieldPoolType.NOMINATION_POOL].includes(poolInfo.type)) {
        activeModal(YIELD_STAKING_DETAIL_MODAL);
      } else {
        activeModal(YIELD_POSITION_DETAIL_MODAL);
      }
    };
  }, [activeModal, poolInfoMap]);

  const onClickItemMoreActions = useCallback((item: YieldPositionInfo) => {
    return () => {
      setSelectedSlug(item.slug);
      setShowAdditionActionInActionsModal(true);
      activeModal(EARNING_MORE_ACTION_MODAL);
    };
  }, [activeModal]);

  const renderEarningItem = useCallback((item: YieldPositionInfo) => {
    const poolInfo = poolInfoMap[item.slug];
    const key = [item.slug, item.address].join('-');

    if (!poolInfo) {
      return null;
    }

    let nominationPoolReward: StakingRewardItem | undefined;

    if (isAccountAll(currentAccount?.address || '')) {
      nominationPoolReward = {
        state: APIItemState.READY,
        name: '',
        chain: '',
        address: ALL_ACCOUNT_KEY,
        type: StakingType.POOLED
      } as StakingRewardItem;

      stakingRewardMap.forEach((stakingReward: StakingRewardItem) => {
        if (nominationPoolReward && stakingReward.chain === poolInfo?.chain && stakingReward.type === StakingType.POOLED) {
          nominationPoolReward.name = stakingReward.name;
          nominationPoolReward.chain = stakingReward.chain;

          nominationPoolReward.unclaimedReward = stakingReward.unclaimedReward;
        }
      });
    } else {
      nominationPoolReward = stakingRewardMap.find((rewardItem) => rewardItem.address === item?.address && rewardItem.chain === poolInfo?.chain && rewardItem.type === StakingType.POOLED);
    }

    return (
      <HorizontalEarningItem
        className={'__earning-item'}
        compactMode={!isWebUI}
        key={key}
        nominationPoolReward={nominationPoolReward}
        onClickCalculatorBtn={onClickCalculatorBtn(item)}
        onClickCancelUnStakeBtn={onClickCancelUnStakeBtn(item)}
        onClickClaimBtn={onClickClaimBtn(item)}
        onClickInfoBtn={onClickInfoBtn(item)}
        onClickItem={onClickItem(item)}
        onClickMoreBtn={onClickItemMoreActions(item)}
        onClickStakeBtn={onClickStakeBtn(item)}
        onClickUnStakeBtn={onClickUnStakeBtn(item)}
        onClickWithdrawBtn={onClickWithdrawBtn(item)}
        yieldPoolInfo={poolInfo}
        yieldPositionInfo={item}
      />
    );
  }, [poolInfoMap, currentAccount?.address, isWebUI, onClickCalculatorBtn, onClickCancelUnStakeBtn, onClickClaimBtn, onClickInfoBtn, onClickItem, onClickItemMoreActions, onClickStakeBtn, onClickUnStakeBtn, onClickWithdrawBtn, stakingRewardMap]);

  const resultList = useMemo((): YieldPositionInfo[] => {
    return [...groupYieldPosition]
      .filter((value) => {
        return chainStateMap[value.chain].active;
      })
      .sort((a: YieldPositionInfo, b: YieldPositionInfo) => {
        const aPoolInfo = poolInfoMap[a.slug];
        const aInputSlug = aPoolInfo.inputAssets[0];
        const aInputAsset = assetRegistry[aInputSlug];
        const aInputDecimals = aInputAsset.decimals || 0;

        const bPoolInfo = poolInfoMap[b.slug];
        const bInputSlug = bPoolInfo.inputAssets[0];
        const bInputAsset = assetRegistry[bInputSlug];
        const bInputDecimals = bInputAsset.decimals || 0;

        const aValue = a.balance.reduce((previousValue, currentValue) => {
          const value = new BigN(currentValue.totalBalance).multipliedBy(currentValue.exchangeRate || 1);

          return previousValue.plus(value);
        }, BN_ZERO).div(BN_TEN.pow(aInputDecimals));

        const bValue = b.balance.reduce((previousValue, currentValue) => {
          const value = new BigN(currentValue.totalBalance).multipliedBy(currentValue.exchangeRate || 1);

          return previousValue.plus(value);
        }, BN_ZERO).div(BN_TEN.pow(bInputDecimals));

        switch (sortSelection) {
          case SortKey.TOTAL_VALUE:
            return bValue.minus(aValue).toNumber();

          default:
            return 0;
        }
      });
  }, [assetRegistry, chainStateMap, groupYieldPosition, poolInfoMap, sortSelection]);

  const renderWhenEmpty = useCallback(() => {
    return (
      <EmptyList
        emptyMessage={t('Need message')}
        emptyTitle={t('Need message')}
        phosphorIcon={Vault}
      />
    );
  }, [t]);

  const handleCloseUnstake = useCallback(() => {
    inactiveModal(TRANSACTION_YIELD_UNSTAKE_MODAL);
  }, [inactiveModal]);

  const handleCloseCancelUnstake = useCallback(() => {
    inactiveModal(TRANSACTION_YIELD_CANCEL_UNSTAKE_MODAL);
  }, [inactiveModal]);

  const handleCloseWithdraw = useCallback(() => {
    inactiveModal(TRANSACTION_YIELD_WITHDRAW_MODAL);
  }, [inactiveModal]);

  const handleCloseFastWithdraw = useCallback(() => {
    inactiveModal(TRANSACTION_YIELD_FAST_WITHDRAW_MODAL);
  }, [inactiveModal]);

  const handleCloseClaim = useCallback(() => {
    inactiveModal(TRANSACTION_YIELD_CLAIM_MODAL);
  }, [inactiveModal]);

  const addMore = useCallback(() => {
    navigate('/home/earning/overview');
  }, [navigate]);

  useEffect(() => {
    if (location.pathname.startsWith('/home/earning')) {
      setTitle(t('Earning'));
    }
  }, [location.pathname, setTitle, t]);

  const headerIcons = useMemo<ButtonProps[]>(() => {
    return [
      {
        icon: (
          <Icon
            customSize={'24px'}
            phosphorIcon={Plus}
            type='phosphor'
            weight={'fill'}
          />
        ),
        onClick: () => {
          navigate('/home/earning/overview');
        }
      }
    ];
  }, [navigate]);

  const handleSearch = useCallback((value: string) => setSearchInput(value), [setSearchInput]);

  const onClickSearchFilterBtn = useCallback(
    (e?: SyntheticEvent) => {
      e && e.stopPropagation();
      activeModal(FILTER_MODAL_ID);
    },
    [activeModal]
  );

  const moreActions = useCallback((currentActions: ActionListType[]): ActionListType[] => {
    return [
      {
        action: YieldAction.CUSTOM_ACTION,
        backgroundIconColor: 'geekblue-6',
        icon: PlusMinus,
        label: t('Earning calculator'),
        onClick: () => {
          console.log('----selectedYieldPosition', selectedYieldPosition);
          selectedYieldPosition && onClickCalculatorBtn(selectedYieldPosition)();
        }
      },
      {
        action: YieldAction.CUSTOM_ACTION,
        backgroundIconColor: 'geekblue-6',
        icon: Question,
        label: t('Earning information'),
        onClick: () => {
          selectedYieldPosition && onClickInfoBtn(selectedYieldPosition)();
        }
      },
      ...currentActions
    ];
  }, [onClickCalculatorBtn, onClickInfoBtn, selectedYieldPosition, t]);

  const onCloseActionsModal = useCallback(() => {
    setShowAdditionActionInActionsModal(false);
  }, []);

  return (
    <div className={className}>
      {
        !isWebUI && (
          <SwSubHeader
            background={'transparent'}
            className={'__header-area'}
            paddingVertical
            rightButtons={headerIcons}
            showBackButton={false}
            title={t('Earning')}
          />)
      }

      <div className={'__body-area'}>
        <div className='__toolbar-area'>
          {
            !isWebUI && (
              <Search
                actionBtnIcon={(
                  <Icon
                    phosphorIcon={FadersHorizontal}
                    size='sm'
                  />
                )}
                onClickActionBtn={onClickSearchFilterBtn}
                onSearch={handleSearch}
                placeholder={t('Search project')}
                searchValue={searchInput}
                showActionBtn
              />
            )
          }

          <EarningToolbar
            className={'__earning-toolbar'}
            filterSelectionMap={filterSelectionMap}
            onApplyFilter={onApplyFilter}
            onChangeFilterOption={onChangeFilterOption}
            onChangeSortOpt={onChangeSortOpt}
            onCloseFilterModal={onCloseFilterModal}
            onResetSort={onResetSort}
            selectedFilters={selectedFilters}
            selectedSort={sortSelection}
            showAdd={true}
            sortOptions={sortOptions}
          />
        </div>

        <SwList
          className={CN('earning-management-list')}
          enableSearchInput={false}
          filterBy={filterFunction}
          list={resultList}
          renderItem={renderEarningItem}
          renderOnScroll={true}
          renderWhenEmpty={renderWhenEmpty}
          searchBy={searchFunction}
          searchMinCharactersCount={1}
          searchTerm={searchInput}
        />
        <Divider className='divider' />
        <div className='footer-group'>
          <div className='footer-left'>
            <Icon
              iconColor='var(--icon-color)'
              phosphorIcon={PlusCircle}
              size='md'
              weight='fill'
            />
            <span className='footer-content'>{t('Do you want to add more funds or add funds to other pools')}</span>
          </div>
          <Button
            icon={(
              <Icon
                phosphorIcon={Vault}
                size='sm'
                weight='fill'
              />
            )}
            onClick={addMore}
            shape='circle'
            size='xs'
          >
            {t('Add more fund')}
          </Button>
        </div>
      </div>

      {selectedYieldPoolInfo && <EarningCalculatorModal defaultItem={selectedYieldPoolInfo} />}
      {selectedYieldPoolInfo && <EarningInfoModal defaultItem={selectedYieldPoolInfo} />}

      {
        selectedYieldPosition && selectedYieldPoolInfo && (
          [YieldPoolType.NOMINATION_POOL, YieldPoolType.NATIVE_STAKING].includes(selectedYieldPoolInfo.type)
            ? (
              <YieldStakingDetailModal
                nominatorMetadata={selectedYieldPosition.metadata as NominatorMetadata}
                rewardItem={selectedStakingRewardItem}
                yieldPoolInfo={selectedYieldPoolInfo}
              />
            )
            : (
              <YieldPositionDetailModal
                positionInfo={selectedYieldPosition}
                yieldPoolInfo={selectedYieldPoolInfo}
              />
            )
        )
      }
      {
        selectedYieldPosition && selectedYieldPoolInfo && (
          <EarningMoreActionModal
            additionActions={isShowAdditionActionInActionsModal ? moreActions : undefined}
            onAfterCancel={onCloseActionsModal}
            stakingRewardItem={selectedStakingRewardItem}
            yieldPoolInfo={selectedYieldPoolInfo}
            yieldPositionInfo={selectedYieldPosition}
          />
        )
      }
      <BaseModal
        className={'right-side-modal'}
        destroyOnClose={true}
        id={TRANSACTION_YIELD_UNSTAKE_MODAL}
        onCancel={handleCloseUnstake}
        title={t('Unstake')}
      >
        <Transaction
          modalContent={isWebUI}
        >
          <YieldUnstake />
        </Transaction>
      </BaseModal>
      <BaseModal
        className={'right-side-modal'}
        destroyOnClose={true}
        id={TRANSACTION_YIELD_CANCEL_UNSTAKE_MODAL}
        onCancel={handleCloseCancelUnstake}
        title={t('Cancel unstake')}
      >
        <Transaction
          modalContent={isWebUI}
        >
          <YieldCancelUnstake />
        </Transaction>
      </BaseModal>
      <BaseModal
        className={'right-side-modal'}
        destroyOnClose={true}
        id={TRANSACTION_YIELD_WITHDRAW_MODAL}
        onCancel={handleCloseWithdraw}
        title={t('Withdraw')}
      >
        <Transaction
          modalContent={isWebUI}
        >
          <YieldWithdraw />
        </Transaction>
      </BaseModal>
      <BaseModal
        className={'right-side-modal'}
        destroyOnClose={true}
        id={TRANSACTION_YIELD_FAST_WITHDRAW_MODAL}
        onCancel={handleCloseFastWithdraw}
        title={t('Withdraw')}
      >
        <Transaction
          modalContent={isWebUI}
        >
          <YieldWithdrawPosition />
        </Transaction>
      </BaseModal>
      <BaseModal
        className={'right-side-modal'}
        destroyOnClose={true}
        id={TRANSACTION_YIELD_CLAIM_MODAL}
        onCancel={handleCloseClaim}
        title={t('Claim rewards')}
      >
        <Transaction
          modalContent={isWebUI}
        >
          <YieldClaimReward />
        </Transaction>
      </BaseModal>
    </div>
  );
};

const EarningManagement = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',

    '.__header-area': {
      '.ant-sw-header-center-part': {
        marginLeft: token.size
      },

      '.ant-sw-sub-header-center-part-pl': {
        textAlign: 'left',
        paddingLeft: 0
      }
    },

    '.__body-area': {
      overflow: 'auto',
      flex: 1,
      width: '100%',
      alignSelf: 'center',
      display: 'flex',
      flexDirection: 'column'
    },

    '.earning-management-list': {
      paddingLeft: 0,
      paddingRight: 0,
      overflowY: 'auto',
      flex: 1,
      paddingBottom: token.padding
    },

    '.__earning-item + .__earning-item': {
      marginTop: token.size
    },

    '.earning-filter-icon': {
      width: '12px',
      height: '12px'
    },

    '.divider': {
      marginTop: 0,
      marginBottom: token.margin
    },

    '.footer-group': {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: token.paddingXS,
      paddingBottom: token.paddingXL,

      '.footer-left': {
        '--icon-color': token['gold-6'],
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: token.sizeXS
      },

      '.footer-content': {
        fontSize: token.fontSizeHeading5,
        lineHeight: token.lineHeightHeading5,
        color: token.colorTextSecondary
      }
    },

    '@media (max-width: 991px)': {
      '.__body-area': {
        paddingLeft: token.size,
        paddingRight: token.size
      },

      '.__toolbar-area': {
        position: 'sticky',
        zIndex: 10,
        top: 0,
        backgroundColor: token.colorBgDefault
      },

      '.__earning-item + .__earning-item': {
        marginTop: token.sizeXS
      },

      '.search-container': {
        paddingBottom: token.size,

        '.right-section, .ant-input-search': {
          width: '100%'
        }
      },

      '.__earning-toolbar': {
        paddingBottom: token.sizeSM,
        overflowX: 'auto',

        '.button-group': {
          display: 'none'
        }
      },

      '.earning-management-list': {
        overflow: 'visible'
      },

      '.footer-group': {
        '.footer-content': {
          fontSize: token.fontSize,
          lineHeight: token.lineHeight
        }
      }
    },

    '.empty-list': {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    }
  });
});

export default EarningManagement;
