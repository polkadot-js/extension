// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeypairType } from '@polkadot/util-crypto/types';
import type { ThemeProps } from '../../types';

import { faPaperPlane, faQrcode, faSyncAlt, faTasks } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Container, Grid, Link, Skeleton } from '@mui/material';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { Chain } from '@polkadot/extension-chains/types';

import useTranslation from '../../hooks/useTranslation';
import { getBalance } from '../../util/HackathonUtilFiles/getBalance';
import { accountsBalanceType, balanceToHuman } from '../../util/HackathonUtilFiles/hackatonUtils';
import { SettingsContext } from '../contexts';
import AddressQRcode from './AddressQRcode';
import TransactionHistory from './TransactionHistory';
import TransferFunds from './TransferFunds';

export interface Props {
  actions?: React.ReactNode;
  address?: string | null;
  formattedAddress?: string | null;
  chain?: Chain | null;
  className?: string;
  genesisHash?: string | null;
  isExternal?: boolean | null;
  isHardware?: boolean | null;
  isHidden?: boolean;
  name: string;
  parentName?: string | null;
  suri?: string;
  toggleActions?: number;
  type?: KeypairType;
  balances?: accountsBalanceType[] | null;
  setBalances?: React.Dispatch<React.SetStateAction<accountsBalanceType[]>>;
  givenType?: KeypairType;
}

