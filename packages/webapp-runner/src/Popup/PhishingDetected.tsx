// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useDefaultNavigate from "@subwallet-webapp/hooks/router/useDefaultNavigate";
import { Theme } from "@subwallet-webapp/themes";
import { ButtonProps, Icon, PageIcon, Typography } from "@subwallet/react-ui";
import CN from "classnames";
import { ShieldSlash, XCircle } from "phosphor-react";
import React from "react";
import { useParams } from "react-router";
import styled, { useTheme } from "styled-components";

import { Layout } from "../components";
import useTranslation from "../hooks/common/useTranslation";

interface Props {
  className?: string;
}

function _PhishingDetected({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { goHome } = useDefaultNavigate();
  const { token } = useTheme() as Theme;
  const website = useParams<{ website: string }>().website || "";
  const decodedWebsite = decodeURIComponent(website);

  const footerBtn: ButtonProps = {
    children: t("Get me out of here"),
    icon: <Icon phosphorIcon={XCircle} weight="fill" />,
    onClick: goHome,
  };

  return (
    <Layout.WithSubHeaderOnly
      className={CN(className)}
      rightFooterButton={footerBtn}
      showBackButton={false}
      subHeaderPaddingVertical={true}
      title={t("Phishing detection")}
    >
      <div className={CN("__upper-block-wrapper")} />
      <PageIcon
        color={token.colorError}
        iconProps={{ phosphorIcon: ShieldSlash, weight: "fill" }}
      />
      <div className="title h3-text text-danger">{t("Phishing detection")}</div>
      <div className="h4-text text-danger">{decodedWebsite}</div>
      <div className="phishing-detection-message">
        <span>
          {t(
            "This domain has been reported as a known phishing site on a community maintained list: "
          )}
        </span>
        <Typography.Link size="lg">
          <a href="https://polkadot.js.org/phishing/#">{t("view full list")}</a>
        </Typography.Link>
      </div>
    </Layout.WithSubHeaderOnly>
  );
}

const PhishingDetected = styled(_PhishingDetected)<Props>(({ theme }) => {
  const { extendToken, token } = theme as Theme;

  return {
    position: "relative",

    ".ant-sw-screen-layout-body": {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      paddingTop: 48,
    },

    ".ant-sw-sub-header-title-content": {
      zIndex: 1,
    },

    ".title": {
      paddingTop: 16,
      paddingBottom: 16,
    },

    ".phishing-detection-message": {
      paddingLeft: 40,
      paddingRight: 40,
      paddingTop: 16,
      textAlign: "center",
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      color: token.colorTextLight3,
    },

    ".__upper-block-wrapper": {
      position: "absolute",
      height: 180,
      top: 0,
      left: 0,
      right: 0,
      display: "flex",
      alignItems: "center",
      transaction: "0.1s height",
      backgroundImage: extendToken.tokensScreenDangerBackgroundColor,
    },
  };
});

export default PhishingDetected;
