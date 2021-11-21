// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line simple-import-sort/imports
import type { StakingLedger } from '@polkadot/types/interfaces';

import { ArrowBackIosRounded, CheckRounded, Clear } from '@mui/icons-material';
import { Alert, Avatar, Button as MuiButton, Container, Divider, Grid, IconButton, InputAdornment, Modal, TextField } from '@mui/material';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';

import { Chain } from '@polkadot/extension-chains/types';
import getChainLogo from '@polkadot/extension-ui/util/HackathonUtilFiles/getChainLogo';
import { DeriveStakingQuery } from '@polkadot/api-derive/types';
import keyring from '@polkadot/ui-keyring';

import useTranslation from '../../hooks/useTranslation';
import { accountsBalanceType, StakingConsts, TransactionStatus, Validators, ValidatorsName } from '../../util/HackathonUtilFiles/pjpeTypes';
import getNetworkInfo from '@polkadot/extension-ui/util/HackathonUtilFiles/getNetwork';
import { amountToHuman } from '@polkadot/extension-ui/util/HackathonUtilFiles/hackathonUtils';
import ValidatorsList from './ValidatorsList';
import { ActionText, Button } from '../';
import { bondOrExtra, nominate } from '@polkadot/extension-ui/util/HackathonUtilFiles/staking';

interface Props {
  chain?: Chain | null;
  // handleEasyStakingModalClose: Dispatch<SetStateAction<boolean>>;
  state: string;
  setState: React.Dispatch<React.SetStateAction<string>>;
  staker: accountsBalanceType;
  showConfirmStakingModal: boolean;
  setConfirmStakingModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  stakingConsts: StakingConsts | null;
  stakeAmount: bigint;
  validatorsInfo: Validators | null;
  ledger: StakingLedger;
  nominatedValidatorsInfo: DeriveStakingQuery[];
  coin: string;
  validatorsName: ValidatorsName[] | null;
}

