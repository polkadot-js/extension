import styled from "styled-components"
import Component from "./TokenTable"
import { ThemeProps } from "@subwallet-webapp/types/index"

type Props = ThemeProps & {
  columns: Record<string, any>
  data: Record<string, any>
}

const TokenTable = styled(Component)<Props>(() => {
  return {
    width: "100%",
    color: "red",
    background: "blue",
  }
})

export default TokenTable
