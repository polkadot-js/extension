// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeypairType } from '@polkadot/util-crypto/types';

import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ArrowBackIosRounded, ArrowForwardRounded, CheckRounded, Clear, InfoTwoTone as InfoTwoToneIcon, LaunchRounded, RefreshRounded } from '@mui/icons-material';
import LoadingButton from '@mui/lab/LoadingButton';
import { Alert, Avatar, Box, Button, CircularProgress, Container, Divider, Grid, IconButton, InputAdornment, Modal, TextField, Tooltip } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useContext, useEffect, useState } from 'react';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { AccountWithChildren } from '@polkadot/extension-base/background/types';
import { Chain } from '@polkadot/extension-chains/types';
import { getMetadata, updateTransactionHistory } from '@polkadot/extension-ui/messaging';
import getFee from '@polkadot/extension-ui/util/HackathonUtilFiles/getFee';
import keyring from '@polkadot/ui-keyring';

import useTranslation from '../../hooks/useTranslation';
import getChainLogo from '../../util/HackathonUtilFiles/getChainLogo';
import getNetworkInfo from '../../util/HackathonUtilFiles/getNetwork';
import { accountsBalanceType, amountToHuman, fixFloatingPoint, getFormattedAddress, handleAccountBalance, TransactionStatus } from '../../util/HackathonUtilFiles/hackatonUtils';
import signAndTransfer from '../../util/HackathonUtilFiles/signAndTransfer';
import { AccountContext, SettingsContext } from '../contexts';

interface Props {
  availableBalance: string;
  actions?: React.ReactNode;
  sender: accountsBalanceType;
  recepient: accountsBalanceType;
  chain?: Chain | null;
  children?: React.ReactNode;
  className?: string;
  genesisHash?: string | null;
  isExternal?: boolean | null;
  isHardware?: boolean | null;
  isHidden?: boolean;
  lastFee?: string;
  name?: string | null;
  parentName?: string | null;
  toggleActions?: number;
  type?: KeypairType;
  transferAmount: bigint;
  coin: string;
  nextButtonDisabled: boolean;
  nextButtonCaption: string;
  handleTransferModalClose: any;
  balances?: accountsBalanceType[] | null;
  setBalances?: React.Dispatch<React.SetStateAction<accountsBalanceType[]>>;
}

