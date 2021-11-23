// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line simple-import-sort/imports
import type { StakingLedger } from '@polkadot/types/interfaces';

import { ArrowBackIosRounded, CheckRounded, Clear } from '@mui/icons-material';
import { Avatar, Button as MuiButton, Container, Divider, Grid, IconButton, InputAdornment, Modal, Skeleton, TextField } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';

import { Chain } from '@polkadot/extension-chains/types';
import getChainLogo from '@polkadot/extension-ui/util/HackathonUtilFiles/getChainLogo';
import { DeriveStakingQuery } from '@polkadot/api-derive/types';
import keyring from '@polkadot/ui-keyring';

import useTranslation from '../../hooks/useTranslation';
import { AccountsBalanceType, StakingConsts, Validators, ValidatorsName } from '../../util/HackathonUtilFiles/pjpeTypes';
import getNetworkInfo from '@polkadot/extension-ui/util/HackathonUtilFiles/getNetwork';
import { amountToHuman } from '@polkadot/extension-ui/util/HackathonUtilFiles/hackathonUtils';
import ValidatorsList from './ValidatorsList';
import { ActionText, Button } from '../';
import { bondOrExtra, nominate } from '@polkadot/extension-ui/util/HackathonUtilFiles/staking';
import { grey } from '@mui/material/colors';

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
  stakeAmount: bigint;
  validatorsInfo?: Validators | null;
  ledger: StakingLedger | null;
  nominatedValidators: DeriveStakingQuery[] | null;
  coin: string;
  validatorsName: ValidatorsName[] | null;
  selectedValidators: DeriveStakingQuery[] | null;
  validatorsToList: DeriveStakingQuery[] | null;
}

