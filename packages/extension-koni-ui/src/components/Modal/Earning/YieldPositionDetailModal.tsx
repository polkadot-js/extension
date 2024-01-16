// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NominatorMetadata, YieldCompoundingPeriod, YieldPoolInfo, YieldPositionInfo } from '@subwallet/extension-base/background/KoniTypes';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import { getYieldAvailableActionsByPosition, YieldAction } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { calculateReward } from '@subwallet/extension-base/koni/api/yield';
import { _getAssetDecimals, _getAssetSymbol } from '@subwallet/extension-base/services/chain-service/utils';
import { balanceFormatter, formatNumber } from '@subwallet/extension-base/utils';
import { BaseModal, MetaInfo } from '@subwallet/extension-koni-ui/components';
import { DEFAULT_FAST_WITHDRAW_YIELD_PARAMS, DEFAULT_UN_YIELD_PARAMS, DEFAULT_YIELD_PARAMS, EARNING_MORE_ACTION_MODAL, FAST_WITHDRAW_YIELD_TRANSACTION, StakingStatusUi, TRANSACTION_YIELD_FAST_WITHDRAW_MODAL, TRANSACTION_YIELD_UNSTAKE_MODAL, UN_YIELD_TRANSACTION, YIELD_POSITION_DETAIL_MODAL, YIELD_TRANSACTION } from '@subwallet/extension-koni-ui/constants';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { useGetAccountsByYield, usePreCheckAction, useSelector } from '@subwallet/extension-koni-ui/hooks';
import { getWaitingTime } from '@subwallet/extension-koni-ui/Popup/Transaction/helper';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { createEarningTagTypes, getEarnExtrinsicType, getUnstakeExtrinsicType, getWithdrawExtrinsicType, isAccountAll } from '@subwallet/extension-koni-ui/utils';
import { Button, Icon, ModalContext } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import { ArrowCircleUpRight, DotsThree } from 'phosphor-react';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

interface Props extends ThemeProps {
  positionInfo: YieldPositionInfo;
  yieldPoolInfo: YieldPoolInfo;
}

const modalId = YIELD_POSITION_DETAIL_MODAL;

interface YieldAssetExpectedEarning {
  apy?: number;
  symbol: string;
}

