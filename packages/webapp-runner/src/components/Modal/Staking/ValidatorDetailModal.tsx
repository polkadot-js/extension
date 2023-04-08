// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import MetaInfo from "@subwallet-webapp/components/MetaInfo";
import {
  StakingStatus,
  StakingStatusType,
} from "@subwallet-webapp/constants/stakingStatus";
import useTranslation from "@subwallet-webapp/hooks/common/useTranslation";
import { ValidatorDataType } from "@subwallet-webapp/hooks/screen/staking/useGetValidatorList";
import { ThemeProps } from "@subwallet-webapp/types";
import { SwModal } from "@subwallet/react-ui";
import { ModalContext } from "@subwallet/react-ui/es/sw-modal/provider";
import React, { useCallback, useContext } from "react";
import styled from "styled-components";

type Props = ThemeProps & {
  onCancel?: () => void;
  status: StakingStatusType;
  validatorItem: ValidatorDataType;
};

export const ValidatorDetailModalId = "validatorDetailModalId";

function Component(props: Props): React.ReactElement<Props> {
  const { className, onCancel, status, validatorItem } = props;
  const {
    address: validatorAddress,
    commission,
    decimals,
    expectedReturn: earningEstimated = "",
    identity: validatorName = "",
    minBond: minStake,
    ownStake,
    symbol,
  } = validatorItem;
  const { t } = useTranslation();

  const { inactiveModal } = useContext(ModalContext);

  const _onCancel = useCallback(() => {
    inactiveModal(ValidatorDetailModalId);

    onCancel && onCancel();
  }, [inactiveModal, onCancel]);

  return (
    <SwModal
      className={className}
      id={ValidatorDetailModalId}
      onCancel={_onCancel}
      title={t("Validator details")}
    >
      <MetaInfo
        hasBackgroundWrapper
        spaceSize={"xs"}
        valueColorScheme={"light"}
      >
        <MetaInfo.Account
          address={validatorAddress}
          label={t("Validator")}
          name={validatorName}
        />

        <MetaInfo.Status
          label={t("Status")}
          statusIcon={StakingStatus[status].icon}
          statusName={StakingStatus[status].name}
          valueColorSchema={StakingStatus[status].schema}
        />

        <MetaInfo.Number
          decimals={decimals}
          label={t("Min stake")}
          suffix={symbol}
          value={minStake}
          valueColorSchema={"even-odd"}
        />

        <MetaInfo.Number
          decimals={decimals}
          label={t("Own stake")}
          suffix={symbol}
          value={ownStake}
          valueColorSchema={"even-odd"}
        />

        <MetaInfo.Number
          label={t("Earning estimated")}
          suffix={"%"}
          value={earningEstimated}
          valueColorSchema={"even-odd"}
        />

        <MetaInfo.Number
          label={t("Commission")}
          suffix={"%"}
          value={commission}
          valueColorSchema={"even-odd"}
        />
      </MetaInfo>
    </SwModal>
  );
}

export const ValidatorDetailModal = styled(Component)<Props>(
  ({ theme: { token } }: Props) => {
    return {};
  }
);
