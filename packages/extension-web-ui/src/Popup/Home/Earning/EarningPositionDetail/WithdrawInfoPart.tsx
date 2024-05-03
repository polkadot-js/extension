// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { UnstakingInfo, UnstakingStatus, YieldPoolInfo } from '@subwallet/extension-base/types';
import { BN_ZERO } from '@subwallet/extension-base/utils';
import { CollapsiblePanel, MetaInfo } from '@subwallet/extension-web-ui/components';
import { CANCEL_UN_STAKE_TRANSACTION, DEFAULT_CANCEL_UN_STAKE_PARAMS, DEFAULT_WITHDRAW_PARAMS, WITHDRAW_TRANSACTION } from '@subwallet/extension-web-ui/constants';
import { useTranslation } from '@subwallet/extension-web-ui/hooks';
import { getWaitingTime } from '@subwallet/extension-web-ui/Popup/Transaction/helper';
import { Theme } from '@subwallet/extension-web-ui/themes';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button, Icon, Number } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, ProhibitInset } from 'phosphor-react';
import React, { Context, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { ThemeContext } from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

type Props = ThemeProps & {
  unstakings: UnstakingInfo[];
  poolInfo: YieldPoolInfo;
  inputAsset: _ChainAsset;
  transactionFromValue: string;
  transactionChainValue: string;
};

function Component ({ className, inputAsset, poolInfo, transactionChainValue, transactionFromValue,
  unstakings }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { slug } = poolInfo;

  const token = useContext<Theme>(ThemeContext as Context<Theme>).token;

  const [, setCancelUnStakeStorage] = useLocalStorage(CANCEL_UN_STAKE_TRANSACTION, DEFAULT_CANCEL_UN_STAKE_PARAMS);
  const [, setWithdrawStorage] = useLocalStorage(WITHDRAW_TRANSACTION, DEFAULT_WITHDRAW_PARAMS);
  const [currentTimestampMs, setCurrentTimestampMs] = useState(Date.now());

  const items = useMemo(() => {
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

  const haveUnlocking = useMemo(() => unstakings.some((i) => i.status === UnstakingStatus.UNLOCKING), [unstakings]);

  const canCancelWithdraw = useMemo(
    () => haveUnlocking && poolInfo.metadata.availableMethod.cancelUnstake,
    [haveUnlocking, poolInfo.metadata.availableMethod.cancelUnstake]
  );

  const canWithdraw = useMemo(() => {
    return poolInfo.metadata.availableMethod.withdraw && totalWithdrawable.gt(BN_ZERO);
  }, [poolInfo.metadata.availableMethod.withdraw, totalWithdrawable]);

  const onWithDraw = useCallback(() => {
    setWithdrawStorage({
      ...DEFAULT_WITHDRAW_PARAMS,
      slug: slug,
      chain: transactionChainValue,
      from: transactionFromValue
    });
    navigate('/transaction/withdraw');
  }, [navigate, setWithdrawStorage, slug, transactionChainValue, transactionFromValue]);

  const onCancelWithDraw = useCallback(() => {
    setCancelUnStakeStorage({
      ...DEFAULT_CANCEL_UN_STAKE_PARAMS,
      slug: slug,
      chain: transactionChainValue,
      from: transactionFromValue
    });
    navigate('/transaction/cancel-unstake');
  }, [navigate, setCancelUnStakeStorage, slug, transactionChainValue, transactionFromValue]);

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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimestampMs(Date.now());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  if (!unstakings.length) {
    return null;
  }

  return (
    <div
      className={CN(className)}
    >
      <CollapsiblePanel
        className={'__collapsible-panel'}
        title={t('Withdraw info')}
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

        {canCancelWithdraw && (
          <div className={'__cancel-unstake-button-wrapper'}>
            <Button
              block={true}
              icon={(
                <Icon
                  phosphorIcon={ProhibitInset}
                  weight='fill'
                />
              )}
              onClick={onCancelWithDraw}
              size='xs'
              type='ghost'
            >
              {t('Cancel unstaking')}
            </Button>
          </div>
        )}
      </CollapsiblePanel>

      {canWithdraw && (
        <>
          <div className={'__separator'}></div>

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
        </>
      )}
    </div>
  );
}

export const WithdrawInfoPart = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  borderRadius: token.borderRadiusLG,
  backgroundColor: token.colorBgSecondary,
  '.__withdraw-time-item': {
    gap: token.sizeSM,

    '.__label': {
      'white-space': 'nowrap',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: token.sizeXXS,
      overflow: 'hidden'
    },

    '.__value-col': {
      flex: '0 1 auto'
    }
  },

  '.__withdraw-time-label': {
    textOverflow: 'ellipsis',
    overflow: 'hidden'
  },

  '.__separator': {
    height: 2,
    backgroundColor: 'rgba(33, 33, 33, 0.80)',
    marginLeft: token.margin,
    marginRight: token.margin,
    marginBottom: token.marginXS,
    marginTop: -token.marginXXS
  },

  '.__cancel-unstake-button-wrapper': {
    marginTop: token.marginSM
  },

  '.__collapsible-panel.-close + .__separator': {
    display: 'none'
  },

  '.__withdraw-area': {
    display: 'flex',
    gap: token.sizeSM,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: token.paddingSM,
    paddingTop: token.paddingXXS,
    paddingLeft: token.padding,
    paddingRight: token.padding
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
  }
}));
