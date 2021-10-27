// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line simple-import-sort/imports
import type { AccountJson, AccountWithChildren } from '@polkadot/extension-base/background/types';
import type { SettingsStruct } from '@polkadot/ui-settings/types';
import { DEFAULT_TYPE } from '../../util/defaultType';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ArrowBackIosRounded, CheckRounded as CheckRoundedIcon, Clear as ClearIcon, CloseRounded } from '@mui/icons-material';
import LoadingButton from '@mui/lab/LoadingButton';
import { Alert, Avatar, Box, Button, Chip, Container, Divider, Grid, IconButton, InputAdornment, List, ListItem, ListItemButton, ListItemIcon, ListItemText, ListSubheader, Modal, TextField, Tooltip } from '@mui/material';
import keyring from '@polkadot/ui-keyring';
import React, { Dispatch, SetStateAction, useCallback, useContext, useEffect, useState } from 'react';
import ConfirmTx from './ConfirmTx';
import { Chain } from '@polkadot/extension-chains/types';
import type { KeypairType } from '@polkadot/util-crypto/types';

import useTranslation from '../../hooks/useTranslation';
import getChainLogo from '../../util/HackathonUtilFiles/getChainLogo';
import getFee from '../../util/HackathonUtilFiles/getFee';
import getNetworkInfo from '../../util/HackathonUtilFiles/getNetwork';
import isValidAddress from '../../util/HackathonUtilFiles/validateAddress';
import { AccountContext, SettingsContext } from '../contexts';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';
import { accountsBalanceType, amountToHuman, amountToMachine, balanceToHuman, DEFAULT_COIN, fixFloatingPoint } from '../../util/HackathonUtilFiles/hackatonUtils';
import grey from '@mui/material/colors/grey';

interface Props {
  actions?: React.ReactNode;
  sender: accountsBalanceType;
  transferModalOpen: boolean;
  chain?: Chain | null;
  children?: React.ReactNode;
  className?: string;
  setTransferModalOpen: Dispatch<SetStateAction<boolean>>;
  givenType?: KeypairType;
  balances?: accountsBalanceType[] | null;
  setBalances?: React.Dispatch<React.SetStateAction<accountsBalanceType[]>>;
}

interface Recoded {
  account: AccountJson | null;
  formatted: string | null;
  genesisHash?: string | null;
  prefix?: number;
  type: KeypairType;
}

