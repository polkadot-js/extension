import React from "react";
import styled from "styled-components";
import {ThemeProps} from "@polkadot/extension-koni-ui/types";

interface Props {
  className?: string;
}

function NftPreview ({className}: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      <img
        src={'https://kodadot.mypinata.cloud/ipfs/bafkreihgocle6ixnibfgtmdg63t6vrx77rpahutnyhsjsmccub7pq26zjm'}
        className={'collection-thumbnail'}
        alt={'collection-thumbnail'}
      />

      <div className={'collection-title'}>
        <div className={'collection-name'}>
          {/*show only first 10 characters*/}
          Nekoverse
        </div>
        <div className={'collection-item-count'}>1</div>
      </div>
    </div>
  )
}

export default styled(NftPreview)(({theme}: ThemeProps) => `
  box-shadow: 0px 0px 3px rgba(0, 0, 0, 0.2);
  width: 124px;
  height: 164px;
  &:hover {
    cursor: pointer;
  }

  .collection-thumbnail {
    display: block;
    border-radius: 5px 5px 0 0;
    height: 124px;
    width: 124px;
  }

  .collection-name {
    font-size: 16px;
  }

  .collection-title {
    height: 40px;
    padding-left: 10px;
    display: flex;
    align-items: center;
    background-color: #181E42;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.13);
    border-radius: 0 0 5px 5px;
  }

  .collection-item-count {
    font-size: 14px;
    margin-left: 5px;
    font-weight: normal;
    color: #7B8098;
  }
`);
