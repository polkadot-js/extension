// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { InputFilter } from '@subwallet/extension-koni-ui/components';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import Header from '@subwallet/extension-koni-ui/partials/Header';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
}

function BondingNetworkSelection ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [searchString, setSearchString] = useState('');
  const _onChangeFilter = useCallback((val: string) => {
    setSearchString(val);
  }, []);

  return (
    <div className={className}>
      <Header
        showBackArrow
        showSubHeader
        subHeaderName={t<string>('Select a network')}
        to='/'
      >
        <div className={'bonding-input-filter-container'}>
          <InputFilter
            onChange={_onChangeFilter}
            placeholder={t<string>('Search network...')}
            value={searchString}
            withReset
          />
        </div>
      </Header>

      <div className={'network-list'}>
        kjascoascm
      </div>
    </div>
  );
}

export default React.memo(styled(BondingNetworkSelection)(({ theme }: Props) => `
  .bonding-input-filter-container {
    padding: 0 15px 12px;
  }

  .network-list {
    margin-top: 20px;
  }
`));
