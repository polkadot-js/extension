// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line simple-import-sort/imports

import type { AccountId, StakingLedger } from '@polkadot/types/interfaces';

import { ReportProblemOutlined } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import { Avatar, Box, Checkbox, Container, Divider, FormControlLabel, Grid, IconButton, Modal, TextField } from '@mui/material';
import { alpha, styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
// import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';

import { DeriveStakingQuery } from '@polkadot/api-derive/types';
import { Chain } from '@polkadot/extension-chains/types';
import getChainLogo from '@polkadot/extension-ui/util/newUtils/getChainLogo';

import useTranslation from '../../hooks/useTranslation';
import getNetworkInfo from '../../util/newUtils/getNetwork';
import { DEFAULT_VALIDATOR_COMMISION_FILTER } from '../../util/newUtils/pjpeUtils';
import { AccountsBalanceType, AllValidatorsFromSubscan, StakingConsts, Validators, ValidatorsName } from '../../util/newUtils/pjpeTypes';
import { ActionText, NextStepButton } from '../../components';
import ConfirmStaking from './ConfirmStaking';

interface Props {
  chain?: Chain | null;
  handleEasyStakingModalClose: Dispatch<SetStateAction<boolean>>;
  staker: AccountsBalanceType;
  showSelectValidatorsModal: boolean;
  setSelectValidatorsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  stakingConsts: StakingConsts;
  stakeAmount: bigint;
  validatorsInfo: Validators;
  validatorsInfoFromSubscan: AllValidatorsFromSubscan | null;
  validatorsName: ValidatorsName[] | null;
  setState: React.Dispatch<React.SetStateAction<string>>;
  state: string;
  coin: string;
  ledger: StakingLedger | null;

}

interface Data {
  name: string;
  commission: number;
  nominator: number;
  total: string;
}

function toShortAddress(_address: string | AccountId): string {
  _address = String(_address);

  return `${_address.slice(0, 6)} ...  ${_address.slice(-6)}`;
}

function makeFirstLetterOfStringUpperCase(str: string): string {
  const arr = str.split(' ');

  for (let i = 0; i < arr.length; i++) {
    arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1).toLowerCase();
  }

  return arr.join(' ');
}

// function displayValidator(_validator): string {
//   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
//   let display = _validator.stash_account_display.display || _validator.controller_account_display.display;

//   if (display) { return display; }

//   display = _validator.parent?.display || _validator.parent?.display;

//   if (display) { return display; }

//   return makeAddressShort(_validator.stash_account_display.address);
// }

function descendingComparator<T>(a: DeriveStakingQuery, b: DeriveStakingQuery, orderBy: keyof T) {
  let A, B;

  switch (orderBy) {
    case ('commission'):
      A = a.validatorPrefs.commission;
      B = b.validatorPrefs.commission;
      break;
    case ('nominator'):
      A = a.exposure.others.length;
      B = b.exposure.others.length;
      break;
    default:
      A = a.accountId;
      B = b.accountId;
  }

  if (B < A) {
    return -1;
  }

  if (B > A) {
    return 1;
  }

  return 0;
}

type Order = 'asc' | 'desc';

function getComparator<T>(order: Order, orderBy: keyof T): (a: DeriveStakingQuery, b: DeriveStakingQuery) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

interface HeadCell {
  disablePadding: boolean;
  id: keyof Data;
  label: string;
  numeric: boolean;
}

const headCells: HeadCell[] = [
  {
    disablePadding: false,
    id: 'name',
    label: 'Address/Name',
    numeric: false
  },
  {
    disablePadding: false,
    id: 'commission',
    label: 'Commission',
    numeric: true
  },
  {
    disablePadding: false,
    id: 'nominator',
    label: 'Nominator',
    numeric: true
  }
  // , {
  //   id: 'oversubscribed',
  //   numeric: true,
  //   disablePadding: false,
  //   label: 'Oversubscribed'
  // }
];

interface EnhancedTableProps {
  numSelected: number;
  onRequestSort: (event: React.MouseEvent<unknown>, property: keyof Data) => void;
  // onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
  order: Order;
  orderBy: string;
  rowCount: number;
  // validatorsName: ValidatorsName[] | null;
}