export default function ConfirmTx({
  availableBalance,
  chain,
  coin,
  handleTransferModalClose,
  lastFee,
  nextButtonCaption,
  nextButtonDisabled,
  recepient,
  sender,
  transferAmount,
  balances,
  setBalances }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const network = chain ? chain.name.replace(' Relay Chain', '') : 'westend';
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [fee, setFee] = useState<string>();
  const [total, setTotal] = useState<string | null>(null);
  const [confirmDisabled, setConfirmDisabled] = useState<boolean>(true);
  const [transactionHash, setTransactionHash] = useState<string>();
  const [failAlert, setFailAlert] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [passwordIsCorrect, setPasswordIsCorrect] = useState<number>(0);// 0: no password, -1: password incorrect, 1:password correct
  const [transfering, setTransfering] = useState<boolean>(false);
  const [txStatus, setTxStatus] = useState<TransactionStatus>({ blockNumber: null, success: null, text: null });
  const [transferAmountInHuman, setTransferAmountInHuman] = useState('');

  const { hierarchy } = useContext(AccountContext);
  const settings = useContext(SettingsContext);

  function getSenderTxHistory(): string | null {
    const txH = hierarchy.find((h) => h.address === sender.address);

    if (!txH) return null;

    return txH.txHistory ? txH.txHistory : null;
  }

  function makeAddressShort(_address: string): React.ReactElement {
    return (
      <Box
        component='span'
        fontFamily='Monospace'
      // fontStyle='oblique'
      // fontWeight='fontWeightBold'
      >
        {_address.slice(0, 4) +
          '...' +
          _address.slice(-4)}
      </Box>
    );
    // return _address.slice(0, 4) + '...' + _address.slice(-4);
  }

  useEffect(() => {
    const { decimals } = getNetworkInfo(chain);

    setTransferAmountInHuman(amountToHuman(String(transferAmount), decimals));
  }, [chain, transferAmount]);

  // useEffect(() => {
  //   // try {
  //   //   if (transfering) {
  //   //     const pair = keyring.getPair(String(sender.address));

  //   //     pair.unlock(password);
  //   //     setPasswordIsCorrect(1);

  //   //     // eslint-disable-next-line @typescript-eslint/no-floating-promises
  //   //     signAndTransfer(pair, String(recepient.address), transferAmount, chain, setTxStatus)
  //   //       .then((hash) => {
  //   //         setTransactionHash(hash);
  //   //         setTransfering(false);
  //   //       });

  //   //     subscribeAllAccounts();
  //   //   }
  //   // } catch (e) {
  //   //   setPasswordIsCorrect(-1);
  //   //   setTransfering(false);
  //   // }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [transfering]);

  useEffect(() => {
    if (!transactionHash) {
      return;
    }

    const { decimals } = getNetworkInfo(chain);

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    updateTransactionHistory(
      String(sender.address),
      amountToHuman(String(transferAmount), decimals),
      String(sender.balanceInfo?.coin),
      String(fee),
      transactionHash,
      String(txStatus.text),
      String(recepient.address),
      null || getSenderTxHistory());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionHash, txStatus]);

  function handleConfirmTransfer() {
    console.log('handleConfirmTransfer is runing ...')
    setTransfering(true);

    try {
      const pair = keyring.getPair(String(sender.address));

      pair.unlock(password);
      setPasswordIsCorrect(1);

      console.log('calling signAndTransfer.');

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      signAndTransfer(pair, String(recepient.address), transferAmount, chain, setTxStatus)
        .then((hash) => {
          setTransactionHash(hash);
          setTransfering(false);
        });

      setTimeout(subscribeAllAccounts, 1000);
    } catch (e) {
      setPasswordIsCorrect(-1);
      setTransfering(false);
    }
  }

  useEffect(() => {
    if (!confirmModalOpen) return;

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getDefaultFeeAndSetTotal(lastFee);

    function getDefaultFeeAndSetTotal(lastFee?: string): void {
      const { decimals, defaultFee } = getNetworkInfo(chain);

      lastFee = lastFee || defaultFee;

      setFee(amountToHuman(lastFee, decimals));

      const total = (Number(lastFee) + Number(transferAmount)) / (10 ** decimals);

      setTotal(fixFloatingPoint(total));

      setConfirmDisabled(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmModalOpen, lastFee]);

  useEffect(() => {
    setFailAlert(Number(total) > Number(availableBalance));
  }, [total, availableBalance]);

  function handleClearPassword() {
    setPasswordIsCorrect(0);
    setPassword('');
  }

  function handleSavePassword(event: React.ChangeEvent<HTMLInputElement>) {
    setPassword(event.target.value);

    if (event.target.value === '') { handleClearPassword(); }
  }

  function handleConfirmModaClose(): void {
    setConfirmModalOpen(false);
    setTransfering(false);
  }

  function handleReject(): void {
    setConfirmModalOpen(false);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    handleTransferModalClose();
  }

  const openTxOnExplorer = useCallback(() => window.open('https://' + network + '.subscan.io/extrinsic/' + String(transactionHash), '_blank')
    , [network, transactionHash]);

  function handleConfirmModaOpen(): void {
    setConfirmModalOpen(true);
  }

  function handleNext() {
    handleConfirmModaOpen();
  }

  const refreshNetworkFee = (): void => {
    setFee('');
    setConfirmDisabled(true);

    const pairKey = keyring.getPair(String(sender.address));

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getFee(pairKey, String(recepient.address), BigInt(transferAmount), chain)
      .then((f) => {
        if (!f) {
          console.log('fee is NULL');

          return;
        }

        const { decimals } = getNetworkInfo(chain);
        const t = transferAmount + BigInt(f);
        const fixedPointTotal = fixFloatingPoint(Number(t) / (10 ** decimals));

        setFee(amountToHuman(f, decimals));
        setTotal(fixedPointTotal);
        setConfirmDisabled(false);
      });
  };

  async function getChainData(genesisHash?: string | null): Promise<Chain | null> {
    if (genesisHash) {
      const chain = await getMetadata(genesisHash, true);

      if (chain) return chain;
    }

    return null;
  }

  function subscribeAllAccounts() {
    console.log('calling subscribeToBalanceChange for all accounts.')

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    hierarchy.forEach((h) => subscribeToBalanceChange(h));
  }

  async function subscribeToBalanceChange(_acc: AccountWithChildren) {
    const chain = _acc.genesisHash ? await getChainData(_acc.genesisHash) : null;
    const { coin, decimals, url } = getNetworkInfo(chain);
    const formattedAddress = getFormattedAddress(_acc.address, chain, settings);
    const wsProvider = new WsProvider(url);
    const api = await ApiPromise.create({ provider: wsProvider });

    const unsubscribe = await api.query.system.account(formattedAddress, ({ data: balance }) => {
      if (balance) {
        const result = {
          coin: coin,
          decimals: decimals,
          ...handleAccountBalance(balance)
        };
        let temp = [];

        if (balances) {
          temp = balances;
          const index = temp.findIndex((b) => b.address === _acc.address);

          if (index >= 0) {
            temp[index].balanceInfo = result;
            temp[index].chain = chain;
            temp[index].name = _acc.name || '';
          }
        } else {
          temp.push({
            address: _acc.address,
            balanceInfo: result,
            chain: chain,
            name: _acc.name || ''
          });
        }

        if (setBalances) {
          setBalances([...temp]);
        }
      }

      setTimeout(() => {
        unsubscribe();
        console.log('Unsubscribed');
      }, 60000); // unsubscribe after 20 sec.
    });
  }

  return (
    <>
      <Button
        color='primary'
        disabled={nextButtonDisabled}
        fullWidth
        name='Next Button'
        // eslint-disable-next-line react/jsx-no-bind
        onClick={handleNext}
        variant='contained'
        size='large'
      >
        {nextButtonCaption}
      </Button>
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
            <Grid alignItems='center' container justifyContent='space-between'>
              <Grid item xs={2}>
                <Button
                  // eslint-disable-next-line react/jsx-no-bind
                  onClick={handleConfirmModaClose}
                  startIcon={<ArrowBackIosRounded />}>
                  {t('Edit')}
                </Button>
              </Grid>
              <Grid item xs={2}>
                <Avatar
                  alt={'logo'}
                  src={getChainLogo(chain)}
                // sx={{ height: 45, width: 45 }}
                />
              </Grid>
            </Grid>
            <Divider light />
            <Grid container
              alignItems='center'
              justifyContent='space-around'
            >
              <Grid item xs={4} sx={{ fontSize: 14 }}>
                {sender.name ? sender.name : makeAddressShort(String(sender.address))}
              </Grid>
              <Divider orientation='vertical' flexItem>
                <Avatar sx={{ bgcolor: grey[300] }}>
                  <ArrowForwardRounded fontSize='small' />
                </Avatar>
              </Divider>
              <Grid item xs={4} sx={{ fontSize: 14 }}>
                {recepient.name != 'null' ? recepient.name : makeAddressShort(String(recepient.address))}
              </Grid>
              <Grid item container xs={12} sx={{ backgroundColor: '#f7f7f7', padding: '25px 40px 25px' }}>
                <Grid item xs={3} sx={{ padding: '5px 10px 5px', borderRadius: '5px', border: '2px double grey', justifyContent: 'flex-start', fontSize: 15, textAlign: 'center', fontVariant: 'small-caps' }}>
                  {t('transfer of')}
                </Grid>
                <Grid item container justifyContent='center' spacing={1} xs={12} sx={{ fontSize: 18, fontFamily: 'fantasy', textAlign: 'center' }} >
                  <Grid item>
                    {transferAmountInHuman}
                  </Grid>
                  <Grid item>
                    {coin}
                  </Grid>
                </Grid>
              </Grid>
              <Grid item container alignItems='center' xs={12} sx={{ padding: '30px 40px 20px' }}>
                <Grid item container xs={6}>
                  <Grid item sx={{ fontSize: 13, fontWeight: '600', textAlign: 'left' }}>
                    {'Network Fee'}
                  </Grid>
                  <Grid item sx={{ fontSize: 13, marginLeft: '5px', textAlign: 'left' }}>
                    <Tooltip placement='right-end' title='Network fees are paid to network validators who process transactions on the network. This wallet does not profit from fees. Fees are set by the network and fluctuate based on network traffic and transaction complexity.' arrow>
                      <InfoTwoToneIcon color='action' fontSize='small' />
                    </Tooltip>
                  </Grid>
                  <Grid item sx={{ alignItems: 'center', fontSize: 13, textAlign: 'left' }}>
                    <IconButton onClick={refreshNetworkFee} sx={{ top: -7 }}>
                      <Tooltip placement='right-end' title='get newtwork fee now' arrow>
                        <RefreshRounded color='action' fontSize='small' />
                      </Tooltip>
                    </IconButton>
                  </Grid>
                </Grid>
                <Grid item xs={6} sx={{ fontSize: 13, textAlign: 'right' }}>
                  {fee || <CircularProgress color='inherit' thickness={1} size={20} />}
                  <Box fontSize={11} sx={{ color: 'gray' }}>
                    {fee ? 'estimated' : 'estimating'}
                  </Box>
                </Grid>
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item container alignItems='center' xs={12} sx={{ padding: '10px 40px 20px' }}>
                <Grid item xs={1} sx={{ fontSize: 13, fontWeight: '600', textAlign: 'left' }}>
                  {'Total'}
                </Grid>
                <Grid item xs={8} sx={{ fontSize: 13, fontWeight: '600', textAlign: 'left' }}>
                  {failAlert
                    ? <Alert severity='warning' sx={{ fontSize: 11 }}>Transaction most likely fail, consider fee!</Alert>
                    : ''}
                </Grid>
                <Grid item xs={3} sx={{ fontSize: 13, fontWeight: '600', textAlign: 'right' }}>
                  {total || ' ... '} {' '} {coin}
                </Grid>
              </Grid>
              <Grid item sx={{ margin: '20px 40px 1px' }} xs={12}>
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
                  autoFocus
                  fullWidth
                  helperText={t('Please enter the password of the sender account')}
                  label={t('Password')}
                  onChange={handleSavePassword}
                  // eslint-disable-next-line react/jsx-no-bind
                  onKeyPress={(event) => {
                    if (event.key === 'Enter') { handleConfirmTransfer(); }
                  }}
                  size='medium'
                  // sx={{ fontSize: 20 }}
                  type='password'
                  value={password}
                  variant='outlined'
                />
                {passwordIsCorrect === -1
                  ? <Alert severity='error'>
                    {t('Password is not correct')}
                  </Alert>
                  : ''
                }

              </Grid>
            </Grid>
            <Grid container justifyContent='space-between' sx={{ padding: '20px 40px 10px' }}>
              {txStatus && (txStatus.success !== null)
                ? <Grid item xs={12}>
                  <Button fullWidth onClick={handleReject} variant='contained' color={txStatus.success ? 'success' : 'error'}>
                    {txStatus.success ? t('Done') : t('Failed')}

                  </Button>
                </Grid>
                : <>
                  <Grid item xs={6}>
                    <LoadingButton
                      color={failAlert ? 'warning' : 'primary'}
                      disabled={confirmDisabled}
                      fullWidth
                      loading={transfering}
                      loadingPosition='start'
                      name='transferButton'
                      onClick={handleConfirmTransfer}
                      startIcon={
                        <FontAwesomeIcon
                          icon={faPaperPlane}
                          size='lg'
                        />}
                      variant='contained'
                    >
                      {t('Confirm')}
                    </LoadingButton>
                  </Grid>
                  <Grid item xs={3}>
                    <Button color='secondary' disabled={transfering} fullWidth onClick={handleReject} variant='outlined'>
                      {t('Reject')}
                    </Button>
                  </Grid>
                </>}
              {txStatus.blockNumber || transactionHash
                ? <Grid alignItems='center' container item
                  sx={{ border: '1px groove silver', borderRadius: '10px', fontSize: 12, fontWeight: 'bold', marginTop: '10px', p: 1 }}>
                  <Grid item xs={10} sx={{ textAlign: 'center' }}>
                    {txStatus.success || txStatus.success === null
                      ? 'The transaction is ' + String(txStatus ? txStatus.text : '')
                      : String(txStatus.text)
                    }
                    {', block number ' + String(txStatus.blockNumber)}
                  </Grid>
                  <Grid item xs={2} sx={{ textAlign: 'right' }}>
                    <IconButton disabled={!transactionHash} size='small' onClick={openTxOnExplorer}>
                      <LaunchRounded />
                    </IconButton>
                  </Grid>
                </Grid>
                : ''
              }
            </Grid>

          </Container>
        </div>
      </Modal>
    </>
  );
}
