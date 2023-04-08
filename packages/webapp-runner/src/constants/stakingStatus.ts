// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { InfoItemBase } from "@subwallet-webapp/components/MetaInfo/parts/types";
import { CheckCircle, ListChecks, XCircle } from "phosphor-react";

export type StakingStatusType = "active" | "inactive" | "pending";

export const StakingStatus = {
  active: {
    schema: "success" as InfoItemBase["valueColorSchema"],
    icon: CheckCircle,
    name: "Earning reward",
  },
  pending: {
    schema: "warning" as InfoItemBase["valueColorSchema"],
    icon: ListChecks,
    name: "Earning reward",
  },
  inactive: {
    schema: "danger" as InfoItemBase["valueColorSchema"],
    icon: XCircle,
    name: "Not earning",
  },
};
