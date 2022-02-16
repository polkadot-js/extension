// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import styled from 'styled-components';

import Spinner from '@polkadot/extension-koni-ui/components/Spinner';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

import logo from '../../../assets/sub-wallet-logo.svg';

interface Props {
  className?: string;
  data: any;
  onClickBack: () => void;
}

function NftItem ({ className, data, onClickBack }: Props): React.ReactElement<Props> {
  const [loading, setLoading] = useState(true);
  const [showImage, setShowImage] = useState(true);

  const propDetail = (title: string, value: string, key: number) => {
    return (
      <div className={'prop-detail'} key={key}>
        <div className={'prop-title'}>{title}</div>
        <div className={'prop-value'}>{value}</div>
      </div>
    );
  };

  const handleOnLoad = () => {
    setLoading(false);
  };

  const handleImageError = () => {
    setLoading(false);
    setShowImage(false);
  };

  const handleOnClick = () => {
    if (data.external_url) {
      chrome.tabs.create({ url: data?.external_url, active: true }).then(() => console.log('redirecting'));
    }
  };

  return (
    <div className={className}>
      <div className={'header'}>
        <div
          className={'back-icon'}
          onClick={() => onClickBack()}
        >
          <FontAwesomeIcon
            className='arrowLeftIcon'
            icon={faArrowLeft}
          />
        </div>
        <div
          className={'header-title'}
          title={data.name ? data.name : '#' + data.id}
        >
          <div className={'collection-name'}>
            {data.name ? data.name : '#' + data.id}
          </div>
        </div>
        <div></div>
      </div>

      <div className={'detail-container'}>
        {
          loading &&
          <Spinner className={'img-spinner'} />
        }
        {
          showImage
            ? <img
              alt={'item-img'}
              className={'item-img'}
              onClick={() => handleOnClick()}
              onError={() => handleImageError()}
              onLoad={() => handleOnLoad()}
              src={data.image ? data?.image : logo}
              style={{ borderRadius: '5px' }}
              />
            : <video
              autoPlay
              height='416'
              loop={true}
              width='100%'
            >
              <source
                src={data.image}
                type='video/mp4'
              />
            </video>
        }
        <div className={'send-button'}>Send</div>
        {
          data.description &&
            <div>
              <div className={'att-title'}>Description</div>
              <div className={'att-value'}>{data?.description}</div>
            </div>
        }
        {
          data.rarity &&
          <div>
            <div className={'att-title'}>Rarity</div>
            <div className={'att-value'}>{data?.rarity}</div>
          </div>
        }
        {
          data.properties &&
            <div>
              <div className={'att-title'}>Properties</div>
              <div className={'prop-container'}>
                {
                  Object.keys(data?.properties).map((key, index) => {
                    return propDetail(key, data?.properties[key].value, index);
                  })
                }

                {/* {data?.properties.map((item: any) => { */}
                {/*  return propDetail(item) */}
                {/* })} */}
              </div>
            </div>
        }
      </div>
    </div>
  );
}

export default styled(NftItem)(({ theme }: ThemeProps) => `
  padding-bottom: 20px;
  .img-container {
    position: relative;
    height: 124px;
    width: 124px;
  }

  .back-icon:hover {
    cursor: pointer;
  }

  .header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .header-title {
    width: 50%;
    display: flex;
    justify-content: center;
    margin-bottom: 12px;
  }

  .collection-name {
    font-size: 20px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .send-button {
    margin-top: 20px;
    background: #004BFF;
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px;
    color: #FFFFFF;
  }

  .send-button:hover {
    cursor: pointer;
  }

  .item-img {
    display: block;
    height: 416px;
    width: 100%;
    border-radius: 5px;
    cursor: pointer;
  }

  .att-title {
    font-size: 16px;
    font-weight: 500;
    margin-top: 20px;
  }

  .att-value {
    font-size: 15px;
    color: #7B8098;
  }

  .prop-container {
    margin-top: 5px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .prop-detail {
    padding: 5px 10px;
    background: ${theme.popupBackground};
    box-shadow: 0px 0px 3px rgba(0, 0, 0, 0.15);
    border-radius: 5px;
  }

  .prop-title {
    text-transform: uppercase;
    color: ${theme.iconNeutralColor};
    font-size: 13px;
  }

  .prop-value {
    font-size: 14px;
  }
`);
