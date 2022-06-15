// Copyright 2019-2022 @subwallet/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationsQueueItem, NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { AccountInfoEl } from '@subwallet/extension-koni-ui/components';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { getLogoByNetworkKey } from '@subwallet/extension-koni-ui/util';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  account?: AccountJson;
  network?: NetworkJson;
  requestActionText?: string;
  requestActionText2?: string;
  confirmation: ConfirmationsQueueItem<any>;
}

function ConfirmationHeader ({ account, className, confirmation, network, requestActionText, requestActionText2 }: Props): React.ReactElement {
  const { t } = useTranslation();
  const { networkKey, url } = confirmation;
  const { hostname } = new URL(url);

  return <div className={className}>
    <div className='header-requester'>
      <img
        alt={`${hostname}`}
        className='requester__logo'
        src={`https://icons.duckduckgo.com/ip2/${hostname}.ico`}
      />
      <div className='requester__host-name'>
        {hostname}
      </div>
    </div>
    {requestActionText && <div className='header__action-text'>
      {requestActionText}
    </div>}
    <div className='header__acc-network'>
      {account &&
      <AccountInfoEl
        address={account.address}
        className='header__account'
        genesisHash={account.genesisHash}
        iconSize={20}
        isShowAddress={false}
        isShowBanner={false}
        name={account.name}
        showCopyBtn={false}
      />
      }
      {account && network && <div className='acc-network-connector'>{t<string>('on')}</div>}
      {network && networkKey && <div className='header__network'>
        <img
          alt='logo'
          className={'network-logo'}
          src={getLogoByNetworkKey(networkKey)}
        />
        <span className='network-name'>{network.chain}</span>
      </div>}
    </div>

    {requestActionText2 && <div className='header__action-text'>
      {requestActionText2}
    </div>}
  </div>;
}

export default styled(ConfirmationHeader)(({ theme }: Props) => `
  padding: 24px 15px;
  text-align: center;
  white-space: nowrap;
  border-bottom: 1px solid ${theme.backgroundAccountAddress};
    
  .header-requester {
    background-color: ${theme.backgroundAccountAddress};
    display: inline-flex;
    align-items: center;
    padding: 8px;
    padding-right: 10px;
    border-radius: 5px;
    
    .requester__logo {
      min-width: 24px;
      width: 24px;
      align-self: center;
      margin-right: 8px;
    }
    
    .requester__host-name {
      text-align: center;
      color: ${theme.textColor2};
      font-size: 14px;
      line-height: 24px;
    }
  }
  
  .header__action-text {
    text-align: center;
    font-weight: 500;
    margin-top: 8px;
  } 
  .header__account {
    margin-top: 8px;
    display: inline-block;
    text-align: left;
    background-color: ${theme.backgroundAccountAddress};
    border-radius: 5px;
    
    .account-info-row {
      height: 42px;
      padding-left: 8px;
      padding-right: 10px;
    }
  }
  
  .header__acc-network {
    display: flex;
    align-items: center;
    justify-content: space-evenly
  }
  
  .acc-network-connector {
    padding-top: 8px;
    padding-left: 8px;
    padding-right: 8px;
  }
  
  .header__network {
    position: relative;
    margin-top: 8px;
    background-color: ${theme.backgroundAccountAddress};
    border-radius: 5px;
    display: inline-flex;
    align-items: center;
    height: 42px;
    padding-left: 8px;
    padding-right: 10px;
    
    .network-logo {
      width: 24px;
      border-radius: 50%;
      border: 1px solid #fff;
      margin-right: 8px;
    }
  }
`);
