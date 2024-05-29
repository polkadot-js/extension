// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { UnstakingInfo, UnstakingStatus, YieldPoolInfo } from '@subwallet/extension-base/types';
import { BN_ZERO } from '@subwallet/extension-base/utils';
import { BaseModal } from '@subwallet/extension-web-ui/components';
import { EarningWithdrawalDetailModal } from '@subwallet/extension-web-ui/components/Modal/Earning/EarningWithdrawalDetailModal';
import { CANCEL_UN_STAKE_TRANSACTION, DEFAULT_CANCEL_UN_STAKE_PARAMS, DEFAULT_WITHDRAW_PARAMS, TRANSACTION_YIELD_CANCEL_UNSTAKE_MODAL, TRANSACTION_YIELD_WITHDRAW_MODAL, WITHDRAW_TRANSACTION } from '@subwallet/extension-web-ui/constants';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useTranslation } from '@subwallet/extension-web-ui/hooks';
import Transaction from '@subwallet/extension-web-ui/Popup/Transaction/Transaction';
import CancelUnstake from '@subwallet/extension-web-ui/Popup/Transaction/variants/CancelUnstake';
import Withdraw from '@subwallet/extension-web-ui/Popup/Transaction/variants/Withdraw';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button, Icon, ModalContext, Number } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { Eye } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

type Props = ThemeProps & {
  unstakings: UnstakingInfo[];
  poolInfo: YieldPoolInfo;
  inputAsset: _ChainAsset;
  transactionFromValue: string;
  transactionChainValue: string;
};

const withdrawalDetailModalId = 'earning-withdrawal-detail-modal';

