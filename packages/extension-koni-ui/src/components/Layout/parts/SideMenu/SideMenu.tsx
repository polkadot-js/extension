
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
import { Logo3D } from "@subwallet/extension-koni-ui/components/Logo"
import { ThemeProps } from "@subwallet/extension-koni-ui/types"
import { useLocation, useNavigate } from "react-router"

export type Props = ThemeProps;

type MenuItem = Required<MenuProps>["items"][number]
type SideMenuItemType = MenuItem;

const menuItems: SideMenuItemType[] = [
  {
    label: "Porfolio",
    key: "porfolio",
    icon: <Wallet height={20} width={20} weight="fill" />,
  },
  {
    label: "Crowdloans",
    key: "crowdloans",
    icon: <Rocket height={20} width={20} weight="fill" />,
  },
  {
    label: "Staking",
    key: "staking",
    icon: <Database height={20} width={20} weight="fill" />,
  },
  {
    label: "DApps",
    key: "dapps",
    icon: <Globe height={20} width={20} weight="fill" />,
  },
  {
    label: "History",
    key: "history",
    icon: <Clock height={20} width={20} weight="fill" />,
  },
  {
    label: "Settings",
    key: "settings",
    icon: <Gear height={20} width={20} weight="fill" />,
  },
]

const staticMenuItems: SideMenuItemType[] = [
  {
    label: "FAQs",
    key: "faqs",
    icon: <Info height={20} width={20} weight="fill" />,
  },
  {
    label: "Contact",
    key: "contact",
    icon: <MessengerLogo height={20} width={20} weight="fill" />,
  },
  {
    label: "Terms of services",
    key: "tos",
    icon: <ArrowSquareUpRight height={20} width={20} weight="fill" />,
  },
]

function Component({ className }: Props): React.ReactElement<Props> {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleNavigate = ({ key }: {
    key: string
  }) => navigate(`/${key}`)

  return (
    <div className={CN(className, "flex-col")}>
      <div className="logo-container">
        <Logo3D height={70} width={50} />
      </div>
      <div className={CN("menu-wrapper", "flex-col")}>
        <Menu items={menuItems} selectedKeys={[pathname.split('/')[1]]} onClick={handleNavigate} />
        <Menu items={staticMenuItems} selectedKeys={[pathname.split('/')[1]]} onClick={handleNavigate} />
      </div>
    </div>
  )
}

export default Component
