import styled from "styled-components"
import Component, { Props } from "./Header"

const Header = styled(Component)<Props>(({ theme: { token } }: Props) => ({
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

export default Header
