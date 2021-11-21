// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountId, StakingLedger } from '@polkadot/types/interfaces';

// import type { AccountId, Balance, EraIndex, Exposure, RewardDestination, RewardPoint, StakingLedger, ValidatorPrefs } from '@polkadot/types/interfaces';
import { faCoins } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AddCircleOutlineOutlined, CheckOutlined, CloseRounded, InfoOutlined, RemoveCircleOutlineOutlined } from '@mui/icons-material';
import { Alert, Avatar, Box, Button, Chip, CircularProgress, Container, Divider, FormControl, FormControlLabel, FormLabel, Grid, IconButton, InputAdornment, Modal, Paper, Radio, RadioGroup, Skeleton, Tab, Tabs, TextField, Typography } from '@mui/material';
import React, { Dispatch, SetStateAction, useCallback, useContext, useEffect, useState } from 'react';

import { DeriveStakingQuery } from '@polkadot/api-derive/types';
import { AccountJson } from '@polkadot/extension-base/background/types';
import { Chain } from '@polkadot/extension-chains/types';
import getChainLogo from '@polkadot/extension-ui/util/HackathonUtilFiles/getChainLogo';
import { accountsBalanceType, AllValidatorsFromSubscan, savedMetaData,StakingConsts, Validators, ValidatorsFromSubscan, ValidatorsName } from '@polkadot/extension-ui/util/HackathonUtilFiles/pjpeTypes';
import { bondOrExtra, getAllValidatorsFromSubscan, getCurrentEraIndex, getStakingReward, nominate } from '@polkadot/extension-ui/util/HackathonUtilFiles/staking';
import keyring from '@polkadot/ui-keyring';
import { formatBalance } from '@polkadot/util';

import useTranslation from '../../hooks/useTranslation';
import { updateMeta, updateStakingConsts } from '../../messaging';
import getNetworkInfo from '../../util/HackathonUtilFiles/getNetwork';
import { amountToHuman, amountToMachine, balanceToHuman, DEFAULT_COIN, fixFloatingPoint, MIN_EXTRA_BOND } from '../../util/HackathonUtilFiles/hackathonUtils';
import { ActionText, NextStepButton } from '../';
import ConfirmStaking from './ConfirmStaking';
import SelectValidators from './SelectValidators';
import ValidatorsList from './ValidatorsList';

