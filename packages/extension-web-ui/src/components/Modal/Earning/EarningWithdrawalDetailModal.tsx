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
import { CheckCircle, ProhibitInset } from 'phosphor-react';
import React, { Context, useCallback, useContext, useMemo } from 'react';
import styled, { ThemeContext } from 'styled-components';

type Props = ThemeProps & {
  modalId: string;
  inputAsset: _ChainAsset;
  unstakings: UnstakingInfo[];
  poolInfo: YieldPoolInfo;
  onCancelWithDraw: VoidFunction;
};

function Component ({ className, inputAsset, modalId, onCancelWithDraw, poolInfo, unstakings }: Props) {
  const { t } = useTranslation();
  const { inactiveModal } = useContext(ModalContext);

  const token = useContext<Theme>(ThemeContext as Context<Theme>).token;

  const items = useMemo(() => {
    return [...unstakings].sort((a, b) => {
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
    });
  }, [unstakings]);

  const closeModal = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal, modalId]);

  const renderWithdrawTime = useCallback(
    (item: UnstakingInfo) => {
      if (item.waitingTime === undefined) {
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
            <div className={'__withdraw-time-label'}>{getWaitingTime(item.waitingTime, item.status, t)}</div>
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
    },
    [t, token.colorSecondary]
  );

  const haveUnlocking = useMemo(() => unstakings.some((i) => i.status === UnstakingStatus.UNLOCKING), [unstakings]);

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
      footer={
        <Button
          block={true}
          className={'__cancel-unstake-button'}
          disabled={!canCancelWithdraw}
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
        </Button>
      }
      id={modalId}
      onCancel={closeModal}
      title={'Withdraw info'}
    >
      <MetaInfo
        labelColorScheme='gray'
        labelFontWeight='regular'
        spaceSize='ms'
      >
        {items.map((item, index) => {
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

  '&.__withdrawal-detail-modal .ant-sw-modal-footer': {
    borderTop: 0,
    paddingTop: 0,
    paddingBottom: 0

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
