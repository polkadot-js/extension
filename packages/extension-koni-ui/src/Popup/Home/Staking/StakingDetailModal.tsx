// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainStakingMetadata, NominatorMetadata, StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { _isSubstrateRelayChain } from '@subwallet/extension-base/services/chain-service/utils';
import MetaInfo from '@subwallet/extension-koni-ui/components/MetaInfo';
import useGetAccountByAddress from '@subwallet/extension-koni-ui/hooks/account/useGetAccountByAddress';
import useGetStakingList from '@subwallet/extension-koni-ui/hooks/screen/staking/useGetStakingList';
import { MORE_ACTION_MODAL } from '@subwallet/extension-koni-ui/Popup/Home/Staking/MoreActionModal';
import { getUnstakingPeriod } from '@subwallet/extension-koni-ui/Popup/Transaction/helper/stakingHandler';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { StakingDataType } from '@subwallet/extension-koni-ui/types/staking';
import { toShort } from '@subwallet/extension-koni-ui/util';
import { Button, Icon, Number, SwModal } from '@subwallet/react-ui';
import { ModalContext } from '@subwallet/react-ui/es/sw-modal/provider';
import { CheckCircle, DotsThree } from 'phosphor-react';
import React, { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

interface Props extends ThemeProps {
  nominatorMetadata: NominatorMetadata;
  chainStakingMetadata: ChainStakingMetadata;
}

export const STAKING_DETAIL_MODAL_ID = 'staking-detail-modal-id';

const Component: React.FC<Props> = (props: Props) => {
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);
  const { chainStakingMetadata, className, nominatorMetadata } = props;
  const { expectedReturn, inflation, minStake, unstakingPeriod } = chainStakingMetadata;
  const { activeStake, address, chain, nominations, type, unstakings } = nominatorMetadata;
  const chainInfo = chainInfoMap[chain];
  const isSubstrateRelayChain = _isSubstrateRelayChain(chainInfo);
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const { data: stakingData } = useGetStakingList();
  const data = useMemo((): StakingDataType => {
    return stakingData.find(
      (item) => item.staking.chain === chain && item.staking.type === type
    ) as StakingDataType;
  }, [stakingData, chain, type]);
  const { decimals, reward, staking } = data || { staking: {}, reward: {} };
  const { t } = useTranslation();
  const modalTitle = type === StakingType.NOMINATED.valueOf() ? 'Nominate details' : 'Pooled details';
  const account = useGetAccountByAddress(staking.address);
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
        <MetaInfo.Account
          address={address}
          label={t('Account')}
          name={account?.name}
        />

        <MetaInfo.Status
          label={t('Nomination')}
          statusIcon={CheckCircle}
          statusName={t('Earning reward')}
          valueColorSchema={'success'}
        />

        <MetaInfo.DisplayType
          label={t('Staking type')}
          typeName={stakingTypeNameMap[staking.type]}
        />

        {!!reward?.totalReward && (
          <MetaInfo.Number
            decimals={decimals}
            label={t('Total reward')}
            suffix={staking.nativeToken}
            value={reward?.totalReward || '0'}
          />
        )}

        <MetaInfo.Number
          decimals={decimals}
          label={t('Staked')}
          suffix={staking.nativeToken}
          value={String(parseFloat(activeStake) + parseFloat(staking.unlockingBalance || '0'))}
        />

        <MetaInfo.Number
          decimals={decimals}
          label={t('Active staked')}
          suffix={staking.nativeToken}
          value={activeStake}
        />

        <MetaInfo.Number
          decimals={decimals}
          label={t('Unstaked')}
          suffix={staking.nativeToken}
          value={staking.unlockingBalance || '0'}
        />

        <MetaInfo.Chain
          chain={staking.chain}
          chainName={staking.name}
          label={t('Network')}
        />
      </MetaInfo>

      <MetaInfo
        hasBackgroundWrapper
        spaceSize={'xs'}
        valueColorScheme={'light'}
      >
        {!!expectedReturn && !!inflation &&
          <MetaInfo.Default label={t('Estimated earning')}>
            <div className={'__active-nominators-value'}>
              <Number
                className={'__expected-return'}
                decimal={0}
                decimalOpacity={1}
                intOpacity={1}
                suffix={'%'}
                unitOpacity={1}
                value={expectedReturn}
              />
              <span className={'__slash'}>/</span>
              <Number
                className={'__inflation'}
                decimal={0}
                decimalOpacity={1}
                intOpacity={1}
                suffix={'%'}
                unitOpacity={1}
                value={inflation}
              />
              <span className={'__inflation-text'}>{t('after inflation')}</span>
            </div>
          </MetaInfo.Default>
        }

        <MetaInfo.Number
          decimals={decimals}
          label={t('Minimum active')}
          suffix={staking.nativeToken}
          value={minStake}
          valueColorSchema={'even-odd'}
        />

        {!!unstakingPeriod && <MetaInfo.Default label={t('Unstaking period')}>
          {!!getUnstakingPeriod(unstakingPeriod) && getUnstakingPeriod(unstakingPeriod)}
        </MetaInfo.Default>}
      </MetaInfo>

      {isSubstrateRelayChain && <MetaInfo
        hasBackgroundWrapper
        spaceSize={'xs'}
        valueColorScheme={'light'}
      >
        <>
          {nominations && nominations.length && nominations.map((item) => (
            <MetaInfo.Number
              decimals={decimals}
              key={item.validatorAddress}
              label={item.validatorIdentity || toShort(item.validatorAddress)}
              suffix={staking.nativeToken}
              value={item.activeStake || ''}
            />
          ))}
        </>
      </MetaInfo>}

      {!isSubstrateRelayChain &&
        <>
          {unstakings.map((item) => (
            <MetaInfo
              hasBackgroundWrapper
              key={item.validatorAddress}
              spaceSize={'sm'}
              valueColorScheme={'light'}
            >
              <MetaInfo.Status
                label={t('Staking status')}
                statusIcon={CheckCircle}
                statusName={t('Earning reward')}
              />

              <MetaInfo.Default className={'__para'} label={t('Unstaked')}>
                <div>
                  <Number
                    className={'common-text text-light-4'}
                    decimal={decimals}
                    suffix={staking.nativeToken}
                    value={item.claimable}
                  />

                  {!!getUnstakingPeriod(item.waitingTime) &&
                    <Number
                      className={'sm-text text-light-4'}
                      decimal={0}
                      suffix={'next days'}
                      value={getUnstakingPeriod(item.waitingTime)}
                    />
                  }
                </div>
              </MetaInfo.Default>
            </MetaInfo>
          ))

          }
        </>
      }
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
    },

    '.__slash': {
      marginLeft: token.marginXXS,
      marginRight: token.marginXXS
    },

    '.__inflation-text': {
      marginLeft: token.marginXXS,
      color: token.colorTextLight4
    },

    '.__expected-return, .__inflation': {
      display: 'inline-flex'
    },

    '.__inflation': {
      color: token.colorTextLight4
    }
  };
});

export default StakingDetailModal;
