import styled from "styled-components"
import Component, { Props } from "./Main"

const Main = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  "& > *": {
    minHeight: "100%",
  },

  ".layout-content": {
    padding: "20px 36px 80px 44px",
  },
}))

export default Main
