// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import LoginBg from "@subwallet-webapp/assets/WelcomeBg.png"
import { Layout } from "@subwallet-webapp/components"
import Logo3D from "@subwallet-webapp/components/Logo/Logo3D"
import {
  EVM_ACCOUNT_TYPE,
  SUBSTRATE_ACCOUNT_TYPE,
} from "@subwallet-webapp/constants/account"
import {
  ATTACH_ACCOUNT_MODAL,
  CREATE_ACCOUNT_MODAL,
  IMPORT_ACCOUNT_MODAL,
  SELECT_ACCOUNT_MODAL,
} from "@subwallet-webapp/constants/modal"
import useTranslation from "@subwallet-webapp/hooks/common/useTranslation"
import { PhosphorIcon, ThemeProps } from "@subwallet-webapp/types"
import {
  Button,
  ButtonProps,
  Icon,
  Input,
  ModalContext,
} from "@subwallet/react-ui"
import CN from "classnames"
import {
  FileArrowDown,
  PlusCircle,
  Swatches,
  PuzzlePiece,
  Wallet,
  Eye,
  EyeSlash,
  DiscordLogo,
  PaperPlaneTilt,
  TwitterLogo,
} from "phosphor-react"
import React, { useCallback, useContext } from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import styled from "styled-components"
import {
  DISCORD_URL,
  TELEGRAM_URL,
  TWITTER_URL,
} from "@subwallet-webapp/constants/common"

type Props = ThemeProps

enum SocialType {
  TWITTER = "twitter",
  DISCORD = "discord",
  TELEGRAM = "telegram",
}
interface WelcomeButtonItem {
  id: string
  icon: PhosphorIcon
  schema: ButtonProps["schema"]
  title: string
  description: string
}

interface SocialItem {
  icon: PhosphorIcon
  type: SocialType
  url: string
}

const socialItems: SocialItem[] = [
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
]

const items: WelcomeButtonItem[] = [
  {
    description: "Create a new account with SubWallet",
    icon: PlusCircle,
    id: CREATE_ACCOUNT_MODAL,
    schema: "secondary",
    title: "Create a new account",
  },
  {
    description: "Import an existing account",
    icon: FileArrowDown,
    id: IMPORT_ACCOUNT_MODAL,
    schema: "secondary",
    title: "Import an account",
  },
  {
    description: "Attach an account from external wallet",
    icon: Swatches,
    id: ATTACH_ACCOUNT_MODAL,
    schema: "secondary",
    title: "Attach an account",
  },
  {
    description: "For management of your account keys",
    icon: PuzzlePiece,
    id: ATTACH_ACCOUNT_MODAL,
    schema: "secondary",
    title: "Download SubWallet extension",
  },
]

function Component({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation()
  const { activeModal, inactiveModal } = useContext(ModalContext)
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false)
  const navigate = useNavigate()

  const openModal = useCallback(
    (id: string) => {
      return () => {
        if (id === CREATE_ACCOUNT_MODAL) {
          navigate("/accounts/new-seed-phrase", {
            state: { accountTypes: [SUBSTRATE_ACCOUNT_TYPE, EVM_ACCOUNT_TYPE] },
          })
        } else {
          inactiveModal(SELECT_ACCOUNT_MODAL)
          activeModal(id)
        }
      }
    },
    [activeModal, inactiveModal, navigate]
  )

  return (
    <Layout.Base className={CN(className)}>
      <div className="bg-gradient" />
      <div className="bg-image" />
      <div className="body-container">
        <div className="logo-container">
          <Logo3D height={100} width={69} />
        </div>
        <div className="title">{t("SubWallet")}</div>
        <div className="sub-title">
          {t("Polkadot, Substrate & Ethereum wallet")}
        </div>
        <div className="buttons-container">
          {items.map((item) => (
            <Button
              block={true}
              className="welcome-import-button"
              contentAlign="left"
              icon={
                <Icon
                  className="welcome-import-icon"
                  phosphorIcon={item.icon}
                  size="md"
                  weight="fill"
                />
              }
              key={item.id}
              onClick={openModal(item.id)}
              schema={item.schema}
            >
              <div className="welcome-import-button-content">
                <div className="welcome-import-button-title">
                  {t(item.title)}
                </div>
                <div className="welcome-import-button-description">
                  {t(item.description)}
                </div>
              </div>
            </Button>
          ))}
        </div>

        <div className="sub-title">{t("Watch any wallet")}</div>
        <Input.Password
          // disabled={loading}
          placeholder={t("Enter address")}
          prefix={<Wallet />}
          visibilityToggle={{
            visible: passwordVisible,
            onVisibleChange: setPasswordVisible,
          }}
          iconRender={(visible) => (visible ? <Eye /> : <EyeSlash />)}
        />
        <Button block className="add-watch-only" schema="primary">
          {t("Add watch-only wallet")}
        </Button>

        <div className="button-group">
          {socialItems.map((item) => (
            <Button
              className={CN(`type-${item.type}`)}
              icon={<Icon phosphorIcon={item.icon} weight="fill" />}
              key={item.type}
              // onClick={openInNewTab(item.url)}
              shape="squircle"
            />
          ))}
        </div>
      </div>
    </Layout.Base>
  )
}

const Welcome = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    position: "relative",

    ".bg-gradient": {
      backgroundImage:
        "linear-gradient(180deg, rgba(0, 75, 255, 0.1) 16.47%, rgba(217, 217, 217, 0) 94.17%)",
      height: 290,
      width: "100%",
      position: "absolute",
      left: 0,
      top: 0,
    },

    ".bg-image": {
      backgroundImage: `url(${LoginBg})`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "top",
      backgroundSize: "contain",
      height: "100%",
      position: "absolute",
      width: "100%",
      left: 0,
      top: 0,
      opacity: 0.1,
    },

    ".body-container": {
      padding: `0 ${token.padding}px`,
      textAlign: "center",

      ".logo-container": {
        marginTop: token.sizeLG * 3,
        color: token.colorTextBase,
      },

      ".title": {
        marginTop: token.marginXS,
        fontWeight: token.fontWeightStrong,
        fontSize: token.fontSizeHeading1,
        lineHeight: token.lineHeightHeading1,
        color: token.colorTextBase,
      },

      ".sub-title": {
        // marginTop: token.marginXS,
        // marginBottom: token.sizeLG * 3,
        fontSize: token.fontSizeHeading5,
        lineHeight: token.lineHeightHeading5,
        color: token.colorTextLight3,
      },

      ".buttons-container": {
        display: "grid",
        // flexDirection: "column",
        gridTemplateRows: "1fr 1fr",
        gridTemplateColumns: "1fr 1fr",
        gap: token.sizeMS,

        ".welcome-import-button": {
          height: "auto",
          width: "100%",

          ".welcome-import-icon": {
            height: token.sizeLG,
            width: token.sizeLG,
            marginLeft: token.sizeMD - token.size,
          },

          ".welcome-import-button-content": {
            display: "flex",
            flexDirection: "column",
            gap: token.sizeXXS,
            fontWeight: token.fontWeightStrong,
            padding: `${token.paddingSM - 1}px ${token.paddingLG}px`,
            textAlign: "start",

            ".welcome-import-button-title": {
              fontSize: token.fontSizeHeading5,
              lineHeight: token.lineHeightHeading5,
              color: token.colorTextBase,
            },

            ".welcome-import-button-description": {
              fontSize: token.fontSizeHeading6,
              lineHeight: token.lineHeightHeading6,
              color: token.colorTextLabel,
            },
          },
        },
      },
    },
  }
})

export default Welcome