export default function ConfirmStaking({ chain, coin, ledger, nominatedValidatorsInfo, setConfirmStakingModalOpen, setState,
  showConfirmStakingModal, stakeAmount, staker, stakingConsts, state, validatorsInfo, validatorsName }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [decimals, setDecimals] = useState<number>(1);
  const [password, setPassword] = useState<string>('');
  const [passwordIsCorrect, setPasswordIsCorrect] = useState<number>(0);// 0: no password, -1: password incorrect, 1:password correct
  const [confirming, setConfirming] = useState<boolean>(false);
  const [stakingResultStatus, setStakingResultStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!chain) { return; }

    const { ED, coin, decimals, minNominatorBond } = getNetworkInfo(chain);

    setDecimals(decimals);
  }, [chain]);

  // useEffect((): void => {
  //   if (!bondState || bondState === 'bonding') {
  //     console.log('no BondState or bonding, bondState:', bondState);

  //     return;
  //   }

  //   
  // }, [bondState, selectedValidatorsAccountId]);

  const handleClearPassword = useCallback((): void => {
    setPasswordIsCorrect(0);
    setPassword('');
  }, []);

  const handleSavePassword = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setPassword(event.target.value);

    if (event.target.value === '') { handleClearPassword(); }
  }, [handleClearPassword]);

  const handleConfirmStakingModalClose = useCallback(
    (): void => {
      // set all defaults
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      setConfirmStakingModalOpen(false);
      if (['stakeAuto'].includes(state)) setState('');
    },
    [setConfirmStakingModalOpen, setState, state]
  );

  const stateInHuman = (state: string): string => {
    switch (state) {
      case ('stakeAuto'):
      case ('stakeManual'):
        return 'Staking of'.toUpperCase();
      case ('changeValidators'):
        return 'nominating'.toUpperCase();
      default:
        return 'Unknown';
    }
  };

  const handleConfirm = (): void => {
    try {
      setConfirming(true);

      const signer = keyring.getPair(String(staker.address));

      signer.unlock(password);
      setPasswordIsCorrect(1);

      const alreadyBondedAmount = BigInt(String(ledger?.total));
      const selectedValidatorsAccountId = nominatedValidatorsInfo.map((v) => v.accountId);

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      bondOrExtra(chain, staker.address, signer, stakeAmount, selectedValidatorsAccountId, alreadyBondedAmount)
        .then((bondResult: string | null): void => {
          console.log('bond Result,', bondResult);

          if (bondResult === 'success') {
            console.log('bond Result 00,', bondResult);

            if (Number(alreadyBondedAmount) === 0) {
              // do nominate after bond

              // eslint-disable-next-line @typescript-eslint/no-floating-promises
              nominate(chain, staker.address, signer, selectedValidatorsAccountId)
                .then((nominateResult) => {
                  console.log('nominateResult,', nominateResult);
                  setConfirming(false);
                  setStakingResultStatus(nominateResult);
                });
            } else {
              console.log('bond Result 01,', bondResult);

              setStakingResultStatus('success');
              setConfirming(false);
            }
          } else {
            console.log('bond Result 02,', bondResult);
            setStakingResultStatus('failed');
            setConfirming(false);
          }
        });
    } catch (e) {
      setPasswordIsCorrect(-1);
      setConfirming(false);
    }
  };

  useEffect(() => {
    console.log('stakingResultStatus', stakingResultStatus);
  }, [stakingResultStatus]);

  const handleReject = useCallback((): void => {
    handleConfirmStakingModalClose();
  }, [handleConfirmStakingModalClose]);

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
              <Grid item container xs={12} sx={{ backgroundColor: '#f7f7f7', padding: '30px 40px 25px' }}>
                <Grid item xs={3} sx={{ padding: '5px 10px 5px', borderRadius: '5px', border: '2px double grey', justifyContent: 'flex-start', fontSize: 15, textAlign: 'center', fontVariant: 'small-caps' }}>
                  {stateInHuman(state)}
                </Grid>
                {stakeAmount ?
                  <Grid item container justifyContent='center' spacing={1} xs={12} sx={{ fontSize: 18, fontFamily: 'fantasy', textAlign: 'center' }} >
                    <Grid item>
                      {amountToHuman(stakeAmount.toString(), decimals)}
                    </Grid>
                    <Grid item>
                      {coin}
                    </Grid>
                  </Grid>
                  : ''}
              </Grid>
              <Grid item sx={{ textAlign: 'left', fontSize: 14, padding: '20px 20px 0px' }} xs={12}>
                {stakingConsts
                  ? <ValidatorsList
                    chain={chain}
                    stakingConsts={stakingConsts}
                    validatorsInfo={nominatedValidatorsInfo}
                    validatorsName={validatorsName} />
                  : ''
                }
              </Grid>
            </Grid>
            <Grid item sx={{ margin: '10px 20px 5px' }} xs={12}>
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
                helperText={passwordIsCorrect === -1 ? t('Password is not correct') : t('Please enter the stake account password')}
                label={t('Password')}
                onChange={handleSavePassword}
                // eslint-disable-next-line react/jsx-no-bind
                onKeyPress={(event) => {
                  if (event.key === 'Enter') { handleConfirm(); }
                }}
                size='medium'
                color='warning'
                type='password'
                value={password}
                variant='outlined'
              />
            </Grid>
            <Grid container item justifyContent='space-between' sx={{ padding: '5px 20px 0px' }} xs={12}>
              {stakingResultStatus !== null
                ? <Grid item xs={12}>
                  <MuiButton fullWidth onClick={handleReject} variant='contained' color={stakingResultStatus === 'success' ? 'success' : 'error'}>
                    {stakingResultStatus === 'success' ? t('Done') : t('Failed')}
                  </MuiButton>
                </Grid>
                : <>
                  <Grid item xs={8}>
                    <Button
                      data-button-action=''
                      isBusy={confirming}
                      isDisabled={confirming}
                      onClick={handleConfirm}
                    >
                      {t('Confirm').toUpperCase()}
                    </Button>
                  </Grid>
                  <Grid item xs={3} justifyContent='center' sx={{ paddingTop: 2, fontSize: 15 }}>
                    <div style={confirming ? { opacity: '0.4', pointerEvents: 'none' } : {}}>
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
