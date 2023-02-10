// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { INftCollectionDetail } from '@subwallet/extension-koni-ui/Popup/Home/Nfts/types';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const location = useLocation();
  const {collectionInfo, nftList} = location.state as INftCollectionDetail;

  return (
    <div className={className}>
      {collectionInfo.collectionName}
    </div>
  );
}

export const NftCollectionDetail = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({

  });
});
