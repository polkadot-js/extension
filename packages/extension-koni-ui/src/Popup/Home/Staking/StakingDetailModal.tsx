// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainStakingMetadata, NominationInfo, NominatorMetadata, StakingType, UnstakingInfo, UnstakingStatus } from '@subwallet/extension-base/background/KoniTypes';
import { isShowNominationByValidator } from '@subwallet/extension-koni-base/api/staking/bonding/utils';
import MetaInfo from '@subwallet/extension-koni-ui/components/MetaInfo';
import AccountItem from '@subwallet/extension-koni-ui/components/MetaInfo/parts/AccountItem';
import useGetAccountByAddress from '@subwallet/extension-koni-ui/hooks/account/useGetAccountByAddress';
import useGetStakingList from '@subwallet/extension-koni-ui/hooks/screen/staking/useGetStakingList';
import { MORE_ACTION_MODAL, StakingDataOption } from '@subwallet/extension-koni-ui/Popup/Home/Staking/MoreActionModal';
import { getUnstakingPeriod, getWaitingTime } from '@subwallet/extension-koni-ui/Popup/Transaction/helper/stakingHandler';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { StakingDataType } from '@subwallet/extension-koni-ui/types/staking';
import { toShort } from '@subwallet/extension-koni-ui/util';
import { Button, Icon, Number, SwModal } from '@subwallet/react-ui';
import { ModalContext } from '@subwallet/react-ui/es/sw-modal/provider';
import { ArrowCircleUpRight, CheckCircle, DotsThree } from 'phosphor-react';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

interface Props extends ThemeProps {
  nominatorMetadata: NominatorMetadata;
  chainStakingMetadata: ChainStakingMetadata;
}

export const STAKING_DETAIL_MODAL_ID = 'staking-detail-modal-id';

const getUnstakingInfo = (unstakings: UnstakingInfo[], address: string) => {
  return unstakings.find((item) => item.validatorAddress === address);
};

