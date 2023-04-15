import styled from "styled-components"
import { Button, Icon, Typography } from "@subwallet/react-ui"
import {
  Coin,
  Image,
  ListBullets,
  MagnifyingGlass,
  PlusCircle,
  RocketLaunch,
  SlidersHorizontal,
} from "phosphor-react"
import CN from "classnames"
import { ThemeProps } from "../types"

export enum PAGE_TYPE {
  NFT = "nft",
  TOKEN = "token",
  SEARCH = "search",
  CROWDLOANS = "crowdloans",
  HISTORY = "history",
}

type Props = ThemeProps & {
  pageType: PAGE_TYPE
  className?: string
}

type PageContent = {
  title: string
  icon: PhosphorIcon
  content: string
  button?: {
    label: string
    icon: PhosphorIcon
  }
}

const pageContents: Record<string, PageContent> = {
  [PAGE_TYPE.NFT]: {
    icon: Image,
    title: "No collectible found",
    content: "Your collectibles will appear here",
    button: {
      label: "Import collectible",
      icon: PlusCircle,
    },
  },
  [PAGE_TYPE.TOKEN]: {
    icon: Coin,
    title: "No token found",
    content: "Your token will appear here",
    button: {
      label: "Manage token list",
      icon: SlidersHorizontal,
    },
  },
  [PAGE_TYPE.SEARCH]: {
    icon: MagnifyingGlass,
    title: "No results found",
    content: "Please change your search criteria and try again",
    button: {
      label: "Manage token list",
      icon: SlidersHorizontal,
    },
  },
  [PAGE_TYPE.CROWDLOANS]: {
    icon: RocketLaunch,
    title: "You’ve not participated in any crowdloans",
    content: "Your crowdloans portfolio will appear here",
  },
  [PAGE_TYPE.HISTORY]: {
    icon: ListBullets,
    title: "No transaction found",
    content: "Your transaction history will appear here",
  },
}

const Component: React.FC<Props> = ({ className, pageType }: Props) => {
  const { icon, title, content, button } = pageContents[pageType]
  return (
    <div className={CN(className, "flex-col")}>
      <div className={CN("flex-col", "message-wrapper")}>
        <div className="message-icon">
          <Icon phosphorIcon={icon} weight="fill" iconColor="#737373"/>
          <div className="shape" />
        </div>

        <div className={CN("flex-col", "message-content")}>
          <Typography.Title className="title">{title}</Typography.Title>
          {content && (
            <Typography.Text className="content">{content}</Typography.Text>
          )}
        </div>
      </div>

      {button && (
        <Button
          type="ghost"
          icon={<Icon phosphorIcon={button.icon} />}
          className="action-button"
        >
          {button.label}
        </Button>
      )}
    </div>
  )
}

const NoContent = styled(Component)<Props>(() => {
  return {
    height: "100%",
    justifyContent: "space-between",

    ".message-wrapper": {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",

      ".message-icon": {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: 60,
        height: 'fit-content',
        width: 'fit-content',
        padding: '28px',
        position: 'relative',

        ".shape": {
          opacity: 0.3,
          background: "#4D4D4D",
          borderRadius: "50%",
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          right: 0
        }
      },

      ".message-content": {
        marginTop: 16,
        justifyContent: "center",
        alignItems: "center",

        '& > *': {
          margin: 0
        },

        ".title": {
          fontSize: 16,
          lineHeight: "24px",
        },

        ".content": {
          fontSize: 14,
          lineHeight: "22px",
          color: "rgba(255, 255, 255, 0.45)",
        },
      },
    },

    ".action-button": {
      opacity: 0.45
    },
  }
})

export default NoContent
