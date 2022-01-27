import React, {useState} from "react";
import logo from "@polkadot/extension-koni-ui/assets/sub-wallet-logo.svg";
import LazyLoad from 'react-lazyload';
import styled from "styled-components";
import {ThemeProps} from "@polkadot/extension-koni-ui/types";
import Spinner from "@polkadot/extension-koni-ui/components/Spinner";

interface Props {
  className?: string;
  data: any;
  onClick: (data: any) => void;
}

function NftCollectionPreview ({className, data, onClick}: Props): React.ReactElement<Props> {
  const [loading, setLoading] = useState(true)

  const handleOnLoad = () => {
    setLoading(false)
  }

  return (
    <div className={className}>
      <LazyLoad>
        <div
          className={'nft-preview'}
          style={{height:'164px'}}
          onClick={() => onClick(data)}
        >
          <div className={`img-container`}>
            {
              loading &&
              <Spinner className={'img-spinner'}/>
            }
            <img
              src={data.image ? data?.image : logo}
              className={'collection-thumbnail'}
              alt={'collection-thumbnail'}
              style={{borderRadius: '5px 5px 0 0', opacity: loading ? '0.3' : '1'}}
              onLoad={() => handleOnLoad()}
            />
          </div>

          <div className={'collection-title'}>
            <div className={'collection-name'} title={data.collectionName ? data.collectionName : data?.collectionId}>
              {/*show only first 10 characters*/}
              {data.collectionName ? data.collectionName : data?.collectionId}
            </div>
            <div className={'collection-item-count'}>{data?.nftItems.length}</div>
          </div>
        </div>
      </LazyLoad>
    </div>
  )
}

export default styled(NftCollectionPreview)(({theme}: ThemeProps) => `
  .img-container {
    position: relative;
    height: 124px;
    width: 124px;
  }

  .img-spinner {
    top: 50%;
  }

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
      object-fit: cover;
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
