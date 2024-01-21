// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { EarningRewardHistoryItem, EarningStatus, YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/types';
import { CollapsiblePanel, MetaInfo } from '@subwallet/extension-koni-ui/components';
import { BN_ZERO, CLAIM_REWARD_TRANSACTION, DEFAULT_CLAIM_REWARD_PARAMS, StakingStatusUi } from '@subwallet/extension-koni-ui/constants';
import { useSelector, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { useYieldRewardTotal } from '@subwallet/extension-koni-ui/hooks/earning';
import { AlertDialogProps, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { customFormatDate, openInNewTab } from '@subwallet/extension-koni-ui/utils';
import { ActivityIndicator, Button, Icon, Number } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { ArrowSquareOut } from 'phosphor-react';
import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

type Props = ThemeProps & {
  compound: YieldPositionInfo;
  inputAsset: _ChainAsset;
  isShowBalance: boolean;
  rewardHistories: EarningRewardHistoryItem[];
  showAlert: (alertProps: AlertDialogProps) => void;
  closeAlert: VoidFunction;
  transactionFromValue: string;
  transactionChainValue: string;
};

function Component ({ className, closeAlert, compound, inputAsset, isShowBalance, rewardHistories, showAlert, transactionChainValue,
  transactionFromValue }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { slug, type } = compound;
  const { currentAccount } = useSelector((state) => state.accountState);
  const chainInfoMap = useSelector((state) => state.chainStore.chainInfoMap);

  const [, setClaimRewardStorage] = useLocalStorage(CLAIM_REWARD_TRANSACTION, DEFAULT_CLAIM_REWARD_PARAMS);

  const total = useYieldRewardTotal(slug);

  const canClaim = useMemo((): boolean => {
    switch (type) {
      case YieldPoolType.LENDING:
      case YieldPoolType.LIQUID_STAKING:
        return false;
      case YieldPoolType.NATIVE_STAKING:
        return false;
      case YieldPoolType.NOMINATION_POOL:
        return true;
    }
  }, [type]);

  const earningStatus = useMemo(() => {
    const stakingStatusUi = StakingStatusUi;
    const status = compound.status;

    if (status === EarningStatus.EARNING_REWARD) {
      return stakingStatusUi.active;
    }

    if (status === EarningStatus.PARTIALLY_EARNING) {
      return stakingStatusUi.partialEarning;
    }

    if (status === EarningStatus.WAITING) {
      return stakingStatusUi.waiting;
    }

    return stakingStatusUi.inactive;
  }, [compound.status]);

  const title = useMemo(() => {
    if (type === YieldPoolType.NOMINATION_POOL) {
      return t('Unclaimed rewards');
    } else {
      return t('Rewards');
    }
  }, [t, type]);

  const onClaimReward = useCallback(() => {
    if (total && new BigN(total).gt(BN_ZERO)) {
      setClaimRewardStorage({
        ...DEFAULT_CLAIM_REWARD_PARAMS,
        slug: slug,
        chain: transactionChainValue,
        from: transactionFromValue
      });
      navigate('/transaction/claim-reward');
    } else {
      showAlert({
        title: t('Rewards unavailable'),
        content: t("You don't have any rewards to claim at the moment. Try again later."),
        okButton: {
          text: t('I understand'),
          onClick: closeAlert
        }
      });
    }
  }, [closeAlert, navigate, setClaimRewardStorage, showAlert, slug, t, total, transactionChainValue, transactionFromValue]);

  const onClickViewExplore = useCallback(() => {
    if (currentAccount) {
      const subscanSlug = chainInfoMap[compound.chain]?.extraInfo?.subscanSlug;

      if (subscanSlug) {
        openInNewTab(`https://${subscanSlug}.subscan.io/account/${currentAccount.address}?tab=reward`)();
      }
    }
  }, [chainInfoMap, compound.chain, currentAccount]);

  return (
    <div
      className={CN(className)}
    >
      <div>
        <MetaInfo>
          <MetaInfo.Status
            label={title}
            statusIcon={earningStatus.icon}
            statusName={earningStatus.name}
            valueColorSchema={earningStatus.schema}
          />
        </MetaInfo>
      </div>

      {(type === YieldPoolType.NOMINATION_POOL || type === YieldPoolType.NATIVE_STAKING) && !rewardHistories.length && (
        <>
          <div className={'__separator'}></div>

          <div>
            { total
              ? (
                <Number
                  decimal={inputAsset.decimals || 0}
                  decimalOpacity={0.45}
                  hide={!isShowBalance}
                  subFloatNumber={true}
                  suffix={inputAsset.symbol}
                  unitOpacity={0.45}
                  value={total}
                />
              )
              : (
                <ActivityIndicator size={20} />
              )}
            {canClaim && (
              <Button
                onClick={onClaimReward}
                size='xs'
              >
                {t('Claim rewards')}
              </Button>
            )}
          </div>
        </>
      )}

      {!!(rewardHistories && rewardHistories.length) && (
        <>
          <div className={'__separator'}></div>

          <CollapsiblePanel
            initOpen={true}
            title={t('Reward history')}
          >
            <MetaInfo
              labelColorScheme='gray'
              labelFontWeight='regular'
              spaceSize='sm'
              valueColorScheme='light'
            >
              {rewardHistories.map((item, index) => (
                <MetaInfo.Number
                  decimals={inputAsset.decimals || 0}
                  key={`${item.slug}-${index}`}
                  label={customFormatDate(new Date(item.blockTimestamp), '#DD# #MMM#, #YYYY#')}
                  suffix={inputAsset.symbol}
                  value={item.amount}
                />
              ))}

            </MetaInfo>
            <Button
              icon={(
                <Icon
                  phosphorIcon={ArrowSquareOut}
                />
              )}
              onClick={onClickViewExplore}
              size={'sm'}
              type={'ghost'}
            >
              {t('View on explorer')}
            </Button>
          </CollapsiblePanel>
        </>
      )}
    </div>
  );
}

export const RewardInfoPart = styled(Component)<Props>(({ theme: { token } }: Props) => ({

}));
