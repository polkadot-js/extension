import { Logo3D } from "@subwallet-webapp/components/Logo"
import { ThemeProps } from "@subwallet-webapp/types/index"
import { Layout, Menu, MenuProps } from "@subwallet/react-ui"
import CN from "classnames"
import MenuItem from "@subwallet/react-ui/es/menu/MenuItem"
import {
  Wallet,
  Rocket,
  Database,
  Globe,
  Clock,
  Gear,
  Info,
  MessengerLogo,
  ArrowSquareUpRight,
} from "phosphor-react"

export type Props = ThemeProps

type MenuItem = Required<MenuProps>["items"][number]
type SideMenuItemType = MenuItem & {
  url: string
}

const menuItems: SideMenuItemType[] = [
  {
    label: "Porfolio",
    key: "Porfolio",
    icon: <Wallet height={20} width={20} weight="fill" />,
    url: "/porfolio",
  },
  {
    label: "Crowdloans",
    key: "Crowdloans",
    icon: <Rocket height={20} width={20} weight="fill" />,
    url: "/crowdloans",
  },
  {
    label: "Staking",
    key: "Staking",
    icon: <Database height={20} width={20} weight="fill" />,
    url: "/staking",
  },
  {
    label: "DApps",
    key: "DApps",
    icon: <Globe height={20} width={20} weight="fill" />,
    url: "/dapps",
  },
  {
    label: "History",
    key: "History",
    icon: <Clock height={20} width={20} weight="fill" />,
    url: "/history",
  },
  {
    label: "Settings",
    key: "Settings",
    icon: <Gear height={20} width={20} weight="fill" />,
    url: "/settings",
  },
]

const staticMenuItems: SideMenuItemType[] = [
  {
    label: "FAQs",
    key: "FAQs",
    icon: <Info height={20} width={20} weight="fill" />,
    url: "/faq",
  },
  {
    label: "Contact",
    key: "Contact",
    icon: <MessengerLogo height={20} width={20} weight="fill" />,
    url: "/contact",
  },
  {
    label: "Terms of services",
    key: "Terms of services",
    icon: <ArrowSquareUpRight height={20} width={20} weight="fill" />,
    url: "/tos",
  },
]

function Component({ className }: Props): React.ReactElement<Props> {
  return (
    <div className={CN(className, "flex-col")}>
      <div className="logo-container">
        <Logo3D height={70} width={50} />
      </div>
      <div className={CN("menu-wrapper", "flex-col")}>
        <Menu items={menuItems} />
        <Menu items={staticMenuItems} />
      </div>
    </div>
  )
}

export default Component
