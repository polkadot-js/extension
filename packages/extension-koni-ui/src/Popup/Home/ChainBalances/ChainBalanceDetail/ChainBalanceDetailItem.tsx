// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import cloneIcon from '@subwallet/extension-koni-ui/assets/clone.svg';
import receivedIcon from '@subwallet/extension-koni-ui/assets/receive-icon.svg';
import { BalanceVal } from '@subwallet/extension-koni-ui/components/balance';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import ChainBalanceItemRow from '@subwallet/extension-koni-ui/Popup/Home/ChainBalances/ChainBalanceItemRow';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isAccountAll, toShort } from '@subwallet/extension-koni-ui/util';
import { waitForElement } from '@subwallet/extension-koni-ui/util/dom';
import { AccountInfoByNetwork, BalanceInfo } from '@subwallet/extension-koni-ui/util/types';
import CN from 'classnames';
import React, { useCallback } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import styled from 'styled-components';

import { Loading } from '../../../../components';
import NetworkTools from "@subwallet/extension-koni-ui/components/NetworkTools";

interface Props extends ThemeProps {
  className?: string;
  accountInfo: AccountInfoByNetwork;
  balanceInfo: BalanceInfo;
  isLoading: boolean;
  setQrModalOpen: (visible: boolean) => void;
  setQrModalProps: (props: {
    networkPrefix: number,
    networkKey: string,
    iconTheme: string,
    showExportButton: boolean
  }) => void;
  isShowDetail?: boolean,
  toggleBalanceDetail?: (networkKey: string) => void
}

function ChainBalanceDetailItem ({ accountInfo,
  balanceInfo,
  className,
  isLoading,
  isShowDetail,
  setQrModalOpen,
  setQrModalProps,
  toggleBalanceDetail }: Props): React.ReactElement<Props> {
  const { address, formattedAddress, networkIconTheme, networkKey, networkPrefix } = accountInfo;
  const { show } = useToast();
  const { t } = useTranslation();
  const _onCopy = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    show(t('Copied'));
  }, [show, t]);

  const _onToggleDetail = useCallback((e: React.MouseEvent<HTMLElement>) => {
    toggleBalanceDetail && toggleBalanceDetail(accountInfo.networkKey);

    if (!isShowDetail && toggleBalanceDetail) {
      const callback = (element: Element) => {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      };

      waitForElement(`.chain-balance-item__container.${accountInfo.networkKey}-detail`, callback);
    }
  }, [accountInfo.networkKey, toggleBalanceDetail, isShowDetail]);

  const _openQr = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setQrModalProps({
      networkPrefix: networkPrefix,
      networkKey: networkKey,
      iconTheme: networkIconTheme,
      showExportButton: false
    });
    setQrModalOpen(true);
  }, [networkIconTheme, networkKey, networkPrefix, setQrModalOpen, setQrModalProps]);

  const _isAccountAll = isAccountAll(address);

  return (
    <div
      className={CN(className, { '-show-detail': isShowDetail }, 'chain-balance-item__container', `${networkKey}-detail`)}
    >
      <div className='chain-balance-item__main-area'>
        <div className='chain-balance-item__main-area-part-1'>
          <img
            alt={'Logo'}
            className='chain-balance-item__logo'
            src={accountInfo.networkLogo}
          />

          <div className='chain-balance-item__meta-wrapper'>
            <div className='chain-balance-item__chain-name'>{accountInfo.networkDisplayName}</div>

            <div className='chain-balance-item__bottom-area'>
              {!_isAccountAll && (
                <>
                  <CopyToClipboard text={formattedAddress}>
                    <div
                      className='chain-balance-item__address'
                      onClick={_onCopy}
                    >
                      <span className='chain-balance-item__address-text'>{toShort(formattedAddress)}</span>
                      <img
                        alt='copy'
                        className='chain-balance-item__copy'
                        src={cloneIcon}
                      />
                    </div>
                  </CopyToClipboard>
                  <img
                    alt='receive'
                    className='chain-balance-item__receive'
                    onClick={_openQr}
                    src={receivedIcon}
                  />
                </>
              )}

              {_isAccountAll && (
                <div className='chain-balance-item__address'>
                  <span className='chain-balance-item__address-text'>
                    {accountInfo.networkDisplayName}
                  </span>
                </div>
              )}

              {isLoading && (
                <NetworkTools networkKey={networkKey}/>
              )}
            </div>
          </div>
        </div>

        {isLoading && (
          <div className='chain-balance-item__main-area-part-2'>
            <Loading />
          </div>
        )}

        {!isLoading && (
          <div
            className='chain-balance-item__main-area-part-2'
            onClick={_onToggleDetail}
          >
            <div className='chain-balance-item__balance'>
              <BalanceVal
                symbol={balanceInfo.symbol}
                value={balanceInfo.balanceValue}
              />
            </div>
            <div className='chain-balance-item__value'>
              <BalanceVal
                startWithSymbol
                symbol={'$'}
                value={balanceInfo.convertedBalanceValue}
              />
            </div>

            {(!!balanceInfo.detailBalances.length || !!balanceInfo.childrenBalances.length) && (
              <div className='chain-balance-item__toggle' />
            )}
          </div>
        )}
      </div>

      {!isLoading && isShowDetail && !!balanceInfo.detailBalances.length && (
        <>
          <div className='chain-balance-item__separator' />
          <div className='chain-balance-item__detail-area'>
            {balanceInfo.detailBalances.map((d) => (
              <ChainBalanceItemRow
                item={d}
                key={d.key}
              />
            ))}
          </div>
        </>
      )}
      <div className='chain-balance-item__separator' />
    </div>
  );
}

