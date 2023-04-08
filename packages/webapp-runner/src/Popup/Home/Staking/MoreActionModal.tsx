// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {
  ChainStakingMetadata,
  NominatorMetadata,
  RequestStakeWithdrawal,
  StakingItem,
  StakingRewardItem,
  StakingType,
} from "@subwallet/extension-base/background/KoniTypes";
import {
  getStakingAvailableActions,
  getWithdrawalInfo,
  isActionFromValidator,
  StakingAction,
} from "@subwallet/extension-base/koni/api/staking/bonding/utils";
import { ALL_KEY } from "@subwallet-webapp/constants/common";
import { usePreCheckReadOnly, useSelector } from "@subwallet-webapp/hooks";
import useNotification from "@subwallet-webapp/hooks/common/useNotification";
import {
  submitStakeClaimReward,
  submitStakeWithdrawal,
} from "@subwallet-webapp/messaging";
import { GlobalToken } from "@subwallet-webapp/themes";
import { PhosphorIcon, Theme, ThemeProps } from "@subwallet-webapp/types";
import {
  BackgroundIcon,
  ModalContext,
  SettingItem,
  SwModal,
} from "@subwallet/react-ui";
import CN from "classnames";
import {
  ArrowArcLeft,
  ArrowCircleDown,
  MinusCircle,
  PlusCircle,
  Wallet,
} from "phosphor-react";
import React, { useCallback, useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import styled, { useTheme } from "styled-components";

type Props = ThemeProps & {
  staking?: StakingItem;
  reward?: StakingRewardItem;
  chainStakingMetadata?: ChainStakingMetadata;
  nominatorMetadata?: NominatorMetadata;
};

export const MORE_ACTION_MODAL = "more-action-modal";

type ActionListType = {
  backgroundIconColor: keyof GlobalToken;
  icon: PhosphorIcon;
  label: string;
  action: StakingAction;
  onClick: () => void;
};

export type StakingDataOption = {
  staking?: StakingItem;
  reward?: StakingRewardItem;
  chainStakingMetadata?: ChainStakingMetadata;
  nominatorMetadata?: NominatorMetadata;
  hideTabList?: boolean;
};

const Component: React.FC<Props> = (props: Props) => {
  const { chainStakingMetadata, className, nominatorMetadata, reward } = props;

  const navigate = useNavigate();
  const { token } = useTheme() as Theme;
  const { t } = useTranslation();
  const notify = useNotification();

  const { inactiveModal } = useContext(ModalContext);

  const { currentAccount } = useSelector((state) => state.accountState);

  const onCancel = useCallback(() => {
    inactiveModal(MORE_ACTION_MODAL);
  }, [inactiveModal]);

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
      nominatorMetadata,
    };

    if (
      isActionFromValidator(nominatorMetadata.type, nominatorMetadata.chain)
    ) {
      params.validatorAddress = unstakingInfo.validatorAddress;
    }

    submitStakeWithdrawal(params)
      .then((result) => {
        const { errors, extrinsicHash, warnings } = result;

        if (errors.length || warnings.length) {
          notify({
            message: t("Error"),
          });
          // setErrors(errors.map((e) => e.message));
          // setWarnings(warnings.map((w) => w.message));
        } else if (extrinsicHash) {
          console.log("all good");
        }
      })
      .catch((e: Error) => {
        notify({
          message: t("Error"),
        });
      });
  }, [nominatorMetadata, notify, t]);

  const handleClaimRewardAction = useCallback(() => {
    if (!nominatorMetadata) {
      return;
    }

    if (nominatorMetadata.type === StakingType.POOLED) {
      navigate(
        `/transaction/claim-reward/${nominatorMetadata.type}/${nominatorMetadata.chain}`
      );

      return;
    }

    submitStakeClaimReward({
      address: nominatorMetadata.address,
      chain: nominatorMetadata.chain,
      stakingType: nominatorMetadata.type,
      unclaimedReward: reward?.unclaimedReward,
    })
      .then((result) => {
        const { errors, extrinsicHash, warnings } = result;

        if (errors.length || warnings.length) {
          notify({
            message: t("Error"),
          });
          // setErrors(errors.map((e) => e.message));
          // setWarnings(warnings.map((w) => w.message));
        } else if (extrinsicHash) {
          console.log("all good");
        }
      })
      .catch((e: Error) => {
        notify({
          message: t("Error"),
        });
      });
  }, [navigate, nominatorMetadata, notify, reward?.unclaimedReward, t]);

  const availableActions = useMemo(() => {
    if (!nominatorMetadata) {
      return [];
    }

    return getStakingAvailableActions(nominatorMetadata);
  }, [nominatorMetadata]);

  const onNavigate = useCallback(
    (url: string) => {
      return () => {
        navigate(url);
      };
    },
    [navigate]
  );

  const actionList: ActionListType[] = useMemo((): ActionListType[] => {
    const isPool = chainStakingMetadata?.type === StakingType.POOLED;

    const result: ActionListType[] = [
      {
        action: StakingAction.STAKE,
        backgroundIconColor: "green-6",
        icon: PlusCircle,
        label: "Stake more",
        onClick: onNavigate(
          `/transaction/stake/${chainStakingMetadata?.type || ALL_KEY}/${
            chainStakingMetadata?.chain || ALL_KEY
          }`
        ),
      },
      {
        action: StakingAction.UNSTAKE,
        backgroundIconColor: "magenta-6",
        icon: MinusCircle,
        label: "Unstake funds",
        onClick: onNavigate(
          `/transaction/unstake/${chainStakingMetadata?.type || ALL_KEY}/${
            chainStakingMetadata?.chain || ALL_KEY
          }`
        ),
      },
      {
        action: StakingAction.WITHDRAW,
        backgroundIconColor: "geekblue-6",
        icon: ArrowCircleDown,
        label: "Withdraw",
        onClick: handleWithdrawalAction,
      },
      {
        action: StakingAction.CLAIM_REWARD,
        backgroundIconColor: "green-7",
        icon: Wallet,
        label: "Claim rewards",
        onClick: handleClaimRewardAction,
      },
      // {
      //   backgroundIconColor: 'blue-7',
      //   icon: Alarm,
      //   label: 'Compound',
      //   value: '/transaction/compound'
      // }
    ];

    if (!isPool) {
      result.push({
        action: StakingAction.CANCEL_UNSTAKE,
        backgroundIconColor: "purple-8",
        icon: ArrowArcLeft,
        label: "Cancel unstake",
        onClick: onNavigate(
          `/transaction/cancel-unstake/${
            chainStakingMetadata?.type || ALL_KEY
          }/${chainStakingMetadata?.chain || ALL_KEY}`
        ),
      });
    }

    return result;
  }, [
    chainStakingMetadata?.chain,
    chainStakingMetadata?.type,
    handleClaimRewardAction,
    handleWithdrawalAction,
    onNavigate,
  ]);

  const onClickItem = usePreCheckReadOnly(currentAccount?.address);

  return (
    <SwModal
      className={className}
      closable={true}
      id={MORE_ACTION_MODAL}
      maskClosable={true}
      onCancel={onCancel}
      title={t("Actions")}
    >
      {actionList.map((item) => (
        <SettingItem
          className={CN("action-more-item", {
            disabled: !availableActions.includes(item.action),
          })}
          key={item.label}
          leftItemIcon={
            <BackgroundIcon
              backgroundColor={token[item.backgroundIconColor] as string}
              phosphorIcon={item.icon}
              size="sm"
              weight="fill"
            />
          }
          name={item.label}
          onPressItem={
            !availableActions.includes(item.action)
              ? undefined
              : onClickItem(item.onClick)
          }
        />
      ))}
    </SwModal>
  );
};

const MoreActionModal = styled(Component)<Props>(
  ({ theme: { token } }: Props) => {
    return {
      ".action-more-item:not(:last-child)": {
        marginBottom: token.marginXS,
      },

      ".disabled": {
        cursor: "not-allowed",
        opacity: token.opacityDisable,

        ".ant-web3-block": {
          cursor: "not-allowed",
        },

        ".ant-web3-block:hover": {
          cursor: "not-allowed",
          background: token.colorBgSecondary,
        },
      },
    };
  }
);

export default MoreActionModal;
