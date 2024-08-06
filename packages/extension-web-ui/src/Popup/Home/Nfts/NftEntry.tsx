// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PageWrapper } from '@subwallet/extension-web-ui/components';
import { DataContext } from '@subwallet/extension-web-ui/contexts/DataContext';
import { useGetNftByAccount } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import React, { useContext, useMemo } from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps;

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const dataContext = useContext(DataContext);
  const nftData = useGetNftByAccount();
  const outletContext: {
    searchInput: string,
    setDetailTitle: React.Dispatch<React.SetStateAction<React.ReactNode>>,
    setSearchPlaceholder: React.Dispatch<React.SetStateAction<React.ReactNode>>,
    setShowSearchInput: React.Dispatch<React.SetStateAction<boolean>>
  } = useOutletContext();

  const outletValue = useMemo(() => ({
    searchInput: outletContext?.searchInput,
    setDetailTitle: outletContext?.setDetailTitle,
    setSearchPlaceholder: outletContext?.setSearchPlaceholder,
    setShowSearchInput: outletContext?.setShowSearchInput,
    ...nftData
  }), [nftData, outletContext?.searchInput, outletContext?.setDetailTitle, outletContext?.setSearchPlaceholder, outletContext?.setShowSearchInput]);

  return (
    <PageWrapper
      className={className}
      resolve={dataContext.awaitStores(['nft', 'balance'])}
    >
      <Outlet context={outletValue} />
    </PageWrapper>
  );
}

const NftEntry = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({

  });
});

export default NftEntry;
