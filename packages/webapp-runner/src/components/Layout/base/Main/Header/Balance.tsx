import { NumberItem } from "@subwallet-webapp/components/MetaInfo/parts"
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
    <div className={CN(className, "flex-row")}>
      <div className="balance-item">
        <div className="flex-row">
          <Typography.Text className="balance-title">
            Total balance
          </Typography.Text>
          <Button
            type="ghost"
            className="toggle-show-balance"
            icon={
              <Icon phosphorIcon={displayBalance ? Eye : EyeClosed} size="sm" />
            }
            onClick={() => setDisplayBalance(!displayBalance)}
          />
        </div>
        <NumberItem
          className="balance-value"
          decimalOpacity={0.65}
          size={30}
          value={3399267}
          suffix="$"
          decimals={2}
          subFloatNumber
        />

        <div className="balance-margin"></div>
      </div>

      <div className="balance-item">
        <Typography.Text className="balance-title">
          Total balance
        </Typography.Text>

        <NumberItem
          className="balance-value"
          decimalOpacity={0.65}
          size={30}
          value={3399267}
          suffix="$"
          decimals={2}
          subFloatNumber
        />
      </div>

      <div className="balance-item">
        <Typography.Text className="balance-title">
          Total balance
        </Typography.Text>

        <NumberItem
          className="balance-value"
          decimalOpacity={0.65}
          size={30}
          value={3399267}
          suffix="$"
          decimals={2}
          subFloatNumber
        />
      </div>

      <div className={CN("balance-item", "action-wrapper")}>
        <Typography.Text className="balance-title">Actions</Typography.Text>

        <div className="actions">
          {actions.map((item) => (
            <div key={item.type} className="action-button">
              <Button
                className={CN(`type-${item.type}`)}
                icon={<Icon phosphorIcon={item.icon} weight="fill" />}
                shape="squircle"
                size="sm"
              />
              <Typography.Text>{item.label}</Typography.Text>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const Balance = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "stretch",
  marginBottom: 62,

  ".flex-row": {
    display: "flex",
  },

  ".toggle-show-balance": {
    height: "fit-content",
  },

  ".balance-item": {
    display: "flex",
    flexDirection: "column",

    ".balance-title": {
      marginBottom: 5,
    },
    "&:not(:first-child) > .balance-title": {
      textAlign: "center",
      display: "block",
      width: "100%",
    },

    ".balance-value": {
      margin: "12px 0",
    },
  },

  ".action-wrapper": {
    justifyContent: "space-between",
    ".actions": {
      display: "flex",
      gap: 12,

      ".action-button": {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        marginTop: 20,
      },
    },
  },
}))

export default Balance
