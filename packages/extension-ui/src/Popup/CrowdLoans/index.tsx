// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import { Email, LaunchRounded, Twitter } from '@mui/icons-material';
import { Avatar, CircularProgress, FormControl, Grid, InputLabel, Link, MenuItem, Paper, Select } from '@mui/material';
import { deepOrange } from '@mui/material/colors';
import grey from '@mui/material/colors/grey';
import { SelectChangeEvent } from '@mui/material/Select';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { AccountsStore } from '@polkadot/extension-base/stores';
import getChainLogo from '@polkadot/extension-ui/util/newUtils/getChainLogo';
import getNetworkInfo from '@polkadot/extension-ui/util/newUtils/getNetwork';
import { Auction, Crowdloans } from '@polkadot/extension-ui/util/newUtils/pjpeTypes';
import { amountToHuman, getWebsiteFavico } from '@polkadot/extension-ui/util/newUtils/pjpeUtils';
import keyring from '@polkadot/ui-keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

import { Button } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { Header } from '../../partials';
import ConfirmCrowdloan from './ConfirmCrowdloan';
// import WebsiteEntry from './WebsiteEntry';

interface Props extends ThemeProps {
  className?: string;
}

function CrowdLoanList({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [decimals, setDecimals] = useState<number>(1);
  const [coin, setCoin] = useState<string>('');
  const [contributingTo, setContributingTo] = useState<Crowdloans | null>(null);

  const [auction, setAuction] = useState<Auction | null>(null);
  const [selectedBlockchain, setSelectedBlockchain] = useState<string>('polkadot');

  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [genesisHash, setGenesisHash] = useState<string>('');

  // const [filter, setFilter] = useState('');

  function getCrowdLoands(_selectedBlockchain: string) {
    const crowdloanWorker: Worker = new Worker(new URL('../../util/newUtils/workers/getCrowdloans.js', import.meta.url));

    const chain = _selectedBlockchain;// TODO: change it

    crowdloanWorker.postMessage({ chain });

    crowdloanWorker.onerror = (err) => {
      console.log(err);
    };

    crowdloanWorker.onmessage = (e: MessageEvent<any>) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result: Auction = e.data;

      console.log('auction: %o', result);

      if (result.blockchain == selectedBlockchain) {
        setAuction(result);
      }

      crowdloanWorker.terminate();
    };
  }

  useEffect(() => {
    // eslint-disable-next-line no-void
    void cryptoWaitReady().then(() => {
      keyring.loadAll({ store: new AccountsStore() });
    });
  }, []);

  useEffect(() => {
    if (selectedBlockchain) {
      setAuction(null);
      setContributingTo(null);

      getCrowdLoands(selectedBlockchain);

      const { coin, decimals, genesisHash } = getNetworkInfo(null, selectedBlockchain);

      setDecimals(decimals);
      setCoin(coin);

      if (genesisHash) { setGenesisHash(genesisHash); }
    }
  }, [selectedBlockchain]);

  // const _onChangeFilter = useCallback((filter: string) => {
  //   setFilter(filter);
  // }, []);

  const handleBlockchainChange = (event: SelectChangeEvent) => {
    setSelectedBlockchain(event.target.value);
  };

  const handleContribute = useCallback((crowdloan: Crowdloans): void => {
    setContributingTo(crowdloan);

    setConfirmModalOpen(true);
  }, []);



  return (
    <>
      <Header
        showBackArrow
        smallMargin
        text={t<string>('Crowdloans')}
      />
      <>
        {/* <InputFilter
          onChange={_onChangeFilter}
          placeholder={t<string>('parachain name')}
          value={filter}
        /> */}
        <Grid container sx={{ padding: '5px 35px' }}>
          <FormControl fullWidth>
            <InputLabel id='select-blockchain'>Select Relay Chain</InputLabel>
            <Select
              value={selectedBlockchain}
              label='Select blockchain'
              onChange={handleBlockchainChange}
            >
              <MenuItem value={'polkadot'}>
                <Grid container alignItems='center' justifyContent='space-between'>
                  <Grid item>
                    <Avatar
                      alt={'dot logo'}
                      src={getChainLogo(null, 'polkadot')}
                      sx={{ height: 24, width: 24 }}
                    />
                  </Grid>
                  <Grid item sx={{ fontSize: 15 }}>
                    Polkadot
                  </Grid>
                </Grid>
              </MenuItem>
              <MenuItem value={'kusama'}>
                <Grid container alignItems='center' justifyContent='space-between'>
                  <Grid item>
                    <Avatar
                      alt={'ksm logo'}
                      src={getChainLogo(null, 'kusama')}
                      sx={{ width: 24, height: 24 }}
                    />
                  </Grid>
                  <Grid item sx={{ fontSize: 15 }}>
                    Kusama
                  </Grid>
                </Grid>
              </MenuItem>
              <MenuItem value={'westend'}>
                <Grid container alignItems='center' justifyContent='space-between'>
                  <Grid item>
                    <Avatar
                      alt={'wsn logo'}
                      src={getChainLogo(null, 'westend')}
                      sx={{ width: 24, height: 24 }}
                    />

                  </Grid>
                  <Grid item sx={{ fontSize: 15 }}>
                    Westend
                  </Grid>
                </Grid>
              </MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <div className={className}>
          {
            <Grid container>
              {!auction &&
                <Grid item container xs={12} sx={{ padding: '100px', textAlign: 'center' }}>
                  <Grid item xs={12} >
                    <CircularProgress />
                  </Grid>

                  <Grid item xs={12} sx={{ fontSize: '13', paddingTop: '20px' }}>
                    Getting Auction/Crowdloans on {selectedBlockchain.charAt(0).toUpperCase() + selectedBlockchain.slice(1)} ...
                  </Grid>

                </Grid>
              }
              {auction &&
                <Grid item xs={12} sx={{ padding: '10px' }}>
                  <Paper elevation={6} sx={{ backgroundColor: grey[100] }}>
                    <Grid container justifyContent='flex-start' sx={{ padding: '15px 10px 15px' }}>
                      <Grid xs={1} >
                        <Avatar sx={{ bgcolor: deepOrange[500], height: 30, width: 30 }}>
                          #{auction.auctionCounter}
                        </Avatar>
                      </Grid>
                      <Grid item xs={3} container justifyContent='flex-start'>
                        <Grid sx={{ fontSize: 15, fontWeight: 'fontWeightBold' }}>Auction</Grid>
                        {/* <Grid sx={{ fontSize: 13 }}>{'  '} #{auction.auctionCounter} </Grid> */}
                      </Grid>
                      <Grid xs={4} sx={{ fontSize: 12, textAlign: 'center' }}>Lease: {' '} {auction.auctionInfo[0]}</Grid>
                      <Grid xs={4} sx={{ fontSize: 12, textAlign: 'right' }}>Stage: {' '} {auction.auctionInfo[1]}</Grid>
                    </Grid>
                  </Paper>
                </Grid>
              }
              {auction?.crowdloans.map((crowdloan) => (
                <Grid container item key={crowdloan.fund.paraId} xs={12}>
                  {(crowdloan.identity.info.legal || crowdloan.identity.info.display) &&
                    <Grid item xs={12} sx={{ padding: '10px' }}>
                      <Paper elevation={3} >
                        <Grid container alignItems='center' sx={{ padding: '10px' }}>
                          <Grid item xs={5} container justifyContent='flex-start' spacing={1} sx={{ fontSize: 13, fontWeight: 'fontWeightBold' }}>
                            <Grid item>
                              {crowdloan.identity.info.web &&
                                <Avatar
                                  src={getWebsiteFavico(crowdloan.identity.info.web)}
                                  sx={{ height: 24, width: 24 }}
                                />
                              }
                            </Grid>

                            <Grid item>
                              {crowdloan.identity.info.legal || crowdloan.identity.info.display}
                            </Grid>
                            {crowdloan.identity.info.web &&
                              <Grid item>
                                <Link href={`${crowdloan.identity.info.web}`}
                                  target='_blank'
                                  rel='noreferrer'
                                >
                                  <LaunchRounded color='primary' sx={{ fontSize: 15 }} />
                                </Link>
                              </Grid>}
                            {crowdloan.identity.info.twitter &&
                              <Grid item>
                                <Link href={`https://twitter.com/${crowdloan.identity.info.twitter}`}>
                                  <Twitter color='primary' sx={{ fontSize: 15 }} />
                                </Link>
                                {/* {' '} {crowdloan.identity.info.twitter} */}
                              </Grid>
                            }
                            {crowdloan.identity.info.email &&
                              <Grid item >
                                <Link href={`mailto:${crowdloan.identity.info.email}`}>
                                  <Email color='secondary' sx={{ fontSize: 15 }} />
                                </Link>
                                {/* {' '} {crowdloan.identity.info.email} */}
                              </Grid>}
                          </Grid>

                          <Grid xs={3} sx={{ fontSize: 12, textAlign: 'center' }} >
                            Leases: {' '} {String(crowdloan.fund.firstPeriod)} - {String(crowdloan.fund.lastPeriod)}
                          </Grid>
                          <Grid xs={4} sx={{ fontSize: 12, textAlign: 'right' }} >
                            End: {' '} {String(crowdloan.fund.end)}
                          </Grid>

                          <Grid xs={6} sx={{ fontSize: 11, textAlign: 'left' }} >
                            Parachain Id: {' '} {crowdloan.fund.paraId}
                          </Grid>
                          <Grid xs={6} sx={{ fontSize: 12, textAlign: 'right' }} >
                            Raised/Cap: {' '} {amountToHuman(crowdloan.fund.raised, decimals)}/{amountToHuman(crowdloan.fund.cap, decimals)}
                          </Grid>

                          {/* <Grid xs={12} sx={{ fontSize: 11 }} >
                            depositor: {' '} {String(crowdloan.fund.depositor)}
                          </Grid> */}


                          <Grid item container xs={12}>
                            {/* <Grid item xs={12} sx={{ padding: '20px 0px 10px' }}>
                              {contributingTo === crowdloan &&
                                <TextField
                                  InputLabelProps={{ shrink: true }}
                                  InputProps={{ endAdornment: (<InputAdornment position='end'>{coin}</InputAdornment>) }}
                                  autoFocus
                                  color='warning'
                                  // error={reapeAlert || noFeeAlert || zeroBalanceAlert}
                                  fullWidth
                                  helperText={(t('Minimum contribution: ') + amountToHuman(auction.minContribution, decimals) + ' ' + coin)}
                                  label={t('Amount')}
                                  margin='dense'
                                  name='contributionAmount'
                                  // onBlur={(event) => handleTransferAmountOnBlur(event.target.value)}
                                  // onChange={(event) => handleTransferAmountOnChange(event.target.value)}
                                  placeholder={amountToHuman(auction.minContribution, decimals)}
                                  size='medium'
                                  type='number'
                                  // value={transferAmountInHuman}
                                  variant='outlined'
                                />
                              }
                            </Grid> */}
                            <Button
                              data-button-action=''
                              // isBusy={}
                              // isDisabled={}
                              // eslint-disable-next-line react/jsx-no-bind
                              onClick={() => handleContribute(crowdloan)}
                            >
                              {contributingTo === crowdloan ? t('Next') : t('Contribute')}
                            </Button>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  }
                </Grid>
              ))
              }
            </Grid>
          }
        </div>

        {confirmModalOpen && auction && contributingTo &&
          <ConfirmCrowdloan
            auction={auction}
            coin={coin}
            confirmModalOpen={confirmModalOpen}
            crowdloan={contributingTo}
            decimals={decimals}
            genesisHash={genesisHash}
            selectedBlockchain={selectedBlockchain}
            setConfirmModalOpen={setConfirmModalOpen}

          />
        }
      </>
    </>
  );
}

export default styled(CrowdLoanList)`
  height: calc(100vh - 2px);
  overflow-y: auto;

  .empty-list {
    text-align: center;
  }
`;
