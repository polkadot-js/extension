import { ThemeProps } from "@subwallet-webapp/types/index"
import { Layout } from "@subwallet/react-ui"
import SideMenu from "./SideMenu"
import Header from "./Header"
import CN from "classnames"

export type Props = ThemeProps & {
  children: React.ReactNode | React.ReactNode[]
}

function Component({
  children,
  className,
  theme,
}: Props): React.ReactElement<Props> {
  return (
    <Layout className={CN(className, "layout-container")}>
      <Layout.Sider width={250}>
        <SideMenu />
      </Layout.Sider>

      <Layout.Content className="layout-content">
        <Header />
        {children}
      </Layout.Content>
    </Layout>
  )
}

export default Component