interface Props {
  account: AccountJson,
  chain?: Chain | null;
  name: string;
  showStakingModalOpen: boolean;
  setStakingModalOpen: Dispatch<SetStateAction<boolean>>;
  staker: accountsBalanceType;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const workers: Worker[] = [];

export default function EasyStaking({ account, chain, setStakingModalOpen, showStakingModalOpen, staker }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [coin, setCoin] = useState('');
  const [ED, setED] = useState(0);
  const [decimals, setDecimals] = useState(1);
  const [minNominatorBond, setMinNominatorBond] = useState<string>('');
  const [stakingConsts, setStakingConsts] = useState<StakingConsts | null>(null);
  const [gettingStakingConstsFromBlockchain, setgettingStakingConstsFromBlockchain] = useState<boolean>(true);
  const [gettingNominatedValidatorsInfoFromBlockchain, setGettingNominatedValidatorsInfoFromBlockchain] = useState<boolean>(true);
  const [nextButtonCaption, setNextButtonCaption] = useState<string>(t('Next'));
  const [nextButtonDisabled, setNextButtonDisabled] = useState(true);
  const [maxStake, setMaxStake] = useState<string>('0');
  const [totalReceivedReward, setTotalReceivedReward] = useState<string>();
  const [showConfirmStakingModal, setConfirmStakingModalOpen] = useState<boolean>(false);
  const [showSelectValidatorsModal, setSelectValidatorsModalOpen] = useState<boolean>(false);
  const [stakeAmount, setStakeAmount] = useState<bigint>(0n);
  const [stakeAmountInHuman, setStakeAmountInHuman] = useState<string>();
  const [availableBalance, setAvailableBalance] = useState<string>('');
  const [alert, setAlert] = useState<string>('');
  const [ledger, setLedger] = useState<StakingLedger | null>(null);
  const [zeroBalanceAlert, setZeroBalanceAlert] = useState(false);
  const [validatorsName, setValidatorsName] = useState<ValidatorsName[]>([]);

  // validatorsInfo is all validators (current and waiting) information  
  const [validatorsInfo, setValidatorsInfo] = useState<Validators | null>(null);
  const [validatorsInfoIsUpdated, setValidatorsInfoIsUpdated] = useState<boolean>(false);
  const [validatorsInfoFromSubscan, setValidatorsInfoFromSubscan] = useState<AllValidatorsFromSubscan | null>(null);
  const [selectedValidatorsAccountId, setSelectedValidatorsAcountId] = useState<string[] | null>(null);
  const [nominatedValidatorsId, setNominatedValidatorsId] = useState<string[] | null>(null);
  const [noNominatedValidators, setNoNominatedValidators] = useState<boolean>(false);
  const [nominatedValidatorsInfo, setNominatedValidatorsInfo] = useState<DeriveStakingQuery[] | null>(null);
  const [validatorSelectionType, setValidatorSelectionType] = useState<string>('Auto');
  const [state, setState] = useState<string>(''); // {'', 'stakeAuto', 'stakeManual', 'changeValidators'}
  const [tabValue, setTabValue] = React.useState(3);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    if (!chain) {
      console.log(' no fetch/subscribe for no chain');

      return;
    }

    const { ED, coin, decimals, minNominatorBond } = getNetworkInfo(chain);

    setDecimals(decimals);
    setCoin(coin || DEFAULT_COIN);
    setED(ED || 0);

    // getCurrentEraIndex(chain).then((index) => {
    //   console.log('current era index:', index)
    // })

    setZeroBalanceAlert(Number(staker.balanceInfo?.available) <= 0);

    let formattedMinNominatorBond = formatBalance(minNominatorBond, { forceUnit: '-', withSi: false }, decimals);
    const [prefix, postfix] = formattedMinNominatorBond.split('.');

    if (Number(postfix) === 0) {
      formattedMinNominatorBond = prefix;
    }

    setMinNominatorBond(formattedMinNominatorBond);

    // 1. get some staking constant like minNominatorBond ,...
    const getStakingConstsWorker: Worker = new Worker(new URL('../../util/HackathonUtilFiles/workers/getStakingConsts.js', import.meta.url));

    workers.push(getStakingConstsWorker);

    getStakingConstsWorker.postMessage({ chain });

    getStakingConstsWorker.onerror = (err) => {
      console.log(err);
    };

    getStakingConstsWorker.onmessage = (e: MessageEvent<any>) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const consts: StakingConsts = e.data;

      console.log('stakingConsts: ', consts);

      if (consts) {
        setStakingConsts(consts);

        setgettingStakingConstsFromBlockchain(false);

        if (staker.address) {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          console.log('updateStakingConsts:', consts);

          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          updateStakingConsts(account.address, JSON.stringify(consts));
        }
      }

      getStakingConstsWorker.terminate();
    };

    // 2. get ledger info, includin users currently staked, locked, etc
    callGetLedgerWorker();

    // 3. get validators info, including current and waiting
    const getValidatorsInfoWorker: Worker = new Worker(new URL('../../util/HackathonUtilFiles/workers/getValidatorsInfo.js', import.meta.url));

    workers.push(getValidatorsInfoWorker);

    getValidatorsInfoWorker.postMessage({ chain });

    getValidatorsInfoWorker.onerror = (err) => {
      console.log(err);
    };

    getValidatorsInfoWorker.onmessage = (e) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const vInfo: Validators = e.data;

      console.log(`got validators from storage, current: ${vInfo.current.length} waiting ${vInfo.waiting.length} `);
      console.log(vInfo.current[0]);
      console.log(vInfo.waiting[0]);

      setValidatorsInfo(vInfo);
      setValidatorsInfoIsUpdated(true);