export default function ConfirmStaking({
  chain, coin, ledger, nominatedValidators, selectedValidators, setConfirmStakingModalOpen, validatorsToList,
  setSelectValidatorsModalOpen, setState, showConfirmStakingModal, stakeAmount,
  staker, stakingConsts, state, validatorsName }
  : Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [decimals, setDecimals] = useState<number>(1);
  const [password, setPassword] = useState<string>('');
  const [passwordIsCorrect, setPasswordIsCorrect] = useState<number>(0);// 0: no password, -1: password incorrect, 1:password correct
  const [currentlyStaked, setCurrentlyStaked] = useState<bigint>(0n);
  // const [validatorsToList, setvalidatorsToList] = useState<DeriveStakingQuery[] | null>(null);

  // useEffect(() => {
  //   if (['stakeManual', 'stakeAuto', 'changeValidators'].includes(state)) {
  //     setvalidatorsToList(selectedValidators);
  //   } else if (['stakeKeepNominated'].includes(state)) {
  //     setvalidatorsToList(nominatedValidators);
  //   }
  // }, []);

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    // setConfirmStakingModalOpen(false);
    if (!['stakeManual'].includes(state)) setState('');
  };

  useEffect(() => {
    console.log('showConfirmStakingModallllllllllllllllll', showConfirmStakingModal)
  }, [showConfirmStakingModal])

  const stateInHuman = (state: string): string => {
    switch (state) {
      case ('stakeAuto'):
      case ('stakeManual'):
      case ('stakeKeepNominated'):
        return 'Staking of'.toUpperCase();
      case ('changeValidators'):
        return 'nominating'.toUpperCase();
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
    try {
      const localState = state;

      setState('confirming');

      const signer = keyring.getPair(String(staker.address));

      signer.unlock(password);
      setPasswordIsCorrect(1);
      let bondResult = 'failed';
      const alreadyBondedAmount = BigInt(String(ledger?.total));

      if (['stakeAuto', 'stakeManual', 'stakeKeepNominated'].includes(localState) && stakeAmount !== 0n) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        bondResult = await bondOrExtra(chain, staker.address, signer, stakeAmount, alreadyBondedAmount);
        console.log('bond Result,', bondResult);

        if (bondResult === 'failed') {
          setState(bondResult);

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
              setState('success');
            } else {
              setState('failed');
            }

            return;
          }

          if (isEqual(selectedValidatorsAccountId, nominatedValidatorsId)) {
            console.log('the selected and previously nominated validators are the same, no need to renominate');

            setState('success');

            return;
          }
        }

        if (['stakeManual'].includes(localState)) { // TODO: more check!!
          if (!selectedValidatorsAccountId) {
            console.log('selectedValidatorsAccountId is empty!!');
            setState('failed');

            return;
          }
        }

        if (['changeValidators'].includes(localState)) {
          if (!selectedValidatorsAccountId) {
            console.log('! there is no selectedValidatorsAccountId to changeValidators');
            setState('failed');

            return;
          }

          if (isEqual(selectedValidatorsAccountId, nominatedValidatorsId)) {
            console.log('the selected and previously nominated validators are the same, no need to renominate');

            setState('failed');

            return;
          }
        }

        const nominateResult = await nominate(chain, staker.address, signer, selectedValidatorsAccountId);

        console.log('nominateResult,', nominateResult);
        setState(nominateResult);
      }
    } catch (e) {
      setPasswordIsCorrect(-1);
      setState('failed');
    }
  };

  const handleReject = (): void => {
    handleConfirmStakingModalClose();
    setState('');
    if (setSelectValidatorsModalOpen) setSelectValidatorsModalOpen(false);
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
          <Container
            disableGutters
            maxWidth='md'
            sx={{ marginTop: 2 }}
          >
            <Grid alignItems='center' container justifyContent='space-between'>
              <Grid item xs={2}>
                <MuiButton
                  // eslint-disable-next-line react/jsx-no-bind
                  onClick={handleConfirmStakingModalClose}
                  startIcon={<ArrowBackIosRounded />}
                >
                  {t('Edit')}
                </MuiButton>
              </Grid>
              <Grid
                item
                xs={2}
              >
                <Avatar
                  alt={'logo'}
                  src={getChainLogo(chain)}
                />
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
                  {stateInHuman(state)}
                </Grid>
                {stakeAmount
                  ? <Grid item container justifyContent='center' spacing={1} xs={12} sx={{ fontFamily: 'fantasy', fontSize: 18, textAlign: 'center' }} >
                    <Grid item>
                      {amountToHuman(stakeAmount.toString(), decimals)}
                    </Grid>
                    <Grid item>
                      {coin}
                    </Grid>
                  </Grid>
                  : ''}

                <Grid item xs={12} container justifyContent='space-between' alignItems='center' sx={{ fontSize: 12, paddingTop: '30px' }} >
                  <Grid item container xs={5} justifyContent='flex-start' spacing={1}>
                    <Grid item  sx={{ fontSize: 12, fontWeight: '600' }}>
                      {t('Currently staked')}:
                    </Grid>
                    <Grid item  sx={{ fontSize: 12 }}>
                      {!ledger
                        ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '60px' }} />
                        : <>
                          {currentlyStaked ? amountToHuman(currentlyStaked.toString(), decimals) : '0.00'}
                        </>
                      }{coin}
                    </Grid>
                  </Grid>
                  <Grid item container xs={5} spacing={1} justifyContent='flex-end'>
                    <Grid item sx={{ fontSize: 12, fontWeight: '600' }}>
                      {t('Total')}:
                    </Grid>
                    <Grid item sx={{ fontSize: 12 }}>
                      {amountToHuman((currentlyStaked + stakeAmount).toString(), decimals)} {coin}
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item sx={{ textAlign: 'center', color: grey[600], fontFamily: 'fantasy', fontSize: 16, padding: '15px 50px 5px' }} xs={12}>
                {t('VALIDATORS')}
              </Grid>
              <Grid item sx={{ textAlign: 'left', fontSize: 14, padding: '1px 20px 0px' }} xs={12}>
                {stakingConsts
                  ? <ValidatorsList
                    chain={chain}
                    stakingConsts={stakingConsts}
                    validatorsInfo={validatorsToList}
                    validatorsName={validatorsName} />
                  : ''
                }
              </Grid>
            </Grid>
            <Grid item sx={{ margin: '30px 20px 5px' }} xs={12}>
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
                autoFocus={!['confirming', 'failed', 'success'].includes(state)}
                fullWidth
                helperText={passwordIsCorrect === -1 ? t('Password is not correct') : t('Please enter the stake account password')}
                label={t('Password')}
                onChange={handleSavePassword}
                // eslint-disable-next-line react/jsx-no-bind
                onKeyPress={(event) => {
                  // eslint-disable-next-line @typescript-eslint/no-floating-promises
                  if (event.key === 'Enter') { handleConfirm(); }
                }}
                size='medium'
                color='warning'
                type='password'
                value={password}
                variant='outlined'
                disabled={!ledger}
              />
            </Grid>
            <Grid container item justifyContent='space-between' sx={{ padding: '5px 20px 0px' }} xs={12}>
              {['success', 'failed'].includes(state)
                ? <Grid item xs={12}>
                  <MuiButton fullWidth onClick={handleReject} variant='contained' color={state === 'success' ? 'success' : 'error'}>
                    {state === 'success' ? t('Done') : t('Failed')}
                  </MuiButton>
                </Grid>
                : <>
                  <Grid item xs={8}>
                    <Button
                      data-button-action=''
                      isBusy={state === 'confirming'}
                      isDisabled={!ledger}
                      onClick={handleConfirm}
                    >
                      {t('Confirm').toUpperCase()}
                    </Button>
                  </Grid>
                  <Grid item xs={3} justifyContent='center' sx={{ paddingTop: 2, fontSize: 15 }}>
                    <div style={state === 'confirming' ? { opacity: '0.4', pointerEvents: 'none' } : {}}>
                      <ActionText
                        // className={{'margin': 'auto'}}
                        onClick={handleReject}
                        text={t('Reject').toUpperCase()}
                      />
                    </div>
                  </Grid>
                </>}
            </Grid>
          </Container>
        </div>
      </Modal>
    </>
  );
}