// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout, PageWrapper } from "@subwallet-webapp/components";
import { DEFAULT_ROUTER_PATH } from "@subwallet-webapp/constants/router";
import useIsPopup from "@subwallet-webapp/hooks/dom/useIsPopup";
import useDefaultNavigate from "@subwallet-webapp/hooks/router/useDefaultNavigate";
import { saveCameraSetting, windowOpen } from "@subwallet-webapp/messaging";
import { RootState } from "@subwallet-webapp/stores";
import { PhosphorIcon, ThemeProps } from "@subwallet-webapp/types";
import { isNoAccount } from "@subwallet-webapp/util/account/account";
import { BackgroundIcon, Icon, SettingItem, Switch } from "@subwallet/react-ui";
import CN from "classnames";
import { Camera, CaretRight, GlobeHemisphereEast, Key } from "phosphor-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";

type Props = ThemeProps;

enum SecurityType {
  WALLET_PASSWORD = "wallet-password",
  WEBSITE_ACCESS = "website-access",
  CAMERA_ACCESS = "camera-access",
}

interface SecurityItem {
  icon: PhosphorIcon;
  key: SecurityType;
  title: string;
  url: string;
}

const items: SecurityItem[] = [
  {
    icon: Key,
    key: SecurityType.WALLET_PASSWORD,
    title: "Change wallet password",
    url: "/keyring/change-password",
  },
  {
    icon: GlobeHemisphereEast,
    key: SecurityType.WEBSITE_ACCESS,
    title: "Manage website access",
    url: "/settings/dapp-access",
  },
];

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();
  const { goBack } = useDefaultNavigate();
  const navigate = useNavigate();
  const location = useLocation();
  const canGoBack = !!location.state;
  const isPopup = useIsPopup();

  const { accounts } = useSelector((state: RootState) => state.accountState);
  const { camera } = useSelector((state: RootState) => state.settings);

  const noAccount = useMemo(() => isNoAccount(accounts), [accounts]);

  const [loading, setLoading] = useState(false);

  const onBack = useCallback(() => {
    if (canGoBack) {
      goBack();
    } else {
      if (noAccount) {
        navigate(DEFAULT_ROUTER_PATH);
      } else {
        navigate("/settings/list");
      }
    }
  }, [canGoBack, goBack, navigate, noAccount]);

  const updateCamera = useCallback(
    (currentValue: boolean) => {
      return () => {
        setLoading(true);

        let openNewTab = false;

        if (!currentValue) {
          if (isPopup) {
            openNewTab = true;
          }
        }

        saveCameraSetting(!currentValue)
          .then(() => {
            if (openNewTab) {
              windowOpen("/settings/security").catch((e: Error) => {
                console.log(e);
              });
            }
          })
          .catch(console.error)
          .finally(() => {
            setLoading(false);
          });
      };
    },
    [isPopup]
  );

  const onClickItem = useCallback(
    (url: string) => {
      return () => {
        navigate(url);
      };
    },
    [navigate]
  );

  useEffect(() => {
    if (camera) {
      window.navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          // Close video
          stream.getTracks().forEach((track) => {
            track.stop();
          });
        })
        .catch(console.error);
    }
  }, [camera]);

  return (
    <PageWrapper className={CN(className)}>
      <Layout.WithSubHeaderOnly onBack={onBack} title={t("Security settings")}>
        <div className="body-container">
          <div className="items-container">
            {items.map((item) => (
              <SettingItem
                className={CN("security-item", `security-type-${item.key}`, {
                  disabled: noAccount,
                })}
                key={item.key}
                leftItemIcon={
                  <BackgroundIcon
                    backgroundColor={"var(--icon-bg-color)"}
                    phosphorIcon={item.icon}
                    size="sm"
                    type="phosphor"
                    weight="fill"
                  />
                }
                name={t(item.title)}
                onPressItem={noAccount ? undefined : onClickItem(item.url)}
                rightItem={
                  <Icon
                    className="security-item-right-icon"
                    phosphorIcon={CaretRight}
                    size="sm"
                    type="phosphor"
                  />
                }
              />
            ))}
          </div>
          <div className="camera-access-container">
            <div className="label">{t("Camera access")}</div>
            <SettingItem
              className={CN(
                "security-item",
                `security-type-${SecurityType.CAMERA_ACCESS}`
              )}
              leftItemIcon={
                <BackgroundIcon
                  backgroundColor={"var(--icon-bg-color)"}
                  phosphorIcon={Camera}
                  size="sm"
                  type="phosphor"
                  weight="fill"
                />
              }
              name={t("Allow QR camera access")}
              rightItem={
                <Switch
                  checked={camera}
                  loading={loading}
                  onClick={updateCamera(camera)}
                />
              }
            />
          </div>
        </div>
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  );
};

const SecurityList = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    ".body-container": {
      padding: `${token.padding}px ${token.padding}px`,
    },

    ".items-container": {
      display: "flex",
      flexDirection: "column",
      gap: token.sizeXS,
    },

    [`.security-type-${SecurityType.WALLET_PASSWORD}`]: {
      "--icon-bg-color": token["geekblue-6"],

      "&:hover": {
        "--icon-bg-color": token["geekblue-7"],
      },
    },

    [`.security-type-${SecurityType.WEBSITE_ACCESS}`]: {
      "--icon-bg-color": token["blue-7"],

      "&:hover": {
        "--icon-bg-color": token["blue-8"],
      },
    },

    [`.security-type-${SecurityType.CAMERA_ACCESS}`]: {
      "--icon-bg-color": token["green-6"],

      "&:hover": {
        "--icon-bg-color": token["green-7"],
      },
    },

    ".security-item": {
      ".ant-web3-block-right-item": {
        marginRight: token.sizeXXS,
        color: token["gray-4"],
      },

      "&:hover": {
        ".ant-web3-block-right-item": {
          color: token["gray-6"],
        },
      },

      "&.disabled": {
        opacity: 0.4,

        ".ant-setting-item-content": {
          cursor: "not-allowed",
        },
      },
    },

    ".camera-access-container": {
      marginTop: token.marginLG,
      display: "flex",
      flexDirection: "column",
      gap: token.size,

      ".label": {
        fontWeight: token.fontWeightStrong,
        fontSize: token.fontSizeSM,
        lineHeight: token.lineHeightSM,
        color: token.colorTextLabel,
        textTransform: "uppercase",
      },
    },
  };
});

export default SecurityList;
