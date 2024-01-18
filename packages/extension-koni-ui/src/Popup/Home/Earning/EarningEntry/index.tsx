// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PageWrapper } from '@subwallet/extension-koni-ui/components';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { useGroupYieldPosition } from '@subwallet/extension-koni-ui/hooks/earning';
import EarningOptions from '@subwallet/extension-koni-ui/Popup/Home/Earning/EarningEntry/EarningOptions';
import EarningPositions from '@subwallet/extension-koni-ui/Popup/Home/Earning/EarningEntry/EarningPositions';
import { EarningEntryParam, EarningEntryView, ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useContext, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps;

function Component ({ className }: Props) {
  const locationState = useLocation().state as EarningEntryParam;
  const [entryView, setEntryView] = useState<EarningEntryView>(locationState?.view || EarningEntryView.POSITIONS);

  const earningPositions = useGroupYieldPosition();
  const dataContext = useContext(DataContext);

  return (
    <PageWrapper
      className={CN(className)}
      resolve={dataContext.awaitStores(['earning', 'balance', 'price'])}
    >
      {
        earningPositions.length && entryView === EarningEntryView.POSITIONS
          ? (
            <EarningPositions
              earningPositions={earningPositions}
              setEntryView={setEntryView}
            />
          )
          : (
            <EarningOptions
              hasEarningPositions={!!earningPositions.length}
              setEntryView={setEntryView}
            />
          )
      }

    </PageWrapper>
  );
}

const EarningEntry = styled(Component)<Props>(({ theme: { token } }: Props) => ({

}));

export default EarningEntry;
