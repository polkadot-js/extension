import React, {useState} from "react";
import styled from "styled-components";
import {ThemeProps} from "@polkadot/extension-koni-ui/types";
import {faArrowLeft} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import NftItem from "@polkadot/extension-koni-ui/components/NftItem";
import logo from '../assets/sub-wallet-logo.svg';

interface Props {
  className?: string;
  data: any;
  onClickBack: () => void;
}

function NftCollection ({className, data, onClickBack}: Props): React.ReactElement<Props> {
  const [chosenItem, setChosenItem] = useState()
  const [showItemDetail, setShowItemDetail] = useState(false)

  const handleShowItem = (data: any) => {
    setChosenItem(data)
    setShowItemDetail(true)
  }

  const NftItemPreview = (itemData: any) => {
    return (
      <div
        className={'nft-preview'}
        style={{height:'124px'}}
        onClick={() => handleShowItem(itemData)}
      >
        <img
          src={itemData.image ? itemData?.image : logo}
          className={'collection-thumbnail'}
          alt={'collection-thumbnail'}
          style={{borderRadius: '5px'}}
        />
      </div>
    )
  }

  return (
    <div className={className}>
      {
        !showItemDetail &&
        <div>
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
            <div className={'header-title'} title={data.collectionName ? data?.collectionName : data?.collectionId}>
              <div className={'collection-name'}>{data.collectionName ? data?.collectionName : data?.collectionId}</div>
              <div className={'collection-item-count'}>{data?.nftItems.length}</div>
            </div>
            <div></div>
          </div>
          <div className={'grid-container'}>
            {
              data?.nftItems.length > 0 &&
              data?.nftItems.map((item: any, index: React.Key | null | undefined) => {
                return NftItemPreview(item)
              })
            }
          </div>
        </div>
      }

      {
        showItemDetail && <NftItem data={chosenItem} onClickBack={() => setShowItemDetail(false)}/>
      }

    </div>
  )
}

export default styled(NftCollection)(({theme}: ThemeProps) => `
  .grid-container {
    width: 100%;
    display: grid;
    column-gap: 20px;
    row-gap: 20px;
    justify-items: center;
    grid-template-columns: repeat(3, 1fr);
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
    width: 60%;
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-bottom: 12px;
  }

  .collection-name {
    font-size: 20px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .collection-item-count {
    font-size: 16px;
    font-weight: normal;
    color: #7B8098;
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
