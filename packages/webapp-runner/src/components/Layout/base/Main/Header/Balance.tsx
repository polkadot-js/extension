import { PhosphorIcon, ThemeProps } from "@subwallet-webapp/types/index"
import { Button, Icon, Typography } from "@subwallet/react-ui"
import CN from "classnames"
import {
  EyeClosed,
  Eye,
  ArrowFatLineDown,
  PaperPlaneTilt,
  ShoppingCartSimple,
} from "phosphor-react"
import { useState } from "react"
import styled from "styled-components"

export type Props = ThemeProps

type Action = {
  label: string
  type: string
  icon: PhosphorIcon
  onClick?: () => void
}

const actions: Action[] = [
  {
    label: "Receive",
    type: "receive",
    icon: ArrowFatLineDown,
  },
  {
    label: "Send",
    type: "send",
    icon: PaperPlaneTilt,
  },
  {
    label: "Buy",
    type: "buys",
    icon: ShoppingCartSimple,
  },
]

function Component({ className }: Props): React.ReactElement<Props> {
  const [displayBalance, setDisplayBalance] = useState<boolean>(false)

  return (
    <div className={CN(className, "balance-container")}>
      <div className="balance-item">
        <div>
          <Typography.Text className="balance-title">
            Total balance
          </Typography.Text>
          <Button
            type="ghost"
            icon={
              <Icon phosphorIcon={displayBalance ? Eye : EyeClosed} size="sm" />
            }
            onClick={() => setDisplayBalance(!displayBalance)}
          />
        </div>
        <Typography.Title className="balance-value">
          $33,992.67
        </Typography.Title>
        <div className="balance-margin"></div>
      </div>

      <div className="balance-item">
        <Typography.Text className="balance-title">
          Total balance
        </Typography.Text>

        <Typography.Title className="balance-value">
          $33,992.67
        </Typography.Title>
      </div>

      <div className="balance-item">
        <Typography.Text className="balance-title">
          Total balance
        </Typography.Text>

        <Typography.Title className="balance-value">
          $33,992.67
        </Typography.Title>
      </div>

      <div className={CN("balance-item", "action-wrapper")}>
        <Typography.Text className="balance-title">Actions</Typography.Text>

        <div className="actions">
          {actions.map((item) => (
            <Button
              className={CN(`type-${item.type}`, "social-button")}
              icon={<Icon phosphorIcon={item.icon} weight="fill" />}
              key={item.type}
              shape="squircle"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

const Balance = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  ".common-header": {
    padding: "24px 36px 40px 44px",
    display: "flex",
    justifyContent: "space-between",

    ".page-name": {
      fontSize: 30,
      lineHeight: "38px",
      color: "#FFF",
      margin: 0,
    },

    ".action-group": {
      display: "flex",
      justifyContent: "center",
      ".ava-group": {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        margin: "0 4px",
        padding: "8px 16px",

        background: "#1A1A1A",
        borderRadius: 32,
        ".__account-item": {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        },
      },
    },
  },
}))

export default Balance
