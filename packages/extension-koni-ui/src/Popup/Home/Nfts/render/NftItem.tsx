// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { CurrentNetworkInfo, NetWorkMetadataDef, NftItem as _NftItem } from '@polkadot/extension-base/background/KoniTypes';
import { ActionContext } from '@polkadot/extension-koni-ui/components';
import Spinner from '@polkadot/extension-koni-ui/components/Spinner';
import useToast from '@polkadot/extension-koni-ui/hooks/useToast';
import { tieAccount } from '@polkadot/extension-koni-ui/messaging';
import { RootState, store } from '@polkadot/extension-koni-ui/stores';
import { TransferNftParams } from '@polkadot/extension-koni-ui/stores/types';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { isAccountAll } from '@polkadot/extension-koni-ui/util';

import logo from '../../../../assets/sub-wallet-logo.svg';

interface Props {
  className?: string;
  data: _NftItem;
  onClickBack: () => void;
  collectionImage?: string;
  collectionId: string;
}

const SUPPORTED_TRANSFER_CHAIN = [
  'statemine',
  'acala',
  'karura',
  'kusama',
  'uniqueNft',
  'quartz',
  'opal',
  'statemint'
];

function updateTransferNftParams (nftItem: _NftItem, collectionImage: string | undefined, collectionId: string) {
  store.dispatch({ type: 'transferNftParams/update', payload: { nftItem, collectionImage, collectionId } as TransferNftParams });
}

function updateCurrentNetwork (networkMetadata: NetWorkMetadataDef) {
  const newState = {
    networkPrefix: networkMetadata.ss58Format,
    icon: networkMetadata.icon,
    genesisHash: networkMetadata.genesisHash,
    networkKey: networkMetadata.networkKey,
    isEthereum: networkMetadata.isEthereum
  } as CurrentNetworkInfo;

  store.dispatch({ type: 'currentNetwork/update', payload: newState });
}

function NftItem ({ className, collectionId, collectionImage, data, onClickBack }: Props): React.ReactElement<Props> {
  const [loading, setLoading] = useState(true);
  const [showImage, setShowImage] = useState(true);
  const [imageError, setImageError] = useState(false);
  const { currentAccount: account, currentNetwork, networkMetadata } = useSelector((state: RootState) => state);

  const navigate = useContext(ActionContext);
  const { show } = useToast();

  const propDetail = (title: string, value: string, rarity: number, key: number) => {
    return (
      <div
        className={'prop-detail'}
        key={key}
      >
        <div className={'prop-title'}>{title}</div>
        <div className={'prop-value'}>{value}
          {/* {rarity && `(~${Math.round((rarity + Number.EPSILON) * 100) / 100}%)`} */}
        </div>
      </div>
    );
  };

  const handleClickTransfer = useCallback(async () => {
    if (!account.account || account.account.address === 'ALL' || !data.chain) {
      show('An error has occurred.');

      return;
    }

    if (SUPPORTED_TRANSFER_CHAIN.indexOf(data.chain) <= -1) {
      show(`Transferring is not supported for ${data.chain.toUpperCase()} network`);

      return;
    }

    if (data.chain !== currentNetwork.networkKey) {
      const targetNetwork = networkMetadata[data?.chain];

      if (!isAccountAll(account.account.address)) {
        await tieAccount(account.account.address, targetNetwork.genesisHash);
      } else {
        window.localStorage.setItem('accountAllNetworkGenesisHash', targetNetwork.genesisHash);
      }

      updateCurrentNetwork(targetNetwork);
    }

    updateTransferNftParams(data, collectionImage, collectionId);
    navigate('/account/send-nft');
  }, [account.account, collectionId, collectionImage, currentNetwork.networkKey, data, navigate, networkMetadata, show]);

  const handleClickBack = useCallback(() => {
    onClickBack();
  }, [onClickBack]);

  const handleOnLoad = useCallback(() => {
    setLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setLoading(false);
    setShowImage(false);
  }, []);

  const handleVideoError = useCallback(() => {
    setImageError(true);
    setShowImage(true);
  }, []);

  const handleOnClick = useCallback(() => {
    if (data.external_url) {
      // eslint-disable-next-line no-void
      void chrome.tabs.create({ url: data?.external_url, active: true }).then(() => console.log('redirecting'));
    }
  }, [data]);

  const getItemImage = useCallback(() => {
    if (data.image && !imageError) return data.image;
    else if (collectionImage) return collectionImage;

    return logo;
  }, [collectionImage, data, imageError]);

  return (
    <div className={className}>
      <div>
        <div className={'header'}>
          <div
            className={'back-icon'}
            onClick={handleClickBack}
          >
            <FontAwesomeIcon
              className='arrowLeftIcon'
              // @ts-ignore
              icon={faArrowLeft}
            />
          </div>
          <div
            className={'header-title'}
            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
            title={data.name ? data.name : '#' + data.id}
          >
            <div className={'collection-name'}>
              {/* eslint-disable-next-line @typescript-eslint/restrict-plus-operands */}
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
                onClick={handleOnClick}
                onError={handleImageError}
                onLoad={handleOnLoad}
                src={getItemImage()}
                style={{ borderRadius: '5px' }}
              />
              : <video
                autoPlay
                height='416'
                loop={true}
                onError={handleVideoError}
                width='100%'
              >
                <source
                  src={getItemImage()}
                  type='video/mp4'
                />
              </video>
          }

          {
            // @ts-ignore
            account.account.address !== 'ALL' &&
            <div className={'send-container'}>
              <div
                className={'send-button'}
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                onClick={handleClickTransfer}
              >
                Send
              </div>
            </div>
          }

          {
            data.description &&
            <div>
              <div className={'att-title'}>Description</div>
              <div className={'att-value'}><pre>{data?.description}</pre></div>
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
                    // eslint-disable @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
                    // @ts-ignore
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
                    return propDetail(key, data?.properties[key]?.value, data?.properties[key]?.rarity, index);
                    // eslint-enable @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
                  })
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  );
}

export default React.memo(styled(NftItem)(({ theme }: ThemeProps) => `
  padding-bottom: 20px;

  pre {
    white-space: pre-wrap;
    word-break: keep-all;
  }

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

  .send-container {
    margin-top: 20px;
  }

  .send-error {
    color: red;
    font-size: 14px;
    text-transform: uppercase;
  }

  .send-button {
    margin-top: 5px;
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
    height: 402px;
    width: 100%;
    border-radius: 5px;
    cursor: pointer;
    object-fit: contain;
  }

  .att-title {
    font-size: 16px;
    font-weight: 500;
    margin-top: 20px;
  }

  .att-value {
    font-size: 15px;
    color: #7B8098;
    word-break: break-all;
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
`));
