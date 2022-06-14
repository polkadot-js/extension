// Copyright 2019-2022 @subwallet/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationsQueue } from '@subwallet/extension-base/background/KoniTypes';
import useFetchNetworkMap from '@subwallet/extension-koni-ui/hooks/screen/setting/useFetchNetworkMap';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React from 'react';
import styled from 'styled-components';

import LogosMap from '../../assets/logo';

interface Props extends ThemeProps {
  className?: string;
  confirmation: ConfirmationsQueue['switchNetworkRequest'][0];
}

function SwitchNetworkConfirmationInfo ({ className, confirmation }: Props): React.ReactElement {
  const { t } = useTranslation();
  const { parsedNetworkMap: networkMap } = useFetchNetworkMap();
  const { payload: { networkKey } } = confirmation;
  const icon = LogosMap[networkKey] || LogosMap.default;
  const { chain } = networkMap[networkKey];

  return <div className={className}>
    <div className='network-wrapper'>
      <div className='img-wrapper'>
        <img
          className='img-circle'
          src={icon}
          width={128}
        />
      </div>
      <div>{t<string>('Switch current network to ')}{chain}?</div>
    </div>
  </div>;
}

export default styled(SwitchNetworkConfirmationInfo)(({ theme }: Props) => `
  text-align: center;
  height: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  position: relative;
  
  .network-wrapper {
    width: 100%;  
  }
  
  .img-wrapper {
    width: 100%;
  }
  
  .img-circle {
    overflow: hidden;
    border-radius: 50%;
    margin-bottom: 16px;
    border: 2px solid #fff;
  }
`);
