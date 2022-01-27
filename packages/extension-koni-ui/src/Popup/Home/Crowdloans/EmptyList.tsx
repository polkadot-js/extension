import {ThemeProps} from "@polkadot/extension-koni-ui/types";
import styled from "styled-components";
import React from "react";

interface Props extends ThemeProps {
  className?: string;
}

function CrowdloanEmptyList({className}: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      Empty list
    </div>
  );
}

export default styled(CrowdloanEmptyList)(({theme}: Props) => ``);