function EnhancedTableHead(props: EnhancedTableProps) {
  const { onRequestSort, order, orderBy } = props;

  const createSortHandler = (property: keyof Data) => (event: React.MouseEvent<unknown>) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead sx={{ height: '15px' }}>
      <TableRow sx={{ height: '10px' }}>
        <StyledTableCell padding='checkbox'>
          {/* <Checkbox
            checked={rowCount > 0 && numSelected === rowCount}
            color='primary'
            indeterminate={numSelected > 0 && numSelected < rowCount}
            inputProps={{
              'aria-label': 'select all validators'
            }}
            onChange={onSelectAllClick}
          /> */}
        </StyledTableCell>
        {headCells.map((headCell) => (
          <StyledTableCell
            align={headCell.numeric ? 'right' : 'left'}
            key={headCell.id}
            // padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
            </TableSortLabel>
          </StyledTableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

interface EnhancedTableToolbarProps {
  numSelected: number;
  setSelected: React.Dispatch<React.SetStateAction<DeriveStakingQuery[]>>;
  setSearchedValidators: React.Dispatch<React.SetStateAction<DeriveStakingQuery[]>>;
  stakingConsts: StakingConsts;
  validators: DeriveStakingQuery[];
  setSearching: React.Dispatch<React.SetStateAction<boolean>>;
  validatorsName: ValidatorsName[] | null;
}

const EnhancedTableToolbar = (props: EnhancedTableToolbarProps) => {
  const { numSelected, setSearchedValidators, setSearching, setSelected, stakingConsts, validators, validatorsName } = props;
  // const { t } = useTranslation();

  const handleValidatorSearch = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const keyWord = event.target.value;

    setSearching(!!keyWord);

    const founds = validators.filter((item) => String(item.accountId).toLowerCase().includes(keyWord.toLowerCase()));
    const foundsOnName = validatorsName?.filter((item) => item.name.toLowerCase().includes(keyWord.toLowerCase()));

    foundsOnName?.forEach((item) => {
      const f = validators.find((v) => String(v.accountId) === item.address)

      if (f) founds.push(f);
    });

    setSearchedValidators(founds);
  }

  return (
    <Toolbar
      sx={{
        borderRadius: '5px',
        pl: { sm: 2 },
        pr: { sm: 1, xs: 1 },
        ...(numSelected > 0 && {
          bgcolor: (theme) =>
            alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity)
        })
      }}
    >
      {numSelected > 0
        ? (
          <Typography
            color='inherit'
            component='div'
            sx={{ fontSize: 15, fontWeight: 'bold', flex: '1 1 100%' }}
          >
            {numSelected}/{stakingConsts?.maxNominations} selected
          </Typography>
        )
        : (
          <Typography
            component='div'
            id='tableTitle'
            sx={{ fontSize: 15, fontWeight: 'bold', flex: '1 1 100%' }}
          >
            Select Validators
          </Typography>
        )
      }
      <TextField
        autoComplete='off'
        // InputProps={{ endAdornment: (<InputAdornment position='end'>{coin}</InputAdornment>) }}
        color='warning'
        fullWidth
        // helperText={zeroBalanceAlert ? t('Available balance is zero.') : ''}
        // label={t('Search')}
        name='search'
        onChange={handleValidatorSearch}
        placeholder='Filter with Address/Name'
        type='text'
        variant='outlined'
        size='small'
        sx={{ fontSize: 12 }}
      />
      {numSelected > 0
        ? (
          <Tooltip title='Delete'>
            <IconButton onClick={() => setSelected([])}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        )
        : (
          <Tooltip title='Filter list'>
            <IconButton>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        )
      }
    </Toolbar>
  );
};

interface TableRowProps {
  validators: DeriveStakingQuery[];
  decimals: number;
  stakingConsts: StakingConsts;
  validatorsName: ValidatorsName[] | null;
  searchedValidators: DeriveStakingQuery[];
  setSearchedValidators: React.Dispatch<React.SetStateAction<DeriveStakingQuery[]>>;
  selected: DeriveStakingQuery[];
  setSelected: React.Dispatch<React.SetStateAction<DeriveStakingQuery[]>>;
  searching: boolean;
  setSearching: React.Dispatch<React.SetStateAction<boolean>>;
}

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.grey[400],
    color: theme.palette.common.white,
    height: '20px',
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 13,
    height: '20px',
    padding: '0px 10px'
  }
}));

