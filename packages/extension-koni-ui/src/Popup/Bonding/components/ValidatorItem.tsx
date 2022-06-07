// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import Identicon from '@subwallet/extension-koni-ui/components/Identicon';
import useGetNetworkJson from '@subwallet/extension-koni-ui/hooks/screen/home/useGetNetworkJson';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  validatorInfo: ValidatorInfo,
  networkKey: string
}

function ValidatorItem ({ className, networkKey, validatorInfo }: Props): React.ReactElement<Props> {
  const networkJson = useGetNetworkJson(networkKey);

  return (
    <div className={className}>
      <div className={'validator-item-container'}>
        <Identicon
          className='identityIcon'
          genesisHash={networkJson.genesisHash}
          prefix={networkJson.ss58Format}
          size={30}
          value={validatorInfo.address}
        />
      </div>

    </div>
  );
}

export default React.memo(styled(ValidatorItem)(({ theme }: Props) => `
  .identityIcon {
    border: 2px solid ${theme.checkDotColor};
  }

  .validator-item-container {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: ${theme.backgroundAccountAddress};
    padding: 10px 15px;
    border-radius: 8px;
    gap: 10px;
  }
`));
