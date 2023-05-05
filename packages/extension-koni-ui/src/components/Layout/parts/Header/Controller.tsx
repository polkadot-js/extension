import { Button, Icon, ModalContext, Typography } from "@subwallet/react-ui"
import CN from "classnames"
import { FadersHorizontal } from "phosphor-react"
import { ThemeProps } from "@subwallet/extension-koni-ui/types"
import Networks from "./Networks"
import Accounts from "./Accounts"
import styled from "styled-components"
import { useCallback, useContext } from "react"
import { CUSTOMIZE_MODAL } from "@subwallet/extension-koni-ui/constants"

export type Props = ThemeProps & {
  title?: string | React.ReactNode;
}

function Component({ title = 'Porfolio', className }: Props): React.ReactElement<Props> {
  const { activeModal } = useContext(ModalContext)

  const onOpenCustomizeModal = useCallback(() => {
    activeModal(CUSTOMIZE_MODAL);
  }, [activeModal]);

  return (
    <div className={CN(className)}>
      <div className="common-header">
        <Typography.Title className="page-name">{title}</Typography.Title>
        <div className="action-group">
          <Button
            icon={<Icon phosphorIcon={FadersHorizontal} size={"sm"} />}
            size={"xs"}
            type={"ghost"}
            onClick={onOpenCustomizeModal}
          />
          <Networks />
          <Accounts />
        </div>
      </div>
    </div>
  )
}

const Controller = styled(Component)<Props>(({ }: Props) => ({
  ".common-header": {
    paddingBottom: 40,
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
        cursor: 'pointer',
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

export default Controller
