// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainStakingMetadata, NominatorMetadata, RequestStakeWithdrawal, StakingItem, StakingRewardItem } from '@subwallet/extension-base/background/KoniTypes';
import { getStakingAvailableActions, getWithdrawalInfo, isActionFromValidator, StakingAction } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { ALL_KEY } from '@subwallet/extension-koni-ui/constants/commont';
import useNotification from '@subwallet/extension-koni-ui/hooks/common/useNotification';
import { submitStakeClaimReward, submitStakeWithdrawal } from '@subwallet/extension-koni-ui/messaging';
import { GlobalToken } from '@subwallet/extension-koni-ui/themes';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { BackgroundIcon, ModalContext, SettingItem, SwModal } from '@subwallet/react-ui';
import { ArrowArcLeft, ArrowCircleDown, IconProps, MinusCircle, PlusCircle, Wallet } from 'phosphor-react';
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
  backgroundIconColor: keyof GlobalToken,
  icon: React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>,
  label: string,
  value: string,
  action: StakingAction
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

  const actionList: ActionListType[] = useMemo(() => {
    return [
      {
        backgroundIconColor: 'green-6',
        icon: PlusCircle,
        label: 'Stake more',
        value: `/transaction/stake/${chainStakingMetadata?.type || ALL_KEY}/${chainStakingMetadata?.chain || ALL_KEY}`,
        action: StakingAction.STAKE
      },
      {
        backgroundIconColor: 'magenta-6',
        icon: MinusCircle,
        label: 'Unstake funds',
        value: '/transaction/unstake',
        action: StakingAction.UNSTAKE
      },
      {
        backgroundIconColor: 'geekblue-6',
        icon: ArrowCircleDown,
        label: 'Withdraw',
        value: '/transaction/withdraw',
        action: StakingAction.WITHDRAW
      },
      {
        backgroundIconColor: 'green-7',
        icon: Wallet,
        label: 'Claim rewards',
        value: '/transaction/claim-reward',
        action: StakingAction.CLAIM_REWARD
      },
      {
        backgroundIconColor: 'purple-8',
        icon: ArrowArcLeft,
        label: 'Cancel unstake',
        value: '/transaction/cancel-unstake',
        action: StakingAction.CANCEL_UNSTAKE
      }
      // {
      //   backgroundIconColor: 'blue-7',
      //   icon: Alarm,
      //   label: 'Compound',
      //   value: '/transaction/compound'
      // }
    ];
  }, [chainStakingMetadata?.chain, chainStakingMetadata?.type]);

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

    if (isActionFromValidator(nominatorMetadata)) {
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

  const onPressItem = useCallback(
    (item: ActionListType) => {
      if (item.action === StakingAction.WITHDRAW) {
        return () => handleWithdrawalAction();
      } else if (item.action === StakingAction.CLAIM_REWARD) {
        return () => handleClaimRewardAction();
      }

      return () => navigate(item.value, { state: { chainStakingMetadata, nominatorMetadata, staking, reward, hideTabList: true } as StakingDataOption });
    },
    [chainStakingMetadata, handleClaimRewardAction, handleWithdrawalAction, navigate, nominatorMetadata, reward, staking]
  );

  const availableActions = useCallback(() => {
    if (!nominatorMetadata) {
      return [];
    }

    return getStakingAvailableActions(nominatorMetadata);
  }, [nominatorMetadata]);

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
          onPressItem={onPressItem(item)}
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
