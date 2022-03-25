// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { NftItem } from '@polkadot/extension-base/background/KoniTypes';
import logo from '@polkadot/extension-koni-ui/assets/sub-wallet-logo.svg';
import Spinner from '@polkadot/extension-koni-ui/components/Spinner';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

interface Props {
  className?: string;
  data: NftItem;
  onClick: (data: any) => void;
  collectionImage?: string;
}

function NftItemPreview ({ className, collectionImage, data, onClick }: Props): React.ReactElement<Props> {
  const [loading, setLoading] = useState(true);
  const [showImage, setShowImage] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleOnLoad = useCallback(() => {
    setLoading(false);
  }, []);

  const handleOnClick = useCallback(() => {
    onClick(data);
  }, [data, onClick]);

  const handleImageError = useCallback(() => {
    setLoading(false);
    setShowImage(false);
  }, []);

  const handleVideoError = useCallback(() => {
    setImageError(true);
    setShowImage(true);
  }, []);

  const getItemImage = useCallback(() => {
    if (data.image && !imageError) return data.image;
    else if (collectionImage) return collectionImage;

    return logo;
  }, [collectionImage, data.image, imageError]);

  return (
    <div className={className}>
      <div
        className={'nft-preview'}
        onClick={handleOnClick}
        style={{ height: '124px' }}
      >
        <div className={'img-container'}>
          {
            loading &&
            <Spinner className={'img-spinner'} />
          }
          {
            showImage
              ? <img
                alt={'collection-thumbnail'}
                className={'collection-thumbnail'}
                onError={handleImageError}
                onLoad={handleOnLoad}
                src={getItemImage()}
                style={{ borderRadius: '5px' }}
              />
              : <video
                autoPlay
                height='124'
                loop={true}
                onError={handleVideoError}
                width='124'
              >
                <source
                  src={getItemImage()}
                  type='video/mp4'
                />
              </video>
          }
          {/* // <img */}
          {/* //   alt={'collection-thumbnail'} */}
          {/* //   className={'collection-thumbnail'} */}
          {/* //   onLoad={() => handleOnLoad()} */}
          {/* //   onError={() => handleImageError()} */}
          {/* //   src={data.image ? data?.image : logo} */}
          {/* //   style={{ borderRadius: '5px' }} */}
          {/* // /> */}
        </div>
      </div>
    </div>
  );
}

export default React.memo(styled(NftItemPreview)(({ theme }: ThemeProps) => `
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
      object-fit: contain;
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
`));
