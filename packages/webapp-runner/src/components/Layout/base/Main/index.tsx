import styled from "styled-components"
import Component, { Props } from "./Main"

const Main = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  "& > *": {
    minHeight: "100%",
  },
}))

export default Main
