// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PageWrapper } from '@subwallet/extension-web-ui/components';
import { DataContext } from '@subwallet/extension-web-ui/contexts/DataContext';
import { useSelector } from '@subwallet/extension-web-ui/hooks';
import { handleSwapRequest } from '@subwallet/extension-web-ui/messaging/transaction/swap';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import CN from 'classnames';
import React, { useContext, useEffect } from 'react';
import styled from 'styled-components';

type Props = ThemeProps;

const Component: React.FC<Props> = ({ className }: Props) => {
  const dataContext = useContext(DataContext);
  const swapPairs = useSelector((state) => state.swap.swapPairs);

  useEffect(() => {
    handleSwapRequest({
      address: '15MLn9YQaHZ4GMkhK3qXqR5iGGSdULyJ995ctjeBgFRseyi6',
      pair: swapPairs[0],
      fromAmount: '40000000000',
      slippage: 0.05
    }).then((result) => {
      console.log('swap result', result);
    }).catch(console.error);
  }, [swapPairs]);

  return (
    <PageWrapper
      className={CN(className)}
      resolve={dataContext.awaitStores(['swap'])}
    >
      <div className={className}>Swap</div>

      {
        swapPairs.map((pair) => {
          return (<div key={pair.slug}>{pair.from} - {pair.to}</div>);
        })
      }
    </PageWrapper>
  );
};

const Swap = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default Swap;
