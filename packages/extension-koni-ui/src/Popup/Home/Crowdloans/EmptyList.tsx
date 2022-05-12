// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import crowdloansEmptyData from '@subwallet/extension-koni-ui/assets/crowdloans-empty-list.png';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
}

function CrowdloanEmptyList ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <div className={`${className} empty-list crowdloan-empty-list`}>
      <img
        alt='Empty'
        className='empty-list__img'
        src={crowdloansEmptyData}
      />
      <div className='empty-list__text'>{t<string>('Your crowdloans will appear here')}</div>
    </div>
  );
}

export default styled(CrowdloanEmptyList)`
  display: flex;
  align-items: center;
  flex-direction: column;
  position: relative;

  .empty-list__img {
    height: 130px;
    width: auto;
    position: absolute;
    left: 0;
    right: 0;
    top: 70px;
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
