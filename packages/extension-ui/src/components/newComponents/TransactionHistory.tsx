// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line simple-import-sort/imports

import { CloseRounded, HistoryRounded, LaunchRounded } from '@mui/icons-material';
import { Box, Button, Chip, Container, Divider, Grid, IconButton, Modal } from '@mui/material';
import React, { Dispatch, SetStateAction, useCallback, useContext, useEffect, useState } from 'react';

import { Chain } from '@polkadot/extension-chains/types';

import useTranslation from '../../hooks/useTranslation';
import getNetworkInfo from '../../util/newUtils/getNetwork';
import { TransactionDetail } from '../../util/newUtils/pjpeTypes';
import { getTransactionHistoryFromLocalStorage } from '../../util/newUtils/pjpeUtils';
import { AccountContext } from '../contexts';

interface Props {
  address: string;
  chain?: Chain | null;
  name: string;
  showTxHistoryModalOpen: boolean;
  setTxHistoryModalOpen: Dispatch<SetStateAction<boolean>>;
}

const TRANSACTION_HISTROY_DEFAULT_ROWS = 6;

export default function TransactionHistory({ address, chain, name, setTxHistoryModalOpen, showTxHistoryModalOpen }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { hierarchy } = useContext(AccountContext);
  const [historyList, setHistoryList] = useState<TransactionDetail[] | []>([]);
  const [moreLoaded, setLoadMore] = useState(false);
  const [hasMoreToLoad, setHasMoreToLoad] = useState(false);
  const [coin, setCoin] = useState<string>('');

  useEffect(() => {
    if (!chain) {
      console.log('no chain in TransactionHistory');

      return;
    }

    const { coin } = getNetworkInfo(chain);
    setCoin(coin);

    let history: TransactionDetail[] = getTransactionHistoryFromLocalStorage(chain, hierarchy, address);

    history = history.reverse();
    console.log('new history', history);

    if (history.length > TRANSACTION_HISTROY_DEFAULT_ROWS) {
      setHasMoreToLoad(true);
    }

    if (!moreLoaded) {
      history = history.slice(0, TRANSACTION_HISTROY_DEFAULT_ROWS);
    }

    setHistoryList(history);


    console.log('new history2', history);

    // const txHistory = hierarchy.find((h) => h.address === address)?.txHistory;

    // const history = makeTxHistoryArray();

    // setHistoryList(history);

    // function makeTxHistoryArray(): string[][] | null {
    //   let txH = txHistory?.split(',');

    //   txH = txH?.reverse(); //`${coin}_${amount}_${fee}_${to}_${status}_${hash}_${date}

    //   if ((txH?.length || 0) > TRANSACTION_HISTROY_DEFAULT_ROWS) {
    //     setHasMoreToLoad(true);
    //   }

    //   if (!moreLoaded) {
    //     txH = txH?.slice(0, TRANSACTION_HISTROY_DEFAULT_ROWS);
    //   }

    //   if (txH) {
    //     return txH.map((h) => h.split('_'));
    //   }

    //   return null;
    // }
  }, [address, hierarchy, moreLoaded, chain]);

  const handleTxHistoryModalClose = useCallback(
    (): void => {
      // set all defaults
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      setTxHistoryModalOpen(false);
    },
    [setTxHistoryModalOpen]
  );

  const network = chain ? chain.name.replace(' Relay Chain', '') : 'westend';
  const openTxOnExplorer = (transactionHash: string) => window.open('https://' + network + '.subscan.io/extrinsic/' + String(transactionHash), '_blank');

  function makeAddressShort(_address: string): React.ReactElement {
    return (
      <Box
        component='span'
        fontFamily='Monospace'
      >
        {_address.slice(0, 4) +
          '...' +
          _address.slice(-4)}
      </Box>
    );
  }

  return (
    <Modal
      // eslint-disable-next-line react/jsx-no-bind
      onClose={(_event, reason) => {
        if (reason !== 'backdropClick') {
          handleTxHistoryModalClose();
        }
      }}
      open={showTxHistoryModalOpen}
    >
      <div style={{
        backgroundColor: '#FFFFFF',
        display: 'flex',
        height: '100%',
        maxWidth: 700,
        overflow: 'scroll',
        position: 'relative',
        top: '5px',
        transform: `translateX(${(window.innerWidth - 560) / 2}px)`,
        width: '560px'
      }}
      >
        <Container>
          <Grid container justifyContent='flex-start' xs={12} sx={{ paddingTop: '10px' }}>
            <IconButton edge='start' size='small' onClick={handleTxHistoryModalClose}>
              <CloseRounded fontSize='small' />
            </IconButton>
          </Grid>
          <Grid xs={12} sx={{ paddingBottom: '10px' }}>
            <Box fontSize={12} fontWeight='fontWeightBold'>
              <Divider>
                <Chip icon={<HistoryRounded />} label={t('Transaction History')} variant='outlined' />
              </Divider>
            </Box>
          </Grid>
          <Grid alignItems='center' container justifyContent='center' sx={{ padding: '0px 30px 1px' }}>
            {historyList?.map((h) => (
              <>
                <Grid item container xs={12} sx={{ paddingTop: '10px' }}>
                  <Grid xs={4} sx={{ fontSize: 15, textAlign: 'left', fontVariant: 'small-caps' }}>
                    {h.action}
                  </Grid>
                  <Grid item xs={3} sx={{ textAlign: 'left', fontWeight: 'bold' }}>
                    {h.amount} {' '}{coin}
                  </Grid>
                  <Grid item container xs={4} justifyContent='center' >
                    <Box fontSize={11} sx={{ color: ['finalized','success'].includes(h.status.toLowerCase()) ? 'green' : 'red' }}>
                      {['finalized','success'].includes(h.status.toLowerCase()) ? t('Success') : t('Failed')}
                      <Box fontSize={9} sx={{ color: 'gray' }}>
                        {!['finalized','success'].includes(h.status.toLowerCase()) ? h.status : ''}
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={1} sx={{ textAlign: 'right' }}>
                    <IconButton size='small' edge='end' onClick={() => openTxOnExplorer(h.hash)}>
                      <LaunchRounded fontSize='small' />
                    </IconButton>
                  </Grid>
                </Grid>
                <Grid item container xs={12} sx={{ color: 'gray', fontSize: '10px', paddingBottom: '10px' }}>
                  <Grid item xs={4} sx={{ textAlign: 'left' }}>
                    {h.to && t('To:')} {' '}{makeAddressShort(h.to)}
                  </Grid>
                  <Grid item xs={3} sx={{ fontVariant: 'small-caps', textAlign: 'left' }}>
                    {h.fee && t('Fee ')} {' '} {h.fee}
                  </Grid>
                  <Grid item xs={4} sx={{ textAlign: 'center' }}>
                    {new Date(h.date).toDateString()}{' '}{new Date(h.date).toLocaleTimeString()}
                  </Grid>
                  <Grid item xs={1}></Grid>
                </Grid>
                <Grid item xs={12}>
                  <Divider light />
                </Grid>
              </>
            ))}
            {!moreLoaded && hasMoreToLoad
              ? <Grid item display='flex' justifyContent='center' xs={12} sx={{ paddingTop: '20px' }}>
                <Button color='primary' onClick={() => setLoadMore(true)} variant='text'>
                  {t('View More')}
                </Button>
              </Grid>
              : ''}
          </Grid>

        </Container>
      </div>
    </Modal>
  );
}
