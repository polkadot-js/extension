// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { UnstakingInfo, UnstakingStatus, YieldPoolInfo } from '@subwallet/extension-base/types';
import { BN_ZERO } from '@subwallet/extension-base/utils';
import { EarningWithdrawalDetailModal } from '@subwallet/extension-web-ui/components/Modal/Earning/EarningWithdrawalDetailModal';
import { CANCEL_UN_STAKE_TRANSACTION, DEFAULT_CANCEL_UN_STAKE_PARAMS, DEFAULT_WITHDRAW_PARAMS, WITHDRAW_TRANSACTION } from '@subwallet/extension-web-ui/constants';
import { useTranslation } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button, ModalContext, Number } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useContext, useMemo } from 'react';
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
  const { activeModal } = useContext(ModalContext);

  const { slug } = poolInfo;

  const [, setCancelUnStakeStorage] = useLocalStorage(CANCEL_UN_STAKE_TRANSACTION, DEFAULT_CANCEL_UN_STAKE_PARAMS);
  const [, setWithdrawStorage] = useLocalStorage(WITHDRAW_TRANSACTION, DEFAULT_WITHDRAW_PARAMS);

  const totalWithdrawable = useMemo(() => {
    let result = BN_ZERO;

    unstakings.forEach((value) => {
      if (value.status === UnstakingStatus.CLAIMABLE) {
        result = result.plus(value.claimable);
      }
    });

    return result;
  }, [unstakings]);

  const canWithdraw = useMemo(() => {
    return totalWithdrawable.gt(BN_ZERO);
  }, [totalWithdrawable]);

  const onWithDraw = useCallback(() => {
    setWithdrawStorage({
      ...DEFAULT_WITHDRAW_PARAMS,
      slug: slug,
      chain: transactionChainValue,
      from: transactionFromValue
    });

    // todo: open WithDraw modal
  }, [setWithdrawStorage, slug, transactionChainValue, transactionFromValue]);

  const onCancelWithDraw = useCallback(() => {
    setCancelUnStakeStorage({
      ...DEFAULT_CANCEL_UN_STAKE_PARAMS,
      slug: slug,
      chain: transactionChainValue,
      from: transactionFromValue
    });

    // todo: open CancelWithDraw
  }, [setCancelUnStakeStorage, slug, transactionChainValue, transactionFromValue]);

  const onOpenDetailModal = useCallback(() => {
    activeModal(withdrawalDetailModalId);
  }, [activeModal]);

  if (!unstakings.length) {
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

        {canWithdraw
          ? (
            <div className={'__withdraw-area'}>
              <Number
                className={'__withdraw-value'}
                decimal={inputAsset.decimals || 0}
                decimalOpacity={0.45}
                subFloatNumber={true}
                suffix={inputAsset.symbol}
                unitOpacity={0.45}
                value={totalWithdrawable}
              />
              <Button
                onClick={onWithDraw}
                size='xs'
              >
                {t('Withdraw')}
              </Button>
            </div>
          )
          : (
            <div className={'__withdraw-area -no-content'}></div>
          )}

        <div className={'__separator'}></div>

        <Button
          block={true}
          className={'rewards-history'}
          onClick={onOpenDetailModal}
          type={'ghost'}
        >{t('View detail')}</Button>
      </div>

      <EarningWithdrawalDetailModal
        inputAsset={inputAsset}
        modalId={withdrawalDetailModalId}
        onCancelWithDraw={onCancelWithDraw}
        poolInfo={poolInfo}
        unstakings={unstakings}
      />
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

  '&.-no-content': {
    opacity: 0,
    padding: 0
  },

  // '&.__withdraw-info-desktop-part': {
  //   marginBottom: 38
  // },

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
    alignItems: 'center'
  },

  '.__separator': {
    height: 2,
    backgroundColor: 'rgba(33, 33, 33, 0.80)',
    marginTop: token.marginSM,
    marginBottom: token.marginSM
  }
}));
