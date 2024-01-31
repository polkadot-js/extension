// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainStakingMetadata, ExtrinsicType, NominatorMetadata, RequestStakeWithdrawal, StakingItem, StakingRewardItem, StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { getStakingAvailableActionsByChain, getStakingAvailableActionsByNominator, getWithdrawalInfo, isActionFromValidator, StakingAction } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/chain-service/constants';
import { CANCEL_UN_STAKE_TRANSACTION, CLAIM_REWARD_TRANSACTION, DEFAULT_CANCEL_UN_STAKE_PARAMS, DEFAULT_CLAIM_REWARD_PARAMS, DEFAULT_STAKE_PARAMS, DEFAULT_UN_STAKE_PARAMS, DEFAULT_WITHDRAW_PARAMS, STAKE_TRANSACTION, UN_STAKE_TRANSACTION, WITHDRAW_TRANSACTION } from '@subwallet/extension-koni-ui/constants';
import { useHandleSubmitTransaction, usePreCheckAction, useSelector } from '@subwallet/extension-koni-ui/hooks';
import { submitStakeClaimReward, submitStakeWithdrawal } from '@subwallet/extension-koni-ui/messaging';
import { GlobalToken } from '@subwallet/extension-koni-ui/themes';
import { PhosphorIcon, Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isAccountAll } from '@subwallet/extension-koni-ui/utils';
import { ActivityIndicator, BackgroundIcon, ModalContext, SettingItem, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowArcLeft, ArrowCircleDown, MinusCircle, PlusCircle, Wallet } from 'phosphor-react';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

