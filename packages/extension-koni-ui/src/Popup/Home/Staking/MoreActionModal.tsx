// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainStakingMetadata, NominatorMetadata, RequestStakeWithdrawal, StakingItem, StakingRewardItem, StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { getStakingAvailableActionsByChain, getStakingAvailableActionsByNominator, getWithdrawalInfo, isActionFromValidator, StakingAction } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { ALL_KEY } from '@subwallet/extension-koni-ui/constants';
import { useHandleSubmitTransaction, usePreCheckReadOnly, useSelector } from '@subwallet/extension-koni-ui/hooks';
import { submitStakeClaimReward, submitStakeWithdrawal } from '@subwallet/extension-koni-ui/messaging';
import { GlobalToken } from '@subwallet/extension-koni-ui/themes';
import { PhosphorIcon, Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ActivityIndicator, BackgroundIcon, ModalContext, SettingItem, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowArcLeft, ArrowCircleDown, MinusCircle, PlusCircle, Wallet } from 'phosphor-react';
import React, { useCallback, useContext, useMemo, useState } from 'react';
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
}

const Component: React.FC<Props> = (props: Props) => {
  const { chainStakingMetadata, className, nominatorMetadata, reward } = props;

  const navigate = useNavigate();
  const { token } = useTheme() as Theme;
  const { t } = useTranslation();

  const { inactiveModal } = useContext(ModalContext);

  const { currentAccount, isAllAccount } = useSelector((state) => state.accountState);

  const [selected, setSelected] = useState<StakingAction | undefined>();

  const onCancel = useCallback(
    () => {
      inactiveModal(MORE_ACTION_MODAL);
    },
    [inactiveModal]
  );

  const onDoneTransaction = useCallback((extrinsicHash: string) => {
    if (chainStakingMetadata) {
      navigate(`/transaction-done/substrate/${chainStakingMetadata?.chain}/${extrinsicHash}`);
    }
  }, [chainStakingMetadata, navigate]);

  const { onError, onSuccess } = useHandleSubmitTransaction(onDoneTransaction);

  const handleWithdrawalAction = useCallback(() => {
    if (!nominatorMetadata) {
      setSelected(undefined);

      return;
    }

    if (isAllAccount) {
      setSelected(undefined);
      navigate(`/transaction/withdraw/${nominatorMetadata.type}/${nominatorMetadata.chain}`);

      return;
    }

    const unstakingInfo = getWithdrawalInfo(nominatorMetadata);

    if (!unstakingInfo) {
      setSelected(undefined);

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
      .then(onSuccess)
      .catch(onError)
      .finally(() => {
        setSelected(undefined);
      });
  }, [isAllAccount, navigate, nominatorMetadata, onError, onSuccess]);

  const handleClaimRewardAction = useCallback(() => {
    if (!nominatorMetadata) {
      setSelected(undefined);

      return;
    }

    if (nominatorMetadata.type === StakingType.POOLED) {
      setSelected(undefined);
      navigate(`/transaction/claim-reward/${nominatorMetadata.type}/${nominatorMetadata.chain}`);

      return;
    }

    submitStakeClaimReward({
      address: nominatorMetadata.address,
      chain: nominatorMetadata.chain,
      stakingType: nominatorMetadata.type,
      unclaimedReward: reward?.unclaimedReward
    })
      .then(onSuccess)
      .catch(onError)
      .finally(() => {
        setSelected(undefined);
      });
  }, [navigate, nominatorMetadata, onError, onSuccess, reward?.unclaimedReward]);

  const availableActions = useMemo(() => {
    if (!nominatorMetadata) {
      return [];
    }

    return getStakingAvailableActionsByNominator(nominatorMetadata);
  }, [nominatorMetadata]);

  const onNavigate = useCallback((url: string) => {
    return () => {
      setSelected(undefined);
      navigate(url);
    };
  }, [navigate]);

  const actionList: ActionListType[] = useMemo((): ActionListType[] => {
    if (!chainStakingMetadata) {
      return [];
    }

    const actionListByChain = getStakingAvailableActionsByChain(chainStakingMetadata.chain, chainStakingMetadata.type);

    return actionListByChain.map((action) => {
      if (action === StakingAction.UNSTAKE) {
        return {
          action: StakingAction.UNSTAKE,
          backgroundIconColor: 'magenta-6',
          icon: MinusCircle,
          label: 'Unstake funds',
          onClick: onNavigate(`/transaction/unstake/${chainStakingMetadata?.type || ALL_KEY}/${chainStakingMetadata?.chain || ALL_KEY}`)
        };
      } else if (action === StakingAction.WITHDRAW) {
        return {
          action: StakingAction.WITHDRAW,
          backgroundIconColor: 'geekblue-6',
          icon: ArrowCircleDown,
          label: 'Withdraw',
          onClick: handleWithdrawalAction
        };
      } else if (action === StakingAction.CLAIM_REWARD) {
        return {
          action: StakingAction.CLAIM_REWARD,
          backgroundIconColor: 'green-7',
          icon: Wallet,
          label: 'Claim rewards',
          onClick: handleClaimRewardAction
        };
      } else if (action === StakingAction.CANCEL_UNSTAKE) {
        return {
          action: StakingAction.CANCEL_UNSTAKE,
          backgroundIconColor: 'purple-8',
          icon: ArrowArcLeft,
          label: 'Cancel unstake',
          onClick: onNavigate(`/transaction/cancel-unstake/${chainStakingMetadata?.type || ALL_KEY}/${chainStakingMetadata?.chain || ALL_KEY}`)
        };
      }

      return {
        action: StakingAction.STAKE,
        backgroundIconColor: 'green-6',
        icon: PlusCircle,
        label: 'Stake more',
        onClick: onNavigate(`/transaction/stake/${chainStakingMetadata?.type || ALL_KEY}/${chainStakingMetadata?.chain || ALL_KEY}`)
      };
    });
  }, [chainStakingMetadata, handleClaimRewardAction, handleWithdrawalAction, onNavigate]);

  const onPreCheck = usePreCheckReadOnly(currentAccount?.address);
  const onClickItem = useCallback((action: StakingAction, onClick: () => void) => {
    const _onClick = () => {
      setSelected(action);
      onClick();
    };

    return () => {
      onPreCheck(_onClick)();
    };
  }, [onPreCheck]);

  return (
    <SwModal
      className={className}
      closable={true}
      id={MORE_ACTION_MODAL}
      maskClosable={true}
      onCancel={!selected ? onCancel : undefined}
      title={t('Actions')}
    >
      {actionList.map((item) => {
        const actionDisable = !availableActions.includes(item.action);
        const hasAnAction = !!selected;
        const isSelected = item.action === selected;
        const anotherDisable = hasAnAction && !isSelected;
        const disabled = actionDisable || anotherDisable;

        return (
          <SettingItem
            className={CN(
              'action-more-item',
              {
                disabled: disabled
              }
            )}
            key={item.label}
            leftItemIcon={(
              <BackgroundIcon
                backgroundColor={token[item.backgroundIconColor] as string}
                phosphorIcon={item.icon}
                size='sm'
                weight='fill'
              />
            )}
            name={item.label}
            onPressItem={disabled ? undefined : onClickItem(item.action, item.onClick)}
            rightItem={
              isSelected && (
                <div className='loading-icon'>
                  <ActivityIndicator />
                </div>
              )
            }
          />
        );
      })}
    </SwModal>
  );
};

const MoreActionModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.action-more-item:not(:last-child)': {
      marginBottom: token.marginXS
    },

    '.ant-web3-block-right-item': {
      marginRight: 0
    },

    '.disabled': {
      cursor: 'not-allowed',
      opacity: token.opacityDisable,

      '.ant-web3-block': {
        cursor: 'not-allowed'
      },

      '.ant-web3-block:hover': {
        cursor: 'not-allowed',
        background: token.colorBgSecondary
      }
    }
  };
});

export default MoreActionModal;
