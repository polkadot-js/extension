import Component, { Props } from "./Porfolio"
import styled from "styled-components"

const Porfolio = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    ".right-section": {
      display: "flex",
      alignItems: "center",
    },
  }
})

export default Porfolio
