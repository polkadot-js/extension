// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from "@subwallet-webapp/types";
import { Button, Icon, Number, SwNumberProps, Tag } from "@subwallet/react-ui";
import {
  ArrowFatLinesDown,
  PaperPlaneTilt,
  ShoppingCartSimple,
} from "phosphor-react";
import React from "react";
import styled from "styled-components";

type Props = ThemeProps & {
  totalValue: SwNumberProps["value"];
  totalChangeValue: SwNumberProps["value"];
  totalChangePercent: SwNumberProps["value"];
  isPriceDecrease: boolean;
  isShrink: boolean;
  onOpenSendFund: () => void;
  onOpenBuyTokens: () => void;
  onOpenReceive: () => void;
};

function Component({
  className = "",
  isPriceDecrease,
  isShrink,
  onOpenBuyTokens,
  onOpenReceive,
  onOpenSendFund,
  totalChangePercent,
  totalChangeValue,
  totalValue,
}: Props): React.ReactElement<Props> {
  return (
    <div
      className={`tokens-upper-block ${className} ${isShrink ? "-shrink" : ""}`}
    >
      <Number
        className={"__total-balance-value"}
        decimal={0}
        decimalOpacity={0.45}
        prefix="$"
        size={38}
        subFloatNumber
        value={totalValue}
      />
      {!isShrink && (
        <div className={"__balance-change-container"}>
          <Number
            className={"__balance-change-value"}
            decimal={0}
            decimalOpacity={1}
            prefix={isPriceDecrease ? "- $" : "+ $"}
            value={totalChangeValue}
          />
          <Tag
            className={`__balance-change-percent ${
              isPriceDecrease ? "-decrease" : ""
            }`}
            shape={"round"}
          >
            <Number
              decimal={0}
              decimalOpacity={1}
              prefix={isPriceDecrease ? "-" : "+"}
              suffix={"%"}
              value={totalChangePercent}
              weight={700}
            />
          </Tag>
        </div>
      )}
      <div className={"__action-button-container"}>
        <Button
          icon={
            <Icon
              phosphorIcon={ArrowFatLinesDown}
              size={isShrink ? "sm" : "md"}
              weight={"duotone"}
            />
          }
          onClick={onOpenReceive}
          shape="squircle"
          size={isShrink ? "xs" : "sm"}
        />
        <div className={"__button-space"} />
        <Button
          icon={
            <Icon
              phosphorIcon={PaperPlaneTilt}
              size={isShrink ? "sm" : "md"}
              weight={"duotone"}
            />
          }
          onClick={onOpenSendFund}
          shape="squircle"
          size={isShrink ? "xs" : "sm"}
        />
        <div className={"__button-space"} />
        <Button
          icon={
            <Icon
              phosphorIcon={ShoppingCartSimple}
              size={isShrink ? "sm" : "md"}
              weight={"duotone"}
            />
          }
          onClick={onOpenBuyTokens}
          shape="squircle"
          size={isShrink ? "xs" : "sm"}
        />
      </div>
    </div>
  );
}

export const UpperBlock = styled(Component)<Props>(
  ({ theme: { token } }: Props) => {
    return {
      padding: "0px 8px 24px 8px",
      display: "flex",
      flexDirection: "column",

      ".__total-balance-value": {
        textAlign: "center",
        padding: "0px 8px",
        lineHeight: token.lineHeightHeading1,
        fontSize: token.fontSizeHeading1,
        whiteSpace: "nowrap",
        overflow: "hidden",

        ".ant-typography": {
          lineHeight: "inherit",
        },
      },

      ".ant-btn": {
        transition: "width, height, padding 0s",
      },

      ".__balance-change-container": {
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        paddingTop: token.sizeSM,

        ".ant-typography": {
          lineHeight: "inherit",
          // todo: may update number component to clear this !important
          color: "inherit !important",
          fontSize: "inherit !important",
        },
      },

      ".__balance-change-value": {
        marginRight: token.sizeSM,
        lineHeight: token.lineHeight,
      },

      ".__balance-change-percent": {
        backgroundColor: token["cyan-6"],
        color: token["green-1"],
        marginInlineEnd: 0,
        display: "flex",

        "&.-decrease": {
          backgroundColor: token.colorError,
          color: token.colorTextLight1,
        },

        ".ant-number": {
          fontSize: token.fontSizeXS,
        },
      },

      ".__action-button-container": {
        display: "flex",
        justifyContent: "center",
        padding: "26px 8px 0 8px",
      },

      ".__button-space": {
        width: token.size,
      },

      "&.-shrink": {
        paddingBottom: 32,
        flexDirection: "row",

        ".__total-balance-value": {
          textAlign: "left",
          lineHeight: token.lineHeightHeading2,
          fontSize: token.fontSizeHeading2,
          flex: 1,

          ".ant-number-prefix, .ant-number-integer": {
            fontSize: "inherit !important",
          },
        },

        ".__balance-change-container": {
          display: "none",
        },

        ".__action-button-container": {
          paddingTop: 0,
        },

        ".__button-space": {
          width: token.sizeXS,
        },
      },
    };
  }
);
