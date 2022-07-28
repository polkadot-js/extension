// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ModalQrProps, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { AccountInfoByNetwork, BalanceInfo } from '@subwallet/extension-koni-ui/util/types';
import BigN from 'bignumber.js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import ChainBalanceChildrenItem from '../ChainBalanceDetail/ChainBalanceChildrenItem';
import ChainBalanceDetailItem from '../ChainBalanceDetail/ChainBalanceDetailItem';

interface Props extends ThemeProps {
  accountInfo: AccountInfoByNetwork;
  balanceInfo: BalanceInfo;
  backToHome: () => void;
  className?: string;
  setQrModalOpen: (visible: boolean) => void;
  updateModalQr: (value: Partial<ModalQrProps>) => void;
  setSelectedNetworkBalance?: (networkBalance: BigN) => void;
}

function ChainBalanceDetail ({ accountInfo, backToHome, balanceInfo, className, setQrModalOpen, setSelectedNetworkBalance, updateModalQr }: Props): React.ReactElement<Props> {
  const [selectedNetworkKey, setSelectedNetworkKey] = useState<string>('');
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const convertedBalanceValue = useMemo((): string => {
    return balanceInfo.convertedBalanceValue.toString();
  }, [balanceInfo]);

  useEffect(() => {
    setSelectedNetworkBalance && setSelectedNetworkBalance(new BigN(convertedBalanceValue));
  }, [setSelectedNetworkBalance, convertedBalanceValue]);

  const toggleBalanceDetail = useCallback((networkKey: string) => {
    if (networkKey === selectedNetworkKey) {
      setSelectedNetworkKey('');
    } else {
      setSelectedNetworkKey(networkKey);
    }
  }, [selectedNetworkKey]);

  return (
    <div
      className={className}
      ref={ref}
    >
      {accountInfo && balanceInfo &&
      <div
        className='chain-balance-detail__back-btn'
        onClick={backToHome}
      >
        <FontAwesomeIcon
          className='chain-balance-detail__back-icon'
          // @ts-ignore
          icon={faArrowLeft}
        />
        <span>{t<string>('Back to home')}</span>
      </div>
      }
      <ChainBalanceDetailItem
        accountInfo={accountInfo}
        balanceInfo={balanceInfo}
        isLoading={!balanceInfo}
        isShowDetail={accountInfo.networkKey === selectedNetworkKey}
        setQrModalOpen={setQrModalOpen}
        toggleBalanceDetail={toggleBalanceDetail}
        updateModalQr={updateModalQr}
      />

      {balanceInfo && balanceInfo.childrenBalances.length
        ? balanceInfo.childrenBalances.map((child) => (
          <ChainBalanceChildrenItem
            accountInfo={accountInfo}
            balanceInfo={child}
            isLoading={!child}
            key={child.key}
          />
        ))
        : ''
      }
    </div>
  );
}

export default React.memo(styled(ChainBalanceDetail)(({ theme }: Props) => `

  .chain-balance-detail-item {
    .chain-balance-item-row__col-1 {
      padding-left: 16px;
    }

    .chain-balance-item-row__col-3 {
      padding-right: 16px;
    }
  }

  .chain-balance-detail__separator {
    padding: 16px;

    &:before {
      content: '';
      height: 1px;
      display: block;
      background: ${theme.boxBorderColor};
    }
  }

  .chain-balance-detail__back-btn {
    color: ${theme.buttonTextColor2};
    font-size: 15px;
    line-height: 26px;
    font-weight: 500;
    margin-left: 25px;
    cursor: pointer;
    margin-bottom: 10px;
  }

  .chain-balance-detail__back-icon {
    padding-right: 7px;
  }
`));
