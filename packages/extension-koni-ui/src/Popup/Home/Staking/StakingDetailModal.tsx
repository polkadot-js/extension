// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { AccountInfoItem, BalanceInfoItem, ChainInfoItem, DisplayTypeInfoItem, InfoItem, MetaInfoBlock, StatusInfoItem } from '@subwallet/extension-koni-ui/components/MetaInfoBlock';
import useGetAccountByAddress from '@subwallet/extension-koni-ui/hooks/account/useGetAccountByAddress';
import { getBalanceValue } from '@subwallet/extension-koni-ui/hooks/screen/home/useAccountBalance';
import useGetStakingList from '@subwallet/extension-koni-ui/hooks/screen/staking/useGetStakingList';
import { MORE_ACTION_MODAL } from '@subwallet/extension-koni-ui/Popup/Home/Staking/MoreActionModal';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { StakingDataType } from '@subwallet/extension-koni-ui/types/staking';
import { Button, Icon, SwModal } from '@subwallet/react-ui';
import { ModalContext } from '@subwallet/react-ui/es/sw-modal/provider';
import { CheckCircle, DotsThree } from 'phosphor-react';
import React, { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps {
  chain?: string;
  stakingType?: StakingType;
}

export const STAKING_DETAIL_MODAL_ID = 'staking-detail-modal-id';

const Component: React.FC<Props> = (props: Props) => {
  const { chain, className, stakingType } = props;
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const { data: stakingData } = useGetStakingList();
  const data = useMemo((): StakingDataType => {
    return stakingData.find(
      (item) => item.staking.chain === chain && item.staking.type === stakingType
    ) as StakingDataType;
  }, [stakingData, chain, stakingType]);
  const { decimals, reward, staking } = data || { staking: {}, reward: {} };
  const { t } = useTranslation();
  const modalTitle = stakingType === StakingType.NOMINATED.valueOf() ? 'Nominate details' : 'Pooled details';
  const stakingStatusLabel = stakingType === StakingType.NOMINATED.valueOf() ? 'Nominate status' : 'Pooled status';
  const accountName = useGetAccountByAddress(staking.address);

  const stakingTypeNameMap: Record<string, string> = {
    nominated: t('Nominated'),
    pooled: t('Pooled')
  };

  const footer = () => {
    return (
      <div className='staking-detail-modal-footer'>
        <Button
          icon={<Icon phosphorIcon={DotsThree} />}
          // eslint-disable-next-line react/jsx-no-bind
          onClick={() => activeModal(MORE_ACTION_MODAL)}
          schema='secondary'
        />
        <Button
          className='__action-btn'
          schema='secondary'
        >{t('Unstake')}</Button>
        <Button className='__action-btn'>{t('Stake more')}</Button>
      </div>
    );
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
      name: accountName?.name || ''
    };

    // TODO: change this when background update information
    const stakingStatus: StatusInfoItem = {
      type: 'status',
      key: 'staking_status',
      label: stakingStatusLabel,
      valueColorSchema: 'success',
      statusName: t('Earning Reward'),
      statusIcon: CheckCircle
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

    result.push(stakingType, network, account, stakingStatus);

    return result;
  };

  return (
    <SwModal
      className={className}
      footer={footer()}
      id={STAKING_DETAIL_MODAL_ID}
      // eslint-disable-next-line react/jsx-no-bind
      onCancel={() => inactiveModal(STAKING_DETAIL_MODAL_ID)}
      title={modalTitle}
    >
      <MetaInfoBlock infoItems={genInfoItems()} />
    </SwModal>
  );
};

const StakingDetailModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.staking-detail-modal-footer': {
      display: 'flex',
      alignItems: 'center'
    },

    '.__action-btn': {
      flex: 1
    }
  };
});

export default StakingDetailModal;
