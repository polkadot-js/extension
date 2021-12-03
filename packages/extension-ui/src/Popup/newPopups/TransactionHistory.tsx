// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line simple-import-sort/imports

import { faBorderNone, faCheck, faCoins, faMinus, faPaperPlane, faPlus, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { HistoryRounded, LaunchRounded } from '@mui/icons-material';
import { Avatar, Box, Button, Chip, Container, Divider, Grid, IconButton, Modal } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { Dispatch, SetStateAction, useCallback, useContext, useEffect, useState } from 'react';

import { Chain } from '@polkadot/extension-chains/types';
import getChainLogo from '@polkadot/extension-ui/util/newUtils/getChainLogo';

import ActionText from '../../components/ActionText';
import { AccountContext } from '../../components/contexts';
import useTranslation from '../../hooks/useTranslation';
import getNetworkInfo from '../../util/newUtils/getNetwork';
import { TransactionDetail } from '../../util/newUtils/pjpeTypes';
import { getTransactionHistoryFromLocalStorage, TRANSACTION_HISTROY_DEFAULT_ROWS } from '../../util/newUtils/pjpeUtils';

interface Props {
  address: string;
  chain?: Chain | null;
  name: string;
  showTxHistoryModalOpen: boolean;
  setTxHistoryModalOpen: Dispatch<SetStateAction<boolean>>;
}

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

  function getIcon(action: string): IconDefinition {
    switch (action.toLowerCase()) {
      case ('send'):
        return faPaperPlane;
      case ('bond'):
        return faCoins;
      case ('unbond'):
        return faMinus;
      case ('bond_extra'):
        return faPlus;
      case ('nominate'):
        return faCheck;
      default:
        return faBorderNone;
    }
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
        <Container disableGutters maxWidth='md' sx={{ marginTop: 2 }}>
          <Grid item alignItems='center' container justifyContent='space-between' sx={{ padding: '0px 20px' }}>
            <Grid item>
              <Avatar
                alt={'logo'}
                src={getChainLogo(chain)}
              />
            </Grid>
            <Grid item sx={{ fontSize: 15 }}>
              <ActionText
                onClick={handleTxHistoryModalClose}
                text={t<string>('Close')}
              />
            </Grid>
          </Grid>
          <Grid xs={12} sx={{ paddingBottom: '10px' }}>
            <Box fontSize={12} fontWeight='fontWeightBold'>
              <Divider>
                <Chip icon={<HistoryRounded />} label={t('Transaction History')} variant='outlined' />
              </Divider>
            </Box>
          </Grid>
          <Grid alignItems='center' container justifyContent='center' sx={{ padding: '20px 30px 1px' }}>
            {historyList?.map((h) => (
              <>
                <Grid item xs={1}>
                  <FontAwesomeIcon
                    color={grey[600]}
                    icon={getIcon(h.action)}
                    size='lg'
                  />
                </Grid>
                <Grid item container xs={10}>
                  <Grid item container xs={12} sx={{ paddingTop: '10px' }}>
                    <Grid xs={4} sx={{ fontSize: 15, textAlign: 'left', fontVariant: 'small-caps' }}>
                      {h.action}
                    </Grid>
                    <Grid item xs={4} sx={{ textAlign: 'right', fontWeight: 'bold', paddingRight:'40px' }}>
                      {h.amount} {' '}{coin}
                    </Grid>
                    <Grid item container xs={4} justifyContent='center'>
                      <Box fontSize={11} sx={{ color: ['finalized', 'success'].includes(h.status.toLowerCase()) ? 'green' : 'red' }}>
                        {['finalized', 'success'].includes(h.status.toLowerCase()) ? t('Success') : t('Failed')}
                        <Box fontSize={9} sx={{ color: 'gray' }}>
                          {!['finalized', 'success'].includes(h.status.toLowerCase()) ? h.status : ''}
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                  <Grid item container xs={12} sx={{ color: 'gray', fontSize: '10px', paddingBottom: '10px' }}>
                    <Grid item xs={4} sx={{ textAlign: 'left' }}>
                      {h.to && t('To:')} {' '}{makeAddressShort(h.to)}
                    </Grid>
                    <Grid item xs={4} sx={{ fontVariant: 'small-caps', textAlign: 'right', paddingRight:'50px' }}>
                      {h.fee && t('Fee ')} {' '} {h.fee}
                    </Grid>
                    <Grid item xs={4} sx={{ textAlign: 'center' }}>
                      {new Date(h.date).toDateString()}{' '}{new Date(h.date).toLocaleTimeString()}
                    </Grid>
                    {/* <Grid item xs={1}></Grid> */}
                  </Grid>
                </Grid>
                <Grid item xs={1} sx={{ textAlign: 'right' }}>
                  <IconButton size='small' edge='end' onClick={() => openTxOnExplorer(h.hash)}>
                    <LaunchRounded fontSize='small' />
                  </IconButton>
                </Grid>
                <Grid item xs={12}>
                  <Divider light />
                </Grid>
              </>
            ))}
            {!moreLoaded && hasMoreToLoad
              ? <Grid item display='flex' justifyContent='center' xs={12} sx={{ paddingTop: '30px' }}>
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
