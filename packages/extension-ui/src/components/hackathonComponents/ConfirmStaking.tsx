// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line simple-import-sort/imports
import type { AccountId, StakingLedger } from '@polkadot/types/interfaces';

import { ArrowBackIosRounded } from '@mui/icons-material';
import { Avatar, Button, Container, Divider, Grid, Modal } from '@mui/material';
import React, { Dispatch, SetStateAction, useCallback, useEffect } from 'react';

import { Chain } from '@polkadot/extension-chains/types';
import getChainLogo from '@polkadot/extension-ui/util/HackathonUtilFiles/getChainLogo';
import { DeriveStakingQuery } from '@polkadot/api-derive/types';

import useTranslation from '../../hooks/useTranslation';
import { accountsBalanceType, Validators } from '../../util/HackathonUtilFiles/pjpeTypes';

interface StakingConsts {
  existentialDeposit: bigint,
  maxNominations: number,
  maxNominatorRewardedPerValidator: number,
  minNominatorBond: number
}

interface Props {
  chain?: Chain | null;
  // handleEasyStakingModalClose: Dispatch<SetStateAction<boolean>>;
  state: string;
  setState: React.Dispatch<React.SetStateAction<string>>;
  staker: accountsBalanceType;
  showConfirmStakingModal: boolean;
  setConfirmStakingModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  stakingConstsInfo: StakingConsts | null;
  stakeAmount: bigint;
  validatorsInfo: Validators | null;
  ledger: StakingLedger;
  selectedValidatorsAccountId: string[];
  nominatedValidatorsInfo: DeriveStakingQuery[];
  coin: string;
}

export default function ConfirmStaking({ chain, coin, ledger, nominatedValidatorsInfo, selectedValidatorsAccountId, setConfirmStakingModalOpen, setState,
  showConfirmStakingModal, stakeAmount, staker, stakingConstsInfo, state, validatorsInfo }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  // useEffect((): void => {
  //   if (!bondState || bondState === 'bonding') {
  //     console.log('no BondState or bonding, bondState:', bondState);

  //     return;
  //   }

  //   if (bondState === 'bond' && selectedValidatorsAccountId) {
  //     if (selectedValidatorsAccountId.length === 0) {
  //       setAlert('There is an issue while getting validators, try again later!');
  //       setBondState('');

  //       return;
  //     }

  //     setBondState('bonding');

  //     const signer = keyring.getPair(String(staker.address));

  //     signer.unlock('Kami,12*');

  //     const alreadyBondedAmount = BigInt(String(ledger?.total));

  //     // eslint-disable-next-line @typescript-eslint/no-floating-promises
  //     bondOrExtra(chain, staker.address, signer, amountToMachine(stakeAmountInHuman, decimals), selectedValidatorsAccountId, alreadyBondedAmount)
  //       .then((bondResult) => {
  //         console.log('bond Result,', bondResult);

  //         if (bondResult === 'success') {
  //           if (Number(alreadyBondedAmount) === 0) {
  //             // do nominate after bond

  //             // eslint-disable-next-line @typescript-eslint/no-floating-promises
  //             nominate(chain, staker.address, signer, selectedValidatorsAccountId)
  //               .then((nominateResult) => {
  //                 console.log('nominateResult,', nominateResult);
  //                 setBondState('');
  //               });
  //           } else {
  //             setBondState('');
  //           }
  //         }

  //         // call to update staked amount shows to user
  //         callGetLedgerWorker();
  //       });
  //   }
  // }, [bondState, selectedValidatorsAccountId]);

  const handleConfirmStakingModalClose = useCallback(
    (): void => {
      // set all defaults
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      setConfirmStakingModalOpen(false);
      setState('');
    },
    [setConfirmStakingModalOpen, setState]
  );

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
                <Button
                  // eslint-disable-next-line react/jsx-no-bind
                  onClick={handleConfirmStakingModalClose}
                  startIcon={<ArrowBackIosRounded />}
                >
                  {t('Edit')}
                </Button>
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
              <Grid item sx={{ textAlign: 'left' }} xs={12}>
                stakeAmount:{stakeAmount.toString()} {coin}
                status:{state}
                {/* nominatedValidatorsInfo:{nominatedValidatorsInfo} */}
              </Grid>
            </Grid>
          </Container>
        </div>
      </Modal>
    </>
  );
}