export default function TransferFunds({ chain, givenType, sender, setTransferModalOpen, transferModalOpen, balances, setBalances }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const [availableBalance, setAvailableBalance] = useState<string>('');
  const settings = useContext(SettingsContext);
  const [nextButtonDisabled, setNextButtonDisabled] = useState(true);
  const [transferAmount, setTransferAmount] = useState<bigint>(0n);
  const [transferAmountInHuman, setTransferAmountInHuman] = useState('');

  const [lastFee, setLastFee] = useState<string>();
  const [reapeAlert, setReapAlert] = useState(false);
  const [noFeeAlert, setNoFeeAlert] = useState(false);
  const [zeroBalanceAlert, setZeroBalanceAlert] = useState(false);
  const [nextButtonCaption, setNextButtonCaption] = useState<string>(t('Next'));
  const [recepientAddressIsValid, setRecepientAddressIsValid] = useState(false);
  const [recepient, setRecepient] = useState<accountsBalanceType | null>();
  const [allAddresesOnThisChain, setAllAddresesOnThisChain] = useState<accountsBalanceType[] | null>();
  const [transferBetweenMyAccountsButtonText, setTransferBetweenMyAccountsButtonText] = useState<string>(t('Transfer between my accounts'));
  const [coin, setCoin] = useState('');
  const [ED, setED] = useState(0);
  const [allAmountLoading, setAllAmountLoading] = useState(false);
  const [safeMaxAmountLoading, setsafeMaxAmountLoading] = useState(false);

  useEffect((): void => {
    const { ED, coin } = getNetworkInfo(chain);

    setCoin(coin || DEFAULT_COIN);
    setED(ED || 0);
  }, [chain]);

  useEffect((): void => {
    setAvailableBalance(balanceToHuman(sender, 'available'));
  }, [sender]);

  // find an account in our list
  function findAccountByAddress(accounts: AccountJson[], _address: string): AccountJson | null {
    return accounts.find(({ address }): boolean =>
      address === _address
    ) || null;
  }

  // find an account in our list
  function findSubstrateAccount(accounts: AccountJson[], publicKey: Uint8Array): AccountJson | null {
    const pkStr = publicKey.toString();

    return accounts.find(({ address }): boolean =>
      decodeAddress(address).toString() === pkStr
    ) || null;
  }

  function recodeAddress(address: string, accounts: AccountWithChildren[], settings: SettingsStruct, chain?: Chain | null): Recoded {
    // decode and create a shortcut for the encoded address
    const publicKey = decodeAddress(address);

    // find our account using the actual publicKey, and then find the associated chain
    const account = findSubstrateAccount(accounts, publicKey);
    const prefix = chain ? chain.ss58Format : (settings.prefix === -1 ? 42 : settings.prefix);

    // always allow the actual settings to override the display
    return {
      account,
      formatted: encodeAddress(publicKey, prefix),
      genesisHash: account?.genesisHash,
      prefix,
      type: account?.type || DEFAULT_TYPE
    };
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function handleClearRecepientAddress() {
    setNextButtonDisabled(true);
    setAllAddresesOnThisChain(null);
    setRecepient(null);
    setRecepientAddressIsValid(false);
    setTransferBetweenMyAccountsButtonText(t('Transfer between my accounts'));
  }

  const handleTransferModalClose = useCallback((): void => {
    setTransferModalOpen(false);
    handleClearRecepientAddress();
  }, [handleClearRecepientAddress, setTransferModalOpen]);

  function handleAddressIsValid(_isValid: boolean, _address: string, _name?: string | null) {
    setRecepient({ address: _address, chain: null, name: String(_name) });
    setRecepientAddressIsValid(_isValid);
  }

  function handleRecepientAddressChange(e: React.ChangeEvent<HTMLInputElement>) {
    const isValid = isValidAddress(e.target.value);

    // TODO: double chekc the name should not be null!
    handleAddressIsValid(isValid, e.target.value, null);
  }

  useEffect(() => {
    if (!Number(availableBalance)) {
      return setZeroBalanceAlert(true);
    } else {
      setZeroBalanceAlert(false);
    }

    const { decimals, defaultFee } = getNetworkInfo(chain);

    if (Number(transferAmountInHuman) < Number(availableBalance) &&
      (Number(availableBalance) < Number(transferAmountInHuman) +
        (ED + Number(amountToHuman(lastFee || defaultFee, decimals)))
      )) {
      setReapAlert(true);
    } else {
      setReapAlert(false);
    }

    if (Number(availableBalance) === Number(transferAmountInHuman) + Number(amountToHuman(lastFee || defaultFee, decimals))) {
      setNoFeeAlert(true);
    } else {
      setNoFeeAlert(false);
    }

    if (Number(availableBalance) <= Number(transferAmountInHuman) || Number(transferAmountInHuman) === 0) {
      setNextButtonDisabled(true);

      if (Number(availableBalance) <= Number(transferAmountInHuman) && Number(transferAmountInHuman) !== 0) {
        setNextButtonCaption(t('Insufficient Balance'));
      }
    } else {
      setNextButtonDisabled(false);
      setNextButtonCaption(t('Next'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transferAmountInHuman, availableBalance, ED, t]);

  function handleTransferAmountOnChange(value: string) {
    if (Number(value) < 0) {
      value = String(-Number(value));
    }

    setTransferAmountInHuman(fixFloatingPoint(value));
  }

  function handleTransferAmountOnBlur(value: string) {
    const { decimals } = getNetworkInfo(chain);
    let floatingPointDigit = 0;
    const v = value.split('.');

    if (v.length === 2) {
      floatingPointDigit = v[1].length;
      value = v[0] + v[1];
    }

    setTransferAmount(BigInt(Number(value)) * BigInt(10 ** (decimals - floatingPointDigit)));
  }

  function handleAccountListClick(event: React.MouseEvent<HTMLElement>) {
    const selectedAddressTextTarget = event.target as HTMLInputElement;
    const selectedAddressText = selectedAddressTextTarget.innerText;
    const selectedAddres = selectedAddressText.split(' ').slice(-1);
    const lastIndex = selectedAddressText.lastIndexOf(' ');
    const selectedName = selectedAddressText.substring(0, lastIndex);

    handleAddressIsValid(true, String(selectedAddres), String(selectedName));
  }

  const HandleSetMax = async (event: React.MouseEvent<HTMLElement>): Promise<void> => {
    if (!sender || !sender.balanceInfo || String(sender.balanceInfo.available) === '0' || !recepient) return;
    const available = sender.balanceInfo.available;

    const pairKey = keyring.getPair(String(sender.address));

    const { name } = event.target as HTMLButtonElement;

    if (name === 'All') {
      setAllAmountLoading(true);
    } else {
      setsafeMaxAmountLoading(true);
    }

    let fee;

    if (lastFee) {
      fee = lastFee;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      fee = await getFee(pairKey, String(recepient.address), BigInt(sender.balanceInfo.available), chain);
    }

    // .then((fee) => {
    if (!fee) {
      console.log('fee is NULL');

      return;
    }

    const { ED, decimals } = getNetworkInfo(chain);

    setLastFee(fee);
    let subtrahend = BigInt(fee);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    if (name === 'safeMax') {
      subtrahend += amountToMachine(String(ED), decimals);
    }

    let max = BigInt(available) - subtrahend;

    if (max <= 0) {
      max = 0n;
    }

    setTransferAmount(max);

    const fixedPointMax = fixFloatingPoint(Number(max) / (10 ** decimals));

    setTransferAmountInHuman(String(fixedPointMax));
    setAllAmountLoading(false);
    setsafeMaxAmountLoading(false);
    // });
  };

  const acountList = (
    transferBetweenMyAccountsButtonText === t('Back to all')
      ? <Box sx={{ bgcolor: 'background.paper', maxWidth: 360, width: '100%' }}>
        <nav aria-label='acount list'>
          <List
            subheader={
              <ListSubheader
                component='div'
                sx={{ textAlign: 'left' }}
              >
                {t('My Accounts')}
              </ListSubheader>
            }
          >
            {!allAddresesOnThisChain
              ? ''
              : allAddresesOnThisChain.map((addr) => (
                // eslint-disable-next-line react/jsx-key
                <ListItem disablePadding>
                  <ListItemButton onClick={handleAccountListClick}>
                    <ListItemIcon>
                      <Avatar
                        alt={`${coin} logo`}
                        // src={getLogoSource(coin)}
                        src={getChainLogo(chain)}
                      // sx={{ height: 45, width: 45 }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${String(addr.name)}  ${String(addr.address)}`}
                      primaryTypographyProps={{
                        fontSize: 14,
                        fontWeight: 'medium',
                        letterSpacing: 0
                      }}
                    />
                  </ListItemButton>
                  <Divider light />
                </ListItem>
              ))}
          </List></nav>
      </Box>
      : ''
  );

  function showAlladdressesOnThisChain(): void {
    // toggle button text
    const condition = transferBetweenMyAccountsButtonText === t('Transfer between my accounts');

    setTransferBetweenMyAccountsButtonText(condition ? t('Back to all') : t('Transfer between my accounts'));

    if (condition) {
      let allAddresesOnSameChain = accounts.map((acc): accountsBalanceType => {
        const accountByAddress = findAccountByAddress(accounts, acc.address);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const recoded = (chain?.definition.chainType === 'ethereum' ||
          accountByAddress?.type === 'ethereum' ||
          (!accountByAddress && givenType === 'ethereum'))
          ? { account: accountByAddress, formatted: acc.addres, type: 'ethereum' } as Recoded
          : recodeAddress(acc.address, accounts, settings, chain);

        return {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          address: recoded.formatted,
          // balanceInfo: null,
          chain: null,
          name: String(acc.name)
        };
      });

      allAddresesOnSameChain = allAddresesOnSameChain.filter((acc) => acc.address !== (sender.address));
      setAllAddresesOnThisChain(allAddresesOnSameChain);
    }
  }

  return (
    <Modal
      // eslint-disable-next-line react/jsx-no-bind
      onClose={(_event, reason) => {
        if (reason !== 'backdropClick') {
          handleTransferModalClose();
        }
      }}
      open={transferModalOpen}
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

        <Container>
          <Grid
            container
            justifyContent='flex-start'
            sx={{ paddingTop: '10px' }}
            xs={12}
          >
            <IconButton
              edge='start'
              onClick={handleTransferModalClose}
              size='small'
            >
              <CloseRounded fontSize='small' />
            </IconButton>
          </Grid>
          <Grid
            sx={{ paddingBottom: '10px' }}
            xs={12}
          >
            <Box
              fontSize={12}
              fontWeight='fontWeightBold'
            >
              <Divider>
                <Chip
                  icon={<FontAwesomeIcon
                    className='sendIcon'
                    icon={faPaperPlane}
                    size='lg'
                  />}
                  label={t('Transfer Funds')}
                  variant='outlined'
                />
              </Divider>
            </Box>
          </Grid>

          <Grid alignItems='center' container justifyContent='center'>
            <Grid item sx={{ paddingTop: '30px' }} xs={12}>
              <TextField
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        // eslint-disable-next-line react/jsx-no-bind
                        onClick={handleClearRecepientAddress}
                      >
                        {recepient !== null ? <ClearIcon /> : ''}
                      </IconButton>
                    </InputAdornment>
                  ),
                  startAdornment: (
                    <InputAdornment position='start'>
                      {recepientAddressIsValid ? <CheckRoundedIcon color='success' /> : ''}
                    </InputAdornment>
                  ),
                  style: { fontSize: 14 }
                }}
                fullWidth
                helperText={t('Reciever and sender must be on the same network')}
                label={t('Recipient')}
                // eslint-disable-next-line react/jsx-no-bind
                onChange={handleRecepientAddressChange}
                placeholder={t('Search, Public address')}
                size='medium'
                type='string'
                value={recepient ? recepient.address : ''}
                variant='outlined'
              />
              {!recepientAddressIsValid && recepient
                ? <Alert severity='error'>
                  {t('Recipient address is invalid')}
                </Alert>
                : ''
              }

            </Grid>
          </Grid>
          {!recepientAddressIsValid
            ? <>
              <Button
                fullWidth
                // eslint-disable-next-line react/jsx-no-bind
                onClick={showAlladdressesOnThisChain}
                startIcon={transferBetweenMyAccountsButtonText === t('Back to all') ? <ArrowBackIosRounded /> : null}
                sx={{ justifyContent: 'flex-start', marginTop: 2, textAlign: 'left' }}
                variant='text'
              >
                {transferBetweenMyAccountsButtonText}
              </Button>

              {acountList}
            </>
            : ''}
          {recepientAddressIsValid
            ? <div id='transferBody'>
              <Grid
                container
                justifyContent='space-between'
                sx={{ padding: '30px 30px 20px' }}
                xs={12}
              >
                <Grid item sx={{ color: grey[800], fontSize: '15px', fontWeight: '600', marginTop: 5, textAlign: 'left' }} xs={3}>
                  {t('Asset:')}
                </Grid>
                <Grid item xs={9}>
                  <Box mt={2} sx={{ border: '1px groove silver', borderRadius: '10px', p: 1 }}>
                    <Grid container justifyContent='flex-start' spacing={1}>
                      <Grid item xs={2}>
                        <Avatar alt={`${coin} logo`} // src={getLogoSource(coin)} 
                          src={getChainLogo(chain)}
                          sx={{ height: 45, width: 45 }}
                        />
                      </Grid>
                      <Grid container direction='column' item justifyContent='flex-start' xs={10}>
                        <Grid sx={{ fontSize: '14px', textAlign: 'left' }}>{coin}</Grid>
                        <Grid sx={{ fontSize: '12px', textAlign: 'left' }}>{t('Available Balance')}: {availableBalance}</Grid>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>

                <Grid item sx={{ fontSize: '15px', fontWeight: '600', color: grey[800], marginTop: 1, textAlign: 'left' }} xs={3}>
                  {t('Amount:')}
                  <Tooltip placement='right-end' title='Transfer all amount and deactivate the account.' arrow>
                    <LoadingButton
                      color='primary'
                      disabled={safeMaxAmountLoading}
                      loading={allAmountLoading}
                      name='All'
                      onClick={HandleSetMax}
                      size='small'
                      sx={{ display: 'inline-block', fontSize: '11px', padding: 0 }}
                      variant='outlined'
                    >
                      {t('All')}
                    </LoadingButton>
                  </Tooltip>
                  <Tooltip placement='right-end' title='Transfer max amount where the account remains active.' arrow>
                    <LoadingButton
                      color='primary'
                      disabled={allAmountLoading}
                      loading={safeMaxAmountLoading}
                      name='safeMax'
                      onClick={HandleSetMax}
                      size='small'
                      sx={{ display: 'inline-block', fontSize: '11px', padding: 0 }}
                      variant='outlined'
                    >
                      {t('Safe max')}
                    </LoadingButton>
                  </Tooltip>
                </Grid>
                <Grid
                  container
                  item
                  justifyContent='flex-start'
                  sx={{ marginTop: '20px' }}
                  xs={9}
                >
                  <Grid
                    item
                    xs={12}
                  >
                    <TextField
                      InputLabelProps={{ shrink: true }}
                      // eslint-disable-next-line sort-keys
                      InputProps={{ endAdornment: (<InputAdornment position='end'>{coin}</InputAdornment>) }}
                      autoFocus
                      error={reapeAlert || noFeeAlert || zeroBalanceAlert}
                      fullWidth
                      helperText={reapeAlert
                        ? (t('Account will be reaped, existential deposit:') + String(ED) + ' ' + coin)
                        : (noFeeAlert ? t('Fee must be considered, use MAX button instead.') : (zeroBalanceAlert ? t('Available balance is zero.') : ''))}
                      label={t('Transfer Amount')}
                      name='transfeAmount'
                      onBlur={(event) => handleTransferAmountOnBlur(event.target.value)}
                      onChange={(event) => handleTransferAmountOnChange(event.target.value)}
                      placeholder='0.0'
                      size='medium'
                      type='number'
                      value={transferAmountInHuman}
                      variant='outlined'
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid
                container
                justifyContent='space-between'
                sx={{ padding: '40px 40px 10px' }}
              >
                <Grid
                  item
                  xs={8}
                >
                  {recepient
                    ? <ConfirmTx
                      availableBalance={availableBalance}
                      balances={balances}
                      chain={chain}
                      coin={coin}
                      handleTransferModalClose={handleTransferModalClose}
                      lastFee={lastFee}
                      nextButtonCaption={nextButtonCaption}
                      nextButtonDisabled={nextButtonDisabled}
                      recepient={recepient}
                      sender={sender}
                      setBalances={setBalances}
                      transferAmount={transferAmount}
                    />
                    : ''}
                </Grid>
                <Grid
                  item
                  xs={3}
                >
                  <Button
                    color='secondary'
                    fullWidth
                    onClick={handleTransferModalClose}
                    variant='outlined'
                  >
                    {t('Cancel')}
                  </Button>
                </Grid>
              </Grid>
            </div>
            : ''}
        </Container>
      </div>
    </Modal>
  );
}