const Component: React.FC<Props> = ({ chainStakingMetadata, className, nominatorMetadata }: Props) => {
  const { expectedReturn, minStake, unstakingPeriod } = chainStakingMetadata;
  const { activeStake, address, chain, nominations, type, unstakings } = nominatorMetadata;
  const [seeMore, setSeeMore] = useState<boolean>(false);
  const { token } = useTheme() as Theme;
  const navigate = useNavigate();

  const showingOption = isShowNominationByValidator(chain);
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
  const onClickStakeMoreBtn = useCallback(() => {
    inactiveModal(STAKING_DETAIL_MODAL_ID);
    setTimeout(() => navigate('/transaction/stake', { state: { chainStakingMetadata, nominatorMetadata, hideTabList: true } as StakingDataOption }), 300);
  }, [chainStakingMetadata, inactiveModal, navigate, nominatorMetadata]);

  const onClickUnstakeBtn = useCallback(() => {
    inactiveModal(STAKING_DETAIL_MODAL_ID);
    setTimeout(() => navigate('/transaction/unstake'), 300);
  }, [inactiveModal, navigate]);

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
          onClick={onClickUnstakeBtn}
          schema='secondary'
        >{t('Unstake')}</Button>
        <Button
          className='__action-btn'
          onClick={onClickStakeMoreBtn}
        >{t('Stake more')}</Button>
      </div>
    );
  };

  const onClickSeeMoreBtn = useCallback(() => {
    setSeeMore(true);
  }, []);

  const onCloseModal = useCallback(() => {
    setSeeMore(false);
    inactiveModal(STAKING_DETAIL_MODAL_ID);
  }, [inactiveModal]);

  const renderUnstakingInfo = useCallback((item: NominationInfo) => {
    const unstakingData = getUnstakingInfo(unstakings, item.validatorAddress);

    return (
      <MetaInfo
        hasBackgroundWrapper
        key={item.validatorAddress}
        spaceSize={'sm'}
        valueColorScheme={'light'}
      >
        <MetaInfo.Account
          address={item.validatorAddress}
          label={t('Validator')}
          name={item.validatorIdentity || toShort(item.validatorAddress)}
        />

        <MetaInfo.Number
          decimals={decimals}
          key={item.validatorAddress}
          label={t('Active stake')}
          suffix={staking.nativeToken}
          value={item.activeStake || ''}
          valueColorSchema={'gray'}
        />

        <MetaInfo.Status
          label={t('Staking status')}
          statusIcon={CheckCircle}
          statusName={t('Earning reward')}
          valueColorSchema={'success'}
        />

        {!!unstakingData && showingOption === 'showByValidator' && <MetaInfo.Default
          className={'__para'}
          label={t('Unstaked')}
          labelAlign={unstakingData.status === UnstakingStatus.UNLOCKING.valueOf() ? 'top' : 'center'}
        >
          <div>
            <Number
              className={'common-text text-light-4'}
              decimal={decimals}
              suffix={staking.nativeToken}
              value={unstakingData.claimable}
            />

            {/* chi hien thi waiting time khi UnstakingStatus = unlocking, neu waitingTime = 0 && UnstakingStatus = unlocking => soon */}
            {unstakingData.status === UnstakingStatus.UNLOCKING.valueOf() &&
              <Number
                className={'sm-text text-light-4'}
                decimal={0}
                value={getWaitingTime(unstakingData.waitingTime)}
              />
            }
          </div>
        </MetaInfo.Default>}
      </MetaInfo>
    );
  }, [decimals, showingOption, staking.nativeToken, t, unstakings]);

  return (
    <SwModal
      className={className}
      closable={true}
      footer={footer()}
      maskClosable={true}
      id={STAKING_DETAIL_MODAL_ID}
      onCancel={onCloseModal}
      title={modalTitle}
    >
      <MetaInfo>
        <MetaInfo.Account
          address={address}
          label={t('Account')}
          name={account?.name}
        />

        <MetaInfo.DisplayType
          label={t('Staking type')}
          typeName={stakingTypeNameMap[staking.type]}
        />

        <MetaInfo.Status
          label={t('Nomination')}
          statusIcon={CheckCircle}
          statusName={t('Earning reward')}
          valueColorSchema={'success'}
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

        {!seeMore && <MetaInfo.Number
          decimals={decimals}
          label={t('Active staked')}
          suffix={staking.nativeToken}
          value={activeStake}
        />}

        {!seeMore && <MetaInfo.Number
          decimals={decimals}
          label={t('Unstaked')}
          suffix={staking.nativeToken}
          value={staking.unlockingBalance || '0'}
        />}

        <MetaInfo.Chain
          chain={staking.chain}
          chainName={staking.name}
          label={t('Network')}
        />
      </MetaInfo>

      {!seeMore && <Button
        block
        className={'see-more-btn'}
        icon={<Icon
          iconColor={token.colorTextLight4}
          phosphorIcon={ArrowCircleUpRight}
          size={'sm'}
        />}
        onClick={onClickSeeMoreBtn}
        size={'xs'}
        type={'ghost'}
      >
        {t('See more')}
      </Button>}

      {seeMore && <>
        <MetaInfo
          hasBackgroundWrapper
          spaceSize={'xs'}
          valueColorScheme={'light'}
        >
          {!!expectedReturn &&
            <MetaInfo.Number
              label={t('Estimated earning')}
              suffix={'%'}
              value={expectedReturn}
              valueColorSchema={'even-odd'}
            />
          }

          <MetaInfo.Number
            decimals={decimals}
            label={t('Minimum active')}
            suffix={staking.nativeToken}
            value={minStake}
            valueColorSchema={'gray'}
          />

          {!!unstakingPeriod && <MetaInfo.Default
            label={t('Unstaking period')}
            valueColorSchema={'gray'}
          >
            {getUnstakingPeriod(unstakingPeriod)}
          </MetaInfo.Default>}
        </MetaInfo>

        {showingOption === 'showByValue' && !!(nominations && nominations.length) && (
          <>
            <MetaInfo valueColorScheme={'light'}>
              <MetaInfo.Number
                decimals={decimals}
                label={t('Active staked')}
                suffix={staking.nativeToken}
                value={activeStake}
              />
            </MetaInfo>
            <MetaInfo
              hasBackgroundWrapper
              spaceSize={'xs'}
              valueColorScheme={'light'}
            >
              <>
                {nominations.map((item) => (
                  <MetaInfo.Number
                    className={'__nomination-field'}
                    decimals={decimals}
                    key={item.validatorAddress}
                    label={<AccountItem
                      address={item.validatorAddress}
                      className={'__nomination-label'}
                      name={item.validatorIdentity}
                    />}
                    suffix={staking.nativeToken}
                    value={item.activeStake || ''}
                    valueColorSchema={'gray'}
                  />
                ))}
              </>
            </MetaInfo>
          </>
        )}

        {(showingOption === 'showByValue' || showingOption === 'mixed') && !!(unstakings && unstakings.length) && (
          <>
            <MetaInfo valueColorScheme={'light'}>
              <MetaInfo.Number
                decimals={decimals}
                label={t('Unstaked')}
                suffix={staking.nativeToken}
                value={staking.unlockingBalance || '0'}
              />
            </MetaInfo>
            <MetaInfo
              hasBackgroundWrapper
              spaceSize={'xs'}
              valueColorScheme={'light'}
            >
              <>
                {unstakings.map((item) => (
                  <MetaInfo.Number
                    decimals={decimals}
                    key={item.validatorAddress}
                    label={getWaitingTime(item.waitingTime) ? t(getWaitingTime(item.waitingTime)) : t('Withdraw')}
                    suffix={staking.nativeToken}
                    value={item.claimable || ''}
                    valueColorSchema={'gray'}
                  />
                ))}
              </>
            </MetaInfo>
          </>
        )}

        {(showingOption === 'showByValidator' || showingOption === 'mixed') &&
          <>
            {nominations && nominations.length && nominations.map((item) => (
              renderUnstakingInfo(item)
            ))}
          </>
        }
      </>}
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
    },

    '.__nomination-field': {
      '> .__col': {
        overflow: 'hidden'
      }
    },

    '.__nomination-label > .__col.-to-right': {
      flex: 'initial',
      overflow: 'hidden',
      alignItems: 'flex-start',

      '.__account-item': {
        width: '100%'
      },

      '.__account-name': {
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap'
      }
    },

    '.see-more-btn': {
      marginTop: token.margin
    },

    '.ant-sw-modal-body': {
      paddingBottom: 0
    },

    '.ant-sw-modal-footer': {
      border: 'none'
    }
  };
});

export default StakingDetailModal;
