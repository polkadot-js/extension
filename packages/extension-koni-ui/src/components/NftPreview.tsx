import React from "react";
import styled from "styled-components";
import {ThemeProps} from "@polkadot/extension-koni-ui/types";

interface Props {
  className?: string;
  minimal: boolean;
  data: any;
  onClick: (data) => void;
}

function NftPreview ({className, minimal, data, onClick}: Props): React.ReactElement<Props> {

  return (
    <div
      className={className}
      style={{height: minimal ? '124px': '164px'}}
      onClick={() => onClick(data?.nftItems)}
    >
      <img
        src={'https://kodadot.mypinata.cloud/ipfs/bafkreihgocle6ixnibfgtmdg63t6vrx77rpahutnyhsjsmccub7pq26zjm'}
        className={'collection-thumbnail'}
        alt={'collection-thumbnail'}
        style={{borderRadius: minimal ? '5px' : '5px 5px 0 0'}}
      />

      {
        !minimal &&
        <div className={'collection-title'}>
          <div className={'collection-name'} title={data.collectionName ? data.collectionName : data?.collectionId}>
            {/*show only first 10 characters*/}
            {data.collectionName ? data.collectionName : data?.collectionId}
          </div>
          <div className={'collection-item-count'}>{data?.nftItems.length}</div>
        </div>
      }
    </div>
  )
}

export default styled(NftPreview)(({theme}: ThemeProps) => `
  .nft-preview {
    box-shadow: 0px 0px 3px rgba(0, 0, 0, 0.2);
    width: 124px;
    &:hover {
      cursor: pointer;
    }

    .collection-thumbnail {
      display: block;
      height: 124px;
      width: 124px;
    }

    .collection-name {
      width: 70%
      text-transform: capitalize;
      font-size: 16px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .collection-title {
      height: 40px;
      padding-left: 10px;
      padding-right: 10px;
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
  }

`);
