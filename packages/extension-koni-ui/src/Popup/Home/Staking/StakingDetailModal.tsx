// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { AccountInfoItem, BalanceInfoItem, ChainInfoItem, DisplayTypeInfoItem, InfoItem, MetaInfoBlock } from '@subwallet/extension-koni-ui/components/MetaInfoBlock';
import { getBalanceValue } from '@subwallet/extension-koni-ui/hooks/screen/home/useAccountBalance';
import useGetStakingList from '@subwallet/extension-koni-ui/hooks/screen/staking/useGetStakingList';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { StakingDataType } from '@subwallet/extension-koni-ui/types/staking';
import { SwModal } from '@subwallet/react-ui';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps {
  chain?: string;
  stakingType?: StakingType;
}

export const STAKING_DETAIL_MODAL_ID = 'staking-detail-modal-id';

const Component: React.FC<Props> = (props: Props) => {
  const { chain, className, stakingType } = props;
  const { data: stakingData } = useGetStakingList();
  const data = useMemo((): StakingDataType => {
    return stakingData.find(
      (item) => item.staking.chain === chain && item.staking.type === stakingType
    ) as StakingDataType;
  }, [stakingData, chain, stakingType]);
  const { decimals, reward, staking } = data || { staking: {}, reward: {} };
  const { t } = useTranslation();
  const modalTitle = stakingType === StakingType.NOMINATED.valueOf() ? 'Nominate details' : 'Pooled details';

  const stakingTypeNameMap: Record<string, string> = {
    nominated: t('Nominated'),
    pooled: t('Pooled')
  };

  const genInfoItems = () => {
    const bondedFund: BalanceInfoItem = {
      type: 'balance',
      key: 'bonded_fund',
      label: t('Bonded fund'),
      balanceValue: getBalanceValue(staking.balance || '0', decimals),
      suffix: staking.nativeToken
    };

    const unlockingStake: BalanceInfoItem = {
      type: 'balance',
      key: 'unlocking_stake',
      label: t('Unlocking stake'),
      balanceValue: getBalanceValue(staking.unlockingBalance || '0', decimals),
      suffix: staking.nativeToken
    };

    const unclaimedReward: BalanceInfoItem = {
      type: 'balance',
      key: 'unclaimed_reward',
      label: t('Unclaimed reward'),
      balanceValue: getBalanceValue(reward?.unclaimedReward || '0', decimals),
      suffix: staking.nativeToken
    };

    const totalSlash: BalanceInfoItem = {
      type: 'balance',
      key: 'total_slash',
      label: t('Total slash'),
      balanceValue: getBalanceValue(reward?.totalReward || '0', decimals),
      suffix: staking.nativeToken
    };

    const latestReward: BalanceInfoItem = {
      type: 'balance',
      key: 'latest_reward',
      label: t('Total slash'),
      balanceValue: getBalanceValue(reward?.latestReward || '0', decimals),
      suffix: staking.nativeToken
    };

    const totalReward: BalanceInfoItem = {
      type: 'balance',
      key: 'total_reward',
      label: t('Total reward'),
      balanceValue: getBalanceValue(reward?.totalReward || '0', decimals),
      suffix: staking.nativeToken
    };

    const stakingType: DisplayTypeInfoItem = {
      type: 'display_type',
      key: 'staking_type',
      label: t('Staking type'),
      typeName: stakingTypeNameMap[staking.type]
    };

    const network: ChainInfoItem = {
      type: 'chain',
      key: 'network_info',
      label: t('Network'),
      chain: staking.chain,
      chainName: staking.name
    };
    const account: AccountInfoItem = {
      type: 'account',
      key: 'account_info',
      label: t('Account'),
      address: staking.address,
      name: 'name'
    };

    const result: InfoItem[] = [
      bondedFund,
      unlockingStake
    ];

    if (reward && reward.unclaimedReward) {
      result.push(unclaimedReward);
    }

    if (reward && reward.totalSlash) {
      result.push(totalSlash);
    }

    if (reward && reward.latestReward) {
      result.push(latestReward);
    }

    if (reward && reward.totalReward) {
      result.push(totalReward);
    }

    result.push(stakingType, network, account);

    return result;
  };

  return (
    <SwModal
      className={className}
      id={STAKING_DETAIL_MODAL_ID}
      title={modalTitle}
    >
      <MetaInfoBlock infoItems={genInfoItems()} />
    </SwModal>
  );
};

const StakingDetailModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.staking-type-info-field': {
      color: token.colorSecondary
    },

    '.network-info-field': {
      display: 'flex'
    }
  };
});

export default StakingDetailModal;
