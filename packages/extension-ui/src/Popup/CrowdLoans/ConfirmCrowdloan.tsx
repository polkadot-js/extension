// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CheckRounded, Clear, Email, LaunchRounded, Twitter } from '@mui/icons-material';
import { Avatar, Button as MuiButton, Container, Divider, FormControl, Grid, IconButton, InputAdornment, InputLabel, Link, MenuItem, Modal, Paper, Select, SelectChangeEvent, TextField } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useContext, useEffect, useState } from 'react';

import {  AccountWithChildren } from '@polkadot/extension-base/background/types';
import { Chain } from '@polkadot/extension-chains/types';
import { updateMeta } from '@polkadot/extension-ui/messaging';
import contribute from '@polkadot/extension-ui/util/newUtils/contribute';
import Identicon from '@polkadot/react-identicon';
import keyring from '@polkadot/ui-keyring';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import { ActionText, BackButton, Button } from '../../components';
import { AccountContext } from '../../components/contexts';
import useTranslation from '../../hooks/useTranslation';
import getChainLogo from '../../util/newUtils/getChainLogo';
import getNetworkInfo from '../../util/newUtils/getNetwork';
import { Auction, Crowdloans, TransactionDetail } from '../../util/newUtils/pjpeTypes';
import { amountToHuman, amountToMachine, fixFloatingPoint, getSubstrateAddress, getTransactionHistoryFromLocalStorage, getWebsiteFavico, prepareMetaData } from '../../util/newUtils/pjpeUtils';

interface Props {
  auction: Auction;
  crowdloan: Crowdloans;
  confirmModalOpen: boolean;
  setConfirmModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  decimals: number;
  coin: string;
  genesisHash: string;
  selectedBlockchain: string;

}

