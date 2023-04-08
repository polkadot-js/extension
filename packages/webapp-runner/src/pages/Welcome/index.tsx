import LoginBg from "@subwallet-webapp/assets/WelcomeBg.png"
import Component, { Props } from "./Welcome"
import styled from "styled-components"
import {
  ATTACH_ACCOUNT_MODAL,
  CREATE_ACCOUNT_MODAL,
  IMPORT_ACCOUNT_MODAL,
  DOWNLOAD_EXTENSION,
} from "@subwallet-webapp/constants/modal"

const Welcome = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    position: "relative",

    ".flex-column": {
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-around",
      alignItems: "center",
    },

    ".bg-gradient": {
      background:
        "linear-gradient(180deg, rgba(0, 75, 255, 0.1) 16.47%, rgba(217, 217, 217, 0) 94.17%)",
      height: 290,
      width: "100%",
      position: "absolute",
      left: 0,
      top: 0,
    },

    ".bg-image": {
      backgroundImage: `url(${LoginBg})`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "top",
      backgroundSize: "contain",
      height: "100%",
      position: "absolute",
      width: "100%",
      left: 0,
      top: 0,
      opacity: 0.1,
    },

    ".body-container": {
      padding: `0 ${token.padding}px`,
      textAlign: "center",
      height: "100%",
      width: "fit-content",
      margin: "0 auto",

      ".logo-container": {
        marginTop: token.sizeLG * 3,
        color: token.colorTextBase,
      },

      ".title": {
        marginTop: token.marginSM + 4,
        marginBottom: token.marginXS,
        fontWeight: token.fontWeightStrong,
        fontSize: token.fontSizeHeading1,
        lineHeight: token.lineHeightHeading1,
        color: token.colorTextBase,
      },

      ".sub-title": {
        // marginTop: token.marginXS,
        // marginBottom: token.sizeLG * 3,
        fontSize: token.fontSizeHeading5,
        lineHeight: token.lineHeightHeading5,
        color: token.colorTextLight3,
      },

      ".buttons-container": {
        marginBottom: token.marginXL,
        marginTop: token.marginXXL * 2,

        ".divider": {
          marginTop: token.marginLG + 2,
        },

        ".buttons": {
          display: "grid",
          // flexDirection: "column",
          gridTemplateRows: "1fr 1fr",
          gridTemplateColumns: "1fr 1fr",
          gap: token.sizeMS,

          [`.type-${CREATE_ACCOUNT_MODAL}`]: {
            color: token["green-6"],
          },

          [`.type-${IMPORT_ACCOUNT_MODAL}`]: {
            color: token["orange-7"],
          },

          [`.type-${ATTACH_ACCOUNT_MODAL}`]: {
            color: token["magenta-6"],
          },
          [`.type-${DOWNLOAD_EXTENSION}`]: {
            color: "#4CEAAC",
          },

          ".welcome-import-button": {
            height: "auto",
            width: "100%",
            paddingRight: token.sizeXL,

            ".welcome-import-icon": {
              height: token.sizeLG,
              width: token.sizeLG,
              marginLeft: token.sizeMD - token.size,
            },

            ".welcome-import-button-content": {
              display: "flex",
              flexDirection: "column",
              gap: token.sizeXXS,
              fontWeight: token.fontWeightStrong,
              padding: `${token.paddingSM - 1}px ${token.paddingLG}px`,
              textAlign: "start",

              ".welcome-import-button-title": {
                fontSize: token.fontSizeHeading5,
                lineHeight: token.lineHeightHeading5,
                color: token.colorTextBase,
              },

              ".welcome-import-button-description": {
                fontSize: token.fontSizeHeading6,
                lineHeight: token.lineHeightHeading6,
                color: token.colorTextLabel,
              },
            },
          },
        },
      },

      ".add-wallet-container": {
        width: "50%",
        alignItems: "stretch",

        ".address-input": {
          margin: `${token.marginSM + 4}px 0`,
        },
      },
    },
  }
})

export default Welcome
