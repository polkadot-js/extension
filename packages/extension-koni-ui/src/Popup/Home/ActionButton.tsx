import React, {useState} from "react";
import Tooltip from "@polkadot/extension-koni-ui/components/Tooltip";
import styled from "styled-components";
import {ThemeProps} from "@polkadot/extension-koni-ui/types";

let tooltipId = 0;

interface Props extends ThemeProps {
  className?: string;
  onClick?: any;
  tooltipContent?: string;
  iconSrc: string;
}

function HomeActionButton({className, onClick, tooltipContent, iconSrc}: Props): React.ReactElement {
  const [trigger] = useState(() => `home-action-button-${++tooltipId}`);

  return (
    <>
      <div className={`home-action-button action-button ${className}`} onClick={onClick} data-for={trigger} data-tip={true}>
        <img src={iconSrc} alt="Icon"/>
      </div>

      {tooltipContent && (
        <Tooltip
          text={tooltipContent}
          trigger={trigger}
        />
      )}
    </>
  );
}

export default styled(HomeActionButton)(({theme}: Props) => `
    width: 48px;
    height: 48px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 40%;
    background-color: ${theme.buttonBackground};
    cursor: pointer;

    img {
      width: 24px;
      height: 24px;
    }
`);