export default function ConfirmCrowdloan({ auction,
  coin,
  confirmModalOpen,
  crowdloan,
  decimals,
  genesisHash,
  selectedBlockchain,
  setConfirmModalOpen }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const [password, setPassword] = useState<string>('');
  const [contributionAmountInHuman, setContributionAmountInHuman] = useState<string>('');
  const [passwordIsCorrect, setPasswordIsCorrect] = useState<number>(0);// 0: no password, -1: password incorrect, 1:password correct
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [allAddresesOnThisChain, setAllAddresesOnThisChain] = useState<string[]>([]);
  const [confirmingState, setConfirmingState] = useState<string>('');
  const { accounts } = useContext(AccountContext);

  const { hierarchy } = useContext(AccountContext);

  function showAlladdressesOnThisChain(prefix: number): void {
    const allAddresesOnSameChain = accounts.map((acc): string => {
      const publicKey = decodeAddress(acc.address);

      return encodeAddress(publicKey, prefix);
    });

    setAllAddresesOnThisChain(allAddresesOnSameChain);
  };

  useEffect(() => {
    const { prefix } = getNetworkInfo(null, selectedBlockchain);

    console.log('hierarchy:', hierarchy);

    if (prefix !== undefined) { showAlladdressesOnThisChain(prefix); }
  }, []);

  useEffect(() => {
    if (allAddresesOnThisChain.length) { setSelectedAddress(allAddresesOnThisChain[0]); }
  }, [allAddresesOnThisChain]);


  function handleConfirmModaClose(): void {
    setConfirmModalOpen(false);
  }

  function saveHistory(chain: Chain | null, hierarchy: AccountWithChildren[], address: string, currentTransactionDetail: TransactionDetail, _chainName?: string): Promise<boolean> {
    const accountSubstrateAddress = getSubstrateAddress(address);
    const savedHistory: TransactionDetail[] = getTransactionHistoryFromLocalStorage(chain, hierarchy, accountSubstrateAddress, _chainName);

    savedHistory.push(currentTransactionDetail);

    return updateMeta(accountSubstrateAddress, prepareMetaData(chain, 'history', savedHistory, _chainName));
  }

  const handleConfirm = async (): Promise<void> => {
    setConfirmingState('confirming');

    try {
      const signer = keyring.getPair(selectedAddress);

      signer.unlock(password);
      setPasswordIsCorrect(1);

      const contributingAmountInMachine = amountToMachine(contributionAmountInHuman, decimals);

      const { failureText, fee, status, txHash } = await contribute(signer, crowdloan.fund.paraId, contributingAmountInMachine, selectedBlockchain)

      const history: TransactionDetail = {
        action: 'contribute',
        amount: contributionAmountInHuman,
        date: Date.now(),
        fee: fee || '',
        from: selectedAddress,
        hash: txHash || '',
        status: failureText || status,
        to: ''
      };

      console.log('history', history);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      saveHistory(null, hierarchy, selectedAddress, history, selectedBlockchain);

    } catch (e) {
      console.log('error:', e);
      setPasswordIsCorrect(-1);
      setConfirmingState('');
    }
  };

  const handleReject = (): void => {
    setConfirmingState('');
    handleConfirmModaClose();
  };

  const handleAddressChange = (event: SelectChangeEvent) => {
    setSelectedAddress(event.target.value);
  }

  const handleConfirmCrowdloanModalBack = (): void => {
    handleConfirmModaClose();
  };

  const handleClearPassword = (): void => {
    setPasswordIsCorrect(0);
    setPassword('');
  };

  const handleSavePassword = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setPassword(event.target.value);

    if (event.target.value === '') { handleClearPassword(); }
  };

  function handleContributionAmountChange(value: string) {
    if (Number(value) < 0) {
      value = String(-Number(value));
    }

    setContributionAmountInHuman(fixFloatingPoint(value));
  }

  return (
    <>
      <Modal
        hideBackdrop
        // eslint-disable-next-line react/jsx-no-bind
        onClose={handleConfirmModaClose}
        open={confirmModalOpen}
      >
        <div style={{
          backgroundColor: '#FFFFFF',
          display: 'flex',
          height: '100%',
          maxWidth: 700,
          position: 'relative',
          top: '5px',
          transform: `translateX(${(window.innerWidth - 560) / 2}px)`,
          width: '560px'
        }}
        >
          <Container disableGutters maxWidth='md' sx={{ marginTop: 2 }}>
            <Grid
              alignItems='center'
              container
              item
              justifyContent='space-between'
              sx={{ padding: '0px 20px' }}
            >
              <Grid item>
                <Avatar
                  alt={'logo'}
                  src={getChainLogo(null, selectedBlockchain)}
                />
              </Grid>
              <Grid
                item
                sx={{ fontSize: 15 }}
              >
                <div style={confirmingState === 'confirming' ? { opacity: '0.4', pointerEvents: 'none' } : {}}>
                  <ActionText
                    onClick={handleReject}
                    text={t('Reject')}
                  />
                </div>
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>
            </Grid>

            <Grid container sx={{ padding: '20px 40px 20px' }}>
              <FormControl fullWidth>
                <InputLabel id='selec-address'>Select Account</InputLabel>
                <Select
                  value={selectedAddress}
                  label='Select address'
                  onChange={handleAddressChange}
                >
                  {allAddresesOnThisChain?.map((address) => (
                    <MenuItem key={address} value={address}>
                      <Grid container alignItems='center' justifyContent='space-between'>
                        <Grid item>
                          <Identicon
                            size={25}
                            theme={'polkadot'}
                            value={address}
                          />
                        </Grid>
                        <Grid item sx={{ fontSize: 14 }}>
                          {address}
                        </Grid>
                      </Grid>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item sx={{ padding: '5px 40px 30px' }} xs={12}>
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
                onChange={(event) => handleContributionAmountChange(event.target.value)}
                placeholder={amountToHuman(auction.minContribution, decimals)}
                size='medium'
                type='number'
                value={contributionAmountInHuman}
                variant='outlined'
              />
            </Grid>

            <Grid item sx={{ textAlign: 'center', color: grey[600], fontFamily: 'fantasy', fontSize: 16, padding: '1px 50px 5px' }} xs={12}>
              {t('Crowdloan to contribute')}
            </Grid>

            {(crowdloan.identity.info.legal || crowdloan.identity.info.display) &&
              <Grid item sx={{ padding: '10px 30px' }} xs={12}>
                <Paper elevation={3} >
                  <Grid alignItems='center' container sx={{ padding: '10px' }}>
                    <Grid container item justifyContent='flex-start' spacing={1} sx={{ fontSize: 13, fontWeight: 'fontWeightBold' }} xs={5}>
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
                          <Link
                            href={`${crowdloan.identity.info.web}`}
                            rel='noreferrer'
                            target='_blank'
                          >
                            <LaunchRounded
                              color='primary'
                              sx={{ fontSize: 15 }}
                            />
                          </Link>
                        </Grid>}
                      {crowdloan.identity.info.twitter &&
                        <Grid item>
                          <Link href={`https://twitter.com/${crowdloan.identity.info.twitter}`}>
                            <Twitter
                              color='primary'
                              sx={{ fontSize: 15 }}
                            />
                          </Link>
                          {/* {' '} {crowdloan.identity.info.twitter} */}
                        </Grid>
                      }
                      {crowdloan.identity.info.email &&
                        <Grid item>
                          <Link href={`mailto:${crowdloan.identity.info.email}`}>
                            <Email
                              color='secondary'
                              sx={{ fontSize: 15 }}
                            />
                          </Link>
                          {/* {' '} {crowdloan.identity.info.email} */}
                        </Grid>}
                    </Grid>

                    <Grid sx={{ fontSize: 12, textAlign: 'center' }} xs={3}>
                      Leases: {' '} {String(crowdloan.fund.firstPeriod)} - {String(crowdloan.fund.lastPeriod)}
                    </Grid>
                    <Grid sx={{ fontSize: 12, textAlign: 'right' }} xs={4}>
                      End: {' '} {String(crowdloan.fund.end)}
                    </Grid>
                    <Grid container item justifyContent='space-between' sx={{ fontSize: 11, paddingTop: '10px' }} xs={12}>
                      <Grid item sx={{ paddingLeft: '30px' }} >
                        Parachain Id: {' '} {crowdloan.fund.paraId}
                      </Grid>
                      <Grid container item xs={6} direction='column' justifyContent='flex-end'>
                        <Grid item >
                          {amountToHuman(crowdloan.fund.raised, decimals)}/{amountToHuman(crowdloan.fund.cap, decimals)}
                        </Grid>
                        <Grid item>
                          Raised/Cap
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            }


            <Grid item sx={{ margin: '30px 30px 5px' }} xs={12}>
              <TextField
                InputLabelProps={{
                  shrink: true
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        onClick={handleClearPassword}
                      >
                        {password !== '' ? <Clear /> : ''}
                      </IconButton>
                    </InputAdornment>
                  ),
                  startAdornment: (
                    <InputAdornment position='start'>
                      {passwordIsCorrect === 1 ? <CheckRounded color='success' /> : ''}
                    </InputAdornment>
                  ),
                  style: { fontSize: 16 }
                }}
                // autoFocus={!['confirming', 'failed', 'success'].includes(confirmingState)}
                color='warning'
                // disabled={!ledger}
                error={passwordIsCorrect === -1}
                fullWidth
                helperText={passwordIsCorrect === -1 ? t('Password is not correct') : t('Please enter the stake account password')}
                label={t('Password')}
                onChange={handleSavePassword}
                onKeyPress={(event) => {
                  if (event.key === 'Enter') { handleConfirm(); }
                }}
                size='medium'
                type='password'
                value={password}
                variant='outlined'
              />
            </Grid>

            <Grid container item justifyContent='space-between' sx={{ padding: '5px 30px 0px' }} xs={12}>
              {['success', 'failed'].includes(confirmingState)
                ? <Grid item xs={12}>
                  <MuiButton fullWidth onClick={handleReject} variant='contained'
                    color={confirmingState === 'success' ? 'success' : 'error'} size='large'>
                    {confirmingState === 'success' ? t('Done') : t('Failed')}
                  </MuiButton>
                </Grid>
                : <>
                  <Grid item xs={1}>
                    <BackButton onClick={handleConfirmCrowdloanModalBack} />
                  </Grid>
                  <Grid item xs={11} sx={{ paddingLeft: '10px' }}>
                    <Button
                      data-button-action=''
                      isBusy={confirmingState === 'confirming'}
                      isDisabled={!selectedAddress}
                      onClick={handleConfirm}
                    >
                      {t('Confirm')}
                    </Button>
                  </Grid>
                </>}
            </Grid>
          </Container>
        </div>
      </Modal>
    </>
  );
}
