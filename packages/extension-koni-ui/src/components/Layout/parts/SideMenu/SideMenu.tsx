
import { Menu } from "@subwallet/react-ui"
import CN from "classnames"
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
import { MenuItemType } from "@subwallet/react-ui/es/menu/hooks/useItems"

export type Props = ThemeProps ;

type SideMenuItemType = MenuItemType;

const menuItems: SideMenuItemType[] = [
  {
    label: "Porfolio",
    key: '/home',
    icon: <Wallet height={20} width={20} weight="fill" />,
  },
  {
    label: "Crowdloans",
    key: '/home/crowdloans',
    icon: <Rocket height={20} width={20} weight="fill" />,
  },
  {
    label: "Staking",
    key: '/home/staking',
    icon: <Database height={20} width={20} weight="fill" />,
  },
  {
    label: "DApps",
    key: '/home/dapps',
    icon: <Globe height={20} width={20} weight="fill" />,
  },
  {
    label: "History",
    key: '/home/history',
    icon: <Clock height={20} width={20} weight="fill" />,
  },
  {
    label: "Settings",
    key: '/settings',
    icon: <Gear height={20} width={20} weight="fill" />,
  },
]

const staticMenuItems: SideMenuItemType[] = [
  {
    label: "FAQs",
    key: '/home/faqs',
    icon: <Info height={20} width={20} weight="fill" />,
  },
  {
    label: "Contact",
    key: '/home/contact',
    icon: <MessengerLogo height={20} width={20} weight="fill" />,
  },
  {
    label: "Terms of services",
    key: '/home/tos',
    icon: <ArrowSquareUpRight height={20} width={20} weight="fill" />,
  },
]

function Component({ className }: Props): React.ReactElement<Props> {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // animate sidebar
  // const [isHovered, setHovered] = useState<boolean>(true);

  const handleNavigate = ({ key }: {
    key: string
  }) => navigate(`${key}`)

  return (
    <div
      className={CN(className, "flex-col", "side-menu-wrapper",{
        '__expanded': true
        // '__expanded': isHovered
      })}
    >
      <div className="logo-container">
        <Logo3D />
      </div>
      <div className={CN("menu-wrapper", "flex-col")}>
        <Menu items={menuItems} selectedKeys={[pathname]} onClick={handleNavigate} />
        <Menu items={staticMenuItems} selectedKeys={[pathname]} onClick={handleNavigate} />
      </div>
    </div>
  )
}

export default Component;