function Component ({ className, inputAsset, poolInfo, transactionChainValue, transactionFromValue,
  unstakings }: Props) {
  const { t } = useTranslation();
  const { isWebUI } = useContext(ScreenContext);
  const navigate = useNavigate();
  const { activeModal, inactiveModal } = useContext(ModalContext);

  const { slug } = poolInfo;

  const [, setCancelUnStakeStorage] = useLocalStorage(CANCEL_UN_STAKE_TRANSACTION, DEFAULT_CANCEL_UN_STAKE_PARAMS);
  const [, setWithdrawStorage] = useLocalStorage(WITHDRAW_TRANSACTION, DEFAULT_WITHDRAW_PARAMS);
  const [currentTimestampMs, setCurrentTimestampMs] = useState(Date.now());

  const unstakingItems = useMemo(() => {
    return [...unstakings].sort((a, b) => {
      if (a.targetTimestampMs === undefined && b.targetTimestampMs === undefined) {
        if (a.waitingTime === undefined && b.waitingTime === undefined) {
          return 0;
        }

        if (a.waitingTime === undefined) {
          return -1;
        }

        if (b.waitingTime === undefined) {
          return 1;
        }

        return a.waitingTime - b.waitingTime;
      }

      if (a.targetTimestampMs === undefined) {
        return -1;
      }

      if (b.targetTimestampMs === undefined) {
        return 1;
      }

      return a.targetTimestampMs - b.targetTimestampMs;
    });
  }, [unstakings]);

  const totalWithdrawable = useMemo(() => {
    let result = BN_ZERO;

    unstakings.forEach((value) => {
      const canClaim = value.targetTimestampMs
        ? value.targetTimestampMs <= currentTimestampMs
        : value.status === UnstakingStatus.CLAIMABLE;

      if (canClaim) {
        result = result.plus(value.claimable);
      }
    });

    return result;
  }, [currentTimestampMs, unstakings]);

  const canWithdraw = useMemo(() => {
    return poolInfo.metadata.availableMethod.withdraw && totalWithdrawable.gt(BN_ZERO);
  }, [poolInfo.metadata.availableMethod.withdraw, totalWithdrawable]);

  const withdrawableValue = useMemo(() => {
    if (canWithdraw) {
      return totalWithdrawable;
    }

    let unstakingItemValue = new BigN('0');

    unstakingItems.forEach((i) => {
      unstakingItemValue = unstakingItemValue.plus(i.claimable);
    });

    return unstakingItemValue;
  }, [canWithdraw, totalWithdrawable, unstakingItems]);

  const onWithDraw = useCallback(() => {
    setWithdrawStorage({
      ...DEFAULT_WITHDRAW_PARAMS,
      slug: slug,
      chain: transactionChainValue,
      from: transactionFromValue
    });

    if (isWebUI) {
      activeModal(TRANSACTION_YIELD_WITHDRAW_MODAL);
    } else {
      navigate('/transaction/withdraw');
    }

    // todo: open WithDraw modal
  }, [activeModal, isWebUI, navigate, setWithdrawStorage, slug, transactionChainValue, transactionFromValue]);

  const onCancelWithDraw = useCallback(() => {
    setCancelUnStakeStorage({
      ...DEFAULT_CANCEL_UN_STAKE_PARAMS,
      slug: slug,
      chain: transactionChainValue,
      from: transactionFromValue
    });

    // todo: open CancelWithDraw
    if (isWebUI) {
      activeModal(TRANSACTION_YIELD_CANCEL_UNSTAKE_MODAL);
    } else {
      navigate('/transaction/cancel-unstake');
    }
  }, [activeModal, isWebUI, navigate, setCancelUnStakeStorage, slug, transactionChainValue, transactionFromValue]);

  const onOpenDetailModal = useCallback(() => {
    activeModal(withdrawalDetailModalId);
  }, [activeModal]);

  const handleCloseWithdraw = useCallback(() => {
    inactiveModal(TRANSACTION_YIELD_WITHDRAW_MODAL);
  }, [inactiveModal]);

  const handleCloseCancelUnstake = useCallback(() => {
    inactiveModal(TRANSACTION_YIELD_CANCEL_UNSTAKE_MODAL);
  }, [inactiveModal]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimestampMs(Date.now());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  if (!unstakingItems.length) {
    return (
      <div className={CN(className, '-no-content')}></div>
    );
  }

  return (
    <>
      <div
        className={CN(className, '__withdraw-info-desktop-part')}
      >
        <div className={'__part-title'}>{t('Withdraw info')}</div>

        <div className={'__withdraw-area'}>
          <Number
            className={'__withdraw-value'}
            decimal={inputAsset.decimals || 0}
            decimalOpacity={0.45}
            subFloatNumber={true}
            suffix={inputAsset.symbol}
            unitOpacity={0.45}
            value={withdrawableValue}
          />

          {canWithdraw && (
            <Button
              onClick={onWithDraw}
              size='xs'
            >
              {t('Withdraw')}
            </Button>
          )}
        </div>

        <div className={'__separator'}></div>

        <Button
          block={true}
          className={'rewards-history -ghost-type-3'}
          icon={
            <Icon
              customSize={'28px'}
              phosphorIcon={Eye}
            />
          }
          onClick={onOpenDetailModal}
          type={'ghost'}
        >{t('View details')}</Button>
      </div>

      <EarningWithdrawalDetailModal
        canWithdraw={canWithdraw}
        currentTimestampMs={currentTimestampMs}
        inputAsset={inputAsset}
        modalId={withdrawalDetailModalId}
        onCancelWithDraw={onCancelWithDraw}
        onWithdraw={onWithDraw}
        poolInfo={poolInfo}
        unstakingItems={unstakingItems}
      />
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
    </>
  );
}

export const WithdrawInfoDesktopPart = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  borderRadius: token.borderRadiusLG,
  backgroundColor: token.colorBgSecondary,
  paddingRight: token.paddingLG,
  paddingLeft: token.paddingLG,
  paddingTop: token.padding,
  paddingBottom: token.padding,
  flex: 1,
  display: 'flex',
  gap: 12,
  flexDirection: 'column',
  flexBasis: 384,

  '&.-no-content': {
    opacity: 0,
    padding: 0,
    flexBasis: 384
  },

  '.-is-show-button': {
    paddingBottom: 6,
    paddingTop: 6
  },

  '&.__withdraw-info-desktop-part': {
    paddingBottom: 0
  },

  '.__part-title': {
    lineHeight: token.lineHeight
  },

  '.__withdraw-area.-no-content': {
    height: 36
  },

  '.__withdraw-value': {
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

  '.ant-btn-content-wrapper': {
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
    fontWeight: token.fontWeightStrong
  },

  '.__withdraw-area': {
    display: 'flex',
    gap: token.sizeSM,
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 40
  },

  '.__separator': {
    height: 2,
    backgroundColor: 'rgba(33, 33, 33, 0.80)',
    marginBottom: -token.marginSM
  }
}));
