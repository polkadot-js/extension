// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps, PhosphorIcon } from "@subwallet-webapp/types"
import { Button, Icon } from "@subwallet/react-ui"
import CN from "classnames"
import React from "react"
import { useTranslation } from "react-i18next"
import styled from "styled-components"
import { DiscordLogo, PaperPlaneTilt, TwitterLogo } from "phosphor-react"
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

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props

  return (
    <div className={CN(className)}>
      {socialItems.map((item) => (
        <Button
          className={CN(`type-${item.type}`, "social-button")}
          icon={<Icon phosphorIcon={item.icon} weight="fill" />}
          key={item.type}
          shape="squircle"
        />
      ))}
    </div>
  )
}

const SocialGroup = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    marginTop: "auto",
    paddingBottom: token.paddingXXL - 8,

    "& > *": {
      margin: `0 ${token.marginXS}px`,

      ".social-button": {
        height: "42px",
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
    },
  }
})

export default SocialGroup
