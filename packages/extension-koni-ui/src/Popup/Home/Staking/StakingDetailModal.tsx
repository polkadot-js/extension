// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakingType } from '@subwallet/extension-base/background/KoniTypes';
import MetaInfo from '@subwallet/extension-koni-ui/components/MetaInfo';
import useGetAccountByAddress from '@subwallet/extension-koni-ui/hooks/account/useGetAccountByAddress';
import useGetStakingList from '@subwallet/extension-koni-ui/hooks/screen/staking/useGetStakingList';
import { MORE_ACTION_MODAL } from '@subwallet/extension-koni-ui/Popup/Home/Staking/MoreActionModal';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { StakingDataType } from '@subwallet/extension-koni-ui/types/staking';
import { Button, Icon, ModalContext, SwModal } from '@subwallet/react-ui';
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

  return (
    <SwModal
      className={className}
      footer={footer()}
      id={STAKING_DETAIL_MODAL_ID}
      // eslint-disable-next-line react/jsx-no-bind
      onCancel={() => inactiveModal(STAKING_DETAIL_MODAL_ID)}
      title={modalTitle}
    >
      <MetaInfo>
        <MetaInfo.Number
          decimals={decimals}
          label={t('Bonded fund')}
          suffix={staking.nativeToken}
          value={staking.balance || '0'}
        />

        <MetaInfo.Number
          decimals={decimals}
          label={t('Unlocking stake')}
          suffix={staking.nativeToken}
          value={staking.unlockingBalance || '0'}
        />

        {!!reward?.unclaimedReward && (
          <MetaInfo.Number
            decimals={decimals}
            label={t('Unclaimed reward')}
            suffix={staking.nativeToken}
            value={reward?.unclaimedReward || '0'}
          />
        )}

        {!!reward?.totalSlash && (
          <MetaInfo.Number
            decimals={decimals}
            label={t('Total slash')}
            suffix={staking.nativeToken}
            value={reward?.totalReward || '0'}
          />
        )}

        {!!reward?.latestReward && (
          <MetaInfo.Number
            decimals={decimals}
            label={t('Latest Reward')}
            suffix={staking.nativeToken}
            value={reward?.latestReward || '0'}
          />
        )}

        {!!reward?.totalReward && (
          <MetaInfo.Number
            decimals={decimals}
            label={t('Total reward')}
            suffix={staking.nativeToken}
            value={reward?.totalReward || '0'}
          />
        )}

        <MetaInfo.DisplayType
          label={t('Staking type')}
          typeName={stakingTypeNameMap[staking.type]}
        />

        <MetaInfo.Chain
          chain={staking.chain}
          chainName={staking.name}
          label={t('Network')}
        />

        <MetaInfo.Account
          address={staking.address}
          label={t('Account')}
          name={accountName?.name || ''}
        />

        {/* // TODO: change this when background update information */}
        <MetaInfo.Status
          label={stakingStatusLabel}
          statusIcon={CheckCircle}
          statusName={t('Earning Reward')}
          valueColorSchema={'success'}
        />

      </MetaInfo>
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
