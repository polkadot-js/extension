// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import stackingEmptyData from '@subwallet/extension-koni-ui/assets/stacking-empty-list.png';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  isExternalAccount: boolean;
  isHardwareAccount: boolean;
  isAccountAll: boolean;
}

function StakingEmptyList ({ className, isAccountAll, isExternalAccount, isHardwareAccount }: Props): React.ReactElement {
  const getText = useCallback(() => {
    if (isAccountAll) {
      return 'No staking data was recorded';
    } else if (isHardwareAccount || isExternalAccount) {
      return 'Staking from this account is not supported yet';
    }

    return '';
  }, [isAccountAll, isExternalAccount, isHardwareAccount]);

  return (
    <div className={`${className || ''} empty-list stacking-empty-list`}>
      <img
        alt='Empty'
        className='empty-list__img'
        src={stackingEmptyData}
      />
      {
        (isAccountAll || (isHardwareAccount || isExternalAccount)) && <div className={'empty-list__text'}>{getText()}</div>
      }
    </div>
  );
}

export default styled(StakingEmptyList)`
  display: flex;
  align-items: center;
  flex-direction: column;
  margin-bottom: 10px;

  .empty-list__img {
    height: 168px;
    width: auto;
    left: 0;
    right: 0;
    top: 35px;
    margin: 0 auto;
  }

  .empty-list__text {
    padding: 15px 15px 0;
    font-size: 15px;
    line-height: 26px;
    text-align: center;
    font-weight: 500;
  }
`;
