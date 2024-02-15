// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { APIItemState, StakingRewardItem, StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import { YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/types';
import { AlertModal, BaseModal, EmptyList, FilterModal, Layout } from '@subwallet/extension-web-ui/components';
import { ASTAR_PORTAL_URL, BN_TEN, TRANSACTION_YIELD_CANCEL_UNSTAKE_MODAL, TRANSACTION_YIELD_CLAIM_MODAL, TRANSACTION_YIELD_UNSTAKE_MODAL, TRANSACTION_YIELD_WITHDRAW_MODAL } from '@subwallet/extension-web-ui/constants';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useAlert, useFilterModal, useSelector, useTranslation } from '@subwallet/extension-web-ui/hooks';
import { reloadCron } from '@subwallet/extension-web-ui/messaging';
import { Toolbar } from '@subwallet/extension-web-ui/Popup/Home/Earning/shared/desktop/Toolbar';
import Transaction from '@subwallet/extension-web-ui/Popup/Transaction/Transaction';
import CancelUnstake from '@subwallet/extension-web-ui/Popup/Transaction/variants/CancelUnstake';
import ClaimReward from '@subwallet/extension-web-ui/Popup/Transaction/variants/ClaimReward';
import Unbond from '@subwallet/extension-web-ui/Popup/Transaction/variants/Unbond';
import Withdraw from '@subwallet/extension-web-ui/Popup/Transaction/variants/Withdraw';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { EarningEntryView, EarningPositionDetailParam, ExtraYieldPositionInfo, ThemeProps } from '@subwallet/extension-web-ui/types';
import { isAccountAll, isRelatedToAstar, openInNewTab } from '@subwallet/extension-web-ui/utils';
import { Button, ButtonProps, Icon, ModalContext, SwList } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { ArrowsClockwise, Database, FadersHorizontal, Plus, PlusCircle } from 'phosphor-react';
import React, { SyntheticEvent, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import EarningPositionDesktopItem from '../../../../../components/Earning/desktop/EarningPositionDesktopItem';

type Props = ThemeProps & {
  earningPositions: YieldPositionInfo[];
  setEntryView: React.Dispatch<React.SetStateAction<EarningEntryView>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

let cacheData: Record<string, boolean> = {};
const FILTER_MODAL_ID = 'earning-positions-filter-modal';
const alertModalId = 'earning-positions-alert-modal';

function Component ({ className, earningPositions, setEntryView, setLoading }: Props) {
  const { t } = useTranslation();
  const { isWebUI } = useContext(ScreenContext);
  const navigate = useNavigate();

  const { activeModal } = useContext(ModalContext);
  const [, setSelectedSlug] = useState('');

  const isShowBalance = useSelector((state) => state.settings.isShowBalance);
  const priceMap = useSelector((state) => state.price.priceMap);
  const { assetRegistry: assetInfoMap } = useSelector((state) => state.assetRegistry);
  const chainInfoMap = useSelector((state) => state.chainStore.chainInfoMap);
  const { currentAccount } = useSelector((state) => state.accountState);
  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, selectedFilters } = useFilterModal(FILTER_MODAL_ID);
  const { alertProps, closeAlert, openAlert } = useAlert(alertModalId);
  const { poolInfoMap } = useSelector((state) => state.earning);
  const stakingRewardMap = useSelector((state: RootState) => state.earning.earningRewards);
  const { inactiveModal } = useContext(ModalContext);

  const [searchInput, setSearchInput] = useState<string>('');

  const items: ExtraYieldPositionInfo[] = useMemo(() => {
    if (!earningPositions.length) {
      return [];
    }

    return earningPositions
      .map((item): ExtraYieldPositionInfo => {
        const priceToken = assetInfoMap[item.balanceToken];
        const price = priceMap[priceToken?.priceId || ''] || 0;

        return {
          ...item,
          asset: priceToken,
          price
        };
      })
      .sort((firstItem, secondItem) => {
        const getValue = (item: ExtraYieldPositionInfo): number => {
          return new BigN(item.totalStake)
            .dividedBy(BN_TEN.pow(item.asset.decimals || 0))
            .multipliedBy(item.price)
            .toNumber();
        };

        return getValue(secondItem) - getValue(firstItem);
      });
  }, [assetInfoMap, earningPositions, priceMap]);

  const filterOptions = [
    { label: t('Nomination pool'), value: YieldPoolType.NOMINATION_POOL },
    { label: t('Direct nomination'), value: YieldPoolType.NATIVE_STAKING },
    { label: t('Liquid staking'), value: YieldPoolType.LIQUID_STAKING },
    { label: t('Lending'), value: YieldPoolType.LENDING },
    { label: t('Parachain staking'), value: YieldPoolType.PARACHAIN_STAKING },
    { label: t('Single farming'), value: YieldPoolType.SINGLE_FARMING }
  ];

  const onClickCancelUnStakeBtn = useCallback((item: YieldPositionInfo) => {
    return () => {
      // const poolInfo = poolInfoMap[item.slug];

      setSelectedSlug(item.slug);

      // const address = currentAccount ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : '';

      // setCancelUnYieldStorage({
      //   ...DEFAULT_CANCEL_UN_YIELD_PARAMS,
      //   from: address,
      //   chain: poolInfo.chain,
      //   method: poolInfo.slug,
      //   asset: poolInfo.inputAssets[0]
      // });

      if (isWebUI) {
        activeModal(TRANSACTION_YIELD_CANCEL_UNSTAKE_MODAL);
      } else {
        navigate('/transaction/cancel-unstake');
      }
    };
  }, [activeModal, isWebUI, navigate]);
  const onClickClaimBtn = useCallback((item: YieldPositionInfo) => {
    return () => {
      // const poolInfo = poolInfoMap[item.slug];

      setSelectedSlug(item.slug);

      // const address = currentAccount ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : '';

      // setClaimStorage({
      //   ...DEFAULT_CLAIM_YIELD_PARAMS,
      //   method: poolInfo.slug,
      //   from: address,
      //   chain: poolInfo.chain,
      //   asset: poolInfo.inputAssets[0]
      // });

      if (isWebUI) {
        activeModal(TRANSACTION_YIELD_CLAIM_MODAL);
      } else {
        navigate('/transaction/claim-reward');
      }
    };
  }, [activeModal, isWebUI, navigate]);

  const onClickStakeBtn = useCallback((item: YieldPositionInfo) => {
    return () => {
      // const poolInfo = poolInfoMap[item.slug];

      setSelectedSlug(item.slug);

      // const address = currentAccount ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : '';

      // setYieldStorage({
      //   ...DEFAULT_YIELD_PARAMS,
      //   method: poolInfo.slug,
      //   from: address,
      //   chain: poolInfo.chain,
      //   asset: poolInfo.inputAssets[0]
      // });

      navigate('/transaction/earn');
    };
  }, [navigate]);

  const onClickUnStakeBtn = useCallback((item: YieldPositionInfo) => {
    return () => {
      // const poolInfo = poolInfoMap[item.slug];

      setSelectedSlug(item.slug);

      // const address = currentAccount ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : '';

      // setUnYieldStorage({
      //   ...DEFAULT_UN_YIELD_PARAMS,
      //   from: address,
      //   chain: poolInfo.chain,
      //   method: poolInfo.slug,
      //   asset: poolInfo.inputAssets[0]
      // });

      if (isWebUI) {
        activeModal(TRANSACTION_YIELD_UNSTAKE_MODAL);
      } else {
        navigate('/transaction/unstake');
      }
    };
  }, [activeModal, isWebUI, navigate]);

  const onClickWithdrawBtn = useCallback((item: YieldPositionInfo) => {
    return () => {
      const poolInfo = poolInfoMap[item.slug];

      setSelectedSlug(item.slug);

      // const address = currentAccount ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : '';

      const isStaking = [YieldPoolType.NATIVE_STAKING, YieldPoolType.NOMINATION_POOL].includes(poolInfo.type);

      // if (isStaking) {
      // setWithdrawStorage({
      //   ...DEFAULT_WITHDRAW_YIELD_PARAMS,
      //   from: address,
      //   chain: poolInfo.chain,
      //   method: poolInfo.slug,
      //   asset: poolInfo.inputAssets[0]
      // });

      if (isWebUI) {
        activeModal(TRANSACTION_YIELD_WITHDRAW_MODAL);
      } else {
        navigate('/transaction/withdraw');
      }
      // }
    };
  }, [activeModal, isWebUI, navigate, poolInfoMap]);

  const onClickItem = useCallback((item: YieldPositionInfo) => {
    return () => {
      if (isRelatedToAstar(item.slug)) {
        openAlert({
          title: t('Enter Astar portal'),
          content: t('You are navigating to Astar portal to view and manage your stake in Astar dApp staking v3. SubWallet will offer support for Astar dApp staking v3 soon.'),
          cancelButton: {
            text: t('Cancel'),
            schema: 'secondary',
            onClick: closeAlert
          },
          okButton: {
            text: t('Enter Astar portal'),
            onClick: () => {
              openInNewTab(ASTAR_PORTAL_URL)();
              closeAlert();
            }
          }
        });
      } else {
        navigate('/home/earning/position-detail', { state: {
          earningSlug: item.slug
        } as EarningPositionDetailParam });
      }
    };
  }, [closeAlert, navigate, openAlert, t]);

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
    }

    return (
      <EarningPositionDesktopItem
        className={'__earning-item'}
        key={key}
        nominationPoolReward={nominationPoolReward}
        onClickCancelUnStakeBtn={onClickCancelUnStakeBtn(item)}
        onClickClaimBtn={onClickClaimBtn(item)}
        onClickItem={onClickItem(item)}
        onClickStakeBtn={onClickStakeBtn(item)}
        onClickUnStakeBtn={onClickUnStakeBtn(item)}
        onClickWithdrawBtn={onClickWithdrawBtn(item)}
        yieldPoolInfo={poolInfo}
        yieldPositionInfo={item}
      />
    );
  }, [poolInfoMap, currentAccount?.address, onClickCancelUnStakeBtn, onClickClaimBtn, onClickStakeBtn, onClickUnStakeBtn, onClickWithdrawBtn, onClickItem]);

  const filterFunction = useMemo<(items: ExtraYieldPositionInfo) => boolean>(() => {
    return (item) => {
      if (!selectedFilters.length) {
        return true;
      }

      for (const filter of selectedFilters) {
        if (filter === '') {
          return true;
        }

        if (filter === YieldPoolType.NOMINATION_POOL && item.type === YieldPoolType.NOMINATION_POOL) {
          return true;
        } else if (filter === YieldPoolType.NATIVE_STAKING && item.type === YieldPoolType.NATIVE_STAKING) {
          return true;
        } else if (filter === YieldPoolType.LIQUID_STAKING && item.type === YieldPoolType.LIQUID_STAKING) {
          return true;
        } else if (filter === YieldPoolType.LENDING && item.type === YieldPoolType.LENDING) {
          return true;
        }
        // Uncomment the following code block if needed
        // else if (filter === YieldPoolType.PARACHAIN_STAKING && item.type === YieldPoolType.PARACHAIN_STAKING) {
        //   return true;
        // } else if (filter === YieldPoolType.SINGLE_FARMING && item.type === YieldPoolType.SINGLE_FARMING) {
        //   return true;
        // }
      }

      return false;
    };
  }, [selectedFilters]);

  // const renderItem = useCallback(
  //   (item: ExtraYieldPositionInfo) => {
  //     return (
  //       <EarningPositionItem
  //         className={'earning-position-item'}
  //         isShowBalance={isShowBalance}
  //         key={item.slug}
  //         onClick={onClickItem(item)}
  //         positionInfo={item}
  //       />
  //     );
  //   },
  //   [isShowBalance, onClickItem]
  // );

  const emptyList = useCallback(() => {
    return (
      <EmptyList
        buttonProps={{
          icon: (
            <Icon
              phosphorIcon={PlusCircle}
              weight={'fill'}
            />),
          onClick: () => {
            setEntryView(EarningEntryView.OPTIONS);
          },
          size: 'xs',
          shape: 'circle',
          children: t('Explore earning options')
        }}
        className={'__empty-list-earning-positions'}
        emptyMessage={t('Change your search or explore other earning options')}
        emptyTitle={t('No earning position found')}
        phosphorIcon={Database}
      />
    );
  }, [setEntryView, t]);

  const searchFunction = useCallback(({ balanceToken, chain: _chain }: ExtraYieldPositionInfo, searchText: string) => {
    const chainInfo = chainInfoMap[_chain];
    const assetInfo = assetInfoMap[balanceToken];

    return (
      chainInfo?.name.replace(' Relay Chain', '').toLowerCase().includes(searchText.toLowerCase()) ||
      assetInfo?.symbol.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [assetInfoMap, chainInfoMap]);

  const subHeaderButtons: ButtonProps[] = useMemo(() => {
    return [
      {
        icon: (
          <Icon
            phosphorIcon={ArrowsClockwise}
            size='sm'
            type='phosphor'
          />
        ),
        onClick: () => {
          setLoading(true);
          reloadCron({ data: 'staking' })
            .catch(console.error).finally(() => {
              setTimeout(() => {
                setLoading(false);
              }, 1000);
            });
        }
      },
      {
        icon: (
          <Icon
            phosphorIcon={Plus}
            size='sm'
            type='phosphor'
          />
        ),
        onClick: () => {
          setEntryView(EarningEntryView.OPTIONS);
        }
      }
    ];
  }, [setEntryView, setLoading]);

  const handleCloseUnstake = useCallback(() => {
    inactiveModal(TRANSACTION_YIELD_UNSTAKE_MODAL);
  }, [inactiveModal]);

  const handleCloseClaim = useCallback(() => {
    inactiveModal(TRANSACTION_YIELD_CLAIM_MODAL);
  }, [inactiveModal]);

  const handleCloseCancelUnstake = useCallback(() => {
    inactiveModal(TRANSACTION_YIELD_CANCEL_UNSTAKE_MODAL);
  }, [inactiveModal]);

  useEffect(() => {
    const address = currentAccount?.address || '';

    if (cacheData[address] === undefined) {
      cacheData = { [address]: !items.length };
    }
  }, [items.length, currentAccount]);

  const onClickFilterButton = useCallback(
    (e?: SyntheticEvent) => {
      e && e.stopPropagation();
      activeModal(FILTER_MODAL_ID);
    },
    [activeModal]
  );
  const handleCloseWithdraw = useCallback(() => {
    inactiveModal(TRANSACTION_YIELD_WITHDRAW_MODAL);
  }, [inactiveModal]);

  return (
    <>
      <Layout.Base
        className={CN(className)}
        showSubHeader={true}
        subHeaderBackground={'transparent'}
        subHeaderCenter={false}
        subHeaderIcons={subHeaderButtons}
        subHeaderPaddingVertical={true}
        title={t<string>('Your earning positions')}
      >
        {
          isWebUI
            ? (
              <>
                <Toolbar
                  className={'__desktop-toolbar'}
                  extraActionNode={
                    subHeaderButtons.map((b, index) => (
                      <Button
                        {...b}
                        key={index}
                        size={'xs'}
                        type={'ghost'}
                      />
                    ))
                  }
                  inputPlaceholder={t<string>('Search token')}
                  onClickFilter={onClickFilterButton}
                  onSearch={setSearchInput}
                  searchValue={searchInput}
                />
                <SwList
                  className={'__desktop-list-container'}
                  filterBy={filterFunction}
                  list={items}
                  renderItem={renderEarningItem}
                  renderWhenEmpty={emptyList}
                  searchBy={searchFunction}
                  searchMinCharactersCount={1}
                  searchTerm={searchInput}
                />
              </>
            )
            : (
              <SwList.Section
                actionBtnIcon={<Icon phosphorIcon={FadersHorizontal} />}
                className={'__section-list-container'}
                enableSearchInput
                filterBy={filterFunction}
                list={items}
                onClickActionBtn={onClickFilterButton}
                renderItem={renderEarningItem}
                renderWhenEmpty={emptyList}
                searchFunction={searchFunction}
                searchMinCharactersCount={1}
                searchPlaceholder={t<string>('Search token')}
                showActionBtn
              />
            )
        }

        <FilterModal
          applyFilterButtonTitle={t('Apply filter')}
          id={FILTER_MODAL_ID}
          onApplyFilter={onApplyFilter}
          onCancel={onCloseFilterModal}
          onChangeOption={onChangeFilterOption}
          optionSelectionMap={filterSelectionMap}
          options={filterOptions}
          title={t('Filter')}
        />
      </Layout.Base>

      <BaseModal
        className={'right-side-modal'}
        destroyOnClose={true}
        id={TRANSACTION_YIELD_UNSTAKE_MODAL}
        onCancel={handleCloseUnstake}
        title={t('Unstake')}
      >
        <Transaction
          modalContent={isWebUI}
          modalId={TRANSACTION_YIELD_UNSTAKE_MODAL}
        >
          <Unbond />
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
          modalId={TRANSACTION_YIELD_CLAIM_MODAL}
        >
          <ClaimReward />
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
          modalId={TRANSACTION_YIELD_CANCEL_UNSTAKE_MODAL}
        >
          <CancelUnstake />
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
          modalId={TRANSACTION_YIELD_WITHDRAW_MODAL}
        >
          <Withdraw />
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
          modalId={TRANSACTION_YIELD_CANCEL_UNSTAKE_MODAL}
        >
          <CancelUnstake />
        </Transaction>
      </BaseModal>

      {
        !!alertProps && (
          <AlertModal
            modalId={alertModalId}
            {...alertProps}
          />
        )
      }
    </>
  );
}

const EarningPositions = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  '.ant-sw-sub-header-container': {
    marginBottom: token.marginXS
  },

  '.__section-list-container': {
    height: '100%',
    flex: 1
  },

  '.__empty-list-earning-positions': {
    height: '100%',
    marginBottom: 0,
    marginTop: 0
  },

  '.__desktop-list-container': {
    display: 'flex',
    gap: 16,
    flexDirection: 'column',
    height: '100%'
  },

  '.earning-position-item': {
    '+ .earning-position-item': {
      marginTop: token.marginXS
    }
  },

  // desktop

  '.__desktop-toolbar': {
    marginBottom: 20
  },

  '@media (min-width: 992px)': {
    '.__empty-list-earning-positions': {
      paddingTop: 32,
      paddingBottom: 62
    }
  }
}));

export default EarningPositions;
