// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EarningRewardHistoryItem, SpecialYieldPoolInfo, SpecialYieldPositionInfo, YieldPoolInfo, YieldPositionInfo } from '@subwallet/extension-base/types';
import { Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import { BN_TEN, BN_ZERO, CANCEL_UN_STAKE_TRANSACTION, CLAIM_REWARD_TRANSACTION, DEFAULT_CANCEL_UN_STAKE_PARAMS, DEFAULT_CLAIM_REWARD_PARAMS, DEFAULT_EARN_PARAMS, DEFAULT_UN_STAKE_PARAMS, DEFAULT_WITHDRAW_PARAMS, EARN_TRANSACTION, UN_STAKE_TRANSACTION, WITHDRAW_TRANSACTION } from '@subwallet/extension-koni-ui/constants';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { useSelector, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { useYieldPositionDetail } from '@subwallet/extension-koni-ui/hooks/earning';
import { EarningEntryParam, EarningEntryView, EarningPositionDetailParam, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isAccountAll } from '@subwallet/extension-koni-ui/utils';
import { Button, ButtonProps, Icon } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { Plus } from 'phosphor-react';
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

function Component ({ compound,
  list,
  poolInfo,
  rewardHistories }: ComponentProp) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // @ts-ignore
  const isShowBalance = useSelector((state) => state.settings.isShowBalance);
  const { assetRegistry } = useSelector((state) => state.assetRegistry);
  const { priceMap } = useSelector((state) => state.price);
  const { currentAccount, isAllAccount } = useSelector((state) => state.accountState);

  const [, setEarnStorage] = useLocalStorage(EARN_TRANSACTION, DEFAULT_EARN_PARAMS);
  const [, setUnStakeStorage] = useLocalStorage(UN_STAKE_TRANSACTION, DEFAULT_UN_STAKE_PARAMS);
  const [, setCancelUnStakeStorage] = useLocalStorage(CANCEL_UN_STAKE_TRANSACTION, DEFAULT_CANCEL_UN_STAKE_PARAMS);
  const [, setWithdrawStorage] = useLocalStorage(WITHDRAW_TRANSACTION, DEFAULT_WITHDRAW_PARAMS);
  const [, setClaimRewardStorage] = useLocalStorage(CLAIM_REWARD_TRANSACTION, DEFAULT_CLAIM_REWARD_PARAMS);

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

  // @ts-ignore
  const convertActiveStake = useMemo(() => {
    return activeStake.div(BN_TEN.pow(inputAsset?.decimals || 0)).multipliedBy(price);
  }, [activeStake, inputAsset?.decimals, price]);

  // @ts-ignore
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
      // todo: alert here

    }

    setUnStakeStorage({
      ...DEFAULT_UN_STAKE_PARAMS,
      slug: poolInfo.slug,
      chain: transactionChainValue,
      from: transactionFromValue
    });
    navigate('/transaction/unstake');
  }, [isActiveStakeZero, navigate, poolInfo.slug, setUnStakeStorage, transactionChainValue, transactionFromValue]);

  const onEarnMore = useCallback(() => {
    setEarnStorage({
      ...DEFAULT_EARN_PARAMS,
      slug: compound.slug,
      chain: transactionChainValue,
      from: transactionFromValue
    });
    navigate('/transaction/earn');
  }, [compound.slug, navigate, setEarnStorage, transactionChainValue, transactionFromValue]);

  const onWithDraw = useCallback(() => {
    setWithdrawStorage({
      ...DEFAULT_WITHDRAW_PARAMS,
      slug: poolInfo.slug,
      chain: transactionChainValue,
      from: transactionFromValue
    });
    navigate('/transaction/withdraw');
  }, [navigate, poolInfo.slug, setWithdrawStorage, transactionChainValue, transactionFromValue]);

  const onCancelWithDraw = useCallback(() => {
    setCancelUnStakeStorage({
      ...DEFAULT_CANCEL_UN_STAKE_PARAMS,
      slug: poolInfo.slug,
      chain: transactionChainValue,
      from: transactionFromValue
    });
    navigate('/transaction/cancel-unstake');
  }, [navigate, poolInfo.slug, setCancelUnStakeStorage, transactionChainValue, transactionFromValue]);

  const onClaimReward = useCallback(() => {
    setClaimRewardStorage({
      ...DEFAULT_CLAIM_REWARD_PARAMS,
      slug: compound.slug,
      chain: transactionChainValue,
      from: transactionFromValue
    });
    navigate('/transaction/claim-reward');
  }, [compound.slug, navigate, setClaimRewardStorage, transactionChainValue, transactionFromValue]);

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
    <Layout.Base
      className={'__screen-container'}
      onBack={onBack}
      showBackButton={true}
      showSubHeader={true}
      subHeaderBackground={'transparent'}
      subHeaderCenter={false}
      subHeaderIcons={subHeaderButtons}
      subHeaderPaddingVertical={true}
      title={t<string>('Earning position detail')}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Button
          block={true}
          onClick={onEarnMore}
        >
          Earn
        </Button>

        <Button
          block={true}
          onClick={onWithDraw}
        >
          Withdraw
        </Button>

        <Button
          block={true}
          onClick={onClaimReward}
        >
          Claim reward
        </Button>

        <Button
          block={true}
          onClick={onLeavePool}
        >
          Unearn
        </Button>

        <Button
          block={true}
          onClick={onCancelWithDraw}
        >
          Cancel withdraw
        </Button>
      </div>
    </Layout.Base>
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

}));

export default EarningPositionDetail;