function Balance({ address, balances, chain, formattedAddress, givenType, name, setBalances }: Props): React.ReactElement<Props> {
  const [myBalance, setMyBalance] = useState<accountsBalanceType | null>(null);
  // const [coin, setCoin] = useState<string>('');
  const settings = useContext(SettingsContext);
  const { t } = useTranslation();
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [showQRcodeModalOpen, setQRcodeModalOpen] = useState(false);
  const [showTxHistoryModalOpen, setTxHistoryModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sender, setSender] = useState<accountsBalanceType>({ address: String(address), chain: null, name: String(name) });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function handleClearBalance(): void {
    setMyBalance(null);
    // setCoin('');
  }

  useEffect((): void => {
    if (!formattedAddress) {
      console.log('no formatted to get balances');
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    showMyBalance();

    // eslint-disable-next-line no-useless-return
    return;

    function showMyBalance() {
      if (!balances) return;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const b = balances.find((b) => b.address === address);

      if (b) {
        // console.log('setMyBalance in Balances', b);
        setMyBalance(b);
      } else {
        handleClearBalance();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balances, chain]);

  const handleTransferModalOpen = useCallback(
    (): void => {
      if (!balances) return;
      const senderBalance = balances.find((bal) => bal.address === address);

      setSender({
        address: String(formattedAddress),
        balanceInfo: senderBalance ? senderBalance.balanceInfo : undefined,
        chain: chain || null,
        name: String(name)
      });
      setTransferModalOpen(true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [balances, formattedAddress, name, address]
  );

  const handleShowQRcode = useCallback(
    (): void => {
      console.log('handleShowQRcode is clicked', showQRcodeModalOpen);
      setQRcodeModalOpen(true);
    },
    [showQRcodeModalOpen]
  );
  const handleTxHistory = useCallback(
    (): void => {
      setTxHistoryModalOpen(true);
    },
    [setTxHistoryModalOpen]
  );

  const handlerefreshBalance = (): void => {
    if (refreshing) return;
    setRefreshing(true);

    setMyBalance(null);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getBalance(address, chain, settings).then((result) => {
      if (result) {
        let temp = balances;

        temp = temp
          ? temp.map((acc) => {
            if (acc.address === address) {
              acc.balanceInfo = result;
            }

            return acc;
          })
          : ([{
            address: String(address),
            balanceInfo: result,
            chain: chain || null,
            name: ''
          }]);

        if (setBalances) {
          setBalances([...temp]);
        }
      }

      setRefreshing(false);
    });
  };

  function getCoin(_myBalance: accountsBalanceType): string {
    return !_myBalance || !_myBalance.balanceInfo ? '' : _myBalance.balanceInfo.coin;
  }

  return (
    <Container disableGutters sx={{ position: 'relative', top: '-15px' }}>
      <Grid container justifyContent='flex-end'>
        <Grid container direction='row' item justifyContent='flex-end' xs={2}>
          <Grid item xs={3} >
            <Link color='inherit' href='#' underline='none'>
              <FontAwesomeIcon
                icon={faQrcode}
                onClick={handleShowQRcode}
                size='sm'
                title={t('QR code')}
              />
            </Link>
          </Grid>
          <Grid item xs={6}></Grid>
        </Grid>
      </Grid>
      <Grid alignItems='center' container>
        <Grid container direction='row' item justifyContent='center' xs={10}>
          <Grid item sx={{ fontSize: 12, fontWeight: 'medium', textAlign: 'left', paddingLeft: '60px' }} xs={6}>
            {'Balance: '}
            {myBalance === null
              ? <Skeleton sx={{ display: 'inline-block', fontWeight: 'bold', width: '70px' }} />
              : (balanceToHuman(myBalance, 'total').toString() + ' ' + getCoin(myBalance))}
          </Grid>
          <Grid item sx={{ fontSize: 12, fontWeight: 'medium', textAlign: 'center' }} xs={6}>
            {'Available: '}{myBalance === null
              ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '70px' }} />
              : balanceToHuman(myBalance, 'available').toString() + ' ' + getCoin(myBalance)}
          </Grid>
        </Grid>
        <Grid container direction='row' item justifyContent='flex-end' xs={2}>
          <Grid item xs={3}>
            <Link color='inherit' href='#' underline='none'>
              <FontAwesomeIcon
                className='iconDisplay'
                icon={faPaperPlane}
                onClick={handleTransferModalOpen}
                size='sm'
                title={t('transfer funds')}
              />
            </Link>
          </Grid>
          <Grid item container xs={3}>
            <Grid item xs={12}>
              <Link color='inherit' href='#' underline='none'>
                <FontAwesomeIcon
                  className='refreshIcon'
                  icon={faSyncAlt}
                  // eslint-disable-next-line react/jsx-no-bind
                  onClick={handlerefreshBalance}
                  size='sm'
                  title={t('refresh balance')}
                />
              </Link>
            </Grid>
          </Grid>
          <Grid item xs={3}>
            <Link color='inherit' href='#' underline='none'>
              <FontAwesomeIcon
                icon={faTasks}
                // eslint-disable-next-line react/jsx-no-bind
                onClick={handleTxHistory}
                size='sm'
                title={t('transaction history')}
              />
            </Link>
          </Grid>
          <Grid item xs={3}></Grid>
        </Grid>
      </Grid>

      {transferModalOpen
        ? <TransferFunds
          balances={balances}
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          chain={chain}
          givenType={givenType}
          sender={sender}
          setBalances={setBalances}
          setTransferModalOpen={setTransferModalOpen}
          transferModalOpen={transferModalOpen}
        />
        : ''}
      {showQRcodeModalOpen
        ? <AddressQRcode
          address={String(formattedAddress || address)}
          chain={chain}
          name={name}
          setQRcodeModalOpen={setQRcodeModalOpen}
          showQRcodeModalOpen={showQRcodeModalOpen}
        />
        : ''}
      {showTxHistoryModalOpen
        ? <TransactionHistory
          address={String(formattedAddress || address)}
          chain={chain}
          name={name}
          setTxHistoryModalOpen={setTxHistoryModalOpen}
          showTxHistoryModalOpen={showTxHistoryModalOpen}
        />
        : ''}
    </Container>
  );
}

export default styled(Balance)(({ theme }: ThemeProps) => `
  background: ${theme.accountBackground};
  border: 1px solid ${theme.boxBorderColor};
  box-sizing: border-box;
  border-radius: 4px;
  margin-bottom: 8px;
  position: relative;

  .banner {
    font-size: 12px;
    line-height: 16px;
    position: absolute;
    top: 0;

    &.chain {
      background: ${theme.primaryColor};
      border-radius: 0 0 0 10px;
      color: white;
      padding: 0.1rem 0.5rem 0.1rem 0.75rem;
      right: 0;
      z-index: 1;
    }
  }

  .balanceDisplay {
    display: flex;
    justify-content: space-between;
    position: relative;

    .balance {
      position: absolute;
      left: 2px;
      top: 18px;    
      color: ${theme.labelColor};
      font-size: 14px;
      font-weight: bold;
    }
    . availableBalance {
      position: absolute;
      right: 2px;
      top: -18px;
    }

    .iconDisplay {
      display: flex;
    justify-content: space-between;
    position: relative;

    .svg-inline--fa {
      width: 14px;
    height: 14px;
    margin-right: 10px;
    color: ${theme.accountDotsIconColor};
    &:hover {
      color: ${theme.labelColor};
    cursor: pointer;
  }
}

    .sendIcon {
          position: absolute;
        right: 2px;
        top: +36px;
    }

    .hiddenIcon, .visibleIcon {
      position: absolute;
      right: 2px;
      top: -18px;
    }

    .hiddenIcon {
      color: ${theme.errorColor};
      &:hover {
        color: ${theme.accountDotsIconColor};
      }
    }
  }

  .externalIcon, .hardwareIcon {
    margin-right: 0.3rem;
    color: ${theme.labelColor};
    width: 0.875em;
  }

  .identityIcon {
    margin-left: 15px;
    margin-right: 10px;

    & svg {
      width: 50px;
      height: 50px;
    }
  }

  .info {
    width: 100%;
  }

  .infoRow {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    height: 30px;
    // border-radius: 4px;
  }

  img {
    max-width: 50px;
    max-height: 50px;
    border-radius: 50%;
  }

  .name {
    font-size: 16px;
    line-height: 22px;
    margin: 2px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 300px;
    white-space: nowrap;

    &.displaced {
      padding-top: 10px;
    }
  }

  .parentName {
    color: ${theme.labelColor};
    font-size: ${theme.inputLabelFontSize};
    line-height: 14px;
    overflow: hidden;
    padding: 0.25rem 0 0 0.8rem;
    text-overflow: ellipsis;
    width: 270px;
    white-space: nowrap;
  }

  .detailsIcon {
    background: ${theme.accountDotsIconColor};
    width: 3px;
    height: 19px;

    &.active {
      background: ${theme.primaryColor};
    }
  }

  .deriveIcon {
    color: ${theme.labelColor};
    position: absolute;
    top: 5px;
    width: 9px;
    height: 9px;
  }

  .movableMenu {
    margin-top: -20px;
    right: 28px;
    top: 0;

    &.isMoved {
      top: auto;
      bottom: 0;
    }
  }

  .settings {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 40px;

    &:before {
      content: '';
      position: absolute;
      left: 0;
      top: 25%;
      bottom: 25%;
      width: 1px;
      background: ${theme.boxBorderColor};
    }

    &:hover {
      cursor: pointer;
      background: ${theme.readonlyInputBackground};
    }
  }
`);
