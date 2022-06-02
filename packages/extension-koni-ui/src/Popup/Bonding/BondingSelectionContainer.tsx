// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { InputFilter } from '@subwallet/extension-koni-ui/components';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { getBondingOptions } from '@subwallet/extension-koni-ui/messaging';
import Header from '@subwallet/extension-koni-ui/partials/Header';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
}

function BondingSelectionContainer ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [searchString, setSearchString] = useState('');
  const [showNetworkSelection, setShowNetworkSelection] = useState(true);
  const [showValidatorSelection, setShowValidatorSelection] = useState(false);

  const _onChangeFilter = useCallback((val: string) => {
    setSearchString(val);
  }, []);

  useEffect(() => {
    getBondingOptions()
      .then((bondingOptionInfo) => {
        console.log(bondingOptionInfo);
      })
      .catch(console.error);
  }, []);

  return (
    <div className={className}>
      <Header
        showBackArrow
        showSubHeader
        subHeaderName={t<string>('Bonding')}
        to='/'
      >
        <div className={'bonding-input-filter-container'}>
          <InputFilter
            onChange={_onChangeFilter}
            placeholder={t<string>('Search validator...')}
            value={searchString}
            withReset
          />
        </div>
      </Header>

      <div>
        content
      </div>
    </div>
  );
}



export default React.memo(styled(BondingSelectionContainer)(({ theme }: Props) => `
  .bonding-input-filter-container {
    padding: 0 15px 12px;
  }
`));
