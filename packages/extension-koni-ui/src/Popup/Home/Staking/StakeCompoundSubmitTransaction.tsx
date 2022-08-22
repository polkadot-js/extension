// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DelegationItem } from '@subwallet/extension-base/background/KoniTypes';
import InputAddress from '@subwallet/extension-koni-ui/components/InputAddress';
import InputBalance from '@subwallet/extension-koni-ui/components/InputBalance';
import Spinner from '@subwallet/extension-koni-ui/components/Spinner';
import { ActionContext } from '@subwallet/extension-koni-ui/contexts';
import useGetNetworkJson from '@subwallet/extension-koni-ui/hooks/screen/home/useGetNetworkJson';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { getStakeDelegationInfo } from '@subwallet/extension-koni-ui/messaging';
import Header from '@subwallet/extension-koni-ui/partials/Header';
import ValidatorsDropdown from '@subwallet/extension-koni-ui/Popup/Bonding/components/ValidatorsDropdown';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { BN } from '@polkadot/util';

const StakeAuthCompoundRequest = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home/Staking/components/StakeAuthCompoundRequest'));

interface Props extends ThemeProps {
  className?: string;
}

function filterValidDelegations (delegations: DelegationItem[]) {
  const filteredDelegations: DelegationItem[] = [];

  delegations.forEach((item) => {
    if (parseFloat(item.amount) > 0) {
      filteredDelegations.push(item);
    }
  });

  return filteredDelegations;
}

function StakeCompoundSubmitTransaction ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [showResult, setShowResult] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const [delegations, setDelegations] = useState<DelegationItem[] | undefined>(undefined);
  const [selectedCollator, setSelectedCollator] = useState<string>('');
  const [accountMinimum, setAccountMinimum] = useState('0');
  const [showAuth, setShowAuth] = useState(false);
  const { currentAccount: { account }, stakeCompoundParams: { selectedAccount, selectedNetwork } } = useSelector((state: RootState) => state);
  const navigate = useContext(ActionContext);

  useEffect(() => {
    if (account?.address !== selectedAccount) {
      navigate('/');
    }
  }, [account?.address, navigate, selectedAccount]);

  const networkJson = useGetNetworkJson(selectedNetwork);

  useEffect(() => {
    getStakeDelegationInfo({
      address: selectedAccount,
      networkKey: selectedNetwork
    }).then((result) => {
      const filteredDelegations = filterValidDelegations(result);

      setDelegations(filteredDelegations);
      setSelectedCollator(filteredDelegations[0].owner);
      setIsDataReady(true);
    }).catch(console.error);

    return () => {
      setDelegations(undefined);
      setSelectedCollator('');
      setIsDataReady(false);
    };
  }, [selectedAccount, selectedNetwork]);

  const handleSelectValidator = useCallback((val: string) => {
    if (delegations) {
      for (const item of delegations) {
        if (item.owner === val) {
          setSelectedCollator(val);
          break;
        }
      }
    }
  }, [delegations]);

  const handleUpdateAccountMinimum = useCallback((value: BN | string) => {
    if (!value) {
      return;
    }

    if (value instanceof BN) {
      setAccountMinimum(value.toString());
    } else {
      setAccountMinimum(value);
    }
  }, []);

  return (
    <div className={className}>
      <Header
        isShowNetworkSelect={false}
        showCancelButton={false}
        showSubHeader
        subHeaderName={t<string>('Stake compounding')}
      />

      {!showResult && <div>
        {
          isDataReady
            ? <div className={'compound-auth-container'}>
              <InputAddress
                autoPrefill={false}
                className={'receive-input-address'}
                defaultValue={selectedAccount}
                help={t<string>('The account which you will compound the stake')}
                isDisabled={true}
                isSetDefaultValue={true}
                label={t<string>('Compound the stake from account')}
                networkPrefix={networkJson.ss58Format}
                type='allPlus'
                withEllipsis
              />

              {
                delegations && <ValidatorsDropdown
                  delegations={delegations}
                  handleSelectValidator={handleSelectValidator}
                  label={'Select a collator'}
                />
              }

              <div className={'stake-compound-input'}>
                <InputBalance
                  autoFocus
                  className={'submit-bond-amount-input'}
                  decimals={networkJson.decimals}
                  help={'The minimum balance that will be kept in your account'}
                  isError={false}
                  isZeroable={false}
                  label={t<string>('Compounding threshold')}
                  onChange={handleUpdateAccountMinimum}
                  placeholder={'0'}
                  siDecimals={networkJson.decimals}
                  siSymbol={networkJson.nativeToken}
                />
              </div>
            </div>
            : <Spinner className={'container-spinner'} />
        }
      </div>}

      {showAuth && !showResult &&
        <StakeAuthCompoundRequest
          accountMinimum={accountMinimum}
          address={selectedAccount}
          networkKey={selectedNetwork}
          selectedCollator={selectedCollator}
          setShowAuth={setShowAuth}
          setShowResult={setShowResult}
        />
      }
    </div>
  );
}

export default React.memo(styled(StakeCompoundSubmitTransaction)(({ theme }: Props) => `
  .container-spinner {
    height: 65px;
    width: 65px;
  }


`));
