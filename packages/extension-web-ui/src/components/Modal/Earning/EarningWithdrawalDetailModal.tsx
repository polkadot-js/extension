// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { UnstakingInfo, UnstakingStatus, YieldPoolInfo } from '@subwallet/extension-base/types';
import { BaseModal, MetaInfo } from '@subwallet/extension-web-ui/components';
import { useTranslation } from '@subwallet/extension-web-ui/hooks';
import { getWaitingTime } from '@subwallet/extension-web-ui/Popup/Transaction/helper';
import { Theme } from '@subwallet/extension-web-ui/themes';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button, Icon, ModalContext } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, ProhibitInset, StopCircle } from 'phosphor-react';
import React, { Context, useCallback, useContext, useMemo } from 'react';
import styled, { ThemeContext } from 'styled-components';

type Props = ThemeProps & {
  modalId: string;
  inputAsset: _ChainAsset;
  unstakingItems: UnstakingInfo[];
  poolInfo: YieldPoolInfo;
  onCancelWithDraw: VoidFunction;
  canWithdraw: boolean;
  onWithdraw: VoidFunction;
  currentTimestampMs: number;
};

function Component ({ canWithdraw, className, currentTimestampMs, inputAsset, modalId, onCancelWithDraw, onWithdraw, poolInfo, unstakingItems }: Props) {
  const { t } = useTranslation();
  const { inactiveModal } = useContext(ModalContext);

  const token = useContext<Theme>(ThemeContext as Context<Theme>).token;

  const closeModal = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal, modalId]);

  const renderWithdrawTime = useCallback(
    (item: UnstakingInfo) => {
      if (!poolInfo.metadata.availableMethod.withdraw) {
        return (
          <div className={'__withdraw-time-label'}>{t('Automatic withdrawal')}</div>
        );
      } else {
        if (item.targetTimestampMs === undefined && item.waitingTime === undefined) {
          return (
            <>
              <div className={'__withdraw-time-label'}>{t('Waiting for withdrawal')}</div>
              {item.status === UnstakingStatus.CLAIMABLE && (
                <Icon
                  iconColor={token.colorSecondary}
                  phosphorIcon={CheckCircle}
                  size='sm'
                  weight='fill'
                />
              )}
            </>
          );
        } else {
          return (
            <>
              <div className={'__withdraw-time-label'}>{getWaitingTime(t, currentTimestampMs, item.targetTimestampMs, item.waitingTime)}</div>
              {item.status === UnstakingStatus.CLAIMABLE && (
                <Icon
                  iconColor={token.colorSecondary}
                  phosphorIcon={CheckCircle}
                  size='sm'
                  weight='fill'
                />
              )}
            </>
          );
        }
      }
    },
    [currentTimestampMs, poolInfo.metadata.availableMethod.withdraw, t, token.colorSecondary]
  );

  const haveUnlocking = useMemo(() => unstakingItems.some((i) => i.status === UnstakingStatus.UNLOCKING), [unstakingItems]);

  const canCancelWithdraw = useMemo(
    () => haveUnlocking && poolInfo.metadata.availableMethod.cancelUnstake,
    [haveUnlocking, poolInfo.metadata.availableMethod.cancelUnstake]
  );

  const onClickCancelUnstaking = useCallback(() => {
    if (!canCancelWithdraw) {
      return;
    }

    onCancelWithDraw();
  }, [canCancelWithdraw, onCancelWithDraw]);

  return (
    <BaseModal
      className={CN(className, '__withdrawal-detail-modal')}
      footer={canCancelWithdraw || canWithdraw
        ? (
          <>
            {
              canWithdraw && (
                <Button
                  block={true}
                  className={'__withdraw-button'}
                  icon={(
                    <Icon
                      phosphorIcon={StopCircle}
                      weight={'fill'}
                    />
                  )}
                  onClick={onWithdraw}
                >
                  {t('Withdraw')}
                </Button>)
            }
            {
              canCancelWithdraw && (
                <Button
                  block={true}
                  className={'__cancel-unstake-button'}
                  icon={(
                    <Icon
                      phosphorIcon={ProhibitInset}
                      weight={'fill'}
                    />
                  )}
                  onClick={onClickCancelUnstaking}
                  schema={'secondary'}
                >
                  {t('Cancel unstake')}
                </Button>)
            }
          </>
        )
        : undefined}
      id={modalId}
      onCancel={closeModal}
      title={'Withdraw info'}
    >
      <MetaInfo
        labelColorScheme='gray'
        labelFontWeight='regular'
        spaceSize='ms'
      >
        {unstakingItems.map((item, index) => {
          return (
            <MetaInfo.Number
              className={'__withdraw-time-item'}
              decimals={inputAsset?.decimals || 0}
              key={index}
              label={renderWithdrawTime(item)}
              suffix={inputAsset?.symbol}
              value={item.claimable}
              valueColorSchema='even-odd'
            />
          );
        })}
      </MetaInfo>
    </BaseModal>
  );
}

export const EarningWithdrawalDetailModal = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  borderRadius: token.borderRadiusLG,
  backgroundColor: token.colorBgSecondary,
  minHeight: 54,

  '.ant-sw-modal-footer': {
    borderTop: 0,
    paddingTop: 0,
    paddingBottom: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: token.sizeSM
  },
  '.ant-sw-modal-footer .ant-btn+.ant-btn:not(.ant-dropdown-trigger)': {
    marginLeft: 0
  },

  '.__part-title': {
    paddingTop: token.padding,
    paddingLeft: token.padding,
    paddingRight: token.padding
  },

  '.__withdraw-now': {
    paddingRight: token.paddingXXS
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
    paddingLeft: token.padding,
    paddingRight: token.padding
  },

  '.__withdraw-time-item .__label': {
    display: 'flex',
    gap: 4,
    'white-space': 'nowrap'
  },

  '.__withdraw-time-item .__withdraw-time-label': {
    textOverflow: 'ellipsis',
    overflow: 'hidden'
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
  }
}));
