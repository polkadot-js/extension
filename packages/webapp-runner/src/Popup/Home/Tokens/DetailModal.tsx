// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useTranslation from "@subwallet-webapp/hooks/common/useTranslation";
import { ThemeProps } from "@subwallet-webapp/types";
import { TokenBalanceItemType } from "@subwallet-webapp/types/balance";
import { Number, SwModal } from "@subwallet/react-ui";
import BigN from "bignumber.js";
import React from "react";
import styled from "styled-components";

type Props = ThemeProps & {
  id: string;
  onCancel: () => void;
  tokenBalanceMap: Record<string, TokenBalanceItemType>;
  currentTokenInfo?: {
    symbol: string;
    slug: string;
  };
};

type ItemType = {
  symbol: string;
  label: string;
  key: string;
  value: BigN;
};

function Component({
  className = "",
  currentTokenInfo,
  id,
  onCancel,
  tokenBalanceMap,
}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const items: ItemType[] = (() => {
    const symbol = currentTokenInfo?.symbol || "";
    const balanceInfo = currentTokenInfo
      ? tokenBalanceMap[currentTokenInfo.slug]
      : undefined;

    return [
      {
        key: "transferable",
        symbol,
        label: t("Transferable"),
        value: balanceInfo ? balanceInfo.free.value : new BigN(0),
      },
      {
        key: "locked",
        symbol,
        label: t("Locked"),
        value: balanceInfo ? balanceInfo.locked.value : new BigN(0),
      },
    ];
  })();

  return (
    <SwModal
      className={className}
      id={id}
      onCancel={onCancel}
      title={t("Token details")}
    >
      <div className={"__container"}>
        {items.map((item) => (
          <div className={"__row"} key={item.key}>
            <div className={"__label"}>{item.label}</div>

            <Number
              className={"__value"}
              decimal={0}
              decimalOpacity={0.45}
              intOpacity={0.85}
              size={14}
              suffix={item.symbol}
              unitOpacity={0.85}
              value={item.value}
            />
          </div>
        ))}
      </div>
    </SwModal>
  );
}

export const DetailModal = styled(Component)<Props>(
  ({ theme: { token } }: Props) => {
    return {
      ".__container": {
        borderRadius: token.borderRadiusLG,
        backgroundColor: token.colorBgSecondary,
        padding: "12px 12px 4px",
      },

      ".__row": {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: token.marginSM,
      },

      ".__label": {
        paddingRight: token.paddingSM,
      },
    };
  }
);
