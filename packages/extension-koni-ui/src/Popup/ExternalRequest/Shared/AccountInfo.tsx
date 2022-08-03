// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import cloneLogo from '@subwallet/extension-koni-ui/assets/clone.svg';
import { AccountContext } from '@subwallet/extension-koni-ui/components';
import Identicon from '@subwallet/extension-koni-ui/components/Identicon';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { getAccountInfoByNetwork } from '@subwallet/extension-koni-ui/util/findAccount';
import { AccountInfoByNetwork } from '@subwallet/extension-koni-ui/util/types';
import CN from 'classnames';
import React, { useCallback, useContext, useMemo } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { IconTheme } from '@polkadot/react-identicon/types';

interface Props extends ThemeProps {
  className?: string;
  address: string;
  network: NetworkJson;
  forceEthereum: boolean;
}

const AccountInfo = (props: Props) => {
  const { address, className, forceEthereum, network } = props;

  const { show } = useToast();
  const { t } = useTranslation();

  const { getAccountByAddress } = useContext(AccountContext);

  const { networkMap } = useSelector((state: RootState) => state);

  const account = useMemo((): AccountJson | undefined => {
    return getAccountByAddress(networkMap, address, network.genesisHash);
  }, [networkMap, getAccountByAddress, address, network.genesisHash]);

  const info = useMemo((): AccountInfoByNetwork => {
    return getAccountInfoByNetwork(networkMap, address, network);
  }, [address, network, networkMap]);

  const iconTheme = useMemo(() => {
    return (network.isEthereum
      ? 'ethereum'
      : (network.icon || 'polkadot')
    ) as IconTheme;
  }, [network.icon, network.isEthereum]);

  const _onCopy = useCallback(
    () => show(t('Copied')),
    [show, t]
  );

  return (
    <div className={CN(className)}>
      <div className='account-info-row'>
        <Identicon
          className='account-info-identity-icon'
          iconTheme={iconTheme}
          prefix={info.networkPrefix}
          size={48}
          value={info.formattedAddress || address}
        />
        <div className='account-info'>
          <div className='info-row'>
            <div
              className='account-info__name'
              data-field='name'
            >
              <span>{account?.name}</span>
            </div>
            <div
              className='account-info-chain'
              data-field='chain'
            >
              {forceEthereum ? 'EVM' : network.chain.replace(' Relay Chain', '')}
            </div>
          </div>
          <div className='info-row'>
            <div
              className='account-info-full-address'
              data-field='address'
            >
              {info.formattedAddress || address || ''}
            </div>
            <CopyToClipboard
              text={info.formattedAddress || address || ''}
            >
              <img
                alt='copy'
                className='copy-icon'
                onClick={_onCopy}
                src={cloneLogo}
              />
            </CopyToClipboard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(styled(AccountInfo)(({ theme }: Props) => `
  padding: 0 10px;
  border: 2px dashed ${theme.boxBorderColor};
  border-radius: 8px;

  .account-info-identity-icon {
    margin-right: 14px;
    width: 48px;
    height: 48px;
    padding: 0;
  }

  .account-info-row {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    height: 72px;
    border-radius: 4px;
    overflow: hidden;

    .account-info {
      width: 100%;
      overflow: hidden;

      .info-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        overflow: hidden;

        .account-info__name {
          color: ${theme.textColor};
          margin: 2px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-style: normal;
          font-weight: 500;
          font-size: 15px;
          line-height: 26px;
          width: 60%;

          &.displaced {
            padding-top: 10px;
          }
        }

        .account-info-chain {
          background-color: ${theme.chainBackgroundColor};
          padding: 0 8px;
          z-index: 1;
          text-overflow: ellipsis;
          overflow: hidden;
          max-width: 40%;
          white-space: nowrap;
          border-radius: 4px;
          font-style: normal;
          font-weight: 400;
          font-size: 15px;
          line-height: 26px;
          color: ${theme.chainTextColor};
        }

        .account-info-full-address {
          overflow: hidden;
          text-overflow: ellipsis;
          font-style: normal;
          font-weight: 400;
          font-size: 14px;
          line-height: 24px;
          color: ${theme.textColor2};
          width: 60%;
        }

        .copy-icon {
          height: 20px;
          width: 20px;
          cursor: pointer;
        }
      }
    }
  }
`));
