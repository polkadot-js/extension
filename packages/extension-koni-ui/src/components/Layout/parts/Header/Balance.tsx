import { PhosphorIcon, ThemeProps } from "@subwallet/extension-koni-ui/types"
import { Button, Icon, Typography, Number, Tag, Divider, ModalContext } from "@subwallet/react-ui"
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
import { CustomModal, ReceiveQrModal, TokensSelectorModal } from "@subwallet/extension-koni-ui/components/Modal"
import SendFund from "@subwallet/extension-koni-ui/Popup/Transaction/variants/SendFund"
import Transaction from "@subwallet/extension-koni-ui/Popup/Transaction/Transaction"
import BuyTokens from "@subwallet/extension-koni-ui/Popup/BuyTokens"
import { AccountSelectorModal } from "@subwallet/extension-koni-ui/components/Modal/AccountSelectorModal"

const TRANSFER_FUND_MODAL = 'transfer-fund-modal';
const BUY_TOKEN_MODAL = 'buy-token-modal';

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
  const { accountBalance: { totalBalanceInfo } } = useContext(HomeContext);
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const {
    onOpenReceive,
    accountSelectorItems,
    openSelectAccount,
    openSelectToken,
    selectedAccount,
    selectedNetwork,
    tokenSelectorItems
  } = useReceiveQR();

  const currentAccount = useSelector((state: RootState) => state.accountState.currentAccount);
  const notify = useNotification();

  const isTotalBalanceDecrease = totalBalanceInfo.change.status === 'decrease';
  const totalChangePercent = totalBalanceInfo.change.percent;
  const totalChangeValue = totalBalanceInfo.change.value;
  const totalValue = totalBalanceInfo.convertedValue;

  const onOpenBuyTokens = useCallback(() => {
    activeModal(BUY_TOKEN_MODAL)
  }, [activeModal]);

  const onOpenSendFund = useCallback(() => {
    if (currentAccount && currentAccount.isReadOnly) {
      notify({
        message: t('The account you are using is read-only, you cannot send assets with it'),
        type: 'info',
        duration: 3
      });

      return;
    }

    activeModal(TRANSFER_FUND_MODAL)
  },
  [currentAccount, navigate, notify, t, activeModal]
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
          decimal={0}
          decimalOpacity={0.45}
          suffix='$'
          size={30}
          subFloatNumber
          value={totalValue}
        />
        <div className={'__balance-change-container'}>
          <Number
            className={'__balance-change-value'}
            decimal={0}
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
              decimal={0}
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
          Transferable balance
        </Typography.Text>

        <Number
          className="balance-value"
          decimalOpacity={0.45}
          size={30}
          value={totalValue}
          suffix="$"
          decimal={0}
          subFloatNumber
        />
      </div>

      <Divider className="divider" type="vertical" />

      <div className="balance-item">
        <Typography.Text className="balance-title">
          Locked balance
        </Typography.Text>

        <Number
          className="balance-value"
          decimalOpacity={0.45}
          size={30}
          value={totalValue}
          suffix="$"
          decimal={0}
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
                icon={<Icon phosphorIcon={item.icon} weight="bold" />}
                shape="squircle"
                size="sm"
                onClick={() => handleClick(item.type)}
              />
              <Typography.Text>{item.label}</Typography.Text>
            </div>
          ))}
        </div>
      </div>

      <CustomModal
        id={TRANSFER_FUND_MODAL}
        onCancel={() => inactiveModal(TRANSFER_FUND_MODAL)}
        title={t("Transfer")}
      >
        <Transaction modalContent>
          <SendFund modalContent />
        </Transaction>
      </CustomModal>

      <CustomModal
        id={BUY_TOKEN_MODAL}
        onCancel={() => inactiveModal(BUY_TOKEN_MODAL)}
        title={t("Buy token")}
      >
        <BuyTokens modalContent />
      </CustomModal>

      <AccountSelectorModal
        items={accountSelectorItems}
        onSelectItem={openSelectAccount}
      />

      <TokensSelectorModal
        address={selectedAccount}
        items={tokenSelectorItems}
        onSelectItem={openSelectToken}
      />

      <ReceiveQrModal
        address={selectedAccount}
        selectedNetwork={selectedNetwork}
      />
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