function EnhancedTable(props: TableRowProps) {
  const rows = props.searching ? props.searchedValidators : props.validators;
  const setSearchedValidators = props.setSearchedValidators;
  const stakingConsts = props.stakingConsts;
  const validatorsName = props.validatorsName;
  const selected = props.selected;
  const setSelected = props.setSelected;
  const [order, setOrder] = React.useState<Order>('asc');
  const [orderBy, setOrderBy] = React.useState<keyof Data>('name');
  const [emptyRows, setEmptyRows] = React.useState<number>(0);

  const handleRequestSort = (_event: React.MouseEvent<unknown>, property: keyof Data) => {
    const isAsc = orderBy === property && order === 'asc';

    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleClick = (event: React.MouseEvent<unknown>, validator: DeriveStakingQuery) => {
    const selectedIndex = selected.indexOf(validator);

    if (selected.length >= stakingConsts.maxNominations && selectedIndex === -1) {
      console.log('Max validators you can select reached!');

      return;
    }

    let newSelected: DeriveStakingQuery[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, validator);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const isSelected = (v: DeriveStakingQuery) => selected.indexOf(v) !== -1;

  function getAccountIdOrName(val: DeriveStakingQuery) {
    const validator = validatorsName?.find((v) => v.address === String(val.accountId));

    if (validator) {
      return makeFirstLetterOfStringUpperCase(validator.name);
    }

    return toShortAddress(val.accountId);
  }

  useEffect(() => {
    setEmptyRows(8 - rows.length);
  }, [rows]);

  return (
    <Container sx={{ overflow: 'hidden', padding: '5px 10px', width: '100%' }}>
      <EnhancedTableToolbar
        numSelected={selected.length}
        setSearchedValidators={setSearchedValidators}
        setSearching={props.setSearching}
        setSelected={setSelected}
        stakingConsts={stakingConsts}
        validators={rows}
        validatorsName={validatorsName} />
      <TableContainer sx={{ borderRadius: '5px', maxHeight: 350 }}>
        <Table stickyHeader>
          <EnhancedTableHead
            numSelected={selected.length}
            // eslint-disable-next-line react/jsx-no-bind
            onRequestSort={handleRequestSort}
            // onSelectAllClick={handleSelectAllClick}
            order={order}
            orderBy={orderBy}
            rowCount={rows.length} />
          <TableBody>
            {
              rows.slice().sort(getComparator(order, orderBy))
                // .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => {
                  const isItemSelected = isSelected(row);
                  const labelId = `table-checkbox-${index}`;

                  return (
                    <TableRow
                      aria-checked={isItemSelected}
                      hover
                      key={index}
                      // eslint-disable-next-line react/jsx-no-bind
                      onClick={(event) => handleClick(event, row)}
                      role='checkbox'
                      selected={isItemSelected}
                      style={{
                        height: 30
                      }}
                      tabIndex={-1}
                    >
                      <StyledTableCell padding='checkbox'>
                        <Checkbox
                          checked={isItemSelected}
                          color='primary'
                          inputProps={{
                            'aria-labelledby': labelId
                          }}
                          size='small'
                        />
                      </StyledTableCell>
                      <StyledTableCell
                        component='th'
                        id={labelId}
                        padding='none'
                        scope='row'
                      >
                        <Grid container>
                          <Grid item xs={12}>
                            {getAccountIdOrName(row)}
                          </Grid>
                          <Grid item sx={{ fontSize: 10 }} xs={12}>
                            {row.exposure.total ? `Total staked: ${String(row.exposure.total)}` : ''}
                          </Grid>
                        </Grid>
                      </StyledTableCell>
                      <StyledTableCell align='right'>
                        {Number(row.validatorPrefs.commission) / (10 ** 7)}%
                      </StyledTableCell>
                      <StyledTableCell align='right'>
                        <Grid container alignItems='center'>
                          <Grid item xs={6} sx={{ textAlign: 'center' }}>
                            {row.exposure.others.length
                              ? row.exposure.others.length > stakingConsts.maxNominatorRewardedPerValidator
                                ? <Tooltip title='Oversubscribed'>
                                  <ReportProblemOutlined sx={{ fontSize: '12px' }} color='warning' />
                                </Tooltip>
                                : ''
                              : ''}
                          </Grid>
                          <Grid item xs={6} sx={{ textAlign: 'right' }}>
                            {row.exposure.others.length ? row.exposure.others.length : 'waiting'}
                          </Grid>
                        </Grid>
                      </StyledTableCell>
                    </TableRow>
                  );
                })}
            {emptyRows > 0 && (
              <TableRow
                style={{
                  height: 53 * emptyRows// (dense ? 33 : 53) * emptyRows,
                }}
              >
                <StyledTableCell colSpan={6} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default function SelectValidators({ chain, coin, ledger, setSelectValidatorsModalOpen, setState,
  showSelectValidatorsModal, stakeAmount, staker, stakingConsts, state, validatorsInfo, validatorsInfoFromSubscan, validatorsName
}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [validators, setValidators] = useState<DeriveStakingQuery[]>([]);
  const [searchedValidators, setSearchedValidators] = useState<DeriveStakingQuery[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [filterHighCommissionsState, setFilterHighCommissions] = useState(true);
  const [filterOverSubscribedsState, setFilterOverSubscribeds] = useState(true);
  const [filterNoNamesState, setFilterNoNames] = useState(false);
  const [decimal, setDecimal] = useState(1);
  const [selected, setSelected] = React.useState<DeriveStakingQuery[]>([]);
  const [showConfirmStakingModal, setConfirmStakingModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const { decimals } = getNetworkInfo(chain);

    setDecimal(decimals);
    setValidators(validatorsInfo?.current.concat(validatorsInfo?.waiting));
  }, []);

  useEffect(() => {
    let filteredValidators = validatorsInfo.current.concat(validatorsInfo.waiting);

    // at first filtered blocked validatorsInfo
    filteredValidators = filteredValidators?.filter((v) => !v.validatorPrefs.blocked);

    if (filterOverSubscribedsState) {
      filteredValidators = filteredValidators?.filter((v) => v.exposure.others.length < stakingConsts.maxNominatorRewardedPerValidator);
    }

    if (filterHighCommissionsState) {
      filteredValidators = filteredValidators?.filter((v) => Number(v.validatorPrefs.commission) / (10 ** 7) <= DEFAULT_VALIDATOR_COMMISION_FILTER);
    }

    if (filterNoNamesState && validatorsName) {
      filteredValidators = filteredValidators?.filter((v) => validatorsName.find((vn) => vn.address === String(v.accountId)));
    }

    // remove filtered validators from the selected list
    const selectedTemp = [...selected];

    selectedTemp.forEach((s, index) => {
      if (!filteredValidators.find((f) => f === s)) {
        selectedTemp.splice(index, 1);
      }
    });

    setSelected(selectedTemp);

    setValidators(filteredValidators);
  }, [filterHighCommissionsState, filterNoNamesState, filterOverSubscribedsState, stakingConsts, validatorsInfo, validatorsName]);


  const filterHighCommisions = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setFilterHighCommissions(event.target.checked);
  }, []);

  const filterNoNames = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setFilterNoNames(event.target.checked);
  }, []);

  const filterOverSubscribeds = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setFilterOverSubscribeds(event.target.checked);
  }, []);

  const handleCancel = useCallback((): void => {
    setSelectValidatorsModalOpen(false);
    setFilterOverSubscribeds(true);
    setFilterHighCommissions(true);
    setFilterNoNames(false);
    setState('');
  }, [setSelectValidatorsModalOpen, setState]);

  function handleSelectValidators() {
    if (selected.length >= 1) { setConfirmStakingModalOpen(true); }
  }

  return (
    <>
      <Modal
        // eslint-disable-next-line react/jsx-no-bind
        onClose={(_event, reason) => {
          if (reason !== 'backdropClick') {
            handleCancel();
          }
        }}
        open={showSelectValidatorsModal}
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
            <Grid alignItems='center' container>
              <Grid item alignItems='center' container justifyContent='space-between' sx={{ padding: '0px 20px' }}>
                <Grid item>
                  {/* <MuiButton
                    // eslint-disable-next-line react/jsx-no-bind
                    onClick={handleCancel}
                    startIcon={<ArrowBackIosRounded />}
                  >
                    {''}
                  </MuiButton> */}
                  <Avatar
                    alt={'logo'}
                    src={getChainLogo(chain)}
                  />
                </Grid>
                <Grid item sx={{ fontSize: 15 }}>
                  <ActionText
                    // className={{'margin': 'auto'}}
                    onClick={handleCancel}
                    text={t('Cancel')}
                  />
                </Grid>
              </Grid>
              <Grid item xs={12}>
                <Box fontSize={12} fontWeight='fontWeightBold'>
                  <Divider>
                    {/* <Chip
                      icon={<FontAwesomeIcon icon={faCoins} size='sm' />}
                      label={t('Select Validators')}
                      variant='outlined'
                    /> */}
                  </Divider>
                </Box>
              </Grid>
            </Grid>
            <Grid alignItems='center' container>
              <Grid item xs={12} sx={{ textAlign: 'left' }}>
                {validatorsInfo
                  ? <EnhancedTable
                    decimals={decimal}
                    searchedValidators={searchedValidators}
                    searching={searching}
                    selected={selected}
                    setSearchedValidators={setSearchedValidators}
                    setSearching={setSearching}
                    setSelected={setSelected}
                    stakingConsts={stakingConsts}
                    validators={validators}
                    validatorsName={validatorsName}
                  />
                  : ''}
              </Grid>
              <Grid item container justifyContent='center' sx={{ padding: '1px 10px' }} xs={12}>
                <Grid item sx={{ fontSize: 13, textAlign: 'right' }} xs={4}>
                  <FormControlLabel
                    control={<Checkbox
                      color='default'
                      // defaultChecked
                      onChange={filterNoNames}
                      size='small'
                    />
                    }
                    label={<Box fontSize={12} sx={{ color: 'green' }}>{t('only have a name')}</Box>}
                  />
                </Grid>
                <Grid item sx={{ fontSize: 13, textAlign: 'center' }} xs={4}>
                  <FormControlLabel
                    control={<Checkbox
                      color='default'
                      defaultChecked
                      onChange={filterHighCommisions}
                      size='small'
                    />
                    }
                    label={<Box fontSize={12} sx={{ color: 'red' }}>{t('no ')}{DEFAULT_VALIDATOR_COMMISION_FILTER}+ {t(' commissions')}</Box>}
                  />
                </Grid>
                <Grid item sx={{ fontSize: 13, textAlign: 'left' }} xs={4}>
                  <FormControlLabel
                    control={<Checkbox
                      color='default'
                      defaultChecked
                      onChange={filterOverSubscribeds}
                      size='small'
                    />
                    }
                    label={<Box fontSize={12} sx={{ color: 'red' }}>{t('no oversubscribeds')}</Box>}
                  />
                </Grid>
                <Grid item xs={12} container sx={{ padding: '10px 20px' }}>
                  <Grid item xs={12}>
                    <NextStepButton
                      data-button-action='select validators manually'
                      isDisabled={!selected.length}
                      onClick={handleSelectValidators}
                    >
                      {t('Next')}
                    </NextStepButton>
                  </Grid>
                  {/* <Grid item xs={4} justifyContent='center' sx={{ fontSize: 15, paddingTop: 2 }}>
                    <ActionText
                      // className={{'margin': 'auto'}}
                      onClick={handleCancel}
                      text={t('Cancel') }
                    />
                  </Grid> */}
                  {selected.length >= 1
                    ? <ConfirmStaking
                      amount={state === 'changeValidators' ? 0n : stakeAmount}
                      chain={chain}
                      // handleEasyStakingModalClose={handleEasyStakingModalClose}
                      // lastFee={lastFee}
                      coin={coin}
                      ledger={ledger}
                      nominatedValidators={null}
                      selectedValidators={selected}
                      setConfirmStakingModalOpen={setConfirmStakingModalOpen}
                      setSelectValidatorsModalOpen={setSelectValidatorsModalOpen}
                      setState={setState}
                      showConfirmStakingModal={showConfirmStakingModal}
                      staker={staker}
                      stakingConsts={stakingConsts}
                      state={state}
                      validatorsInfo={validatorsInfo}
                      validatorsName={validatorsName}
                      validatorsToList={selected}
                    />
                    : 'You need to select at least a validator'}
                </Grid>
              </Grid>
            </Grid>
          </Container>
        </div>
      </Modal>
    </>
  );
}