// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { NotificationType } from '@subwallet/extension-base/background/KoniTypes';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/earning-service/constants';
import { EarningRewardHistoryItem, YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/types';
import { BaseModal } from '@subwallet/extension-web-ui/components';
import { EarningRewardsHistoryModal } from '@subwallet/extension-web-ui/components/Modal/Earning/EarningRewardsHistoryModal';
import { BN_ZERO, CLAIM_REWARD_TRANSACTION, DEFAULT_CLAIM_REWARD_PARAMS, TRANSACTION_YIELD_CLAIM_MODAL } from '@subwallet/extension-web-ui/constants';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useSelector, useTranslation, useYieldRewardTotal } from '@subwallet/extension-web-ui/hooks';
import Transaction from '@subwallet/extension-web-ui/Popup/Transaction/Transaction';
import ClaimReward from '@subwallet/extension-web-ui/Popup/Transaction/variants/ClaimReward';
import { AlertDialogProps, ThemeProps } from '@subwallet/extension-web-ui/types';
import { openInNewTab } from '@subwallet/extension-web-ui/utils';
import { ActivityIndicator, Button, Icon, ModalContext, Number } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { CheckCircle, Clock } from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
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
const rewardsHistoryModalId = 'earning-rewards-history-modal';

function Component ({ className, closeAlert, compound,
  inputAsset, isShowBalance, openAlert, rewardHistories, transactionChainValue,
  transactionFromValue }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const { isWebUI } = useContext(ScreenContext);

  const { currentAccount } = useSelector((state) => state.accountState);
  const chainInfoMap = useSelector((state) => state.chainStore.chainInfoMap);

  const { slug, type } = compound;

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
      openInNewTab('https://portal.astar.network/astar/dapp-staking/discover')();

      return;
    }

    if (total && new BigN(total).gt(BN_ZERO)) {
      setClaimRewardStorage({
        ...DEFAULT_CLAIM_REWARD_PARAMS,
        slug: slug,
        chain: transactionChainValue,
        from: transactionFromValue
      });

      // todo: open Modal
      if (isWebUI) {
        activeModal(TRANSACTION_YIELD_CLAIM_MODAL);
      } else {
        navigate('/transaction/claim-reward');
      }
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
  }, [type, isDAppStaking, total, setClaimRewardStorage, slug, transactionChainValue, transactionFromValue, isWebUI, activeModal, navigate, openAlert, t, closeAlert]);
  const handleCloseClaim = useCallback(() => {
    inactiveModal(TRANSACTION_YIELD_CLAIM_MODAL);
  }, [inactiveModal]);

  const onOpenRewardsHistoryModal = useCallback(() => {
    activeModal(rewardsHistoryModalId);
  }, [activeModal]);

  const subscanSlug = useMemo(() => {
    return chainInfoMap[compound.chain]?.extraInfo?.subscanSlug || undefined;
  }, [chainInfoMap, compound.chain]);

  const canShowRewardInfo = type === YieldPoolType.NOMINATION_POOL || (type === YieldPoolType.NATIVE_STAKING && isDAppStaking);

  return (
    <>
      <div
        className={CN(className, '__reward-info-desktop-part')}
      >
        <div className={'__part-title'}>{title}</div>

        {canShowRewardInfo
          ? (
            <>
              <div className={'__claim-reward-area'}>
                {type === YieldPoolType.NOMINATION_POOL
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
          )
          : (
            <div className={'__claim-reward-area'}>
              <div className={'__auto-compounded'}>
                {t('Auto compounded')}
              </div>
            </div>
          )}

        <div className='__separator' />

        <Button
          block={true}
          className={'__rewards-history-button -ghost-type-3'}
          disabled={!rewardHistories?.length}
          icon={
            <Icon
              customSize={'28px'}
              phosphorIcon={Clock}
            />
          }
          onClick={onOpenRewardsHistoryModal}
          type={'ghost'}
        >{t('Reward history')}</Button>
      </div>
      <EarningRewardsHistoryModal
        address={currentAccount?.address}
        inputAsset={inputAsset}
        modalId={rewardsHistoryModalId}
        rewardHistories={rewardHistories}
        subscanSlug={subscanSlug}
      />
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
    </>
  );
}

export const RewardInfoDesktopPart = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  borderRadius: token.borderRadiusLG,
  backgroundColor: token.colorBgSecondary,
  paddingTop: 16,
  paddingRight: 24,
  paddingLeft: 24,
  flex: 1,
  display: 'flex',
  gap: 12,
  flexDirection: 'column',
  flexBasis: 384,

  '.__part-title': {
    lineHeight: token.lineHeight
  },

  '.__separator': {
    height: 2,
    backgroundColor: 'rgba(33, 33, 33, 0.80)',
    marginBottom: -token.marginSM
  },

  '.__claim-reward-area': {
    display: 'flex',
    gap: token.sizeSM,
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  '.__claim-reward-area.-no-content': {
    height: 36
  },
  '.ant-btn-content-wrapper': {
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
    fontWeight: token.fontWeightStrong
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

  '.__auto-compounded': {
    fontSize: token.fontSizeXL,
    lineHeight: token.lineHeightHeading4,
    fontWeight: token.fontWeightStrong,
    color: token.colorWhite,
    paddingBottom: 6,
    paddingTop: 6
  },

  '.__visit-dapp-label': {
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
    color: token.colorTextLight4
  }
}));
