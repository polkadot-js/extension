// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainStakingMetadata, NominatorMetadata, RequestStakeWithdrawal, StakingItem, StakingRewardItem } from '@subwallet/extension-base/background/KoniTypes';
import { getStakingAvailableActions, getWithdrawalInfo, isActionFromValidator, StakingAction } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { ALL_KEY } from '@subwallet/extension-koni-ui/constants/commont';
import useNotification from '@subwallet/extension-koni-ui/hooks/common/useNotification';
import { submitStakeClaimReward, submitStakeWithdrawal } from '@subwallet/extension-koni-ui/messaging';
import { GlobalToken } from '@subwallet/extension-koni-ui/themes';
import { PhosphorIcon, Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { BackgroundIcon, ModalContext, SettingItem, SwModal } from '@subwallet/react-ui';
import { ArrowArcLeft, ArrowCircleDown, MinusCircle, PlusCircle, Wallet } from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps & {
  staking?: StakingItem;
  reward?: StakingRewardItem;
  chainStakingMetadata?: ChainStakingMetadata;
  nominatorMetadata?: NominatorMetadata;
}

export const MORE_ACTION_MODAL = 'more-action-modal';

type ActionListType = {
  backgroundIconColor: keyof GlobalToken;
  icon: PhosphorIcon;
  label: string;
  action: StakingAction;
  onClick: () => void;
  disabled: boolean;
}

export type StakingDataOption = {
  staking?: StakingItem;
  reward?: StakingRewardItem;
  chainStakingMetadata?: ChainStakingMetadata,
  nominatorMetadata?: NominatorMetadata,
  hideTabList?: boolean
}

const Component: React.FC<Props> = (props: Props) => {
  const { chainStakingMetadata, className, nominatorMetadata, reward, staking } = props;
  const { inactiveModal } = useContext(ModalContext);
  const navigate = useNavigate();
  const { token } = useTheme() as Theme;
  const { t } = useTranslation();
  const notify = useNotification();

  const onCancel = useCallback(
    () => {
      inactiveModal(MORE_ACTION_MODAL);
    },
    [inactiveModal]
  );

  const handleWithdrawalAction = useCallback(() => {
    if (!nominatorMetadata) {
      return;
    }

    const unstakingInfo = getWithdrawalInfo(nominatorMetadata);

    if (!unstakingInfo) {
      return;
    }

    const params: RequestStakeWithdrawal = {
      unstakingInfo,
      chain: nominatorMetadata.chain,
      nominatorMetadata
    };

    if (isActionFromValidator(nominatorMetadata.type, nominatorMetadata.chain)) {
      params.validatorAddress = unstakingInfo.validatorAddress;
    }

    submitStakeWithdrawal(params)
      .then((result) => {
        const { errors, extrinsicHash, warnings } = result;

        if (errors.length || warnings.length) {
          notify({
            message: t('Error')
          });
          // setErrors(errors.map((e) => e.message));
          // setWarnings(warnings.map((w) => w.message));
        } else if (extrinsicHash) {
          console.log('all good');
        }
      })
      .catch((e: Error) => {
        notify({
          message: t('Error')
        });
      });
  }, [nominatorMetadata, notify, t]);

  const handleClaimRewardAction = useCallback(() => {
    if (!nominatorMetadata) {
      return;
    }

    submitStakeClaimReward({
      address: nominatorMetadata.address,
      chain: nominatorMetadata.chain,
      stakingType: nominatorMetadata.type,
      unclaimedReward: reward?.unclaimedReward
    })
      .then((result) => {
        const { errors, extrinsicHash, warnings } = result;

        if (errors.length || warnings.length) {
          notify({
            message: t('Error')
          });
          // setErrors(errors.map((e) => e.message));
          // setWarnings(warnings.map((w) => w.message));
        } else if (extrinsicHash) {
          console.log('all good');
        }
      })
      .catch((e: Error) => {
        notify({
          message: t('Error')
        });
      });
  }, [nominatorMetadata, notify, reward?.unclaimedReward, t]);

  const availableActions = useCallback(() => {
    if (!nominatorMetadata) {
      return [];
    }

    return getStakingAvailableActions(nominatorMetadata);
  }, [nominatorMetadata]);

  const onNavigate = useCallback((url: string) => {
    return () => {
      // TODO: Remove state
      navigate(url, { state: { chainStakingMetadata, nominatorMetadata, staking, reward, hideTabList: true } as StakingDataOption });
    };
  }, [chainStakingMetadata, navigate, nominatorMetadata, reward, staking]);

  const actionList: ActionListType[] = useMemo((): ActionListType[] => {
    return [
      {
        action: StakingAction.STAKE,
        backgroundIconColor: 'green-6',
        disabled: false,
        icon: PlusCircle,
        label: 'Stake more',
        onClick: onNavigate(`/transaction/stake/${chainStakingMetadata?.type || ALL_KEY}/${chainStakingMetadata?.chain || ALL_KEY}`)
      },
      {
        action: StakingAction.UNSTAKE,
        backgroundIconColor: 'magenta-6',
        disabled: !nominatorMetadata,
        icon: MinusCircle,
        label: 'Unstake funds',
        onClick: onNavigate(`/transaction/unstake/${chainStakingMetadata?.type || ALL_KEY}/${chainStakingMetadata?.chain || ALL_KEY}`)
      },
      {
        action: StakingAction.WITHDRAW,
        backgroundIconColor: 'geekblue-6',
        disabled: !nominatorMetadata,
        icon: ArrowCircleDown,
        label: 'Withdraw',
        onClick: handleWithdrawalAction
      },
      {
        action: StakingAction.CLAIM_REWARD,
        backgroundIconColor: 'green-7',
        disabled: !nominatorMetadata,
        icon: Wallet,
        label: 'Claim rewards',
        onClick: handleClaimRewardAction
      },
      {
        action: StakingAction.CANCEL_UNSTAKE,
        backgroundIconColor: 'purple-8',
        disabled: false,
        icon: ArrowArcLeft,
        label: 'Cancel unstake',
        onClick: onNavigate('/transaction/cancel-unstake')
      }
      // {
      //   backgroundIconColor: 'blue-7',
      //   icon: Alarm,
      //   label: 'Compound',
      //   value: '/transaction/compound'
      // }
    ];
  }, [chainStakingMetadata?.chain, chainStakingMetadata?.type, handleClaimRewardAction, handleWithdrawalAction, nominatorMetadata, onNavigate]);

  return (
    <SwModal
      className={className}
      closable={true}
      id={MORE_ACTION_MODAL}
      maskClosable={true}
      onCancel={onCancel}
      title={t('Actions')}
    >
      {actionList.map((item) => (
        <SettingItem
          className={`action-more-item ${availableActions().includes(item.action) ? '' : 'disabled'}`}
          key={item.label}
          leftItemIcon={<BackgroundIcon
            backgroundColor={token[item.backgroundIconColor] as string}
            phosphorIcon={item.icon}
            size={'sm'}
            weight='fill'
          />}
          name={item.label}
          onPressItem={item.onClick}
        />
      ))}
    </SwModal>
  );
};

const MoreActionModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.action-more-item:not(:last-child)': {
      marginBottom: token.marginXS
    },

    '.disabled': {
      cursor: 'not-allowed'
    }
  };
});

export default MoreActionModal;
