// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {
  DISCORD_URL,
  TELEGRAM_URL,
  TWITTER_URL,
} from "@subwallet-webapp/constants/common";
import useDefaultNavigate from "@subwallet-webapp/hooks/router/useDefaultNavigate";
import { PhosphorIcon, ThemeProps } from "@subwallet-webapp/types";
import { openInNewTab } from "@subwallet-webapp/util";
import { Button, Icon, PageIcon } from "@subwallet/react-ui";
import CN from "classnames";
import {
  CheckCircle,
  DiscordLogo,
  PaperPlaneTilt,
  TwitterLogo,
  X,
} from "phosphor-react";
import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

import { Layout } from "../components";

type Props = ThemeProps;

enum SocialType {
  TWITTER = "twitter",
  DISCORD = "discord",
  TELEGRAM = "telegram",
}

interface SocialItem {
  icon: PhosphorIcon;
  type: SocialType;
  url: string;
}

const items: SocialItem[] = [
  {
    icon: TwitterLogo,
    type: SocialType.TWITTER,
    url: TWITTER_URL,
  },
  {
    icon: DiscordLogo,
    type: SocialType.DISCORD,
    url: DISCORD_URL,
  },
  {
    icon: PaperPlaneTilt,
    type: SocialType.TELEGRAM,
    url: TELEGRAM_URL,
  },
];

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { goHome } = useDefaultNavigate();

  const { t } = useTranslation();

  return (
    <Layout.WithSubHeaderOnly
      rightFooterButton={{
        children: t("Exit"),
        onClick: goHome,
      }}
      showBackButton={true}
      subHeaderLeft={<Icon phosphorIcon={X} size="md" />}
      title={t("Successful")}
    >
      <div className={CN(className)}>
        <div className="page-icon">
          <PageIcon
            color="var(--page-icon-color)"
            iconProps={{
              weight: "fill",
              phosphorIcon: CheckCircle,
            }}
          />
        </div>
        <div className="title">{t("You’re all done!")}</div>
        <div className="description">
          {t(
            "Follow along with product updates or reach out if you have any questions."
          )}
        </div>
        <div className="button-group">
          {items.map((item) => (
            <Button
              className={CN(`type-${item.type}`)}
              icon={<Icon phosphorIcon={item.icon} weight="fill" />}
              key={item.type}
              onClick={openInNewTab(item.url)}
              shape="squircle"
            />
          ))}
        </div>
      </div>
    </Layout.WithSubHeaderOnly>
  );
};

const CreatePasswordDone = styled(Component)<Props>(
  ({ theme: { token } }: Props) => {
    return {
      textAlign: "center",

      ".page-icon": {
        display: "flex",
        justifyContent: "center",
        marginTop: token.controlHeightLG,
        marginBottom: token.margin,
        "--page-icon-color": token.colorSecondary,
      },

      ".title": {
        marginTop: token.margin,
        marginBottom: token.margin,
        fontWeight: token.fontWeightStrong,
        fontSize: token.fontSizeHeading3,
        lineHeight: token.lineHeightHeading3,
        color: token.colorTextBase,
      },

      ".description": {
        padding: `0 ${token.controlHeightLG - token.padding}px`,
        marginTop: token.margin,
        marginBottom: token.margin * 2,
        fontSize: token.fontSizeHeading5,
        lineHeight: token.lineHeightHeading5,
        color: token.colorTextDescription,
        textAlign: "center",
      },

      ".button-group": {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: token.size,
      },

      [`.type-${SocialType.TWITTER}`]: {
        backgroundColor: token["blue-7"],

        "&:hover": {
          backgroundColor: token["blue-8"],
        },
      },

      [`.type-${SocialType.DISCORD}`]: {
        backgroundColor: token["geekblue-8"],

        "&:hover": {
          backgroundColor: token["geekblue-9"],
        },
      },

      [`.type-${SocialType.TELEGRAM}`]: {
        backgroundColor: token["blue-5"],

        "&:hover": {
          backgroundColor: token["blue-6"],
        },
      },
    };
  }
);

export default CreatePasswordDone;
