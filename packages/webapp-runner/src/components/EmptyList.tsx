// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Theme, ThemeProps } from "@subwallet-webapp/types";
import { PageIcon } from "@subwallet/react-ui";
import { IconProps } from "phosphor-react";
import React from "react";
import styled, { useTheme } from "styled-components";

interface Props extends ThemeProps {
  phosphorIcon?: React.ForwardRefExoticComponent<
    IconProps & React.RefAttributes<SVGSVGElement>
  >;
  emptyTitle?: string;
  emptyMessage?: string;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, emptyMessage, emptyTitle, phosphorIcon } = props;
  const { token } = useTheme() as Theme;

  return (
    <div className={className}>
      <div className={"empty_icon_wrapper"}>
        <PageIcon
          color={token["gray-4"]}
          iconProps={{
            phosphorIcon,
            weight: "fill",
          }}
        />
      </div>

      <div className={"empty_text_container"}>
        <div className={"empty_title"}>{emptyTitle}</div>
        <div className={"empty_subtitle"}>{emptyMessage}</div>
      </div>
    </div>
  );
};

const EmptyList = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    overflow: "hidden",
    marginTop: 48,
    display: "flex",
    flexWrap: "wrap",
    gap: token.padding,
    flexDirection: "column",
    alignContent: "center",
    position: "relative",
    zIndex: 2,

    ".empty_text_container": {
      display: "flex",
      flexDirection: "column",
      alignContent: "center",
      justifyContent: "center",
      flexWrap: "wrap",
    },

    ".empty_title": {
      fontWeight: token.headingFontWeight,
      textAlign: "center",
      fontSize: token.fontSizeLG,
      color: token.colorText,
    },

    ".empty_subtitle": {
      marginTop: 6,
      textAlign: "center",
      color: token.colorTextTertiary,
    },

    ".empty_icon_wrapper": {
      display: "flex",
      justifyContent: "center",
    },
  };
});

export default EmptyList;