interface YieldBalanceInfo {
  // token slug
  slug: string;
  activeBalance: string;
  totalBalance: string;
  unstakeBalance: string;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, positionInfo, yieldPoolInfo } = props;
  const { slug } = yieldPoolInfo;
  const { unstakings } = positionInfo.metadata as NominatorMetadata;

  const { token } = useTheme() as Theme;

  const { isWebUI } = useContext(ScreenContext);

  const navigate = useNavigate();
  const { t } = useTranslation();
  const { activeModal, inactiveModal } = useContext(ModalContext);

  const { currentAccount, isAllAccount } = useSelector((state: RootState) => state.accountState);
  const { assetRegistry } = useSelector((state: RootState) => state.assetRegistry);

  const onClickFooterButton = usePreCheckAction(currentAccount?.address, false);

  const yieldAccounts = useGetAccountsByYield(slug);

  const availableActions = useMemo(() => getYieldAvailableActionsByPosition(positionInfo, yieldPoolInfo), [positionInfo, yieldPoolInfo]);

  const account = isAllAccount ? null : currentAccount;

  const exchangeRate = useMemo(() => {
    return yieldPoolInfo?.stats?.assetEarning?.[0]?.exchangeRate || 1;
  }, [yieldPoolInfo?.stats?.assetEarning]);

  const yieldPositionInfoBalance: YieldBalanceInfo = useMemo((): YieldBalanceInfo => {
    const metadata = positionInfo.metadata as NominatorMetadata;

    if (!yieldPoolInfo.derivativeAssets) {
      const { activeBalance, slug } = positionInfo.balance[0];

      let totalBalance = new BigN(activeBalance);
      let unstakeBalance = new BigN(0);

      if (metadata.unstakings) {
        for (const unstaking of metadata.unstakings) {
          totalBalance = totalBalance.plus(unstaking.claimable);
          unstakeBalance = unstakeBalance.plus(unstaking.claimable);
        }
      }

      return {
        activeBalance: activeBalance.toString(),
        slug: slug,
        totalBalance: totalBalance.toString(),
        unstakeBalance: unstakeBalance.toString()
      };
    }

    const derivativeTokenBalance = positionInfo.balance[0].activeBalance;
    const inputTokenSlug = yieldPoolInfo.inputAssets[0];
    // @ts-ignore
    const exchangeRate = yieldPoolInfo?.stats?.assetEarning[0]?.exchangeRate || 1;
    const activeBalance = Math.floor(parseInt(derivativeTokenBalance) * exchangeRate);
    let totalBalance = new BigN(derivativeTokenBalance);
    let unstakeBalance = new BigN(0);

    if (metadata.unstakings) {
      for (const unstaking of metadata.unstakings) {
        totalBalance = totalBalance.plus(unstaking.claimable);
        unstakeBalance = unstakeBalance.plus(unstaking.claimable);
      }
    }

    totalBalance = totalBalance.multipliedBy(exchangeRate).integerValue();
    unstakeBalance = unstakeBalance.multipliedBy(exchangeRate).integerValue();

    return {
      activeBalance: activeBalance.toString(),
      slug: inputTokenSlug,
      totalBalance: totalBalance.toString(),
      unstakeBalance: unstakeBalance.toString()
    };
  }, [positionInfo, yieldPoolInfo]);

  const inputTokenInfo = useMemo(() => assetRegistry[yieldPositionInfoBalance.slug], [assetRegistry, yieldPositionInfoBalance]);
  const derivativeTokenInfo = useMemo(() => {
    const derivativeTokenSlug = yieldPoolInfo.derivativeAssets?.[0];

    return derivativeTokenSlug ? assetRegistry[derivativeTokenSlug] : undefined;
  }, [assetRegistry, yieldPoolInfo.derivativeAssets]);

  const derivativeTokenState = useMemo(() => {
    if (!derivativeTokenInfo) {
      return;
    }

    return {
      symbol: _getAssetSymbol(derivativeTokenInfo),
      decimals: _getAssetDecimals(derivativeTokenInfo),
      amount: positionInfo.balance[0].activeBalance
    };
  }, [derivativeTokenInfo, positionInfo.balance]);

  const _assetEarnings: Record<string, YieldAssetExpectedEarning> = useMemo(() => {
    const yearlyEarnings: Record<string, YieldAssetExpectedEarning> = {};

    if (yieldPoolInfo.stats?.assetEarning) {
      yieldPoolInfo.stats?.assetEarning.forEach((assetEarningStats) => {
        const assetSlug = assetEarningStats.slug;
        const rewardAsset = assetRegistry[assetSlug];

        if (assetEarningStats.apy !== undefined) {
          yearlyEarnings[assetSlug] = {
            apy: assetEarningStats.apy,
            symbol: rewardAsset.symbol
          };
        } else {
          const assetApr = assetEarningStats?.apr || 0;

          yearlyEarnings[assetSlug] = {
            apy: calculateReward(assetApr, 0, YieldCompoundingPeriod.YEARLY).apy,
            symbol: rewardAsset.symbol
          };
        }
      });
    }

    return yearlyEarnings;
  }, [assetRegistry, yieldPoolInfo.stats?.assetEarning]);

  const hiddenTotalBalance = useMemo(() => {
    return slug === 'xcDOT___stellaswap_liquid_staking';
  }, [slug]);

  const [, setYieldStorage] = useLocalStorage(YIELD_TRANSACTION, DEFAULT_YIELD_PARAMS);
  const [, setFastWithdrawStorage] = useLocalStorage(FAST_WITHDRAW_YIELD_TRANSACTION, DEFAULT_FAST_WITHDRAW_YIELD_PARAMS);
  const [, setUnYieldStorage] = useLocalStorage(UN_YIELD_TRANSACTION, DEFAULT_UN_YIELD_PARAMS);

  const tagTypes = useMemo(() => createEarningTagTypes(t), [t]);

  const [seeMore, setSeeMore] = useState(false);

  const onClickStakeMoreBtn = useCallback(() => {
    inactiveModal(modalId);
    setTimeout(() => {
      const address = currentAccount ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : '';

      setYieldStorage({
        ...DEFAULT_YIELD_PARAMS,
        method: yieldPoolInfo.slug,
        from: address,
        chain: yieldPoolInfo.chain,
        asset: yieldPoolInfo.inputAssets[0]
      });
      navigate('/transaction/earn');
    }, 300);
  }, [currentAccount, inactiveModal, navigate, setYieldStorage, yieldPoolInfo]);

  const onClickWithdrawBtn = useCallback(() => {
    inactiveModal(modalId);
    const address = currentAccount ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : '';

    setFastWithdrawStorage({
      ...DEFAULT_FAST_WITHDRAW_YIELD_PARAMS,
      from: address,
      chain: yieldPoolInfo.chain,
      method: yieldPoolInfo.slug,
      asset: yieldPoolInfo.inputAssets[0]
    });

    if (isWebUI) {
      activeModal(TRANSACTION_YIELD_FAST_WITHDRAW_MODAL);
    } else {
      navigate('/transaction/yield-withdraw-position');
    }
  }, [activeModal, currentAccount, inactiveModal, isWebUI, navigate, setFastWithdrawStorage, yieldPoolInfo]);

  const onClickUnstakeBtn = useCallback(() => {
    inactiveModal(modalId);
    const address = currentAccount ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : '';

    setFastWithdrawStorage({
      ...DEFAULT_FAST_WITHDRAW_YIELD_PARAMS,
      from: address,
      chain: yieldPoolInfo.chain,
      method: yieldPoolInfo.slug,
      asset: yieldPoolInfo.inputAssets[0]
    });

    setUnYieldStorage({
      ...DEFAULT_UN_YIELD_PARAMS,
      from: address,
      chain: yieldPoolInfo.chain,
      method: yieldPoolInfo.slug,
      asset: yieldPoolInfo.inputAssets[0]
    });

    if (isWebUI) {
      activeModal(TRANSACTION_YIELD_UNSTAKE_MODAL);
    } else {
      navigate('/transaction/un-yield');
    }
  }, [activeModal, currentAccount, inactiveModal, isWebUI, navigate, setFastWithdrawStorage, setUnYieldStorage, yieldPoolInfo.chain, yieldPoolInfo.inputAssets, yieldPoolInfo.slug]);

  const onClickMoreAction = useCallback(() => {
    inactiveModal(modalId);
    activeModal(EARNING_MORE_ACTION_MODAL);
  }, [activeModal, inactiveModal]);

  const footer = useCallback(() => {
    const isAvailable = yieldPoolInfo.stats?.isAvailable ?? true;
    const isPoolUnavailable = !isAvailable;

    return (
      <div className='staking-detail-modal-footer'>
        <Button
          icon={<Icon phosphorIcon={DotsThree} />}
          onClick={onClickMoreAction}
          schema='secondary'
        />
        {
          yieldPoolInfo.slug === 'xcDOT___stellaswap_liquid_staking'
            ? (
              <Button
                className='__action-btn'
                disabled={!availableActions.includes(YieldAction.UNSTAKE) || isPoolUnavailable}
                onClick={onClickFooterButton(
                  onClickUnstakeBtn,
                  getUnstakeExtrinsicType(slug)
                )}
                schema='secondary'
              >{t('Unstake')}</Button>
            )
            : (
              <Button
                className='__action-btn'
                disabled={!availableActions.includes(YieldAction.WITHDRAW_EARNING) || isPoolUnavailable}
                onClick={onClickFooterButton(
                  onClickWithdrawBtn,
                  getWithdrawExtrinsicType(slug)
                )}
                schema='secondary'
              >{t('Withdraw')}</Button>
            )
        }
        <Button
          className='__action-btn'
          disabled={!availableActions.includes(YieldAction.START_EARNING) || isPoolUnavailable}
          onClick={onClickFooterButton(
            onClickStakeMoreBtn,
            getEarnExtrinsicType(slug)
          )}
        >{t(yieldPoolInfo.slug === 'DOT___interlay_lending' ? t('Supply now') : t('Stake now'))}</Button>
      </div>
    );
  }, [availableActions, onClickFooterButton, onClickMoreAction, onClickStakeMoreBtn, onClickWithdrawBtn, slug, t, yieldPoolInfo.slug, yieldPoolInfo.stats?.isAvailable, onClickUnstakeBtn]);

  const onClickSeeMoreBtn = useCallback(() => {
    setSeeMore(true);
  }, []);

  const onCloseModal = useCallback(() => {
    inactiveModal(modalId);
    setSeeMore(false);
  }, [inactiveModal]);

  return (
    <BaseModal
      className={className}
      closable={true}
      footer={footer()}
      id={modalId}
      maskClosable={true}
      onCancel={onCloseModal}
      title={t('Earning details')}
    >
      <MetaInfo>
        <MetaInfo.Account
          accounts={isAccountAll(positionInfo.address) ? yieldAccounts : undefined}
          address={positionInfo.address}
          label={t('Account')}
          name={account?.name}
        />

        {/* change this when all account data is full */}
        {/* <MetaInfo.AccountGroup label={'Account'} accounts={accounts} content={`${accounts.length} accounts staking`} /> */}

        <MetaInfo.DisplayType
          label={t('Earning type')}
          typeName={tagTypes[yieldPoolInfo.type].label}
        />
        <MetaInfo.Status
          label={t('Earning status')}
          statusIcon={StakingStatusUi.active.icon}
          statusName={t(StakingStatusUi.active.name)}
          valueColorSchema={StakingStatusUi.active.schema}
        />

        {
          !hiddenTotalBalance && (
            <MetaInfo.Number
              decimals={_getAssetDecimals(inputTokenInfo)}
              label={t('Total balance')}
              suffix={_getAssetSymbol(inputTokenInfo)}
              value={yieldPositionInfoBalance.totalBalance}
            />
          )
        }

        <MetaInfo.Number
          decimals={_getAssetDecimals(inputTokenInfo)}
          label={t('Active balance')}
          suffix={_getAssetSymbol(inputTokenInfo)}
          value={yieldPositionInfoBalance.activeBalance}
        />

        <MetaInfo.Number
          decimals={_getAssetDecimals(inputTokenInfo)}
          label={t('Unstake balance')}
          suffix={_getAssetSymbol(inputTokenInfo)}
          value={yieldPositionInfoBalance.unstakeBalance}
        />

        {
          derivativeTokenState && (
            <MetaInfo.Number
              decimals={derivativeTokenState.decimals}
              label={t('Derivative token balance')}
              suffix={derivativeTokenState.symbol}
              value={derivativeTokenState.amount}
            />
          )
        }

        <MetaInfo.Chain
          chain={yieldPoolInfo.chain}
          label={t('Network')}
        />
      </MetaInfo>

      {!seeMore && (
        <Button
          block
          className={'see-more-btn'}
          icon={(
            <Icon
              iconColor={token.colorTextLight4}
              phosphorIcon={ArrowCircleUpRight}
              size={'sm'}
            />
          )}
          onClick={onClickSeeMoreBtn}
          size={'xs'}
          type={'ghost'}
        >
          {t('See more')}
        </Button>
      )}

      {seeMore && (
        <>
          <MetaInfo
            hasBackgroundWrapper
            spaceSize={'xs'}
            valueColorScheme={'light'}
          >
            <MetaInfo.Default
              label={t('Yearly rewards')}
              valueColorSchema={'gray'}
            >
              <div>
                {
                  Object.values(_assetEarnings).map((value) => {
                    const amount = (value.apy || 0);

                    return `${formatNumber(new BigN(amount).toString(), 0, balanceFormatter)}% ${value.symbol}`;
                  }).join(' - ')
                }
              </div>
            </MetaInfo.Default>
            <MetaInfo.Number
              decimals={_getAssetDecimals(inputTokenInfo)}
              label={t('Minimum active')}
              suffix={_getAssetSymbol(inputTokenInfo)}
              value={yieldPoolInfo.stats?.minJoinPool || '0'}
              valueColorSchema={'gray'}
            />
            {
              derivativeTokenInfo && (
                <MetaInfo.Number
                  decimals={_getAssetDecimals(derivativeTokenInfo)}
                  label={t('Minimum redeem')}
                  suffix={_getAssetSymbol(derivativeTokenInfo)}
                  value={yieldPoolInfo.stats?.minWithdrawal || '0'}
                  valueColorSchema={'gray'}
                />
              )
            }
            {
              yieldPoolInfo.slug !== 'xcDOT___stellaswap_liquid_staking' && (
                <MetaInfo.Default
                  label={t('Reward distribution')}
                  valueColorSchema={'gray'}
                >
                  {t('Every {{number}} hours', { replace: { number: 24 } })}
                </MetaInfo.Default>
              )
            }
          </MetaInfo>
          {(unstakings && unstakings.length > 0) && currentAccount?.address !== ALL_ACCOUNT_KEY && (
            <>
              <MetaInfo valueColorScheme={'light'}>
                <MetaInfo.Number
                  decimals={_getAssetDecimals(inputTokenInfo)}
                  label={t('Unstaked')}
                  suffix={_getAssetSymbol(inputTokenInfo)}
                  value={yieldPositionInfoBalance.unstakeBalance}
                />
              </MetaInfo>
              <MetaInfo
                hasBackgroundWrapper
                spaceSize={'xs'}
                valueColorScheme={'light'}
              >
                <>
                  {unstakings.map((item) => {
                    const waitingLabel = getWaitingTime(item.status, t, item.waitingTime);

                    const claimable = new BigN(item.claimable).multipliedBy(exchangeRate).integerValue();

                    return (
                      <MetaInfo.Number
                        decimals={_getAssetDecimals(inputTokenInfo)}
                        key={`${item.chain}-${item.status}-${item.claimable}`}
                        label={waitingLabel}
                        suffix={_getAssetSymbol(inputTokenInfo)}
                        value={claimable}
                        valueColorSchema={'gray'}
                      />
                    );
                  })}
                </>
              </MetaInfo>
            </>
          )}
        </>
      )}
    </BaseModal>
  );
};

const YieldPositionDetailModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.expected-return div:first-child': {
      flex: 2
    },

    '.staking-detail-modal-footer': {
      display: 'flex',
      alignItems: 'center'
    },

    '.__action-btn': {
      flex: 1
    },

    '.__slash': {
      marginLeft: token.marginXXS,
      marginRight: token.marginXXS
    },

    '.__inflation-text': {
      marginLeft: token.marginXXS,
      color: token.colorTextLight4
    },

    '.__expected-return, .__inflation': {
      display: 'inline-flex'
    },

    '.__inflation': {
      color: token.colorTextLight4
    },

    '.__nomination-field': {
      '> .__col': {
        overflow: 'hidden'
      },

      '&.stand-alone': {
        '.__col.-to-right': {
          flexGrow: 0
        }
      }
    },

    '.__nomination-label > .__col.-to-right': {
      flex: 'initial',
      overflow: 'hidden',
      alignItems: 'flex-start',

      '.__account-item': {
        width: '100%'
      },

      '.__account-name': {
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap'
      }
    },

    '.see-more-btn': {
      marginTop: token.margin
    },

    '.ant-sw-modal-body': {
      paddingBottom: 0
    },

    '.ant-sw-modal-footer': {
      border: 'none'
    }
  };
});

export default YieldPositionDetailModal;