type Props = ThemeProps & {
  staking: StakingItem;
  reward?: StakingRewardItem;
  chainStakingMetadata: ChainStakingMetadata;
  nominatorMetadata: NominatorMetadata;
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
  const [, setStakeStorage] = useLocalStorage(STAKE_TRANSACTION, DEFAULT_STAKE_PARAMS);
  const [, setUnStakeStorage] = useLocalStorage(UN_STAKE_TRANSACTION, DEFAULT_UN_STAKE_PARAMS);
  const [, setCancelUnStakeStorage] = useLocalStorage(CANCEL_UN_STAKE_TRANSACTION, DEFAULT_CANCEL_UN_STAKE_PARAMS);
  const [, setWithdrawStorage] = useLocalStorage(WITHDRAW_TRANSACTION, DEFAULT_WITHDRAW_PARAMS);
  const [, setClaimRewardStorage] = useLocalStorage(CLAIM_REWARD_TRANSACTION, DEFAULT_CLAIM_REWARD_PARAMS);

  const onCancel = useCallback(
    () => {
      inactiveModal(MORE_ACTION_MODAL);
    },
    [inactiveModal]
  );

  const onDoneTransaction = useCallback((extrinsicHash: string) => {
    if (nominatorMetadata) {
      navigate(`/transaction-done/${nominatorMetadata.address}/${nominatorMetadata.chain}/${extrinsicHash}`);
    }
  }, [navigate, nominatorMetadata]);

  const { onError, onSuccess } = useHandleSubmitTransaction(onDoneTransaction);

  const handleWithdrawalAction = useCallback(() => {
    if (!nominatorMetadata) {
      setSelected(undefined);

      return;
    }

    if (isAllAccount) {
      setSelected(undefined);

      setWithdrawStorage({
        ...DEFAULT_WITHDRAW_PARAMS,
        type: nominatorMetadata.type,
        chain: nominatorMetadata.chain
      });

      navigate('/transaction/withdraw');

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
  }, [isAllAccount, navigate, nominatorMetadata, onError, onSuccess, setWithdrawStorage]);

  const handleClaimRewardAction = useCallback(() => {
    if (!nominatorMetadata) {
      setSelected(undefined);

      return;
    }

    if (nominatorMetadata.type === StakingType.POOLED || isAllAccount) {
      setSelected(undefined);
      const address = currentAccount ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : '';

      setClaimRewardStorage({
        ...DEFAULT_CLAIM_REWARD_PARAMS,
        from: address,
        type: nominatorMetadata.type,
        chain: nominatorMetadata.chain
      });
      navigate('/transaction/claim-reward');

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
  }, [currentAccount, isAllAccount, navigate, nominatorMetadata, onError, onSuccess, reward?.unclaimedReward, setClaimRewardStorage]);

  const availableActions = useMemo(() => {
    if (!nominatorMetadata) {
      return [];
    }

    return getStakingAvailableActionsByNominator(nominatorMetadata, reward?.unclaimedReward);
  }, [nominatorMetadata, reward?.unclaimedReward]);

  const onNavigate = useCallback((url: string) => {
    return () => {
      setSelected(undefined);
      navigate(url);
    };
  }, [navigate]);

  const isDappStaking = useMemo(() => {
    return _STAKING_CHAIN_GROUP.astar.includes(nominatorMetadata.chain);
  }, [nominatorMetadata.chain]);

  const actionList: ActionListType[] = useMemo((): ActionListType[] => {
    if (!chainStakingMetadata) {
      return [];
    }

    const actionListByChain = getStakingAvailableActionsByChain(chainStakingMetadata.chain, chainStakingMetadata.type);
    const address = currentAccount ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : '';

    return actionListByChain.map((action) => {
      if (action === StakingAction.UNSTAKE) {
        return {
          action: StakingAction.UNSTAKE,
          backgroundIconColor: 'magenta-6',
          icon: MinusCircle,
          label: t('Unstake'),
          onClick: () => {
            setUnStakeStorage({
              ...DEFAULT_UN_STAKE_PARAMS,
              from: address,
              type: chainStakingMetadata.type,
              chain: chainStakingMetadata.chain
            });
            onNavigate('/transaction/unstake')();
          }
        };
      } else if (action === StakingAction.WITHDRAW) {
        return {
          action: StakingAction.WITHDRAW,
          backgroundIconColor: 'geekblue-6',
          icon: ArrowCircleDown,
          label: t('Withdraw unstaked funds'),
          onClick: handleWithdrawalAction
        };
      } else if (action === StakingAction.CLAIM_REWARD) {
        return {
          action: StakingAction.CLAIM_REWARD,
          backgroundIconColor: 'green-7',
          icon: Wallet,
          label: !isDappStaking ? t('Claim rewards') : t('Check rewards'),
          onClick: isDappStaking ? () => window.open('https://portal.astar.network/astar/dapp-staking/discover') : handleClaimRewardAction
        };
      } else if (action === StakingAction.CANCEL_UNSTAKE) {
        return {
          action: StakingAction.CANCEL_UNSTAKE,
          backgroundIconColor: 'purple-8',
          icon: ArrowArcLeft,
          label: t('Cancel unstaking'),
          onClick: () => {
            setCancelUnStakeStorage({
              ...DEFAULT_CANCEL_UN_STAKE_PARAMS,
              from: address,
              type: chainStakingMetadata.type,
              chain: chainStakingMetadata.chain
            });
            onNavigate('/transaction/cancel-unstake')();
          }
        };
      }

      return {
        action: StakingAction.STAKE,
        backgroundIconColor: 'green-6',
        icon: PlusCircle,
        label: t('Stake more'),
        onClick: () => {
          setStakeStorage({
            ...DEFAULT_STAKE_PARAMS,
            from: address,
            defaultChain: chainStakingMetadata.chain,
            defaultType: chainStakingMetadata.type,
            type: chainStakingMetadata.type,
            chain: chainStakingMetadata.chain
          });
          onNavigate('/transaction/stake')();
        }
      };
    });
  }, [chainStakingMetadata, currentAccount, handleClaimRewardAction, handleWithdrawalAction, isDappStaking, onNavigate, setCancelUnStakeStorage, setStakeStorage, setUnStakeStorage, t]);

  const onPreCheck = usePreCheckAction(currentAccount?.address, false);

  const convertStakingActionToExtrinsicType = useCallback((action: StakingAction): ExtrinsicType => {
    const isPool = nominatorMetadata?.type === StakingType.POOLED;

    switch (action) {
      case StakingAction.STAKE:
        return isPool ? ExtrinsicType.STAKING_BOND : ExtrinsicType.STAKING_JOIN_POOL;
      case StakingAction.UNSTAKE:
        return isPool ? ExtrinsicType.STAKING_UNBOND : ExtrinsicType.STAKING_LEAVE_POOL;
      case StakingAction.WITHDRAW:
        return isPool ? ExtrinsicType.STAKING_WITHDRAW : ExtrinsicType.STAKING_POOL_WITHDRAW;
      case StakingAction.CLAIM_REWARD:
        return ExtrinsicType.STAKING_CLAIM_REWARD;
      case StakingAction.CANCEL_UNSTAKE:
        return ExtrinsicType.STAKING_CANCEL_UNSTAKE;
      default:
        return ExtrinsicType.UNKNOWN;
    }
  }, [nominatorMetadata?.type]);

  const onClickItem = useCallback((action: StakingAction, onClick: () => void) => {
    const _onClick = () => {
      setSelected(action);
      onClick();
    };

    return () => {
      if (isDappStaking && action === StakingAction.CLAIM_REWARD) {
        onClick();
      } else {
        onPreCheck(_onClick, convertStakingActionToExtrinsicType(action))();
      }
    };
  }, [convertStakingActionToExtrinsicType, isDappStaking, onPreCheck]);

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
