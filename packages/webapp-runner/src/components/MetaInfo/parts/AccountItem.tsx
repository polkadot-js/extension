// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Avatar } from "@subwallet-webapp/components/Avatar";
import { toShort } from "@subwallet-webapp/util";
import CN from "classnames";
import React from "react";
import styled from "styled-components";

import { isEthereumAddress } from "@polkadot/util-crypto";

import { InfoItemBase } from "./types";

export interface AccountInfoItem extends InfoItemBase {
  address: string;
  name?: string;
  networkPrefix?: number;
}

const Component: React.FC<AccountInfoItem> = (props: AccountInfoItem) => {
  const {
    address,
    className,
    label,
    name,
    networkPrefix,
    valueColorSchema = "default",
  } = props;

  return (
    <div className={CN(className, "__row -type-account")}>
      {!!label && (
        <div className={"__col"}>
          <div className={"__label"}>{label}</div>
        </div>
      )}
      <div className={"__col -to-right"}>
        <div
          className={`__account-item __value -is-wrapper -schema-${valueColorSchema}`}
        >
          <Avatar
            className={"__account-avatar"}
            identPrefix={networkPrefix}
            size={24}
            theme={
              address
                ? isEthereumAddress(address)
                  ? "ethereum"
                  : "polkadot"
                : undefined
            }
            value={address}
          />
          <div className={"__account-name ml-xs"}>
            {name || toShort(address)}
          </div>
        </div>
      </div>
    </div>
  );
};

const AccountItem = styled(Component)<AccountInfoItem>(
  ({ theme: { token } }: AccountInfoItem) => {
    return {};
  }
);

export default AccountItem;
