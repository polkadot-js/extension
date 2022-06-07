// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { ActionContext, InputFilter } from '@subwallet/extension-koni-ui/components';
import Spinner from '@subwallet/extension-koni-ui/components/Spinner';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { getBondingOptions } from '@subwallet/extension-koni-ui/messaging';
import Header from '@subwallet/extension-koni-ui/partials/Header';
import ValidatorItem from '@subwallet/extension-koni-ui/Popup/Bonding/components/ValidatorItem';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
}

function BondingValidatorSelection ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { bondingParams } = useSelector((state: RootState) => state);
  const navigate = useContext(ActionContext);
  const [searchString, setSearchString] = useState('');
  const [loading, setLoading] = useState(true);
  const [allValidators, setAllValidators] = useState<ValidatorInfo[]>([]);

  const _onChangeFilter = useCallback((val: string) => {
    setSearchString(val);
  }, []);

  useEffect(() => {
    if (bondingParams.selectedNetwork === null) {
      navigate('/account/select-bonding-network');
    } else {
      getBondingOptions(bondingParams.selectedNetwork)
        .then((bondingOptionInfo) => {
          setAllValidators(bondingOptionInfo.validators);
          setLoading(false);
        })
        .catch(console.error);
    }
  }, []);

  return (
    <div className={className}>
      <Header
        showBackArrow
        showSubHeader
        subHeaderName={t<string>('Select a validator')}
        to='/account/select-bonding-network'
      >
        <div className={'bonding-input-filter-container'}>
          <InputFilter
            onChange={_onChangeFilter}
            placeholder={t<string>('Search validator...')}
            value={searchString}
            withReset
          />
        </div>
      </Header>

      <div className='bonding__button-area'>
        <div
          className='bonding__btn'
        >
          {t<string>('Verified validators')}
        </div>
        <div
          className='bonding__btn'
        >
          {t<string>('Sort by lowest commission')}
        </div>
        <div
          className='bonding__btn'
        >
          {t<string>('Sort by highest own stake')}
        </div>
      </div>

      <div className={'validator-list'}>
        {
          loading && <Spinner />
        }
        {
          !loading && allValidators.map((validator, index) => {
            return <ValidatorItem
              key={index}
              networkKey={bondingParams.selectedNetwork}
              validatorInfo={validator}
            />;
          })
        }
      </div>
    </div>
  );
}

export default React.memo(styled(BondingValidatorSelection)(({ theme }: Props) => `
  .bonding__btn {
    cursor: pointer;
    position: relative;
    font-size: 12px;
    color: ${theme.textColor2};
  }

  .bonding__btn:hover {
    color: ${theme.textColor3};
  }

  .bonding__button-area {
    display: flex;
    justify-content: flex-end;
    padding: 10px 15px;
    gap: 10px;
  }

  .bonding-input-filter-container {
    padding: 0 15px 12px;
  }

  .validator-list {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-left: 15px;
    padding-right: 15px;
    height: 300px;
    overflow-y: scroll;
  }
`));
