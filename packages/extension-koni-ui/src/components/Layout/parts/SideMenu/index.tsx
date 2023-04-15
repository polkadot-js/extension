import styled from "styled-components"
import Component, { Props } from "./SideMenu"

const SideMenu = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  background: "#1A1A1A",

  ".flex-col": {
    display: "flex",
    flexDirection: "column",
  },

  ".logo-container": {
    padding: `${token.paddingXXL - 8}px 0`,
    display: "flex",
    justifyContent: "center",
  },

  ".menu-wrapper": {
    justifyContent: "space-between",
    height: "100%",

    ".ant-menu-item": {
      backgroundColor: "#1A1A1A",
      display: "flex",
      alignItems: "center",
      width: "100%",
      padding: token.paddingMD,
      height: 52,
      margin: 0,
      opacity: 0.65,
      borderRadius: 0,
    },

    ".ant-menu-item-selected": {
      borderRight: `4px solid ${token.colorPrimary}`,
      ".ant-menu-item-icon": {
        color: token.colorPrimary,
      },
      ".ant-menu-title-content": {
        color: "white",
        background: "transparent",
      },
    },
  },
}))

export default SideMenu
