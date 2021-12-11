// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line simple-import-sort/imports

import { faBorderNone, faCheck, faCoins, faMinus, faLevelUpAlt, faLevelDownAlt, faPlus, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AllInclusive, BlurOff, CallMade, HistoryRounded, LaunchRounded } from '@mui/icons-material';
import { Avatar, Box, Button, Container, Divider, Grid, IconButton, Modal, Tab, Tabs, Tooltip } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { Dispatch, SetStateAction, useCallback, useContext, useEffect, useState } from 'react';

import { Chain } from '@polkadot/extension-chains/types';
import getChainLogo from '@polkadot/extension-ui/util/newUtils/getChainLogo';

import ActionText from '../../components/ActionText';
import { AccountContext } from '../../components/contexts';
import useTranslation from '../../hooks/useTranslation';
import getNetworkInfo from '../../util/newUtils/getNetwork';
import { TransactionDetail } from '../../util/newUtils/pjpeTypes';
import { amountToHuman, getTransactionHistoryFromLocalStorage, TRANSACTION_HISTROY_DEFAULT_ROWS } from '../../util/newUtils/pjpeUtils';

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
  // const [historyList, setFilteredHistoryList] = useState<TransactionDetail[] | []>([]);
  const [moreLoaded, setLoadMore] = useState(false);
  const [hasMoreToLoad, setHasMoreToLoad] = useState(false);
  const [coin, setCoin] = useState<string>('');
  const [decimals, setDecimals] = useState<number>(1);
  const [tabValue, setTabValue] = React.useState(0);

  useEffect(() => {
    if (!chain) {
      console.log('no chain in TransactionHistory');

      return;
    }

    const { coin, decimals } = getNetworkInfo(chain);

    setDecimals(decimals);
    setCoin(coin);

    let history: TransactionDetail[] = getTransactionHistoryFromLocalStorage(chain, hierarchy, address);

    history = history.reverse();
    console.log('new history', history);

    switch (tabValue) {
      case (1): // transferes
        history = history.filter((h) => ['send', 'receive'].includes(h.action.toLowerCase()));
        break;
      case (2): // staking
        history = history.filter((h) => ['bond', 'unbond', 'bond_extra', 'nominate', 'redeem'].includes(h.action.toLowerCase()));
        break;
      default:
        break;
    };

    if (history.length > TRANSACTION_HISTROY_DEFAULT_ROWS) {
      setHasMoreToLoad(true);
    } else {
      setHasMoreToLoad(false);
    }


    if (!moreLoaded) {
      history = history.slice(0, TRANSACTION_HISTROY_DEFAULT_ROWS);
    }

    setHistoryList(history);
  }, [address, hierarchy, moreLoaded, chain, tabValue]);

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
        return faLevelUpAlt;
      case ('bond'):
        return faCoins;
      case ('unbond'):
        return faMinus;
      case ('bond_extra'):
        return faPlus;
      case ('nominate'):
        return faCheck;
      case ('redeem'):
        return faLevelDownAlt;
      default:
        return faBorderNone;
    }
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }

  function makePhraseShort(_phrase: string): string {
    // eslint-disable-next-line camelcase
    const MAX_FAILED_PHRASE_TO_SHOw = 30;

    return _phrase.substr(0, MAX_FAILED_PHRASE_TO_SHOw) + '...';
  }

  return (
    <Modal
      keepMounted
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
            <Grid item sx={{ fontSize: 15, fontWeight: 600 }}>
              <HistoryRounded /> {t('Transaction History')}
            </Grid>
            <Grid item sx={{ fontSize: 15 }}>
              <ActionText
                onClick={handleTxHistoryModalClose}
                text={t<string>('Close')}
              />
            </Grid>
          </Grid>
          <Grid xs={12}>
            <Divider />
          </Grid>
          <Grid item xs={12} >
            <Box>
              <Tabs
                textColor='secondary'
                indicatorColor='secondary'
                // centered
                variant='fullWidth'
                value={tabValue}
                onChange={handleTabChange}
              >
                <Tab icon={<AllInclusive fontSize='small' />} iconPosition='start' label='All' sx={{ fontSize: 10 }} />
                <Tab icon={<CallMade fontSize='small' />} iconPosition='start' label='Transfers' sx={{ fontSize: 10 }} />
                <Tab icon={<FontAwesomeIcon icon={faCoins} size='lg' />} iconPosition='start' label='Staking' sx={{ fontSize: 10 }} />
              </Tabs>
            </Box>
          </Grid>


          <Grid alignItems='center' container justifyContent='center' sx={{ padding: '0px 30px 5px' }}>
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
                    <Grid xs={4} sx={{ fontSize: 15, fontVariant: 'small-caps', textAlign: 'left' }}>
                      {h.action}
                    </Grid>
                    <Grid item xs={4} sx={{ fontWeight: '600', paddingRight: '40px', textAlign: 'right' }}>
                      {h.amount || '--- '} {' '}{coin}
                    </Grid>
                    <Grid item container xs={4} justifyContent='center'>
                      <Box fontSize={11} sx={{ color: ['success'].includes(h.status.toLowerCase()) ? 'green' : 'red' }}>
                        {['success'].includes(h.status.toLowerCase()) ? t('Success') : t('Failed')}
                        <Tooltip
                          placement='right-end'
                          arrow
                          title={!['success'].includes(h.status.toLowerCase()) ? h.status : ''}
                        >
                          <Box fontSize={9} sx={{ color: 'gray' }}>
                            {!['success'].includes(h.status.toLowerCase()) ? makePhraseShort(h.status) : ''}
                          </Box>
                        </Tooltip>
                      </Box>
                    </Grid>
                  </Grid>
                  <Grid item container xs={12} sx={{ color: 'gray', fontSize: '10px', paddingBottom: '10px' }}>
                    <Grid item xs={4} sx={{ textAlign: 'left' }}>
                      {h.to && t('To:')} {' '}{makeAddressShort(h.to)}
                    </Grid>
                    <Grid item xs={4} sx={{ fontVariant: 'small-caps', paddingRight: '50px', textAlign: 'right' }}>
                      {h.fee && t('Fee ')} {' '} {amountToHuman(h.fee, decimals)}
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
            {historyList.length === 0
              ?
              <>
                <Grid item xs={12} sx={{ padding: '80px 0px 40px' }}>
                  <BlurOff fontSize='large' color='disabled' />
                </Grid>

                <Grid item xs={12} sx={{ fontSize: 14 }}>
                  Nothing to show
                </Grid>
              </>
              : ''}
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
