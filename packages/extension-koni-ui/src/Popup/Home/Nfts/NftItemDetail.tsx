// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import useGetAccountInfoByAddress from '@subwallet/extension-koni-ui/hooks/screen/common/useGetAccountInfoByAddress';
import useGetChainInfo from '@subwallet/extension-koni-ui/hooks/screen/common/useGetChainInfo';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { INftItemDetail } from '@subwallet/extension-koni-ui/Popup/Home/Nfts/utils';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ButtonProps, Image, Input, SwSubHeader } from '@subwallet/react-ui';
import SwAvatar from '@subwallet/react-ui/es/sw-avatar';
import React, { useCallback, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

import LogosMap from '../../../assets/logo';

type Props = ThemeProps

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const dataContext = useContext(DataContext);
  const location = useLocation();
  const navigate = useNavigate();
  const { extendToken, token } = useTheme() as Theme;

  const { collectionInfo, nftItem } = location.state as INftItemDetail;
  const originChainInfo = useGetChainInfo(nftItem.chain);
  const ownerAccountInfo = useGetAccountInfoByAddress(nftItem.owner || '');

  // TODO: put this in Owned by
  console.log('ownerAccountInfo', ownerAccountInfo);

  const onBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const subHeaderRightButton: ButtonProps[] = [
    {
      icon: <div>Send</div>,
      onClick: () => {
        navigate('/transaction/send-nft', { state: nftItem });
      }
    }
  ];

  const ownerPrefix = useCallback(() => {
    if (nftItem.owner) {
      const theme = isEthereumAddress(nftItem.owner) ? 'ethereum' : 'substrate';

      return (
        <SwAvatar
          identPrefix={42}
          size={20}
          theme={theme}
          value={nftItem.owner}
        />
      );
    }

    return <div />;
  }, [nftItem.owner]);

  const originChainLogo = useCallback(() => {
    return (
      <Image
        src={LogosMap[nftItem.chain]}
        width={'20px'}
      />
    );
  }, [nftItem.chain]);

  return (
    <PageWrapper
      className={`${className}`}
      resolve={dataContext.awaitStores(['nft', 'accountState', 'chainStore'])}
    >
      <SwSubHeader
        background={'transparent'}
        center={false}
        onBack={onBack}
        paddingVertical={true}
        rightButtons={subHeaderRightButton}
        showBackButton={true}
        title={nftItem.name || nftItem.id}
      />

      <div className={'nft_item_detail__container'}>
        <Image
          height={358}
          src={nftItem.image || extendToken.logo}
          width={358}
        />

        <div className={'nft_item_detail__info_container'}>
          <div>{t<string>('NFT information')}</div>
          {
            nftItem && (
              <Input.TextArea
                label={t<string>('Description')}
                readOnly
                value={nftItem.description}
              />
            )
          }

          <Input
            label={t<string>('NFT collection name')}
            readOnly
            value={collectionInfo.collectionName || collectionInfo.collectionId}
          />

          <Input
            label={t<string>('Owned by')}
            prefix={nftItem.owner && ownerPrefix()}
            readOnly
            value={nftItem.owner && `${nftItem.owner.slice(0, 4)}...${nftItem.owner.slice(-4)}`}
          />

          <Input
            label={t<string>('Chain')}
            prefix={originChainLogo()}
            readOnly
            value={originChainInfo.name}
          />
        </div>

        {
          nftItem.properties && (
            <div>
              <div>Properties</div>
              <div className={'nft_item_detail__atts_container'}>
                {
                  Object.entries(nftItem.properties).map(([attName, attValueObj], index) => {
                    const { value: attValue } = attValueObj as Record<string, string>;

                    return (
                      <Input
                        key={index}
                        label={attName}
                        readOnly
                        value={attValue}
                      />
                    );
                  })
                }
              </div>
            </div>
          )
        }
      </div>
    </PageWrapper>
  );
}

const NftItemDetail = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.nft_item_detail__container': {
      marginTop: 14,
      paddingRight: 16,
      paddingLeft: 16,
      paddingBottom: 16
    },

    '.nft_item_detail__info_container': {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      marginTop: 16,
      marginBottom: 16
    },

    '.nft_item_detail__atts_container': {
      marginTop: 16,
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8
    }
  });
});

export default NftItemDetail;
