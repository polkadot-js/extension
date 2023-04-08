// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {
  NftCollection,
  NftItem,
} from "@subwallet/extension-base/background/KoniTypes";
import { EmptyList, Layout, PageWrapper } from "@subwallet-webapp/components";
import { DataContext } from "@subwallet-webapp/contexts/DataContext";
import useTranslation from "@subwallet-webapp/hooks/common/useTranslation";
import useGetNftByAccount from "@subwallet-webapp/hooks/screen/nft/useGetNftByAccount";
import { NftGalleryWrapper } from "@subwallet-webapp/Popup/Home/Nfts/component/NftGalleryWrapper";
import { INftCollectionDetail } from "@subwallet-webapp/Popup/Home/Nfts/utils";
import { ThemeProps } from "@subwallet-webapp/types";
import { ButtonProps, Icon, SwList } from "@subwallet/react-ui";
import CN from "classnames";
import { Image, Plus } from "phosphor-react";
import React, { useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

type Props = ThemeProps;

const rightIcon = <Icon phosphorIcon={Plus} size="sm" type="phosphor" />;

function Component({ className = "" }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dataContext = useContext(DataContext);
  const { nftCollections, nftItems } = useGetNftByAccount();

  const subHeaderButton: ButtonProps[] = [
    {
      icon: rightIcon,
      onClick: () => {
        navigate("/settings/tokens/import-nft", {
          state: { isExternalRequest: false },
        });
      },
    },
  ];

  const searchCollection = useCallback(
    (collection: NftCollection, searchText: string) => {
      const searchTextLowerCase = searchText.toLowerCase();

      return (
        collection.collectionName
          ?.toLowerCase()
          .includes(searchTextLowerCase) ||
        collection.collectionId.toLowerCase().includes(searchTextLowerCase)
      );
    },
    []
  );

  const getNftsByCollection = useCallback(
    (nftCollection: NftCollection) => {
      const nftList: NftItem[] = [];

      nftItems.forEach((nftItem) => {
        if (
          nftItem.collectionId === nftCollection.collectionId &&
          nftItem.chain === nftCollection.chain
        ) {
          nftList.push(nftItem);
        }
      });

      return nftList;
    },
    [nftItems]
  );

  const handleOnClickCollection = useCallback(
    (state: INftCollectionDetail) => {
      navigate("/home/nfts/collection-detail", { state });
    },
    [navigate]
  );

  const renderNftCollection = useCallback(
    (nftCollection: NftCollection) => {
      const nftList = getNftsByCollection(nftCollection);

      let fallbackImage: string | undefined;

      for (const nft of nftList) {
        // fallback to any nft image
        if (nft.image) {
          fallbackImage = nft.image;
          break;
        }
      }

      const state: INftCollectionDetail = {
        collectionInfo: nftCollection,
        nftList,
      };

      return (
        <NftGalleryWrapper
          fallbackImage={fallbackImage}
          handleOnClick={handleOnClickCollection}
          image={nftCollection.image}
          itemCount={nftList.length}
          key={`${nftCollection.collectionId}_${nftCollection.chain}`}
          routingParams={state}
          title={nftCollection.collectionName || nftCollection.collectionId}
        />
      );
    },
    [getNftsByCollection, handleOnClickCollection]
  );

  const emptyNft = useCallback(() => {
    return (
      <EmptyList
        emptyMessage={t("Your NFT collectible will appear here!")}
        emptyTitle={t("No NFT collectible")}
        phosphorIcon={Image}
      />
    );
  }, [t]);

  return (
    <PageWrapper
      className={`nft_container ${className}`}
      resolve={dataContext.awaitStores(["nft"])}
    >
      <Layout.Base
        showSubHeader={true}
        subHeaderBackground={"transparent"}
        subHeaderCenter={false}
        subHeaderIcons={subHeaderButton}
        subHeaderPaddingVertical={true}
        title={t<string>("Collectibles")}
      >
        <SwList.Section
          className={CN("nft_collection_list__container")}
          displayGrid={true}
          enableSearchInput={true}
          gridGap={"14px"}
          list={nftCollections}
          minColumnWidth={"160px"}
          renderItem={renderNftCollection}
          renderOnScroll={true}
          renderWhenEmpty={emptyNft}
          searchFunction={searchCollection}
          searchMinCharactersCount={2}
          searchPlaceholder={t<string>("Search collection name")}
        />
      </Layout.Base>
    </PageWrapper>
  );
}

const NftCollections = styled(Component)<Props>(
  ({ theme: { token } }: Props) => {
    return {
      color: token.colorTextLight1,
      fontSize: token.fontSizeLG,

      "&__inner": {
        display: "flex",
        flexDirection: "column",
      },

      ".nft_collection_list__container": {
        height: "100%",
        flex: 1,

        ".ant-sw-list": {
          paddingBottom: 1,
          marginBottom: -1,
        },
      },
    };
  }
);

export default NftCollections;
