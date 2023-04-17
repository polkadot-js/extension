import { NumberItem } from "@subwallet/extension-koni-ui/components/MetaInfo/parts"
import { PhosphorIcon, ThemeProps } from "@subwallet/extension-koni-ui/types"
import { Button, Icon, Typography, Number, SwNumberProps, Tag, Divider } from "@subwallet/react-ui"
import CN from "classnames"
import {
  EyeClosed,
  Eye,
  ArrowFatLineDown,
  PaperPlaneTilt,
  ShoppingCartSimple,
} from "phosphor-react"
import { useContext, useState } from "react"
import styled from "styled-components"
import { useCallback } from "react"
import { useNavigate } from "react-router"
import { useNotification, useReceiveQR, useTranslation } from "@subwallet/extension-koni-ui/hooks"
import { useSelector } from 'react-redux';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { HomeContext } from "@subwallet/extension-koni-ui/contexts/screen/HomeContext"

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

  const navigate = useNavigate();
  const { t } = useTranslation();
  const { accountBalance: { tokenGroupBalanceMap,
    totalBalanceInfo }, tokenGroupStructure: { sortedTokenGroups } } = useContext(HomeContext);

  const { accountSelectorItems,
    onOpenReceive,
    openSelectAccount,
    openSelectToken,
    selectedAccount,
    selectedNetwork,
    tokenSelectorItems } = useReceiveQR();
  const currentAccount = useSelector((state: RootState) => state.accountState.currentAccount);
  const notify = useNotification();

  const isTotalBalanceDecrease = totalBalanceInfo.change.status === 'decrease';
  const totalChangePercent = totalBalanceInfo.change.percent;
  const totalChangeValue = totalBalanceInfo.change.value;
  const totalValue = totalBalanceInfo.convertedValue;

  const onOpenBuyTokens = useCallback(() => {
    navigate('/buy-tokens');
  },
  [navigate]
  );

  const onOpenSendFund = useCallback(() => {
    if (currentAccount && currentAccount.isReadOnly) {
      notify({
        message: t('The account you are using is read-only, you cannot send assets with it'),
        type: 'info',
        duration: 3
      });

      return;
    }

    navigate('/transaction/send-fund');
  },
  [currentAccount, navigate, notify, t]
  );

  const handleClick = useCallback((type: string) => {
    switch (type) {
      case 'buys': return onOpenBuyTokens()
      case 'send': return onOpenSendFund()
      case 'receive': return onOpenReceive()
      default: return;
    }
  }, [
    onOpenSendFund,
    onOpenBuyTokens,
    onOpenReceive
  ])

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
        <Number
          className={'balance-value'}
          decimal={2}
          decimalOpacity={0.45}
          suffix='$'
          size={30}
          subFloatNumber
          value={3399327}
        />
        <div className={'__balance-change-container'}>
          <Number
            className={'__balance-change-value'}
            decimal={2}
            decimalOpacity={1}
            prefix={isTotalBalanceDecrease ? '- $' : '+ $'}
            value={totalChangeValue}
            size={10}
          />
          <Tag
            className={`__balance-change-percent ${isTotalBalanceDecrease ? '-decrease' : ''}`}
            shape={'round'}
          >
            <Number
              decimal={2}
              decimalOpacity={1}
              prefix={isTotalBalanceDecrease ? '-' : '+'}
              suffix={'%'}
              value={totalChangePercent}
              weight={700}
              size={10}
            />
          </Tag>
        </div>
      </div>

      <Divider className="divider" type="vertical" />

      <div className="balance-item">
        <Typography.Text className="balance-title">
          Total balance
        </Typography.Text>

        <Number
          className="balance-value"
          decimalOpacity={0.65}
          size={30}
          value={3399267}
          suffix="$"
          decimal={2}
          subFloatNumber
        />
      </div>

      <Divider className="divider" type="vertical" />

      <div className="balance-item">
        <Typography.Text className="balance-title">
          Total balance
        </Typography.Text>

        <Number
          className="balance-value"
          decimalOpacity={0.65}
          size={30}
          value={3399267}
          suffix="$"
          decimal={2}
          subFloatNumber
        />
      </div>

      <Divider className="divider" type="vertical" />

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
                onClick={() => handleClick(item.type)}
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

  ".divider": {
    alignSelf: "stretch",
    height: "unset",
  },

  ".flex-row": {
    display: "flex",
  },

  ".toggle-show-balance": {
    height: "fit-content",
  },

  ".balance-item": {
    display: "flex",
    flexDirection: "column",
    flex: 1,

    "&:not(:first-child)": {
      alignItems: 'center',
    },

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

  '.__balance-change-container': {
    display: 'flex',
    justifyContent: 'start',
    alignItems: 'flex-end',

    '.ant-typography': {
      lineHeight: 'inherit',
      // todo: may update number component to clear this !important
      color: 'inherit !important',
    }
  },

  '.__balance-change-value': {
    marginRight: token.sizeSM,
    lineHeight: token.lineHeight
  },

  '.__balance-change-percent': {
    backgroundColor: token['cyan-6'],
    color: token['green-1'],
    marginInlineEnd: 0,
    display: 'flex',

    '&.-decrease': {
      backgroundColor: token.colorError,
      color: token.colorTextLight1
    },

    '.ant-number': {
      fontSize: token.fontSizeXS
    }
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
