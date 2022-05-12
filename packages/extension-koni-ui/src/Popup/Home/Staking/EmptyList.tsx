// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import stackingEmptyData from '@subwallet/extension-koni-ui/assets/stacking-empty-list.png';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
}

function StakingEmptyList ({ className }: Props): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div className={`${className || ''} empty-list stacking-empty-list`}>
      <img
        alt='Empty'
        className='empty-list__img'
        src={stackingEmptyData}
      />
      <div className='empty-list__text'>{t<string>('No staking data was recorded')}</div>
    </div>
  );
}

export default styled(StakingEmptyList)`
  display: flex;
  align-items: center;
  flex-direction: column;
  position: relative;

  .empty-list__img {
    height: 168px;
    width: auto;
    position: absolute;
    left: 0;
    right: 0;
    top: 35px;
    margin: 0 auto;
  }

  .empty-list__text {
    padding: 215px 15px 0;
    font-size: 15px;
    line-height: 26px;
    text-align: center;
    font-weight: 500;
  }
`;
