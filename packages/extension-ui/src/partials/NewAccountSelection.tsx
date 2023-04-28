// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { AccountJson } from '@polkadot/extension-base/background/types';

import plusIcon from '../assets/add.svg';
import border from '../assets/border.svg';
import ribbon from '../assets/ribbon.svg';
import { AccountContext, Svg } from '../components';
import Checkbox from '../components/Checkbox';
import FaviconBox from '../components/FaviconBox';
import useTranslation from '../hooks/useTranslation';
import Account from '../Popup/Accounts/Account';
import AccountsTree from '../Popup/Accounts/AccountsTree';
import { createGroupedAccountData } from '../util/createGroupedAccountData';
import { Z_INDEX } from '../zindex';

interface Props extends ThemeProps {
  className?: string;
  url: string;
  showHidden?: boolean;
  newAccounts: Array<AccountJson> | [];
  onChange?: (value: boolean) => void;
}

interface GroupedData {
  [key: string]: AccountJson[];
}

const StyledCheckbox = styled(Checkbox)`
  display: flex;
  justify-content: flex-end;
  margin-right: 24px;
`;

const StyledFaviconBox = styled(FaviconBox)`
  :hover {
    background: ${({ theme }: ThemeProps) => theme.inputBorderColor};
  }
`;

function NewAccountSelection({
  className,
  newAccounts,
  onChange,
  showHidden = false,
  url
}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { accounts, hierarchy, selectedAccounts = [], setSelectedAccounts } = useContext(AccountContext);
  const [isIndeterminate, setIsIndeterminate] = useState(false);

  const { flattened, getParentName } = useMemo(() => createGroupedAccountData(hierarchy), [hierarchy]);
  const noAccountSelected = selectedAccounts.length === 0;
  const allDisplayedAddresses = showHidden
    ? accounts.map(({ address }) => address)
    : accounts.filter(({ isHidden }) => !isHidden).map(({ address }) => address);
  const areAllAccountsSelected = selectedAccounts.length === allDisplayedAddresses.length;

  useEffect(() => {
    const nextIndeterminateState = !noAccountSelected && !areAllAccountsSelected;

    setIsIndeterminate(nextIndeterminateState);
  }, [areAllAccountsSelected, noAccountSelected]);

  const _onSelectAllToggle = useCallback(() => {
    if (onChange) {
      onChange(true);
    }

    if (areAllAccountsSelected) {
      setSelectedAccounts && setSelectedAccounts([]);

      return;
    }

    setSelectedAccounts && setSelectedAccounts(allDisplayedAddresses);
  }, [allDisplayedAddresses, areAllAccountsSelected, onChange, setSelectedAccounts]);

  const groupedAccounts = flattened.reduce<GroupedData>(
    (acc, curr) => {
      if (newAccounts.some((account) => account.address === curr.address)) {
        acc = { ...acc, new: [...acc.new, curr] };
      } else {
        acc = { ...acc, other: [...acc.other, curr] };
      }

      return acc;
    },
    { new: [], other: [] }
  );

  return (
    <div className={className}>
      <div className='withWarning'>
        <Svg
          className='border'
          src={border}
        />
        <div className='heading'>{t<string>('Update connected app')}</div>
        <StyledFaviconBox
          url={url}
          withoutProtocol
        />
        <div className='separator'>
          <div className='line'></div>
          <Svg
            className='plus-icon'
            src={plusIcon}
          />
          <div className='line'></div>
        </div>
        <div className='subtitle'>
          {t<string>(
            'New account(s) have been added since your last interaction with this app. Update your preferences.'
          )}
        </div>
      </div>
      {flattened.length > 1 && (
        <StyledCheckbox
          checked={areAllAccountsSelected}
          className='accountTree-checkbox'
          indeterminate={isIndeterminate}
          label={t('Select all')}
          onChange={_onSelectAllToggle}
        />
      )}
      <div className='accountList'>
        {Object.entries(groupedAccounts).map(([group, accounts]) => {
          return (
            <>
              {group !== 'new' && groupedAccounts.other.length > 0 && (
                <span className='separator-heading'>{group}</span>
              )}
              {accounts.map((json, index) => (
                <AccountsTree
                  {...json}
                  checkBoxOnChange={onChange}
                  className={group === 'new' ? 'new' : ''}
                  isAuthList
                  key={`${group}:${index}:${json.address}`}
                  parentName={getParentName(json)}
                  showHidden={showHidden}
                  withCheckbox={true}
                  withMenu={false}
                />
              ))}
            </>
          );
        })}
      </div>
    </div>
  );
}

