// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line simple-import-sort/imports
import type { StakingLedger } from '@polkadot/types/interfaces';

import { CheckRounded, Clear } from '@mui/icons-material';
import { Avatar, Button as MuiButton, Container, Divider, Grid, IconButton, InputAdornment, Modal, Skeleton, TextField } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';

import { Chain } from '@polkadot/extension-chains/types';
import getChainLogo from '../../util/newUtils/getChainLogo';
import { DeriveStakingQuery } from '@polkadot/api-derive/types';
import keyring from '@polkadot/ui-keyring';

import useTranslation from '../../hooks/useTranslation';
import { AccountsBalanceType, StakingConsts, TransactionDetail, Validators, ValidatorsName } from '../../util/newUtils/pjpeTypes';
import getNetworkInfo from '../../util/newUtils/getNetwork';
import { amountToHuman, getSubstrateAddress, getTransactionHistoryFromLocalStorage, prepareMetaData } from '../../util/newUtils/pjpeUtils';
import ValidatorsList from './ValidatorsList';
import { AccountContext, ActionText, BackButton, Button } from '../../components';
import { bondOrBondExtra, chill, nominate, unbond, withdrawUnbonded } from '@polkadot/extension-ui/util/newUtils/staking';
import { grey } from '@mui/material/colors';
import { AccountWithChildren } from '@polkadot/extension-base/background/types';
import { updateMeta } from '@polkadot/extension-ui/messaging';

interface Props {
  chain?: Chain | null;
  // handleEasyStakingModalClose: Dispatch<SetStateAction<boolean>>;
  state: string;
  setState: React.Dispatch<React.SetStateAction<string>>;
  staker: AccountsBalanceType;
  showConfirmStakingModal: boolean;
  setConfirmStakingModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectValidatorsModalOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  stakingConsts: StakingConsts | null;
  amount: bigint;
  validatorsInfo?: Validators | null;
  ledger: StakingLedger | null;
  nominatedValidators: DeriveStakingQuery[] | null;
  coin: string;
  validatorsName: ValidatorsName[] | null;
  selectedValidators: DeriveStakingQuery[] | null;
  validatorsToList: DeriveStakingQuery[] | null;
}

