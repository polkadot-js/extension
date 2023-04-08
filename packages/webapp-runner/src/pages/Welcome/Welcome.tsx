// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from "@subwallet-webapp/components"
import Logo3D from "@subwallet-webapp/components/Logo/Logo3D"
import SocialGroup from "@subwallet-webapp/components/SocialGroup"
import {
  EVM_ACCOUNT_TYPE,
  SUBSTRATE_ACCOUNT_TYPE,
} from "@subwallet-webapp/constants/account"
import {
  ATTACH_ACCOUNT_MODAL,
  CREATE_ACCOUNT_MODAL,
  IMPORT_ACCOUNT_MODAL,
  SELECT_ACCOUNT_MODAL,
  DOWNLOAD_EXTENSION,
} from "@subwallet-webapp/constants/modal"
import useTranslation from "@subwallet-webapp/hooks/common/useTranslation"
import { PhosphorIcon, ThemeProps } from "@subwallet-webapp/types"
import {
  Button,
  ButtonProps,
  Divider,
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
} from "phosphor-react"
import React, { useCallback, useContext } from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

export type Props = ThemeProps

interface WelcomeButtonItem {
  id: string
  icon: PhosphorIcon
  schema: ButtonProps["schema"]
  title: string
  description: string
}

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
    id: DOWNLOAD_EXTENSION,
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
      <div className={CN("body-container", "flex-column")}>
        <div className={CN("brand-container", "flex-column")}>
          <div className="logo-container">
            <Logo3D height={100} width={69} />
          </div>
          <div className="title">{t("SubWallet")}</div>
          <div className="sub-title">
            {t("Polkadot, Substrate & Ethereum wallet")}
          </div>
        </div>

        <div className="buttons-container">
          <div className="buttons">
            {items.map((item) => (
              <Button
                block={true}
                className={CN("welcome-import-button", `type-${item.id}`)}
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

          <Divider className="divider" />
        </div>

        <div className={CN("add-wallet-container", "flex-column")}>
          <div className="sub-title">{t("Watch any wallet")}</div>
          <Input.Password
            // disabled={loading}
            className="address-input"
            placeholder={t("Enter address")}
            prefix={<Wallet />}
            visibilityToggle={{
              visible: passwordVisible,
              onVisibleChange: setPasswordVisible,
            }}
            iconRender={(visible) => (visible ? <Eye /> : <EyeSlash />)}
          />
          <Button block className="add-wallet-button" schema="primary">
            {t("Add watch-only wallet")}
          </Button>
        </div>

        <SocialGroup />
      </div>
    </Layout.Base>
  )
}

export default Component
