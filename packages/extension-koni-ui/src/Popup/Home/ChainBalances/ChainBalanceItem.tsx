import React, {useState} from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import cloneIcon from '@polkadot/extension-koni-ui/assets/clone.svg';
import receivedIcon from '@polkadot/extension-koni-ui/assets/receive-icon.svg';
import {ThemeProps} from "@polkadot/extension-koni-ui/types";
import {AccountInfoByNetwork, BalanceInfo} from "@polkadot/extension-koni-ui/util/types";
import useToast from "@polkadot/extension-koni-ui/hooks/useToast";
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import {BalanceVal} from "@polkadot/extension-koni-ui/components/balance";
import {toShort} from "@polkadot/extension-koni-ui/util";
import styled from "styled-components";
import ChainBalanceItemRow from "@polkadot/extension-koni-ui/Popup/Home/ChainBalances/ChainBalanceItemRow";

interface Props extends ThemeProps {
  className?: string;
  accountInfo: AccountInfoByNetwork;
  balanceInfo: BalanceInfo;
  setQrModalOpen: (visible: boolean) => void;
  setQrModalProps: (props: {
    networkPrefix: number,
    networkName: string,
    iconTheme: string,
    showExportButton: boolean
  }) => void;
}

function ChainBalanceItem({accountInfo, balanceInfo, className, setQrModalOpen, setQrModalProps}: Props): React.ReactElement<Props> {
  const {networkName, address, networkPrefix, networkIconTheme} = accountInfo;
  const [toggleDetail, setToggleDetail] = useState(false);
  const {show} = useToast();
  const {t} = useTranslation();

  const _onCopy = (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      show(t('Copied'));
    };

  const _onToggleDetail = (e: React.MouseEvent<HTMLElement>) => {
    setToggleDetail(toggleDetail => !toggleDetail);
  };

  const _openQr = (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      setQrModalProps({
        networkPrefix: networkPrefix,
        networkName: networkName,
        iconTheme: networkIconTheme,
        showExportButton: false
      });
      setQrModalOpen(true);
    };

  return (
    <div className={`${className} ${toggleDetail ? '-show-detail' : ''}`} onClick={_onToggleDetail}>
      <div className='chain-balance-item__main-area'>
        <div className='chain-balance-item__main-area-part-1'>
          <img src={accountInfo.networkLogo} alt={'Logo'} className='chain-balance-item__logo' />

          <div className='chain-balance-item__meta-wrapper'>
            <div className='chain-balance-item__chain-name'>{accountInfo.networkDisplayName}</div>
            <div className='chain-balance-item__bottom-area'>
              <CopyToClipboard text={address}>
                <div className='chain-balance-item__address' onClick={_onCopy}>
                  <span className='chain-balance-item__address-text'>{toShort(address)}</span>
                  <img src={cloneIcon} alt="copy" className='chain-balance-item__copy' />
                </div>
              </CopyToClipboard>
              <img src={receivedIcon} alt="receive" className='chain-balance-item__receive' onClick={_openQr} />
            </div>
          </div>
        </div>

        <div className='chain-balance-item__main-area-part-2'>
          <div className="chain-balance-item__balance">
            <BalanceVal value={balanceInfo.balanceValue} symbol={balanceInfo.symbol} />
          </div>
          <div className="chain-balance-item__value">
            <BalanceVal value={balanceInfo.convertedBalanceValue} symbol={'$'} startWithSymbol />
          </div>

          {(!!balanceInfo.detailBalances.length || !!balanceInfo.childrenBalances.length) && (
            <div className="chain-balance-item__toggle" />
          )}
        </div>
      </div>

      {toggleDetail && !!balanceInfo.detailBalances.length && (
        <>
          <div className='chain-balance-item__separator' />
          <div className='chain-balance-item__detail-area'>
            {balanceInfo.detailBalances.map((d) => (
              <ChainBalanceItemRow item={d} key={d.key} />
            ))}
          </div>
        </>
      )}

      {toggleDetail && !!balanceInfo.childrenBalances.length && (
        <>
          <div className='chain-balance-item__separator' />
          <div className='chain-balance-item__detail-area'>
            {balanceInfo.childrenBalances.map((c) => (
              <ChainBalanceItemRow item={c} key={c.key} />
            ))}
          </div>
        </>
      )}
      <div className='chain-balance-item__separator' />
    </div>
  );
}

export default React.memo(styled(ChainBalanceItem)(({theme}: Props) => `
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
    padding-top: 10px;
    padding-bottom: 10px;
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
    padding-left: 15px;
  }

  .chain-balance-item__main-area-part-2 {
    position: relative;
    padding-right: 38px;
    text-align: right;
    cursor: pointer;
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

  .chain-balance-item__chain-name {
    font-weight: 500;
    font-size: 17px;
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
    right: 15px;
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
    padding-left: 15px;
    padding-right: 15px;

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
