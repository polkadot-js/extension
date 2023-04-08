import styled from "styled-components"
import Component from "./CreatePassword"
import { PropsType } from "./hook"

const CreatePassword = styled(Component)<PropsType>(
  ({ theme: { token } }: PropsType) => {
    return {
      ".body-container": {
        padding: `0 ${token.padding}px`,
        textAlign: "center",

        ".page-icon": {
          display: "flex",
          justifyContent: "center",
          marginTop: token.margin,
          "--page-icon-color": token.colorSecondary,
        },

        ".title": {
          marginTop: token.margin,
          marginBottom: token.margin * 2,
          fontWeight: token.fontWeightStrong,
          fontSize: token.fontSizeHeading3,
          lineHeight: token.lineHeightHeading3,
          color: token.colorTextBase,
        },
      },

      ".instruction-container": {
        display: "flex",
        flexDirection: "column",
        gap: token.sizeXS,
      },
    }
  }
)

export default CreatePassword
