// [object Object]
// SPDX-License-Identifier: Apache-2.0

import React, { useState } from 'react';
import styled from 'styled-components';

import logo from '@polkadot/extension-koni-ui/assets/sub-wallet-logo.svg';
import Spinner from '@polkadot/extension-koni-ui/components/Spinner';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

interface Props {
  className?: string;
  data: any;
  onClick: (data: any) => void;
}

function NftCollectionPreview ({ className, data, onClick }: Props): React.ReactElement<Props> {
  const [loading, setLoading] = useState(true);

  const handleOnLoad = () => {
    setLoading(false);
  };

  return (
    <div className={className}>
      <div
        className={'nft-preview'}
        onClick={() => onClick(data)}
        style={{ height: '164px' }}
      >
        <div className={'img-container'}>
          {
            loading &&
            <Spinner className={'img-spinner'} />
          }
          <img
            alt={'collection-thumbnail'}
            className={'collection-thumbnail'}
            onLoad={() => handleOnLoad()}
            src={data.image ? data?.image : logo}
            style={{ borderRadius: '5px 5px 0 0', opacity: loading ? '0.3' : '1' }}
          />
        </div>

        <div className={'collection-title'}>
          <div
            className={'collection-name'}
            title={data.collectionName ? data.collectionName : data?.collectionId}
          >
            {/* show only first 10 characters */}
            {data.collectionName ? data.collectionName : data?.collectionId}
          </div>
          <div className={'collection-item-count'}>{data?.nftItems.length}</div>
        </div>
      </div>
    </div>
  );
}

export default styled(NftCollectionPreview)(({ theme }: ThemeProps) => `
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