export default React.memo(styled(ChainBalanceDetailItem)(({ theme }: Props) => `
  //border: 2px solid ${theme.boxBorderColor};
  border-radius: 8px;
  color: ${theme.textColor2};
  // font-weight: 500;

  .chain-balance-item__main-area {
    display: flex;
    align-items: center;
    font-size: 15px;
  }

  .chain-balance-item__main-area {
    display: flex;
    font-size: 15px;
    padding-top: 12px;
    padding-bottom: 12px;
  }

  .chain-balance-item__detail-area,
  .chain-balance-item__detail-area {
    font-size: 14px;
    padding-top: 8px;
    padding-bottom: 10px;
  }

  .chain-balance-item__main-area-part-1 {
    flex: 1;
    display: flex;
    overflow: hidden;
    padding-left: 25px;
  }

  .chain-balance-item__main-area-part-2 {
    position: relative;
    padding-right: 48px;
    text-align: right;
    cursor: pointer;
    min-width: 80px;

    .loading-img.loading-img {
      width: 32px;
      height: 32px;
      border-width: 4px;
      border-color: transparent;
      border-left-color: ${theme.textColor2};
      display: block;
    }
  }

  .chain-balance-item__logo {
    min-width: 32px;
    height: 32px;
    border-radius: 100%;
    overflow: hidden;
    margin-right: 12px;
    background-color: #fff;
    border: 1px solid #fff;
    margin-top:10px;
  }

  .chain-balance-item__meta-wrapper {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .chain-balance-item__chain-name {
    font-weight: 500;
    font-size: 16px;
  }

  .chain-balance-item__bottom-area {
    display: flex;
    align-items: center;
  }

  .chain-balance-item__address {
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .chain-balance-item__address-text {
    flex: 1;
    margin-right: 6px;
    font-weight: 400;
    min-width: 126px;
  }

  .chain-balance-item__copy {
    min-width: 20px;
    height: 20px;
  }

  .chain-balance-item__receive {
    min-width: 16px;
    height: 16px;
    margin-left: 12px;
    cursor: pointer;
  }

  .chain-balance-item__toggle {
    position: absolute;
    border-style: solid;
    border-width: 0 2px 2px 0;
    display: inline-block;
    padding: 3.5px;
    transform: rotate(45deg);
    top: 7px;
    right: 25px;
  }

  .chain-balance-item__chain-name,
  .balance-val__symbol,
  .balance-val__prefix {
    color: ${theme.textColor};
  }

  .balance-val {
    font-weight: 500;
  }

  .chain-balance-item__separator {
    padding-left: 69px;
    padding-right: 25px;

    &:before {
      content: '';
      height: 1px;
      display: block;
      background: ${theme.boxBorderColor};
    }
  }

  &.-show-detail .chain-balance-item__toggle {
    top: 9px;
    transform: rotate(-135deg);
  }
`));
