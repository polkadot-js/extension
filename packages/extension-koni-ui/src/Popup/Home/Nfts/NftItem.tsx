// [object Object]
// SPDX-License-Identifier: Apache-2.0

import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, {useState} from 'react';
import styled from 'styled-components';

import { ThemeProps } from '@polkadot/extension-koni-ui/types';

import logo from '../../../assets/sub-wallet-logo.svg';
import Spinner from "@polkadot/extension-koni-ui/components/Spinner";

interface Props {
  className?: string;
  data: any;
  onClickBack: () => void;
}

function NftItem ({ className, data, onClickBack }: Props): React.ReactElement<Props> {
  const [loading, setLoading] = useState(true);
  const [showImage, setShowImage] = useState(true);

  const propDetail = (title: string, value: string) => {
    return (
      <div className={'prop-detail'}>
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
  }

  const handleOnClick = () => {
    console.log(data?.external_url)
  }

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
        <div className={'header-title'}>
          {data.name ? data.name : '#' + data.id}
        </div>
        <div></div>
      </div>

      <div className={'detail-container'}>
        {
          loading &&
          <Spinner className={'img-spinner'} />
        }
        {
          showImage ?
            <img
              alt={'item-img'}
              className={'item-img'}
              onClick={() => handleOnClick()}
              onLoad={() => handleOnLoad()}
              onError={() => handleImageError()}
              src={data.image ? data?.image : logo}
              style={{ borderRadius: '5px' }}
            />
            :
            <video width="100%" height="416" autoPlay loop={true}>
              <source src={data.image} type="video/mp4"/>
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
                    return propDetail(key, data?.properties[key].value);
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
  }

  .send-button:hover {
    cursor: pointer;
  }

  .item-img {
    display: block;
    height: 416px;
    width: 100%;
    border-radius: 5px;
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
    background: #262C4A;
    box-shadow: 0px 0px 3px rgba(0, 0, 0, 0.15);
    border-radius: 5px;
  }

  .prop-title {
    text-transform: uppercase;
    color: #7B8098;
    font-size: 13px;
  }

  .prop-value {
    font-size: 14px;
  }
`);