      if (vInfo) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        updateMeta(account.address, prepareMetaData(chain, 'validatorsInfo', vInfo));
      }

      getValidatorsInfoWorker.terminate();
    };

    // 4. get staking reward
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getStakingReward(chain, staker.address).then((reward) => {
      if (!reward) reward = '0';
      reward = amountToHuman(String(reward), decimals) === '0' ? '0.00' : amountToHuman(reward, decimals);
      setTotalReceivedReward(reward);
    });

    // 5. get nominated validators list

    const getNominatorsWorker: Worker = new Worker(new URL('../../util/HackathonUtilFiles/workers/getNominators.js', import.meta.url));

    workers.push(getNominatorsWorker);

    const stakerAddress = staker.address;

    getNominatorsWorker.postMessage({ chain, stakerAddress });

    getNominatorsWorker.onerror = (err) => {
      console.log(err);
    };

    getNominatorsWorker.onmessage = (e) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const targets: string[] = e.data;

      // console.log('targets:', targets);
      if (!targets) setNoNominatedValidators(true);
      setNominatedValidatorsId(targets);
      getNominatorsWorker.terminate();
    };

    // 6. get all validators info from subscan,
    // it is faster than getting from blockchain but is rate limited
    // --moved to next useeffects--
  }, []);

  useEffect((): void => {
    if (!chain || !account) {
      console.log(' no account or chain, wait for it...!..');

      return;
    }
    const chainName = chain.name.replace(' Relay Chain', '');

    console.log('account:', account);

    // retrive saved staking consts from acount meta data
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const savedStakingConstsFromLocalStrorage = account.stakingConsts ? JSON.parse(account.stakingConsts) : null;

    if (savedStakingConstsFromLocalStrorage) {
      setStakingConsts(savedStakingConstsFromLocalStrorage);
    }

    // retrive saved validatorInfo from acount's meta data
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const validatorsInfoFromLocalStorage: savedMetaData = account.validatorsInfo ? JSON.parse(account.validatorsInfo) : null;

    if (validatorsInfoFromLocalStorage) {
      if (validatorsInfoFromLocalStorage.chainName === chainName) { setValidatorsInfo(validatorsInfoFromLocalStorage.metaData); }
    }

    // retrive validators name from acounts' meta data
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const nominatedValidatorsInfoFromLocalStrorage: savedMetaData = account.nominatedValidatorsInfo ? JSON.parse(account.nominatedValidatorsInfo) : null;

    if (nominatedValidatorsInfoFromLocalStrorage) {
      if (nominatedValidatorsInfoFromLocalStrorage.chainName === chainName) { setNominatedValidatorsInfo(nominatedValidatorsInfoFromLocalStrorage.metaData); }
    }

    // get new name of validators from subscan and update locals
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getAllValidatorsFromSubscan(chain).then((allValidatorsInfoFromSubscan) => {
      console.log('allValidatorsInfoFromSubscan from subscan', allValidatorsInfoFromSubscan);

      if (!allValidatorsInfoFromSubscan) {
        console.log('allValidatorsInfoFromSubscan is empty');

        return;
      }

      if (allValidatorsInfoFromSubscan.current && allValidatorsInfoFromSubscan.waiting) {
        setValidatorsInfoFromSubscan({
          current: allValidatorsInfoFromSubscan.current,
          waiting: allValidatorsInfoFromSubscan.waiting
        });
      }

      const allValidatorsInfoToghether = (allValidatorsInfoFromSubscan.current || []).concat(allValidatorsInfoFromSubscan.waiting || []);

      if (allValidatorsInfoToghether.length === 0) {
        console.log('allValidatorsInfoToghether is empty');

        return;
      }

      const validatorsNameFromSbuScan = allValidatorsInfoToghether
        .filter((v) => v.stash_account_display.identity || v.controller_account_display?.identity)
        .map((v) => ({
          address: v.stash_account_display.address,
          name: v.stash_account_display.display || v.controller_account_display?.display || ''
        }));

      if (validatorsNameFromSbuScan.length === 0) {
        console.log(' no new validator names');

        return;
      }

      // save validators name into local account storage
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const vNFromStorage: { chainName: string, metaData: ValidatorsName[] } | null =
        account.validatorsName ? JSON.parse(account.validatorsName) : null;

      const chainName = chain.name.replace(' Relay Chain', '');

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const validatorsNamesFromStorage: ValidatorsName[] | null = vNFromStorage && vNFromStorage?.chainName === chainName
        ? vNFromStorage.metaData
        : null;

      const validatorsNameFromSbuScanTemp = validatorsNameFromSbuScan;

      validatorsNamesFromStorage?.forEach((vfs: ValidatorsName) => {
        const index = validatorsNameFromSbuScan.find((v) => v.address === vfs.address);

        if (!index) {
          validatorsNameFromSbuScanTemp.push(vfs);
        }
      });

      setValidatorsName(validatorsNameFromSbuScanTemp);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      updateMeta(account.address, prepareMetaData(chain, 'validatorsName', validatorsNameFromSbuScanTemp));
      console.log('validatorsNameFromSbuScan and local storage:', validatorsNameFromSbuScanTemp);
    });
  }, [account, chain, staker.address]);

  useEffect((): void => {
    setAvailableBalance(balanceToHuman(staker, 'available'));
  }, [staker]);

  useEffect(() => {
    if (validatorsInfo && nominatedValidatorsId && chain && account.address) {
      // find all information of nominated validators from all validatorsInfo(current and waiting)
      const nvi = validatorsInfo.current
        .concat(validatorsInfo.waiting)
        .filter((v: DeriveStakingQuery) => nominatedValidatorsId.includes(String(v.accountId)));

      setNominatedValidatorsInfo(nvi);
      setGettingNominatedValidatorsInfoFromBlockchain(false);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      updateMeta(account.address, prepareMetaData(chain, 'nominatedValidatorsInfo', nvi));
    }
  }, [nominatedValidatorsId, validatorsInfo, chain, account.address]);

  useEffect(() => {
    setMaxStake(fixFloatingPoint(Number(availableBalance) - 2 * ED));
  }, [ED, availableBalance]);

  useEffect(() => {
    if (!Number(availableBalance)) {
      return setZeroBalanceAlert(true);
    } else {
      setZeroBalanceAlert(false);
    }

    // if (Number(availableBalance) === Number(stakeAmountInHuman) + Number(amountToHuman(lastFee || defaultFee, decimals))) {
    //   setNoFeeAlert(true);
    // } else {
    //   setNoFeeAlert(false);
    // }

    if (Number(availableBalance) <= Number(stakeAmountInHuman) || !Number(stakeAmountInHuman)) {
      setNextButtonDisabled(true);

      if (Number(availableBalance) <= Number(stakeAmountInHuman) && Number(stakeAmountInHuman) !== 0) {
        setNextButtonCaption(t('Insufficient Balance'));
      }
    } else {
      setNextButtonDisabled(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stakeAmountInHuman, availableBalance, ED, t]);

  // TODO: selecting validators automatically, move to confirm page
  useEffect(() => {
    if (validatorsInfo && stakingConsts) {
      const selectedVAccId = selectBestValidators(validatorsInfo, stakingConsts);

      setSelectedValidatorsAcountId(selectedVAccId);
      // console.log('selectedValidatorsAcountId', selectedVAccId);
    }
  }, [stakingConsts, validatorsInfo]);

  function prepareMetaData(chain: Chain, label: string, data: any): string {
    const chainName = chain.name.replace(' Relay Chain', '');

    return JSON.stringify({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      [label]: JSON.stringify({ chainName: chainName, metaData: data })
    });
  }

  // TODO: find an algorithm to select validators automatically
  function selectBestValidators(validatorsInfo: Validators, stakingConsts: StakingConsts): string[] {
    const MAX_ACCEPTED_COMMISSION = 50;

    // console.log(' current validators Acc Id length', validatorsInfo.current.length);
    const allValidators = validatorsInfo.current.concat(validatorsInfo.waiting);
    const nonBlockedValidatorsAccountId = allValidators.filter((v) =>
      !v.validatorPrefs.blocked && // filter blocked validators
      (Number(v.validatorPrefs.commission) / (10 ** 7)) < MAX_ACCEPTED_COMMISSION && // filter high commision validators
      v.exposure.others.length < stakingConsts?.maxNominatorRewardedPerValidator // filter oversubscribed
    )
      .map((v) => v.accountId.toString());// TODO: sort it too

    return nonBlockedValidatorsAccountId.slice(0, stakingConsts?.maxNominations);
  }

  const handleEasyStakingModalClose = useCallback(
    (): void => {
      // should terminate workers
      workers.forEach((w) => w.terminate());

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      setStakingModalOpen(false);
    },
    [setStakingModalOpen]
  );

  function callGetLedgerWorker() {
    const getLedgerWorker: Worker = new Worker(new URL('../../util/HackathonUtilFiles/workers/getLedger.js', import.meta.url));

    workers.push(getLedgerWorker);
    const address = staker.address;

    getLedgerWorker.postMessage({ address, chain });

    getLedgerWorker.onerror = (err) => {
      console.log(err);
    };

    getLedgerWorker.onmessage = (e) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const ledger: StakingLedger = e.data;

      console.log('getLedger:', ledger);
      setLedger(ledger);
      // eslint-disable-next-line padding-line-between-statements
      if (Number(ledger.total) > 0) {
        // already bonded, set min extra bond to MIN_EXTRA_BOND
        setMinNominatorBond(String(MIN_EXTRA_BOND));
      }

      getLedgerWorker.terminate();
    };
  }

  const handleValidatorSelectionType = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setValidatorSelectionType(event.target.value);

    // if (event.target.value === 'Auto') {
    //   setNextButtonCaption('Stake');
    // } else {
    //   setNextButtonCaption(t('Select Validators'));
    // }
  }, [setValidatorSelectionType]);

  const handleStakeAmountOnChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    let value = event.target.value;

    if (Number(value) < 0) {
      value = String(-Number(value));
    }

    if (Number(value) && Number(value) < Number(minNominatorBond)) {
      setAlert(t(`Staking amount is too low, it must be at least ${minNominatorBond} ${coin}`));
    } else {
      setAlert('');
    }
    console.log('Number(availableBalance):', availableBalance);

    if (Number(maxStake) && Number(value) > Number(maxStake) && Number(value) < Number(availableBalance)) {
      setAlert(t('Your account will be reaped!'));
    } else {
      setAlert('');
    }

    setStakeAmountInHuman(fixFloatingPoint(value));
  }, [availableBalance, coin, maxStake, minNominatorBond, t]);

  function handleStakeAmountOnBlur(value: string) {
    let floatingPointDigit = 0;

    // remove point from the value if it has
    const v = value.split('.');

    if (v.length === 2) {
      floatingPointDigit = v[1].length;
      value = v[0] + v[1];
    }

    setStakeAmount(BigInt(Number(value)) * BigInt(10 ** (decimals - floatingPointDigit)));
    console.log('stakeAmount 0',BigInt(Number(value)) * BigInt(10 ** (decimals - floatingPointDigit)))
  }

  function handleMinClicked() {
    setAlert('');
    setStakeAmountInHuman(minNominatorBond);

    setStakeAmount(amountToMachine(minNominatorBond, decimals));
    console.log('stakeAmount 1',amountToMachine(minNominatorBond, decimals))
  }

  function handleMaxClicked() {
    setAlert('');
    setStakeAmountInHuman(maxStake.toString());

    // remove point from the value if it has
    let max = maxStake.toString();
    let floatingPointDigits = 0;
    const v = max.split('.');

    if (v.length === 2) {
      floatingPointDigits = v[1].length;
      max = v[0] + v[1];
    }

    setStakeAmount(BigInt(max) * BigInt(10 ** (decimals - floatingPointDigits)));
    console.log('stakeAmount 1',BigInt(max) * BigInt(10 ** (decimals - floatingPointDigits)))

  }

  function handleConfirmStakingModaOpen(): void {
    setConfirmStakingModalOpen(true);
  }

  const handleSelectValidatorsModaOpen = useCallback((): void => {
    setSelectValidatorsModalOpen(true);

    if (!state) setState('changeValidators');
  }, [state]);

  const handleNextToStake = useCallback((): void => {
    if (Number(stakeAmountInHuman) >= Number(minNominatorBond)) {
      if (validatorSelectionType === 'Auto') {
        handleConfirmStakingModaOpen();
        if (!state) setState('stakeAuto');
      } else {
        handleSelectValidatorsModaOpen();
        if (!state) setState('stakeManual');
      }
    }
  }, [handleSelectValidatorsModaOpen, minNominatorBond, stakeAmountInHuman, state, validatorSelectionType]);

  function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role='tabpanel'
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ p: 3 }}>
            <Typography>{children}</Typography>
          </Box>
        )}
      </div>
    );
  }

  return (
    <Modal
      // eslint-disable-next-line react/jsx-no-bind
      onClose={(_event, reason) => {
        if (reason !== 'backdropClick') {
          handleEasyStakingModalClose();
        }
      }}
      open={showStakingModalOpen}
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
        <Container>
          <Grid
            container
            justifyContent='flex-start'
            sx={{ padding: '5px 0px 10px' }}
          >
            <Grid alignItems='center' container justifyContent='space-between'>
              <Grid item xs={2}>
                <IconButton
                  edge='start'
                  onClick={handleEasyStakingModalClose}
                  size='small'
                >
                  <CloseRounded fontSize='small' />
                </IconButton>
              </Grid>
              <Grid item xs={2}>
                <Avatar
                  alt={'logo'}
                  src={getChainLogo(chain)}
                // sx={{ height: 45, width: 45 }}
                />
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <Box fontSize={12} fontWeight='fontWeightBold'>
                <Divider>
                  <Chip
                    icon={<FontAwesomeIcon
                      icon={faCoins}
                      size='sm'
                    />}
                    label={t('Easy Staking')}
                    variant='outlined'
                  />
                </Divider>
              </Box>
            </Grid>
          </Grid>
          <Grid alignItems='center' container>
            <Grid alignItems='center' container item justifyContent='center' xs={12}>
              <Paper elevation={4} sx={{ borderRadius: '10px', margin: '10px 30px 10px', p: 3 }}>
                <Grid container item sx={{ textAlign: 'left' }} xs={12}>
                  <Grid item sx={{ paddingBottom: '10px' }} xs={6}>
                    Available: {availableBalance} {coin}
                  </Grid>
                  <Grid item sx={{ paddingBottom: '10px', textAlign: 'right' }} xs={6}>
                    Reward: {!totalReceivedReward
                      ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '60px' }} />
                      : totalReceivedReward} {coin}
                  </Grid>
                  <Grid item xs={6}>
                    Staked: {!ledger
                      ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '60px' }} />
                      : ledger.total ? amountToHuman(ledger.total.toString(), decimals) : '0.00'} {coin}
                  </Grid>
                  <Grid item sx={{ textAlign: 'right' }} xs={6}>
                    Unstaking: {!ledger
                      ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '60px' }} />
                      : ledger.unlocking.length ? ledger.unlocking : '0.00'} {coin}
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                  textColor='secondary'
                  indicatorColor='secondary'
                  centered value={tabValue} onChange={handleChange}>
                  <Tab icon={<AddCircleOutlineOutlined fontSize='small' />} iconPosition='start' label='Stake' sx={{ fontSize: 11 }} />
                  <Tab icon={<RemoveCircleOutlineOutlined fontSize='small' />} iconPosition='start' label='Unstake' sx={{ fontSize: 11 }} />
                  <Tab icon={gettingNominatedValidatorsInfoFromBlockchain
                    ? <CircularProgress thickness={2} size={12} />
                    : <CheckOutlined fontSize='small' />}
                    iconPosition='start' label='Nominated Validators' sx={{ fontSize: 11 }} />
                  <Tab icon={gettingStakingConstsFromBlockchain
                    ? <CircularProgress thickness={2} size={12} />
                    : <InfoOutlined fontSize='small' />}
                    iconPosition='start' label='Info' sx={{ fontSize: 11 }} />
                </Tabs>
              </Box>
              <TabPanel value={tabValue} index={0}>
                <Grid container>
                  <Grid item sx={{ padding: '10px 30px 0px' }} xs={12}>
                    <TextField
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ endAdornment: (<InputAdornment position='end'>{coin}</InputAdornment>) }}
                      autoFocus
                      color='warning'
                      error={zeroBalanceAlert}
                      fullWidth
                      helperText={zeroBalanceAlert ? t('Available balance is zero.') : ''}
                      inputProps={{ step: '.01' }}
                      label={t('Amount')}
                      name='stakeAmount'
                      onBlur={(event) => handleStakeAmountOnBlur(event.target.value)}
                      onChange={handleStakeAmountOnChange}
                      placeholder='0.0'
                      // size='small'
                      type='number'
                      value={stakeAmountInHuman}
                      variant='outlined'
                    />
                  </Grid>
                  {!zeroBalanceAlert
                    ? <Grid container item justifyContent='space-between' sx={{ padding: '0px 30px 10px' }} xs={12}>
                      <Grid item sx={{ fontSize: 12 }}>
                        {minNominatorBond
                          ? <>
                            Min :
                            <Button
                              onClick={handleMinClicked}
                              variant='text'
                            >
                              {`${minNominatorBond} ${coin}`}
                            </Button>
                          </>
                          : ''}
                      </Grid>
                      <Grid item sx={{ fontSize: 12 }}>
                        {minNominatorBond
                          ? <>
                            Max :
                            <Button
                              onClick={handleMaxClicked}
                              variant='text'
                            >
                              {`${maxStake} ${coin}`}
                            </Button>
                          </>
                          : ''}
                      </Grid>
                    </Grid>
                    : ''}
                  <Grid item container sx={{ fontSize: 13, fontWeight: '600', textAlign: 'center', padding: '5px 30px 5px' }} xs={12}>
                    {alert
                      ? <Grid item xs={12}>
                        <Alert severity='error' sx={{ fontSize: 12 }} >
                          {alert}
                        </Alert>
                      </Grid>
                      : <Grid item sx={{ paddingTop: '45px' }} xs={12}></Grid>
                    }
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <Grid alignItems='center' container justifyContent='center'>
                        <Grid item sx={{ fontSize: 12 }} xs={5}>
                          <FormLabel sx={{ fontSize: 13, paddingRight: '20px', fontWeight: '500', color: 'black' }}>{t('Validator Selection')}:</FormLabel>
                        </Grid>
                        <Grid item xs={6}>
                          <RadioGroup
                            defaultValue='Auto'
                            onChange={handleValidatorSelectionType}
                            row
                            value={validatorSelectionType}
                          >
                            <FormControlLabel
                              control={<Radio sx={{ fontSize: 12, '& .MuiSvgIcon-root': { fontSize: 15 } }} />}
                              label={<Box fontSize='small'>Auto <Box
                                component='span'
                                sx={{ color: 'gray' }}
                              > (best return)</Box></Box>}
                              value='Auto'
                            />
                            <FormControlLabel
                              control={<Radio sx={{ fontSize: 12, '& .MuiSvgIcon-root': { fontSize: 15 } }} />}
                              label={<Box fontSize='small'>Manual</Box>}
                              sx={{ fontSize: 12 }}
                              value='Manual'
                            />
                          </RadioGroup>
                        </Grid>
                      </Grid>
                    </FormControl>
                  </Grid>
                  <Grid container item justifyContent='space-between' sx={{ padding: '20px 20px 0px' }} xs={12}>
                    <Grid item xs={8}>
                      <NextStepButton
                        data-button-action='next to stake'
                        isBusy={(!validatorsInfoIsUpdated || validatorSelectionType === 'Auto') && ['stakeAuto', 'StakeManual'].includes(state)}
                        isDisabled={nextButtonDisabled}
                        onClick={handleNextToStake}
                      >
                        {nextButtonCaption.toUpperCase()}
                      </NextStepButton>
                    </Grid>
                    <Grid item xs={3} justifyContent='center' sx={{ paddingTop: 2 }}>
                      <ActionText
                        // className={{'margin': 'auto'}}
                        onClick={handleEasyStakingModalClose}
                        text={t<string>('CANCEL')}
                      />
                    </Grid>
                    {ledger && staker && selectedValidatorsAccountId?.length && nominatedValidatorsInfo
                      ? <ConfirmStaking
                        chain={chain}
                        coin={coin}
                        handleEasyStakingModalClose={handleEasyStakingModalClose}
                        // lastFee={lastFee}
                        ledger={ledger}
                        nominatedValidatorsInfo={nominatedValidatorsInfo}
                        selectedValidatorsAccountId={selectedValidatorsAccountId}
                        setConfirmStakingModalOpen={setConfirmStakingModalOpen}
                        setState={setState}
                        showConfirmStakingModal={showConfirmStakingModal}
                        stakeAmount={stakeAmount}
                        staker={staker}
                        stakingConstsInfo={stakingConsts}
                        state={state}
                        validatorsInfo={validatorsInfo}
                      />
                      : ''}
                  </Grid>
                </Grid>
              </TabPanel>
              <TabPanel value={tabValue} index={1}>
              </TabPanel>
              <TabPanel value={tabValue} index={2}>
                {nominatedValidatorsInfo && stakingConsts
                  ? <>
                    <ValidatorsList
                      chain={chain}
                      stakingConsts={stakingConsts}
                      validatorsInfo={nominatedValidatorsInfo}
                      validatorsName={validatorsName} />

                    <NextStepButton
                      data-button-action='Change Nominated Validators'
                      isBusy={validatorsInfo && state === 'changeValidators'}
                      // isDisabled={nextButtonDisabled}
                      onClick={handleSelectValidatorsModaOpen}
                    >
                      {t('Change Elected Validators').toUpperCase()}
                    </NextStepButton>

                    {/* <Button
                      color='primary'
                      // fullWidth
                      name='Change Nominated Validators'
                      onClick={handleSelectValidatorsModaOpen}
                      size='medium'
                      variant='contained'
                      sx={{ marginTop: '10px' }}
                    >
                      {'Change Elected Validators'}
                    </Button>       */}
                  </>
                  : !noNominatedValidators
                    ? <>
                      <Grid container sx={{ paddingTop: '40px' }} >
                        <Grid xs={12}>
                          <CircularProgress />
                        </Grid>
                        <Grid xs={12} sx={{ fontSize: 13, paddingTop: '20px' }}>
                          {t('Getting nominators ...')}
                        </Grid>
                      </Grid>
                    </>
                    : <Box fontSize={13} mt={3}>
                      {t('You do not nominated any validators yet.')}
                    </Box>
                }
              </TabPanel>
              <TabPanel value={tabValue} index={3}>
                <Grid container>
                  <Grid xs={12}>
                    {t('Welcome to Staking')}
                  </Grid>
                  <Grid xs={12} sx={{ fontSize: 12, paddingBottom: '20px' }}>
                    {t('Information you should know about it.')}
                  </Grid>
                  {stakingConsts
                    ? <>
                      <Grid xs={12} sx={{ fontSize: 11 }}>
                        {t('Maximum validators you can select: ')} {stakingConsts?.maxNominations}
                      </Grid>
                      <Grid xs={12} sx={{ fontSize: 11 }}>
                        {t('Minimum')} {coin}s {t('that you can stake: ')} {minNominatorBond} {coin}s
                      </Grid>
                      <Grid xs={12} sx={{ fontSize: 11 }}>
                        {t('Maximum stakers of a validator, who receives rewards: ')} {stakingConsts?.maxNominatorRewardedPerValidator}
                      </Grid>
                      <Grid xs={12} sx={{ fontSize: 11 }}>
                        {t('Days it takes to receive your funds back after unstaking:  ')} {stakingConsts?.bondingDuration}  {t('days')}
                      </Grid>
                      <Grid xs={12} sx={{ fontSize: 11 }}>
                        {t('Minimum')} {coin}s {t('that must remain in you account: ')} {amountToHuman(String(stakingConsts?.existentialDeposit), decimals)} {coin}s {t('plus some fees')}
                      </Grid>
                    </>
                    : <>
                      <Grid xs={12} sx={{ padding: '20px 1px 20px' }} >
                        <CircularProgress />
                      </Grid>
                      <Grid xs={12} sx={{ fontSize: 11 }}>
                        {t('Getting information ...')}
                      </Grid>
                    </>}
                </Grid>
              </TabPanel>
            </Grid>
          </Grid>
          {stakingConsts && validatorsInfo
            ? <SelectValidators
              chain={chain}
              coin={coin}
              ledger={ledger}
              handleEasyStakingModalClose={handleEasyStakingModalClose}
              // lastFee={lastFee}
              setSelectValidatorsModalOpen={setSelectValidatorsModalOpen}
              setState={setState}
              showSelectValidatorsModal={showSelectValidatorsModal}
              stakeAmount={stakeAmount}
              staker={staker}
              stakingConsts={stakingConsts}
              state={state}
              validatorsInfo={validatorsInfo}
              validatorsInfoFromSubscan={validatorsInfoFromSubscan}
              validatorsName={validatorsName}
            />
            : ''}
        </Container>
      </div>
    </Modal>
  );
}
