// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { canDerive } from '@subwallet/extension-base/utils';
import { AccountContext, Button, Label } from '@subwallet/extension-koni-ui/components';
import RadioStatus from '@subwallet/extension-koni-ui/components/RadioStatus';
import RequireMigratePassword from '@subwallet/extension-koni-ui/components/Signing/RequireMigratePassword';
import useNeedMigratePassword from '@subwallet/extension-koni-ui/hooks/useNeedMigratePassword';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { EVM_ACCOUNT_TYPE } from '@subwallet/extension-koni-ui/Popup/CreateAccount';
import AddressDropdown from '@subwallet/extension-koni-ui/Popup/Derive/AddressDropdown';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useCallback, useContext, useMemo } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  parentAddress: string;
  setParentAddress: (address: string) => void;
  autoPath: boolean;
  setAutoPath: (val: boolean) => void;
  setStep: (val: number) => void;
}

const SelectParent = ({ autoPath, className, parentAddress, setAutoPath, setParentAddress, setStep }: Props) => {
  const { t } = useTranslation();
  const needMigratePassword = useNeedMigratePassword(parentAddress);

  const { accounts } = useContext(AccountContext);

  const allAddresses = useMemo(
    () => accounts
      .filter(({ isExternal }) => !isExternal)
      .filter(({ isMasterAccount, type }) => canDerive(type) && (type !== EVM_ACCOUNT_TYPE || (isMasterAccount && type === EVM_ACCOUNT_TYPE)))
      .map(({ address, genesisHash }): [string, string | null] => [address, genesisHash || null]),
    [accounts]
  );

  const onSelectAutoPath = useCallback(() => {
    setAutoPath(true);
  }, [setAutoPath]);

  const onSelectCustomPath = useCallback(() => {
    setAutoPath(false);
  }, [setAutoPath]);

  const onNextStep = useCallback(() => {
    setStep(2);
  }, [setStep]);

  return (
    <div className={CN(className)}>
      <div className={CN('body-container')}>
        <div className='derive-account'>
          <Label label={t<string>('Choose Parent Account:')}>
            <AddressDropdown
              allAddresses={allAddresses}
              onSelect={setParentAddress}
              selectedAddress={parentAddress}
            />
          </Label>
        </div>
        <div
          className={CN('select-row')}
          onClick={onSelectAutoPath}
        >
          <RadioStatus
            checked={autoPath}
            className='account-info-item__radio-btn'
            onChange={onSelectAutoPath}
          />
          <div className={CN('select-label')}>Auto generate derivation path</div>
        </div>
        <div
          className={CN('select-row')}
          onClick={onSelectCustomPath}
        >
          <RadioStatus
            checked={!autoPath}
            className='account-info-item__radio-btn'
          />
          <div className={CN('select-label')}>Custom derivation path</div>
        </div>
      </div>
      <div className={CN('footer-container')}>
        <RequireMigratePassword address={parentAddress} />
        <Button
          className='next-step-btn'
          data-button-action='create derived account'
          isDisabled={!parentAddress || needMigratePassword}
          onClick={onNextStep}
        >
          {t<string>('Create a derived account')}
        </Button>
      </div>
    </div>
  );
};

export default React.memo(styled(SelectParent)(({ theme }: Props) => `
  padding: 25px 15px 15px;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;

  .next-step-btn {
    > .children {
      display: flex;
      align-items: center;
      position: relative;
      justify-content: center;
    }
  }

  .select-parent-warning {
    margin-top: 10px;
  }

  .body-container {
    flex: 1;
    position: relative;
    padding: 0 15px;
    margin: 0 -15px;
    border-bottom: solid 1px ${theme.boxBorderColor};
  }

  .footer-container {
    margin: 20px 0 5px;
  }

  .select-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    cursor: pointer;
    width: fit-content;

    .select-label {
      margin-left: 8px;
    }
  }
`));
