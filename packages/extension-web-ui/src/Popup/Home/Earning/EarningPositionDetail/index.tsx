// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NotificationType } from '@subwallet/extension-base/background/KoniTypes';
import { EarningRewardHistoryItem, SpecialYieldPoolInfo, SpecialYieldPositionInfo, YieldPoolInfo, YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/types';
import { AlertModal, Layout, PageWrapper } from '@subwallet/extension-web-ui/components';
import { BN_TEN, BN_ZERO, DEFAULT_EARN_PARAMS, DEFAULT_UN_STAKE_PARAMS, EARN_TRANSACTION, TRANSACTION_YIELD_UNSTAKE_MODAL, UN_STAKE_TRANSACTION } from '@subwallet/extension-web-ui/constants';
import { DataContext } from '@subwallet/extension-web-ui/contexts/DataContext';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useAlert, useSelector, useTranslation, useYieldPositionDetail } from '@subwallet/extension-web-ui/hooks';
import { AccountAndNominationInfoPart } from '@subwallet/extension-web-ui/Popup/Home/Earning/EarningPositionDetail/AccountAndNominationInfoPart';
import AccountInfoDesktopPart from '@subwallet/extension-web-ui/Popup/Home/Earning/EarningPositionDetail/desktop/AccountInfoDesktopPart';
import { EarningInfoDesktopPart } from '@subwallet/extension-web-ui/Popup/Home/Earning/EarningPositionDetail/desktop/EarningInfoDesktopPart';
import HeaderDesktopPart from '@subwallet/extension-web-ui/Popup/Home/Earning/EarningPositionDetail/desktop/HeaderDesktopPart';
import { RewardInfoDesktopPart } from '@subwallet/extension-web-ui/Popup/Home/Earning/EarningPositionDetail/desktop/RewardInfoDesktopPart';
import { WithdrawInfoDesktopPart } from '@subwallet/extension-web-ui/Popup/Home/Earning/EarningPositionDetail/desktop/WithdrawInfoDesktopPart';
import { EarningInfoPart } from '@subwallet/extension-web-ui/Popup/Home/Earning/EarningPositionDetail/EarningInfoPart';
import { RewardInfoPart } from '@subwallet/extension-web-ui/Popup/Home/Earning/EarningPositionDetail/RewardInfoPart';
import { WithdrawInfoPart } from '@subwallet/extension-web-ui/Popup/Home/Earning/EarningPositionDetail/WithdrawInfoPart';
import { EarningEntryParam, EarningEntryView, EarningPositionDetailParam, ThemeProps } from '@subwallet/extension-web-ui/types';
import { isAccountAll } from '@subwallet/extension-web-ui/utils';
import { Button, ButtonProps, Icon, ModalContext, Number } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { MinusCircle, Plus, PlusCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

type Props = ThemeProps;

type ComponentProp = {
  compound: YieldPositionInfo;
  list: YieldPositionInfo[];
  poolInfo: YieldPoolInfo;
  rewardHistories: EarningRewardHistoryItem[];
}

const alertModalId = 'earn-position-detail-alert-modal';

function Component ({ compound,
  list,
  poolInfo,
  rewardHistories }: ComponentProp) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeModal } = useContext(ModalContext);

  // @ts-ignore
  const isShowBalance = useSelector((state) => state.settings.isShowBalance);
  const { assetRegistry } = useSelector((state) => state.assetRegistry);
  const { currencyData, priceMap } = useSelector((state) => state.price);
  const { currentAccount, isAllAccount } = useSelector((state) => state.accountState);
  const { isWebUI } = useContext(ScreenContext);

  const [, setEarnStorage] = useLocalStorage(EARN_TRANSACTION, DEFAULT_EARN_PARAMS);
  const [, setUnStakeStorage] = useLocalStorage(UN_STAKE_TRANSACTION, DEFAULT_UN_STAKE_PARAMS);

  const { alertProps, closeAlert, openAlert } = useAlert(alertModalId);

  const inputAsset = useMemo(() => {
    const inputSlug = poolInfo.metadata.inputAsset;

    return assetRegistry[inputSlug];
  }, [assetRegistry, poolInfo.metadata.inputAsset]);

  const price = useMemo(() => priceMap[inputAsset?.priceId || ''] || 0, [inputAsset?.priceId, priceMap]);
  const exchangeRate = useMemo(() => {
    let rate = 1;

    if ('derivativeToken' in compound) {
      const _item = compound as SpecialYieldPositionInfo;
      const _poolInfo = poolInfo as SpecialYieldPoolInfo;
      const balanceToken = _item.balanceToken;

      if (_poolInfo) {
        const asset = _poolInfo.statistic?.assetEarning.find((i) => i.slug === balanceToken);

        rate = asset?.exchangeRate || 1;
      }
    }

    return rate;
  }, [compound, poolInfo]);

  const activeStake = useMemo(() => {
    return new BigN(compound.activeStake).multipliedBy(exchangeRate);
  }, [compound.activeStake, exchangeRate]);

  const convertActiveStake = useMemo(() => {
    return activeStake.div(BN_TEN.pow(inputAsset?.decimals || 0)).multipliedBy(price);
  }, [activeStake, inputAsset?.decimals, price]);

  const filteredRewardHistories = useMemo(() => {
    if (!isAllAccount && currentAccount) {
      return rewardHistories.filter((item) => item.slug === poolInfo.slug && item.address === currentAccount.address);
    } else {
      return [];
    }
  }, [currentAccount, isAllAccount, poolInfo.slug, rewardHistories]);

  const isActiveStakeZero = useMemo(() => {
    return BN_ZERO.eq(activeStake);
  }, [activeStake]);

  const transactionFromValue = useMemo(() => {
    return currentAccount?.address ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : '';
  }, [currentAccount?.address]);

  const transactionChainValue = useMemo(() => {
    return compound.chain || poolInfo.chain || '';
  }, [compound.chain, poolInfo.chain]);

  const onLeavePool = useCallback(() => {
    if (isActiveStakeZero) {
      openAlert({
        title: t('Unstaking not available'),
        type: NotificationType.ERROR,
        content: t("You don't have any staked funds left to unstake. Check withdrawal status (how long left until the unstaking period ends) by checking the Withdraw info. Keep in mind that you need to withdraw manually."),
        okButton: {
          text: t('OK'),
          onClick: closeAlert
        }
      });

      return;
    }

    setUnStakeStorage({
      ...DEFAULT_UN_STAKE_PARAMS,
      slug: poolInfo.slug,
      chain: transactionChainValue,
      from: transactionFromValue
    });

    if (isWebUI) {
      activeModal(TRANSACTION_YIELD_UNSTAKE_MODAL);
    } else {
      navigate('/transaction/unstake');
    }
    // todo: open modal is isWebUI
  }, [isActiveStakeZero, setUnStakeStorage, poolInfo.slug, transactionChainValue, transactionFromValue, isWebUI, openAlert, t, closeAlert, activeModal, navigate]);

  const onEarnMore = useCallback(() => {
    setEarnStorage({
      ...DEFAULT_EARN_PARAMS,
      slug: compound.slug,
      chain: transactionChainValue,
      from: transactionFromValue
    });
    navigate('/transaction/earn');
  }, [compound.slug, navigate, setEarnStorage, transactionChainValue, transactionFromValue]);

  const onBack = useCallback(() => {
    navigate('/home/earning', { state: {
      view: EarningEntryView.POSITIONS
    } as EarningEntryParam });
  }, [navigate]);

  const subHeaderButtons: ButtonProps[] = useMemo(() => {
    return [
      {
        icon: (
          <Icon
            phosphorIcon={Plus}
            size='sm'
            type='phosphor'
          />
        ),
        onClick: onEarnMore
      }
    ];
  }, [onEarnMore]);

  return (
    <>
      <Layout.Base
        className={'__screen-container'}
        onBack={onBack}
        showBackButton={true}
        showSubHeader={true}
        subHeaderBackground={'transparent'}
        subHeaderCenter={false}
        subHeaderIcons={subHeaderButtons}
        subHeaderPaddingVertical={true}
        title={t<string>('Earning position details')}
      >
        {
          isWebUI && (
            <>
              <HeaderDesktopPart
                activeStake={activeStake}
                convertActiveStake={convertActiveStake}
                inputAsset={inputAsset}
                isShowBalance={isShowBalance}
                poolInfo={poolInfo}
              />
              <div className={'__middle-part'}>
                <div className={'__middle-part-item-wrapper'}>
                  <EarningInfoDesktopPart
                    compound={compound}
                    onEarnMore={onEarnMore}
                    onLeavePool={onLeavePool}
                    poolInfo={poolInfo}
                  />
                </div>
                <div className={'__middle-part-item-wrapper'}>
                  <RewardInfoDesktopPart
                    closeAlert={closeAlert}
                    compound={compound}
                    inputAsset={inputAsset}
                    isShowBalance={isShowBalance}
                    openAlert={openAlert}
                    rewardHistories={filteredRewardHistories}
                    transactionChainValue={transactionChainValue}
                    transactionFromValue={transactionFromValue}
                  />
                </div>
                <div className={'__middle-part-item-wrapper'}>
                  <WithdrawInfoDesktopPart
                    inputAsset={inputAsset}
                    poolInfo={poolInfo}
                    transactionChainValue={transactionChainValue}
                    transactionFromValue={transactionFromValue}
                    unstakings={compound.unstakings}
                  />
                </div>
              </div>
              <AccountInfoDesktopPart
                compound={compound}
                inputAsset={inputAsset}
                positionItems={list}
              />
            </>
          )
        }

        {
          !isWebUI && (
            <>
              <div className={'__active-stake-info-area'}>
                <div className={'__active-stake-title'}>{t('Active stake')}</div>
                <Number
                  className={'__active-stake-value'}
                  decimal={inputAsset?.decimals || 0}
                  hide={!isShowBalance}
                  subFloatNumber={true}
                  suffix={inputAsset?.symbol}
                  value={activeStake}
                />

                <Number
                  className={'__active-stake-converted-value'}
                  decimal={0}
                  hide={!isShowBalance}
                  prefix={(currencyData.isPrefix && currencyData.symbol) || ''}
                  suffix={(!currencyData.isPrefix && currencyData.symbol) || ''}
                  value={convertActiveStake}
                />
              </div>

              <RewardInfoPart
                className={'__reward-info-part'}
                closeAlert={closeAlert}
                compound={compound}
                inputAsset={inputAsset}
                isShowBalance={isShowBalance}
                openAlert={openAlert}
                rewardHistories={filteredRewardHistories}
                transactionChainValue={transactionChainValue}
                transactionFromValue={transactionFromValue}
              />

              <div className={'__transaction-buttons'}>
                <Button
                  block={true}
                  icon={(
                    <Icon
                      phosphorIcon={MinusCircle}
                      weight='fill'
                    />
                  )}
                  onClick={onLeavePool}
                  schema='secondary'
                >
                  {poolInfo.type === YieldPoolType.LENDING ? t('Withdraw') : t('Unstake')}
                </Button>

                <Button
                  block={true}
                  icon={(
                    <Icon
                      phosphorIcon={PlusCircle}
                      weight='fill'
                    />
                  )}
                  onClick={onEarnMore}
                  schema='secondary'
                >
                  {poolInfo.type === YieldPoolType.LENDING ? t('Supply more') : t('Stake more')}
                </Button>
              </div>

              <WithdrawInfoPart
                className={'__withdraw-info-part'}
                inputAsset={inputAsset}
                poolInfo={poolInfo}
                transactionChainValue={transactionChainValue}
                transactionFromValue={transactionFromValue}
                unstakings={compound.unstakings}
              />

              <AccountAndNominationInfoPart
                className={'__account-and-nomination-info-part'}
                compound={compound}
                inputAsset={inputAsset}
                list={list}
                poolInfo={poolInfo}
              />

              <EarningInfoPart
                className={'__earning-info-part'}
                inputAsset={inputAsset}
                poolInfo={poolInfo}
              />
            </>
          )
        }
      </Layout.Base>

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

const ComponentGate = () => {
  const locationState = useLocation().state as EarningPositionDetailParam;
  const navigate = useNavigate();
  const [earningSlug] = useState<string>(locationState?.earningSlug || '');

  const { poolInfoMap, rewardHistories } = useSelector((state) => state.earning);
  const data = useYieldPositionDetail(earningSlug);
  const poolInfo = poolInfoMap[earningSlug];

  useEffect(() => {
    if (!data.compound || !poolInfo) {
      navigate('/home/earning', { state: {
        view: EarningEntryView.POSITIONS
      } as EarningEntryParam });
    }
  }, [data.compound, poolInfo, navigate]);

  if (!data.compound || !poolInfo) {
    return null;
  }

  return (
    <Component
      compound={data.compound}
      list={data.list}
      poolInfo={poolInfo}
      rewardHistories={rewardHistories}
    />
  );
};

const Wrapper = ({ className }: Props) => {
  const dataContext = useContext(DataContext);

  return (
    <PageWrapper
      className={CN(className)}
      resolve={dataContext.awaitStores(['earning', 'price', 'balance'])}
    >
      <ComponentGate />
    </PageWrapper>
  );
};

const EarningPositionDetail = styled(Wrapper)<Props>(({ theme: { token } }: Props) => ({
  '.ant-sw-screen-layout-body': {
    paddingLeft: token.padding,
    paddingRight: token.padding,
    paddingBottom: token.padding
  },

  '.__reward-info-part, .__withdraw-info-part, .__account-and-nomination-info-part, .__transaction-buttons': {
    marginBottom: token.marginSM
  },

  '.__active-stake-info-area': {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: token.sizeXXS,
    paddingTop: 24,
    paddingBottom: 24
  },

  '.__middle-part': {
    display: 'flex',
    marginLeft: -8,
    marginRight: -8
  },

  '.__middle-part-item-wrapper': {
    flex: '1 1 384px',
    display: 'flex'
  },

  '.__earning-info-desktop-part, .__reward-info-desktop-part, .__withdraw-info-desktop-part': {
    marginLeft: 8,
    marginRight: 8,
    marginBottom: 16
  },
  '.__withdraw-info-desktop-part .-no-content': {
    marginBottom: 0
  },

  '.__active-stake-title': {
    fontSize: token.sizeSM,
    lineHeight: token.lineHeightSM,
    color: token.colorTextLight4
  },

  '.__active-stake-value': {
    fontSize: token.fontSizeHeading2,
    lineHeight: token.lineHeightHeading2,
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
      fontSize: `${token.fontSizeHeading3}px !important`,
      fontWeight: 'inherit !important',
      lineHeight: token.lineHeightHeading3
    }
  },

  '.__active-stake-converted-value': {
    fontSize: token.fontSizeLG,
    lineHeight: token.lineHeightLG,
    fontWeight: token.bodyFontWeight,
    color: token.colorTextLight4,

    '.ant-typography': {
      color: 'inherit !important',
      fontSize: 'inherit !important',
      fontWeight: 'inherit !important',
      lineHeight: 'inherit'
    }
  },

  '.__transaction-buttons': {
    display: 'flex',
    gap: token.sizeSM
  },

  '@media (max-width: 1450px)': {
    '.__middle-part': {
      flexWrap: 'wrap'
    },
    '.__earning-info-desktop-part, .__reward-info-desktop-part, .__withdraw-info-desktop-part': {
      flexBasis: 384
    }
  }

}));

export default EarningPositionDetail;
