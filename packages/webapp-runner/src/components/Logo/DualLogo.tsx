// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Logo2D from "@subwallet-webapp/components/Logo/Logo2D";
import LogoWithSquircleBorder from "@subwallet-webapp/components/Logo/LogoWithSquircleBorder";
import { ThemeProps } from "@subwallet-webapp/types";
import { Icon } from "@subwallet/react-ui";
import CN from "classnames";
import { ArrowsLeftRight } from "phosphor-react";
import React from "react";
import styled from "styled-components";

interface Props extends ThemeProps {
  leftLogo?: React.ReactNode;
  rightLogo?: React.ReactNode;

  linkIcon?: React.ReactNode;
  linkIconBg?: string;
}

const defaultLinkIcon = (
  <Icon customSize="24px" phosphorIcon={ArrowsLeftRight} />
);
const defaultLogo = <Logo2D />;

const Component = ({
  className,
  leftLogo = defaultLogo,
  linkIcon = defaultLinkIcon,
  rightLogo = defaultLogo,
}: Props) => {
  return (
    <div className={CN(className, "dual-logo-container")}>
      <LogoWithSquircleBorder>{leftLogo}</LogoWithSquircleBorder>
      <div className="link-icon">{linkIcon}</div>
      <LogoWithSquircleBorder>{rightLogo}</LogoWithSquircleBorder>
    </div>
  );
};

const DualLogo = styled(Component)<Props>(({ linkIconBg, theme }: Props) => ({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  width: "max-content",
  margin: "0 auto",
  padding: theme.token.paddingXS,
  marginBottom: theme.token.marginXS,

  ".link-icon": {
    backgroundColor: linkIconBg || theme.token["gray-1"],
    zIndex: 10,
    textAlign: "center",
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: (40 - 24) / 2,
    margin: "0 -12px",
  },
}));

export default DualLogo;