export default function ConfirmStaking({
  amount, chain, coin, ledger, nominatedValidators, selectedValidators, setConfirmStakingModalOpen,
  setSelectValidatorsModalOpen, setState, showConfirmStakingModal, staker, stakingConsts, state, validatorsName, validatorsToList }
  : Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { hierarchy } = useContext(AccountContext);
  const [decimals, setDecimals] = useState<number>(1);
  const [confirmingState, setConfirmingState] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordIsCorrect, setPasswordIsCorrect] = useState<number>(0);// 0: no password, -1: password incorrect, 1:password correct
  const [currentlyStaked, setCurrentlyStaked] = useState<bigint>(0n);
  const [totalStakedInHuman, setTotalStakedInHuman] = useState<string>('');

  async function saveHistory(chain: Chain | null, hierarchy: AccountWithChildren[], address: string, currentTransactionDetail: TransactionDetail): Promise<boolean> {
    const accountSubstrateAddress = getSubstrateAddress(address);
    const savedHistory: TransactionDetail[] = getTransactionHistoryFromLocalStorage(chain, hierarchy, accountSubstrateAddress);

    savedHistory.push(currentTransactionDetail);

    return updateMeta(accountSubstrateAddress, prepareMetaData(chain, 'history', savedHistory));
  }

  useEffect(() => {
    console.log('amount is :', amount);
    console.log('state is :', state);

    if (['confirming', 'success', 'failed'].includes(confirmingState)) {
      return;
    }

    switch (state) {
      case ('stakeAuto'):
      case ('stakeManual'):
      case ('stakeKeepNominated'):
        setTotalStakedInHuman(amountToHuman((currentlyStaked + amount).toString(), decimals));
        break;
      case ('unstake'):
        setTotalStakedInHuman(amountToHuman((currentlyStaked - amount).toString(), decimals));
        break;
      default:
        setTotalStakedInHuman(amountToHuman((currentlyStaked).toString(), decimals));
        break;
    }
  }, [amount, currentlyStaked, decimals, state]);

  useEffect(() => {
    if (!chain) { return; }

    const { decimals } = getNetworkInfo(chain);

    setDecimals(decimals);
  }, [chain]);

  useEffect(() => {
    if (!ledger) { return; }

    setCurrentlyStaked(BigInt(String(ledger.active)));
  }, [ledger]);

  const handleClearPassword = (): void => {
    setPasswordIsCorrect(0);
    setPassword('');
  };

  const handleSavePassword = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setPassword(event.target.value);

    if (event.target.value === '') { handleClearPassword(); }
  };

  const handleConfirmStakingModalClose = (): void => {
    setConfirmStakingModalOpen(false);
  };

  const handleConfirmStakingModalBack = (): void => {
    if (!['stakeManual', 'changeValidators'].includes(state)) {
      setState('');
      setConfirmingState('');
    }

    handleConfirmStakingModalClose();
  };

  const stateInHuman = (state: string): string => {
    switch (state) {
      case ('stakeAuto'):
      case ('stakeManual'):
      case ('stakeKeepNominated'):
        return 'Staking of'.toUpperCase();
      case ('changeValidators'):
        return 'nominating'.toUpperCase();
      case ('unstake'):
        return 'unstaking'.toUpperCase();
      case ('withdrawUnbound'):
        return 'redeem'.toUpperCase();
      default:
        return state.toUpperCase();
    }
  };

  const isEqual = (a1: string[] | null, a2: string[] | null): boolean => {
    if (!a1 && !a2) {
      return true;
    }

    if (!(a1 || a2)) {
      return false;
    }

    const a1Sorted = a1?.slice().sort();
    const a2Sorted = a2?.slice().sort();

    return JSON.stringify(a1Sorted) === JSON.stringify(a2Sorted);
  };

  const handleConfirm = async (): Promise<void> => {
    const localState = state;

    try {
      setConfirmingState('confirming');

      const signer = keyring.getPair(String(staker.address));

      signer.unlock(password);
      setPasswordIsCorrect(1);
      const alreadyBondedAmount = BigInt(String(ledger?.total));

      if (['stakeAuto', 'stakeManual', 'stakeKeepNominated'].includes(localState) && amount !== 0n) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        const { failureText, fee, status, txHash } = await bondOrBondExtra(chain, staker.address, signer, amount, alreadyBondedAmount);

        console.log('bond Result,', status);

        const history: TransactionDetail = {
          action: alreadyBondedAmount ? 'bond_extra' : 'bond',
          amount: amountToHuman(String(amount), decimals),
          date: Date.now(),
          fee: fee || '',
          from: staker.address,
          hash: txHash || '',
          status: failureText || status,
          to: ''
        };

        if (chain) {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          saveHistory(chain, hierarchy, staker.address, history);
        }

        if (status === 'failed' || localState === 'stakeKeepNominated') {
          setConfirmingState(status);

          return;
        }
      }

      if (['changeValidators', 'stakeAuto', 'stakeManual'].includes(localState)) {
        const nominatedValidatorsId = nominatedValidators ? nominatedValidators.map((v) => String(v.accountId)) : [];
        const selectedValidatorsAccountId = selectedValidators ? selectedValidators.map((v) => String(v.accountId)) : [];

        if (['stakeAuto'].includes(localState)) {
          if (!selectedValidators) {
            console.log('! there is no selectedValidators to bond at Stakeauto, so might do bondExtera');

            if (alreadyBondedAmount) {
              setConfirmingState('success');
            } else {
              setConfirmingState('failed');
            }

            return;
          }

          if (isEqual(selectedValidatorsAccountId, nominatedValidatorsId)) {
            console.log('the selected and previously nominated validators are the same, no need to renominate');

            setConfirmingState('success');

            return;
          }
        }

        if (['stakeManual'].includes(localState)) { // TODO: more check!!
          if (!selectedValidatorsAccountId) {
            console.log('selectedValidatorsAccountId is empty!!');
            setConfirmingState('failed');

            return;
          }
        }

        if (['changeValidators'].includes(localState)) {
          if (!selectedValidatorsAccountId) {
            console.log('! there is no selectedValidatorsAccountId to changeValidators');
            setConfirmingState('failed');

            return;
          }

          if (isEqual(selectedValidatorsAccountId, nominatedValidatorsId)) {
            console.log('the selected and previously nominated validators are the same, no need to renominate');

            setConfirmingState('failed');

            return;
          }
        }

        const { failureText, fee, status, txHash } = await nominate(chain, staker.address, signer, selectedValidatorsAccountId);

        const history: TransactionDetail = {
          action: 'nominate',
          amount: '',
          date: Date.now(),
          fee: fee || '',
          from: staker.address,
          hash: txHash || '',
          status: failureText || status,
          to: ''
        };

        if (chain) {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          saveHistory(chain, hierarchy, staker.address, history);
        }

        console.log('nominateResult,', status);
        setConfirmingState(status);
      }

      if (localState === 'unstake' && amount > 0n) {
        if (amount === currentlyStaked) {
          // if you are unstaking all, should chill first
          const { failureText, fee, status, txHash } = await chill(chain, staker.address, signer);

          const history: TransactionDetail = {
            action: 'chill',
            amount: '',
            date: Date.now(),
            fee: fee || '',
            from: staker.address,
            hash: txHash || '',
            status: failureText || status,
            to: ''
          };

          if (chain) {
            // eslint-disable-next-line no-void
            void saveHistory(chain, hierarchy, staker.address, history);
          }

          if (state === 'failed') {
            console.log('chilling failed:', failureText);
            setConfirmingState(status);

            return;
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        const { failureText, fee, status, txHash } = await unbond(chain, staker.address, signer, amount);

        const history: TransactionDetail = {
          action: 'unbond',
          amount: amountToHuman(String(amount), decimals),
          date: Date.now(),
          fee: fee || '',
          from: staker.address,
          hash: txHash || '',
          status: failureText || status,
          to: ''
        };

        if (chain) {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          saveHistory(chain, hierarchy, staker.address, history);
        }

        console.log('unbond:', status);
        setConfirmingState(status);
      }

      if (localState === 'withdrawUnbound' && amount > 0n) {
        const { failureText, fee, status, txHash } = await withdrawUnbonded(chain, staker.address, signer);

        const history: TransactionDetail = {
          action: 'redeem',
          amount: amountToHuman(String(amount), decimals),
          date: Date.now(),
          fee: fee || '',
          from: staker.address,
          hash: txHash || '',
          status: failureText || status,
          to: ''
        };

        if (chain) {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          saveHistory(chain, hierarchy, staker.address, history);
        }

        console.log('withdrawUnbound:', status);
        setConfirmingState(status);
      }
    } catch (e) {
      console.log('error:', e);
      setPasswordIsCorrect(-1);
      setState(localState);
      setConfirmingState('');
    }
  };

  const handleReject = (): void => {
    setState('');
    setConfirmingState('');
    if (setSelectValidatorsModalOpen) setSelectValidatorsModalOpen(false);
    handleConfirmStakingModalClose();
  };

  return (
    <>
      <Modal
        // eslint-disable-next-line react/jsx-no-bind
        onClose={(_event, reason) => {
          if (reason !== 'backdropClick') {
            handleConfirmStakingModalClose();
          }
        }}
        open={showConfirmStakingModal}
      >
        <div style={{
          backgroundColor: '#FFFFFF',
          display: 'flex',
          height: '100%',
          maxWidth: 700,
          // overflow: 'scroll',
          position: 'relative',
          top: '5px',
          transform: `translateX(${(window.innerWidth - 560) / 2}px)`,
          width: '560px'
        }}
        >
          <Container disableGutters maxWidth='md' sx={{ marginTop: 2 }}>
            <Grid item alignItems='center' container justifyContent='space-between' sx={{ padding: '0px 20px' }}>
              <Grid item >
                <Avatar
                  alt={'logo'}
                  src={getChainLogo(chain)}
                />
              </Grid>
              <Grid item sx={{ fontSize: 15 }}>
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
            <Grid alignItems='center' container>
              {/* <Grid item sx={{ textAlign: 'center', fontSize: 15, fontWeight: 'bold', padding: '20px 20px 20px' }} xs={12}>
                {stateInHuman(state)}

              </Grid> */}
              <Grid item container xs={12} sx={{ backgroundColor: '#f7f7f7', padding: '25px 40px 10px' }}>
                <Grid item xs={3} sx={{ border: '2px double grey', borderRadius: '5px', fontSize: 15, justifyContent: 'flex-start', padding: '5px 10px 5px', textAlign: 'center', fontVariant: 'small-caps' }}>
                  {stateInHuman(confirmingState || state)}
                </Grid>
                {amount
                  ? <Grid item container justifyContent='center' spacing={1} xs={12} sx={{ fontFamily: 'fantasy', fontSize: 18, textAlign: 'center' }} >
                    <Grid item>
                      {amountToHuman(amount.toString(), decimals)}
                    </Grid>
                    <Grid item>
                      {coin}
                    </Grid>
                  </Grid>
                  : ''}

                <Grid item xs={12} container justifyContent='space-between' alignItems='center' sx={{ fontSize: 12, paddingTop: '30px' }} >
                  <Grid item container xs={5} justifyContent='flex-start' spacing={1}>
                    <Grid item sx={{ fontSize: 12, fontWeight: '600' }}>
                      {t('Currently staked')}:
                    </Grid>
                    <Grid item sx={{ fontSize: 12 }}>
                      {!ledger
                        ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '60px' }} />
                        : <>
                          {currentlyStaked ? amountToHuman(currentlyStaked.toString(), decimals) : '0.00'}
                        </>
                      }{coin}
                    </Grid>
                  </Grid>
                  <Grid container item justifyContent='flex-end' spacing={1} xs={5}>
                    <Grid item sx={{ fontSize: 12, fontWeight: '600' }}>
                      {t('Total')}:
                    </Grid>
                    <Grid item sx={{ fontSize: 12 }}>
                      {!ledger
                        ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '60px' }} />
                        : <>
                          {totalStakedInHuman}
                        </>
                      }{coin}
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
              {stakingConsts && !['withdrawUnbound', 'unstake'].includes(state)
                ? <>
                  <Grid item sx={{ textAlign: 'center', color: grey[600], fontFamily: 'fantasy', fontSize: 16, padding: '15px 50px 5px' }} xs={12}>
                    {t('VALIDATORS')}
                  </Grid>
                  <Grid item sx={{ fontSize: 14, padding: '1px 20px 0px' }} xs={12}>

                    <ValidatorsList
                      chain={chain}
                      stakingConsts={stakingConsts}
                      validatorsInfo={validatorsToList}
                      validatorsName={validatorsName} />

                  </Grid>
                </>
                : <Grid sx={{ margin: '110px' }}>{' '}</Grid>
              }
            </Grid>
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
                autoFocus={!['confirming', 'failed', 'success'].includes(confirmingState)}
                color='warning'
                disabled={!ledger}
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
                    <BackButton onClick={handleConfirmStakingModalBack} />
                  </Grid>
                  <Grid item xs={11} sx={{ paddingLeft: '10px' }}>
                    <Button
                      data-button-action=''
                      isBusy={confirmingState === 'confirming'}
                      isDisabled={!ledger}
                      onClick={handleConfirm}
                    >
                      {t('Confirm')}
                    </Button>
                  </Grid>
                  {/* <Grid item xs={3} justifyContent='center' sx={{ paddingTop: 2, fontSize: 15 }}>
                    <div style={state === 'confirming' ? { opacity: '0.4', pointerEvents: 'none' } : {}}>
                      <ActionText
                        // className={{'margin': 'auto'}}
                        onClick={handleReject}
                        text={t('Reject') }
                      />
                    </div>
                  </Grid> */}
                </>}
            </Grid>
          </Container>
        </div>
      </Modal>
    </>
  );
}