// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { APIItemState } from '@subwallet/extension-base/background/KoniTypes';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/earning-service/constants';
import { EarningRewardItem, YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/types';
import { AlertModal, BaseModal, EarningInstructionModal, EarningPositionDesktopItem, EarningPositionItem, EmptyList, FilterModal, Layout } from '@subwallet/extension-web-ui/components';
import { ASTAR_PORTAL_URL, BN_TEN, CANCEL_UN_STAKE_TRANSACTION, CLAIM_REWARD_TRANSACTION, DEFAULT_CANCEL_UN_STAKE_PARAMS, DEFAULT_CLAIM_REWARD_PARAMS, DEFAULT_EARN_PARAMS, DEFAULT_UN_STAKE_PARAMS, DEFAULT_WITHDRAW_PARAMS, EARN_TRANSACTION, EARNING_INSTRUCTION_MODAL, TRANSACTION_YIELD_CANCEL_UNSTAKE_MODAL, TRANSACTION_YIELD_CLAIM_MODAL, TRANSACTION_YIELD_UNSTAKE_MODAL, TRANSACTION_YIELD_WITHDRAW_MODAL, UN_STAKE_TRANSACTION, WITHDRAW_TRANSACTION } from '@subwallet/extension-web-ui/constants';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useAlert, useFilterModal, useSelector, useTranslation } from '@subwallet/extension-web-ui/hooks';
import { reloadCron } from '@subwallet/extension-web-ui/messaging';
import { Toolbar } from '@subwallet/extension-web-ui/Popup/Home/Earning/shared/desktop/Toolbar';
import Transaction from '@subwallet/extension-web-ui/Popup/Transaction/Transaction';
import CancelUnstake from '@subwallet/extension-web-ui/Popup/Transaction/variants/CancelUnstake';
import ClaimReward from '@subwallet/extension-web-ui/Popup/Transaction/variants/ClaimReward';
import Unbond from '@subwallet/extension-web-ui/Popup/Transaction/variants/Unbond';
import Withdraw from '@subwallet/extension-web-ui/Popup/Transaction/variants/Withdraw';
import { EarningEntryView, EarningPositionDetailParam, ExtraYieldPositionInfo, ThemeProps } from '@subwallet/extension-web-ui/types';
import { isAccountAll, isRelatedToAstar, openInNewTab } from '@subwallet/extension-web-ui/utils';
import { Button, ButtonProps, Icon, ModalContext, SwList } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { ArrowsClockwise, FadersHorizontal, Plus, PlusCircle, Vault } from 'phosphor-react';
import React, { SyntheticEvent, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

type Props = ThemeProps & {
  earningPositions: YieldPositionInfo[];
  setEntryView: React.Dispatch<React.SetStateAction<EarningEntryView>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

let cacheData: Record<string, boolean> = {};
const FILTER_MODAL_ID = 'earning-positions-filter-modal';
const alertModalId = 'earning-positions-alert-modal';
const instructionModalId = EARNING_INSTRUCTION_MODAL;

function Component ({ className, earningPositions, setEntryView, setLoading }: Props) {
  const { t } = useTranslation();
  const { isWebUI } = useContext(ScreenContext);
  const navigate = useNavigate();

  const { activeModal } = useContext(ModalContext);

  const isShowBalance = useSelector((state) => state.settings.isShowBalance);
  const { currencyData, priceMap } = useSelector((state) => state.price);
  const { assetRegistry: assetInfoMap } = useSelector((state) => state.assetRegistry);
  const chainInfoMap = useSelector((state) => state.chainStore.chainInfoMap);
  const { currentAccount } = useSelector((state) => state.accountState);
  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, selectedFilters } = useFilterModal(FILTER_MODAL_ID);
  const { alertProps, closeAlert, openAlert } = useAlert(alertModalId);
  const poolInfoMap = useSelector((state) => state.earning.poolInfoMap);
  const earningRewards = useSelector((state) => state.earning.earningRewards);
  const assetRegistry = useSelector((state) => state.assetRegistry.assetRegistry);

  const [, setEarnStorage] = useLocalStorage(EARN_TRANSACTION, DEFAULT_EARN_PARAMS);
  const [, setUnStakeStorage] = useLocalStorage(UN_STAKE_TRANSACTION, DEFAULT_UN_STAKE_PARAMS);
  const [, setClaimRewardStorage] = useLocalStorage(CLAIM_REWARD_TRANSACTION, DEFAULT_CLAIM_REWARD_PARAMS);
  const [, setWithdrawStorage] = useLocalStorage(WITHDRAW_TRANSACTION, DEFAULT_WITHDRAW_PARAMS);
  const [, setCancelUnStakeStorage] = useLocalStorage(CANCEL_UN_STAKE_TRANSACTION, DEFAULT_CANCEL_UN_STAKE_PARAMS);

  const { inactiveModal } = useContext(ModalContext);

  const [searchInput, setSearchInput] = useState<string>('');
  const [selectedPositionInfo, setSelectedPositionInfo] = useState<ExtraYieldPositionInfo | undefined>(undefined);
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
          price,
          currency: currencyData
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
  }, [assetInfoMap, currencyData, earningPositions, priceMap]);

  const filterOptions = [
    { label: t('Nomination pool'), value: YieldPoolType.NOMINATION_POOL },
    { label: t('Direct nomination'), value: YieldPoolType.NATIVE_STAKING },
    { label: t('Liquid staking'), value: YieldPoolType.LIQUID_STAKING },
    { label: t('Lending'), value: YieldPoolType.LENDING },
    { label: t('Parachain staking'), value: YieldPoolType.PARACHAIN_STAKING },
    { label: t('Single farming'), value: YieldPoolType.SINGLE_FARMING }
  ];

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

  const transactionFromValue = useMemo(() => {
    return currentAccount?.address ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : '';
  }, [currentAccount?.address]);

  const onClickCancelUnStakeButton = useCallback((item: ExtraYieldPositionInfo) => {
    return () => {
      setSelectedPositionInfo(item);
      setCancelUnStakeStorage({
        ...DEFAULT_CANCEL_UN_STAKE_PARAMS,
        slug: item.slug,
        chain: item.chain,
        from: transactionFromValue
      });

      activeModal(TRANSACTION_YIELD_CANCEL_UNSTAKE_MODAL);
    };
  }, [activeModal, setCancelUnStakeStorage, transactionFromValue]);

  const onClickClaimButton = useCallback((item: ExtraYieldPositionInfo) => {
    return () => {
      const isDAppStaking = _STAKING_CHAIN_GROUP.astar.includes(item.chain);

      if (item.type === YieldPoolType.NATIVE_STAKING && isDAppStaking) {
        openInNewTab('https://portal.astar.network/astar/dapp-staking/discover')();

        return;
      }

      setSelectedPositionInfo(item);
      setClaimRewardStorage({
        ...DEFAULT_CLAIM_REWARD_PARAMS,
        slug: item.slug,
        chain: item.chain,
        from: transactionFromValue
      });

      activeModal(TRANSACTION_YIELD_CLAIM_MODAL);
    };
  }, [activeModal, setClaimRewardStorage, transactionFromValue]);

  const onClickStakeButton = useCallback((item: ExtraYieldPositionInfo) => {
    return () => {
      setSelectedPositionInfo(item);
      setEarnStorage({
        ...DEFAULT_EARN_PARAMS,
        slug: item.slug,
        chain: item.chain,
        from: transactionFromValue
      });

      navigate('/transaction/earn');
    };
  }, [navigate, setEarnStorage, transactionFromValue]);

  const navigateToEarnTransaction = useCallback(
    (slug: string, chain: string) => {
      setEarnStorage({
        ...DEFAULT_EARN_PARAMS,
        slug,
        chain,
        from: transactionFromValue
      });
      navigate('/transaction/earn');
    },
    [navigate, setEarnStorage, transactionFromValue]
  );

  const onClickUnStakeButton = useCallback((item: ExtraYieldPositionInfo) => {
    return () => {
      setSelectedPositionInfo(item);
      setUnStakeStorage({
        ...DEFAULT_UN_STAKE_PARAMS,
        slug: item.slug,
        chain: item.chain,
        from: transactionFromValue
      });

      activeModal(TRANSACTION_YIELD_UNSTAKE_MODAL);
    };
  }, [activeModal, setUnStakeStorage, transactionFromValue]);

  const onClickInstructionButton = useCallback((item: ExtraYieldPositionInfo) => {
    return () => {
      setSelectedPositionInfo(item);
      activeModal(instructionModalId);
    };
  }, [activeModal]);

  const onClickWithdrawButton = useCallback((item: ExtraYieldPositionInfo) => {
    return () => {
      if (item.type === YieldPoolType.LENDING) {
        onClickUnStakeButton(item)();

        return;
      }

      setSelectedPositionInfo(item);
      setWithdrawStorage({
        ...DEFAULT_WITHDRAW_PARAMS,
        slug: item.slug,
        chain: item.chain,
        from: transactionFromValue
      });

      activeModal(TRANSACTION_YIELD_WITHDRAW_MODAL);
    };
  }, [activeModal, onClickUnStakeButton, setWithdrawStorage, transactionFromValue]);

  const onClickItem = useCallback((item: ExtraYieldPositionInfo) => {
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

  const renderItem = useCallback((item: ExtraYieldPositionInfo) => {
    if (!isWebUI) {
      return (
        <EarningPositionItem
          className={'earning-position-item'}
          isShowBalance={isShowBalance}
          key={item.slug}
          onClick={onClickItem(item)}
          positionInfo={item}
        />
      );
    }

    const poolInfo = poolInfoMap[item.slug];
    const key = [item.slug, item.address].join('-');

    if (!poolInfo) {
      return null;
    }

    let nominationPoolReward: EarningRewardItem | undefined;

    if (isAccountAll(currentAccount?.address || '')) {
      nominationPoolReward = {
        state: APIItemState.READY,
        chain: poolInfo.chain,
        slug: poolInfo.slug,
        group: poolInfo.group,
        address: ALL_ACCOUNT_KEY,
        type: YieldPoolType.NOMINATION_POOL
      } as EarningRewardItem;

      earningRewards.forEach((earningReward: EarningRewardItem) => {
        if (nominationPoolReward && earningReward.chain === poolInfo.chain && earningReward.type === YieldPoolType.NOMINATION_POOL) {
          const bnUnclaimedReward = new BigN(earningReward.unclaimedReward || '0');

          nominationPoolReward.unclaimedReward = bnUnclaimedReward.plus(nominationPoolReward.unclaimedReward || '0').toString();
        }
      });
    } else {
      nominationPoolReward = earningRewards.find((rewardItem) => rewardItem.address === item?.address && rewardItem.chain === poolInfo?.chain && rewardItem.type === YieldPoolType.NOMINATION_POOL);
    }

    return (
      <EarningPositionDesktopItem
        className={'earning-position-desktop-item'}
        isShowBalance={isShowBalance}
        key={key}
        onClickCancelUnStakeButton={onClickCancelUnStakeButton(item)}
        onClickClaimButton={onClickClaimButton(item)}
        onClickInstructionButton={onClickInstructionButton(item)}
        onClickItem={onClickItem(item)}
        onClickStakeButton={onClickStakeButton(item)}
        onClickUnStakeButton={onClickUnStakeButton(item)}
        onClickWithdrawButton={onClickWithdrawButton(item)}
        poolInfo={poolInfo}
        positionInfo={item}
        unclaimedReward={nominationPoolReward?.unclaimedReward}
      />
    );
  }, [isWebUI, poolInfoMap, currentAccount?.address, isShowBalance, onClickCancelUnStakeButton, onClickClaimButton, onClickItem, onClickStakeButton, onClickUnStakeButton, onClickWithdrawButton, onClickInstructionButton, earningRewards]);

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
        phosphorIcon={Vault}
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
              }, 3000);
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

  const addMore = useCallback(() => {
    setEntryView(EarningEntryView.OPTIONS);
  }, [setEntryView]);

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
                  renderItem={renderItem}
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
                renderItem={renderItem}
                renderWhenEmpty={emptyList}
                searchFunction={searchFunction}
                searchMinCharactersCount={1}
                searchPlaceholder={t<string>('Search token')}
                showActionBtn
              />
            )
        }
        <div className={'footer-separator'}></div>
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
        title={selectedPositionInfo?.type === YieldPoolType.LENDING ? t('Withdraw') : t('Unstake')}
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
      {
        !!(selectedPositionInfo && poolInfoMap[selectedPositionInfo.slug]) &&
        (
          <EarningInstructionModal
            address={currentAccount?.address}
            assetRegistry={assetRegistry}
            bypassEarlyValidate={true}
            closeAlert={closeAlert}
            customButtonTitle={selectedPositionInfo.type === YieldPoolType.LENDING ? t('Supply more') : t('Stake more')}
            isShowStakeMoreButton={true}
            onStakeMore={navigateToEarnTransaction}
            openAlert={openAlert}
            poolInfo={poolInfoMap[selectedPositionInfo.slug]}
          />
        )
      }

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
  overflow: 'auto',
  flex: 1,
  width: '100%',
  alignSelf: 'center',
  display: 'flex',
  flexDirection: 'column',

  '.ant-sw-sub-header-container': {
    marginBottom: token.marginXS
  },

  '.__section-list-container': {
    paddingLeft: 0,
    paddingRight: 0,
    height: '100%',
    flex: 1
  },
  '.footer-separator': {
    height: 2,
    backgroundColor: token.colorSplit,
    marginBottom: token.marginSM
  },

  '.__empty-list-earning-positions': {
    height: '100%',
    marginBottom: 0,
    marginTop: 0
  },

  '.__desktop-list-container': {
    paddingLeft: 0,
    paddingRight: 0,
    display: 'flex',
    gap: 16,
    flexDirection: 'column',
    overflowY: 'auto',
    flex: 1,
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

  '@media (min-width: 992px)': {
    '.__empty-list-earning-positions': {
      paddingTop: 32,
      paddingBottom: 62
    }
  },
  '@media (max-width: 991px)': {
    '.ant-sw-screen-layout-body': {
      display: 'flex',
      flexDirection: 'column'
    },
    '.footer-group': {
      paddingLeft: token.padding,
      paddingRight: token.padding,
      '.footer-content': {
        fontSize: token.fontSize,
        lineHeight: token.lineHeight,
        paddingRight: token.paddingXXS
      }
    },
    '.footer-separator': {
      marginLeft: token.margin,
      marginRight: token.margin
    },
    '.__desktop-list-container': {
      overflow: 'visible'
    }
  },
  '@media (max-width: 300px)': {
    '.footer-group .ant-btn-content-wrapper': {
      display: 'none'
    }
  }
}));

export default EarningPositions;