export default styled(NewAccountSelection)(
  ({ theme }: Props) => `

  // due to internal padding
  margin: 0px -16px;

  ${AccountsTree}:last-of-type {
    padding-bottom: 48px;
  }

  ${Checkbox}:not(.accountTree-checkbox) label span {
    left: -10px;
  }

  .border {
    z-index: ${Z_INDEX.BORDER};
    position: absolute;
    top: 0;
    right: 0;
    pointer-events: none;
    background: ${theme.newTransactionBackground};
    height: 600px;
    width: 360px;
  }

  .new {
    position: relative;
    
    ${Account} {
      .name {
        margin: 2px 8px 0px 0px;
      }

      ${Checkbox} label span {
        left: -4px;
      }

      &:before {
        content: url(${ribbon});
        display: block;
        width: 56px;
        height: 56px;
        position: absolute;
        width: 56px;
        height: 56px;
        left: 0px;
        top: 0px;
        z-index: ${Z_INDEX.NEW_ACCOUNT_RIBBON};
      }
    }
  }

  .separator-heading {
    display: flex;
    align-items: center;
    font-family: ${theme.secondaryFontFamily};
    font-style: normal;
    font-weight: 300;
    font-size: 11px;
    line-height: 120%;
    text-align: right;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: ${theme.subTextColor};
    padding: 8px 0 8px 8px;
    margin-bottom: 8px;
    border-bottom: 1px solid ${theme.boxBorderColor};
  }

  .accountList {
    overflow-x: hidden;
    scrollbar-color: ${theme.boxBorderColor};
    scrollbar-width: 2px;
    padding-right: 2px;
    padding: 0 16px;
  
    ::-webkit-scrollbar-thumb {
      background:${theme.boxBorderColor};
      border-radius: 50px;  
      width: 2px;  
      border-right: 2px solid #111B24;
    }
  
    ::-webkit-scrollbar {
      width: 4px;
    }
    ${Account} {
      padding: 2px 4px;
    }
  }

  .tab-name,
  .tab-url {
    color: ${theme.textColor};
    display: inline-block;
    max-height: 10rem;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: top;
    cursor: pointer;
    text-decoration: underline;
    white-space: nowrap;
  }

  .warningMargin {
    margin: 0 24px 0 1.45rem;

    .warning-message {
      display: block;
      width: 100%
    }
  }

  .heading {
    font-family: ${theme.secondaryFontFamily};
    font-style: normal;
    font-weight: 700;
    font-size: 24px;
    line-height: 118%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    letter-spacing: 0.03em;
    color: ${theme.textColor};
    margin: 16px 0px 8px 0px;
    text-align: center;
    white-space: pre-line;
  }

  .separator {
    margin-top: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
  }

  .line {
    height: 1px;
    background: ${theme.boxBorderColor};
    width: 120px;
  }

  .plus-icon {
    width: 32px;
    height: 32px;
    background: ${theme.subTextColor};
  }

  .subtitle {
    margin-top: 12px;
    font-style: normal;
    font-weight: 300;
    font-size: 14px;
    line-height: 145%;
    text-align: center;
    letter-spacing: 0.07em;
    white-space: pre-line;
    color: ${theme.subTextColor};
  }

  .withWarning {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
`
);
