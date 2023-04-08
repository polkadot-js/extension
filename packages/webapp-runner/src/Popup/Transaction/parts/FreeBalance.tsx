// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useGetBalance } from "@subwallet-webapp/hooks";
import useTranslation from "@subwallet-webapp/hooks/common/useTranslation";
import { Theme, ThemeProps } from "@subwallet-webapp/types";
import { Number, Typography } from "@subwallet/react-ui";
import CN from "classnames";
import React from "react";
import styled, { useTheme } from "styled-components";

type Props = ThemeProps & {
  address?: string;
  tokenSlug?: string;
  label?: string;
  chain?: string;
};

const Component = ({ address, chain, className, label, tokenSlug }: Props) => {
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;

  const { nativeTokenBalance, nativeTokenSlug, tokenBalance } = useGetBalance(
    chain,
    address,
    tokenSlug
  );

  if (!address && !chain) {
    return <></>;
  }

  return (
    <Typography.Paragraph className={CN(className, "free-balance")}>
      {label || t("Sender available balance:")}
      {!!nativeTokenSlug && (
        <Number
          decimal={nativeTokenBalance.decimals || 18}
          decimalColor={token.colorTextTertiary}
          intColor={token.colorTextTertiary}
          size={14}
          suffix={nativeTokenBalance.symbol}
          unitColor={token.colorTextTertiary}
          value={nativeTokenBalance.value}
        />
      )}
      {!!tokenSlug && tokenSlug !== nativeTokenSlug && (
        <>
          <span className={"__name"}>{t("and")}</span>
          <Number
            decimal={tokenBalance?.decimals || 18}
            decimalColor={token.colorTextTertiary}
            intColor={token.colorTextTertiary}
            size={14}
            suffix={tokenBalance?.symbol}
            unitColor={token.colorTextTertiary}
            value={tokenBalance.value}
          />
        </>
      )}
    </Typography.Paragraph>
  );
};

const FreeBalance = styled(Component)(({ theme: { token } }: Props) => {
  return {
    display: "flex",
    color: token.colorTextTertiary,

    "&.ant-typography": {
      marginBottom: 0,
    },

    ".ant-number, .__name": {
      marginLeft: "0.3em",
    },
  };
});

export default FreeBalance;
