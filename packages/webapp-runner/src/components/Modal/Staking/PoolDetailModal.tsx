// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import MetaInfo from "@subwallet-webapp/components/MetaInfo";
import {
  StakingStatus,
  StakingStatusType,
} from "@subwallet-webapp/constants/stakingStatus";
import useTranslation from "@subwallet-webapp/hooks/common/useTranslation";
import { NominationPoolDataType } from "@subwallet-webapp/hooks/screen/staking/useGetValidatorList";
import { ThemeProps } from "@subwallet-webapp/types";
import { SwModal } from "@subwallet/react-ui";
import React from "react";
import styled from "styled-components";

type Props = ThemeProps & {
  decimals: number;
  onCancel: () => void;
  status: StakingStatusType;
  selectedNominationPool?: NominationPoolDataType;
};

export const PoolDetailModalId = "poolDetailModalId";

function Component({
  className,
  decimals,
  onCancel,
  selectedNominationPool,
  status,
}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const {
    address = "",
    memberCounter = 0,
    name,
    symbol,
  } = selectedNominationPool || {};

  return (
    <SwModal
      className={className}
      id={PoolDetailModalId}
      onCancel={onCancel}
      title={t("Pooled details")}
    >
      <MetaInfo
        hasBackgroundWrapper
        spaceSize={"xs"}
        valueColorScheme={"light"}
      >
        <MetaInfo.Account address={address} label={t("Pool")} name={name} />

        <MetaInfo.Status
          label={t("Status")}
          statusIcon={StakingStatus[status].icon}
          statusName={StakingStatus[status].name}
          valueColorSchema={StakingStatus[status].schema}
        />

        <MetaInfo.Number
          label={t("Commission")}
          suffix={"%"}
          value={"10"}
          valueColorSchema={"even-odd"}
        />

        <MetaInfo.Number
          decimals={decimals}
          label={t("Owner pooled")}
          suffix={symbol}
          value={memberCounter}
          valueColorSchema={"even-odd"}
        />

        <MetaInfo.Number
          label={t("Total pooled")}
          suffix={"%"}
          value={memberCounter}
          valueColorSchema={"even-odd"}
        />

        <MetaInfo.Number
          label={t("Member of pool")}
          suffix={"%"}
          value={memberCounter}
          valueColorSchema={"even-odd"}
        />
      </MetaInfo>
    </SwModal>
  );
}

export const PoolDetailModal = styled(Component)<Props>(
  ({ theme: { token } }: Props) => {
    return {};
  }
);
