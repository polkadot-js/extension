// Copyright 2019-2022 @subwallet/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faRightLong } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ConfirmationsQueue } from '@subwallet/extension-base/background/KoniTypes';
import useFetchNetworkMap from '@subwallet/extension-koni-ui/hooks/screen/setting/useFetchNetworkMap';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { getLogoByNetworkKey } from '@subwallet/extension-koni-ui/util';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  confirmation: ConfirmationsQueue['switchNetworkRequest'][0];
}

function SwitchNetworkConfirmationInfo ({ className, confirmation }: Props): React.ReactElement {
  const { t } = useTranslation();
  const { parsedNetworkMap: networkMap } = useFetchNetworkMap();
  const { payload } = confirmation;
  const newNetwork = networkMap[payload.networkKey];
  const { networkKey } = useSelector((state: RootState) => state.currentNetwork);
  const currentNetwork = networkMap[networkKey];

  return <div className={className}>
    <div className='network-wrapper'>
      <div className='from-network'>
        <div className='img-wrapper'>
          <img
            className='img-circle'
            src={getLogoByNetworkKey(networkKey)}
            width={64}
            height={64}
          />
        </div>
        <div>{currentNetwork?.chain || t<string>('Any chain')}</div>

      </div>
      <div className='swap-icon'>
        <FontAwesomeIcon icon={faRightLong} />
      </div>
      <div className='to-network'>
        <div className='img-wrapper'>
          <img
            className='img-circle'
            src={getLogoByNetworkKey(payload.networkKey)}
            width={64}
          />
        </div>
        <div>{newNetwork.chain}</div>
      </div>
    </div>
  </div>;
}

export default styled(SwitchNetworkConfirmationInfo)(({ theme }: Props) => `
  text-align: center;
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: center;
  position: relative;
  padding-top: 16px;
  padding-botom: 16px;
  
  .network-wrapper {
    width: 100%;  
    display: flex;
    justify-content: space-evenly;
    align-items: center;
  }
  
  .swap-icon {
    padding-bottom: 40px;
    font-size: 32px;
  }
  
  .from-network, .to-network {
    flex: 1;  
  }
  
  .img-wrapper {
    width: 100%;
  }
  
  .img-circle {
    overflow: hidden;
    border-radius: 50%;
    margin-top: 8px;
    margin-bottom: 8px;
    border: 2px solid #fff;
  }
`);
