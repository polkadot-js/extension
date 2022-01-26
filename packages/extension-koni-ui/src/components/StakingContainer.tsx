import {AccountJson} from "@polkadot/extension-base/background/types";
import styled from "styled-components";
import {ThemeProps} from "@polkadot/extension-koni-ui/types";
import React from "react";
import LogosMap from "@polkadot/extension-koni-ui/assets/logo";

interface Props extends AccountJson {
  className?: string;
}


function StakingContainer ({className}: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      <div className={`staking-row`}>
        <img
          alt='logo'
          className={'network-logo'}
          src={LogosMap.acala}
        />
        <div className={'info-wrapper'}>
          <div className={'meta-container'}>
            <div className={'chain-name'}>Polkadot</div>
            <div className={'chain-symbol'}>Dot</div>
          </div>

          <div className={'meta-container'}>
            <div className={'staking-amount'}>0.00000000</div>
            <div className={'chain-unit'}>DOT</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default styled(StakingContainer)(({ theme }: ThemeProps) => `
  width: 100%;

  .staking-row {
    width: 100%;
    display: flex;
    gap: 8px;
  }

  .network-logo {
    display: block;
    width: 56px;
    height: 56px;
  }

  .info-wrapper {
    flex-grow: 1;
    display: flex;
    justify-content: space-between;
  }

  .meta-container {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }


  .chain-name {
    font-size: 16px;
    font-weight: 500;
  }

  .chain-symbol {
    font-size: 14px;
    color: #7B8098;
  }

  .staking-amount {
    font-size: 15px;
    font-weight: 500;
  }

  .chain-unit {
    font-size: 14px;
    font-weight: normal;
  }
`);
