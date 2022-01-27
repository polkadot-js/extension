import {ThemeProps} from "@polkadot/extension-koni-ui/types";
import styled from "styled-components";
import React from "react";

interface Props extends ThemeProps {
  className?: string;
}

function TransactionHistoryEmptyList({className}: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      Empty list
    </div>
  );
}

export default styled(TransactionHistoryEmptyList)(({theme}: Props) => ``);
