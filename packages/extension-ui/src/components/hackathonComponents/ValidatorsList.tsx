// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line simple-import-sort/imports

import type { AccountId } from '@polkadot/types/interfaces';

import { ReportProblemOutlined } from '@mui/icons-material';
import { Container, Grid, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import React, { useEffect, useState } from 'react';

import { DeriveStakingQuery } from '@polkadot/api-derive/types';
import { Chain } from '@polkadot/extension-chains/types';
import { StakingConsts, ValidatorsName } from '@polkadot/extension-ui/util/HackathonUtilFiles/pjpeTypes';

import getNetworkInfo from '../../util/HackathonUtilFiles/getNetwork';

interface Props {
  chain?: Chain | null;
  validatorsInfo: DeriveStakingQuery[] | null;
  stakingConsts: StakingConsts;
  validatorsName: ValidatorsName[] | null;
}

interface TableRowProps {
  validators: DeriveStakingQuery[];
  decimals: number;
  stakingConsts: StakingConsts;
  validatorsName: ValidatorsName[] | null;
}

interface Data {
  name: string;
  // eslint-disable-next-line camelcase
  commission: number;
  // eslint-disable-next-line camelcase
  nominator: number;
  // eslint-disable-next-line camelcase
  total: string;
  // eslint-disable-next-line camelcase
  // reward_point: number;
}

function toShortAddress(_address: string | AccountId): string {
  _address = String(_address);

  return `${_address.slice(0, 6)} ...  ${_address.slice(-6)}`;
}

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

function getComparator<T>(order: Order, orderBy: keyof T): (a: DeriveStakingQuery, b: DeriveStakingQuery)
  => number {
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

const headCells: readonly HeadCell[] = [
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
  onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
  order: Order;
  orderBy: string;
  rowCount: number;
}

function EnhancedTableHead(props: EnhancedTableProps) {
  const { onRequestSort, order, orderBy } = props;

  const createSortHandler = (property: keyof Data) => (event: React.MouseEvent<unknown>) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <StyledTableCell
            align={headCell.numeric ? 'right' : 'left'}
            key={headCell.id}
            padding={headCell.disablePadding ? 'none' : 'normal'}
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

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.grey[400],
    color: theme.palette.common.white
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 12
  }
}));

function EnhancedTable(props: TableRowProps) {
  const rows = props.validators;
  const stakingConsts = props.stakingConsts;
  const validatorsName = props.validatorsName;

  const [order, setOrder] = React.useState<Order>('asc');
  const [orderBy, setOrderBy] = React.useState<keyof Data>('name');
  const [selected, setSelected] = React.useState<readonly string[]>([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof Data
  ) => {
    const isAsc = orderBy === property && order === 'asc';

    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelecteds = rows.map((v) => String(v.accountId));

      setSelected(newSelecteds);

      return;
    }

    setSelected([]);
  };

  const handleClick = (event: React.MouseEvent<unknown>, name: string) => {
    const selectedIndex = selected.indexOf(name);
    let newSelected: readonly string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, name);
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

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const isSelected = (name: string) => selected.indexOf(name) !== -1;

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  function getAccountIdOrName(id: string) {
    if (validatorsName) {
      const validator = validatorsName.find((v) => v.address === id);

      if (validator) {
        return validator.name;
      }
    }

    return toShortAddress(id);
  }

  return (
    <>
      {/* <EnhancedTableToolbar numSelected={selected.length} setSelected={setSelected} /> */}
      <TableContainer sx={{ borderRadius: '5px', maxHeight: 350 }}>
        <Table
          size='small'
          stickyHeader
          sx={{ width: '100%' }}
        >
          <EnhancedTableHead
            numSelected={selected.length}
            onRequestSort={handleRequestSort}
            onSelectAllClick={handleSelectAllClick}
            order={order}
            orderBy={orderBy}
            rowCount={rows.length}
          />
          <TableBody>
            {
              rows.slice().sort(getComparator(order, orderBy))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => {
                  const isItemSelected = isSelected(row.accountId.toString());
                  const labelId = `table-checkbox-${index}`;

                  return (
                    <TableRow
                      aria-checked={isItemSelected}
                      hover
                      key={index}
                      // eslint-disable-next-line react/jsx-no-bind
                      onClick={(event) => handleClick(event, row.accountId.toString())}
                      // role='checkbox'
                      selected={isItemSelected}
                      tabIndex={-1}
                    >
                      {/* <StyledTableCell padding='checkbox'>
                          <Checkbox
                            checked={isItemSelected}
                            color='primary'
                            inputProps={{
                              'aria-labelledby': labelId
                            }}
                          />
                        </StyledTableCell> */}
                      <StyledTableCell component='th' id={labelId} padding='normal' scope='row'>
                        {getAccountIdOrName(row.accountId)}
                      </StyledTableCell>
                      <StyledTableCell align='right'>{Number(row.validatorPrefs.commission) / (10 ** 7)}%</StyledTableCell>
                      <StyledTableCell align='right'>
                        <Grid container alignItems='center'>
                          <Grid item xs={6} sx={{ textAlign: 'center' }}>
                            {row.exposure.others.length
                              ? row.exposure.others.length > stakingConsts?.maxNominatorRewardedPerValidator
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
                  height: 30 * emptyRows// (dense ? 33 : 53) * emptyRows,
                }}
              >
                <StyledTableCell colSpan={6} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component='div'
        count={rows.length}
        labelRowsPerPage={''}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5]}
        showFirstButton
        showLastButton
      />
    </>
  );
}

export default function ValidatorsList({ chain, stakingConsts, validatorsInfo, validatorsName }: Props): React.ReactElement<Props> {
  const [decimal, setDecimal] = useState(1);

  useEffect(() => {
    const { decimals } = getNetworkInfo(chain);

    setDecimal(decimals);

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
  }, []);

  return (
    <Container disableGutters maxWidth='md'>
      <Grid alignItems='center' container>
        <Grid item xs={12}>
          {validatorsInfo
            ? <EnhancedTable
              decimals={decimal}
              stakingConsts={stakingConsts}
              validators={validatorsInfo}
              validatorsName={validatorsName}
            />
            : ''}
        </Grid>
      </Grid>
    </Container>
  );
}
