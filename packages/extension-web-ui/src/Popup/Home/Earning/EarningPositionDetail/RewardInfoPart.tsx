// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { NotificationType } from '@subwallet/extension-base/background/KoniTypes';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/earning-service/constants';
import { EarningRewardHistoryItem, YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/types';
import { CollapsiblePanel, MetaInfo } from '@subwallet/extension-web-ui/components';
import { ASTAR_PORTAL_URL, BN_ZERO, CLAIM_REWARD_TRANSACTION, DEFAULT_CLAIM_REWARD_PARAMS, EarningStatusUi } from '@subwallet/extension-web-ui/constants';
import { useSelector, useTranslation, useYieldRewardTotal } from '@subwallet/extension-web-ui/hooks';
import { AlertDialogProps, ThemeProps } from '@subwallet/extension-web-ui/types';
import { customFormatDate, openInNewTab } from '@subwallet/extension-web-ui/utils';
import { ActivityIndicator, Button, Icon, Number } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { ArrowSquareOut, CheckCircle } from 'phosphor-react';
import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

type Props = ThemeProps & {
  compound: YieldPositionInfo;
  inputAsset: _ChainAsset;
  isShowBalance: boolean;
  rewardHistories: EarningRewardHistoryItem[];
  openAlert: (alertProps: AlertDialogProps) => void;
  closeAlert: VoidFunction;
  transactionFromValue: string;
  transactionChainValue: string;
};

function Component ({ className, closeAlert, compound, inputAsset, isShowBalance, openAlert, rewardHistories, transactionChainValue,
  transactionFromValue }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { slug, type } = compound;
  const { currentAccount } = useSelector((state) => state.accountState);
  const chainInfoMap = useSelector((state) => state.chainStore.chainInfoMap);

  const [, setClaimRewardStorage] = useLocalStorage(CLAIM_REWARD_TRANSACTION, DEFAULT_CLAIM_REWARD_PARAMS);

  const total = useYieldRewardTotal(slug);

  const isDAppStaking = useMemo(() => _STAKING_CHAIN_GROUP.astar.includes(compound.chain), [compound.chain]);

  const canClaim = useMemo((): boolean => {
    switch (type) {
      case YieldPoolType.LENDING:
      case YieldPoolType.LIQUID_STAKING:
        return false;
      case YieldPoolType.NATIVE_STAKING:
        return isDAppStaking;
      case YieldPoolType.NOMINATION_POOL:
        return true;
    }
  }, [isDAppStaking, type]);

  const title = useMemo(() => {
    if (type === YieldPoolType.NOMINATION_POOL) {
      return t('Unclaimed rewards');
    } else {
      return t('Rewards');
    }
  }, [t, type]);

  const onClaimReward = useCallback(() => {
    if (type === YieldPoolType.NATIVE_STAKING && isDAppStaking) {
      openInNewTab(ASTAR_PORTAL_URL)();

      return;
    }

    if (total && new BigN(total).gt(BN_ZERO)) {
      setClaimRewardStorage({
        ...DEFAULT_CLAIM_REWARD_PARAMS,
        slug: slug,
        chain: transactionChainValue,
        from: transactionFromValue
      });
      navigate('/transaction/claim-reward');
    } else {
      openAlert({
        title: t('Rewards unavailable'),
        type: NotificationType.ERROR,
        content: t("You don't have any rewards to claim at the moment. Try again later."),
        okButton: {
          text: t('I understand'),
          onClick: closeAlert,
          icon: CheckCircle
        }
      });
    }
  }, [type, isDAppStaking, total, setClaimRewardStorage, slug, transactionChainValue, transactionFromValue, navigate, openAlert, t, closeAlert]);

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
      <div className={'__part-title'}>
        <MetaInfo>
          <MetaInfo.Status
            label={title}
            statusIcon={EarningStatusUi[compound.status].icon}
            statusName={EarningStatusUi[compound.status].name}
            valueColorSchema={EarningStatusUi[compound.status].schema}
          />
        </MetaInfo>
      </div>

      {(type === YieldPoolType.NOMINATION_POOL || (type === YieldPoolType.NATIVE_STAKING && isDAppStaking)) && (
        <>
          <div className={'__claim-reward-area'}>
            { type === YieldPoolType.NOMINATION_POOL
              ? total
                ? (
                  <Number
                    className={'__claim-reward-value'}
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
                )
              : isDAppStaking && (<div className={'__visit-dapp-label'}>{t('Visit Astar portal')}</div>)}
            {canClaim && (
              <Button
                onClick={onClaimReward}
                size='xs'
              >
                {type === YieldPoolType.NATIVE_STAKING && isDAppStaking ? t('Check rewards') : t('Claim rewards')}
              </Button>
            )}
          </div>
        </>
      )}

      {!!(rewardHistories && rewardHistories.length) && (
        <>
          <div className={'__separator'}></div>

          <CollapsiblePanel
            className={'__reward-history-panel'}
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
              block={true}
              className={'__view-explorer-button'}
              icon={(
                <Icon
                  phosphorIcon={ArrowSquareOut}
                />
              )}
              onClick={onClickViewExplore}
              size={'xs'}
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
  borderRadius: token.borderRadiusLG,
  backgroundColor: token.colorBgSecondary,
  minHeight: 54,

  '.__part-title': {
    paddingTop: token.padding,
    paddingLeft: token.padding,
    paddingRight: token.padding
  },

  '.__separator': {
    height: 2,
    backgroundColor: 'rgba(33, 33, 33, 0.80)',
    marginTop: token.marginSM,
    marginBottom: token.marginSM,
    marginLeft: token.margin,
    marginRight: token.margin
  },

  '.__claim-reward-area': {
    display: 'flex',
    gap: token.sizeSM,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: token.paddingSM,
    paddingTop: token.paddingSM,
    paddingLeft: token.padding,
    paddingRight: token.padding
  },

  '.__claim-reward-value': {
    fontSize: token.fontSizeHeading4,
    lineHeight: token.lineHeightHeading4,
    fontWeight: token.headingFontWeight,
    color: token.colorTextLight1,

    '.ant-number-integer': {
      color: 'inherit !important',
      fontSize: 'inherit !important',
      fontWeight: 'inherit !important',
      lineHeight: 'inherit'
    },

    '.ant-number-decimal, .ant-number-suffix': {
      color: `${token.colorTextLight3} !important`,
      fontSize: `${token.fontSizeHeading5}px !important`,
      fontWeight: 'inherit !important',
      lineHeight: token.lineHeightHeading5
    }
  },

  '.__visit-dapp-label': {
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
    color: token.colorTextLight4
  },

  '.__claim-reward-area + .__separator': {
    marginTop: 0
  },

  '.__separator + .__reward-history-panel': {
    marginTop: -13
  },

  '.__view-explorer-button': {
    marginTop: token.marginSM
  }
}));
