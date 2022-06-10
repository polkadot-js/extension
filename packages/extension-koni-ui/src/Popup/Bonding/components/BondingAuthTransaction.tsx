// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { InputWithLabel, Warning } from '@subwallet/extension-koni-ui/components';
import Button from '@subwallet/extension-koni-ui/components/Button';
import Identicon from '@subwallet/extension-koni-ui/components/Identicon';
import Modal from '@subwallet/extension-koni-ui/components/Modal';
import ReceiverInputAddress from '@subwallet/extension-koni-ui/components/ReceiverInputAddress';
import Tooltip from '@subwallet/extension-koni-ui/components/Tooltip';
import { BalanceFormatType } from '@subwallet/extension-koni-ui/components/types';
import useGetFreeBalance from '@subwallet/extension-koni-ui/hooks/screen/bonding/useGetFreeBalance';
import useGetNetworkJson from '@subwallet/extension-koni-ui/hooks/screen/home/useGetNetworkJson';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { toShort } from '@subwallet/extension-koni-ui/util';
import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  setShowConfirm: (val: boolean) => void;
  validatorInfo: ValidatorInfo,
  selectedNetwork: string
}

// const validatorInfo: ValidatorInfo = {
//   address: '5GTD7ZeD823BjpmZBCSzBQp7cvHR1Gunq7oDkurZr9zUev2n',
//   blocked: true,
//   commission: 0,
//   expectedReturn: 22.56074522099225,
//   identity: 'Parity Westend validator 6',
//   isVerified: false,
//   minBond: 1,
//   nominatorCount: 2,
//   otherStake: 54635.096605487954,
//   ownStake: 11555.529114384852,
//   totalStake: 66190.6257198728
// };
//
// const selectedNetwork = 'westend';

function BondingAuthTransaction ({ className, selectedNetwork, setShowConfirm, validatorInfo }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const networkJson = useGetNetworkJson(selectedNetwork);
  const freeBalance = useGetFreeBalance(selectedNetwork);
  const balanceFormat: BalanceFormatType = [networkJson.decimals as number, networkJson.nativeToken as string, undefined];
  const { currentAccount: { account }, networkMap } = useSelector((state: RootState) => state);

  const [password, setPassword] = useState('');
  const [isKeyringErr, setKeyringErr] = useState<boolean>(false);
  const [errorArr, setErrorArr] = useState<string[]>([]);

  const renderError = () => {
    return errorArr.map((err) =>
      (
        <Warning
          className='auth-transaction-error'
          isDanger
          key={err}
        >
          {t<string>(err)}
        </Warning>
      )
    );
  };

  const _onChangePass = useCallback((value: string) => {
    setPassword(value);
    setErrorArr([]);
    setKeyringErr(false);
  }, []);

  const hideConfirm = useCallback(() => {
    setShowConfirm(false);
  }, [setShowConfirm]);

  const handleConfirm = useCallback(() => {
    console.log('ok');
  }, []);

  return (
    <div className={className}>
      <Modal>
        <div className={'header-confirm'}>
          {/* for alignment */}
          <div />
          <div
            className={'header-title-confirm'}
          >
            Authorize transaction
          </div>
          <div
            className={'close-button-confirm'}
            onClick={hideConfirm}
          >
            x
          </div>
        </div>

        <div className={'bonding-auth-container'}>
          <div className={'selected-validator'}>Selected Validator</div>

          <div className={'validator-item-container'}>
            <div className={'validator-header'}>
              <Identicon
                className='identityIcon'
                genesisHash={networkJson.genesisHash}
                prefix={networkJson.ss58Format}
                size={20}
                value={validatorInfo.address}
              />

              <div
                data-for={`identity-tooltip-${validatorInfo.address}`}
                data-tip={true}
              >
                {validatorInfo.identity ? validatorInfo.identity : toShort(validatorInfo.address)}
              </div>
              {
                validatorInfo.identity && <Tooltip
                  place={'top'}
                  text={toShort(validatorInfo.address)}
                  trigger={`identity-tooltip-${validatorInfo.address}`}
                />
              }
              {
                validatorInfo.isVerified && <FontAwesomeIcon
                  className={'validator-verified'}
                  data-for={`verify-tooltip-${validatorInfo.address}`}
                  data-tip={true}
                  icon={faCircleCheck}
                />
              }
              {
                validatorInfo.isVerified && <Tooltip
                  place={'top'}
                  text={'Verified'}
                  trigger={`verify-tooltip-${validatorInfo.address}`}
                />
              }
            </div>
            <div className={'validator-footer'}>
              <div
                className={'validator-expected-return'}
                data-for={`validator-return-tooltip-${validatorInfo.address}`}
                data-tip={true}
              >
                {validatorInfo.expectedReturn.toFixed(1)}%
              </div>
              <Tooltip
                place={'top'}
                text={'Expected return'}
                trigger={`validator-return-tooltip-${validatorInfo.address}`}
              />
            </div>
          </div>

          <ReceiverInputAddress
            balance={freeBalance}
            balanceFormat={balanceFormat}
            className={'auth-bonding__input-address'}
            defaultAddress={account?.address}
            inputAddressHelp={'The account which you will stake with'}
            inputAddressLabel={'Stake with account'}
            isDisabled={true}
            isSetDefaultValue={true}
            networkKey={selectedNetwork}
            networkMap={networkMap}
          />

          <div className={'transaction-info-container'}>
            <div className={'transaction-info-row'}>
              <div className={'transaction-info-title'}>Staking amount</div>
              <div className={'transaction-info-value'}>20 DOT</div>
            </div>

            <div className={'transaction-info-row'}>
              <div className={'transaction-info-title'}>Staking fee</div>
              <div className={'transaction-info-value'}>0.00156 DOT</div>
            </div>

            <div className={'transaction-info-row'}>
              <div className={'transaction-info-title'}>Total</div>
              <div className={'transaction-info-value'}>20 DOT + 0.00156 DOT</div>
            </div>
          </div>

          <div className='bonding-auth__separator' />

          <InputWithLabel
            isError={isKeyringErr}
            label={t<string>('Unlock account with password')}
            onChange={_onChangePass}
            type='password'
            value={password}
          />

          {!!(errorArr && errorArr.length) && renderError()}

          <div className={'bonding-auth-btn-container'}>
            <Button
              className={'bonding-auth-cancel-button'}
              onClick={hideConfirm}
            >
              Reject
            </Button>
            <Button
              onClick={handleConfirm}
            >
              Confirm
            </Button>
          </div>
        </div>

      </Modal>
    </div>
  );
}

export default React.memo(styled(BondingAuthTransaction)(({ theme }: Props) => `
  .bonding-auth-cancel-button {
    color: ${theme.textColor3};
    background: ${theme.buttonBackground1};
  }

  .bonding-auth-btn-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
  }

  .bonding-auth__separator {
    margin-top: 30px;
    margin-bottom: 18px;
  }

  .bonding-auth__separator:before {
    content: "";
    height: 1px;
    display: block;
    background: ${theme.boxBorderColor};
  }

  .transaction-info-container {
    margin-top: 20px;
    width: 100%;
  }

  .transaction-info-row {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .transaction-info-title {
    font-weight: 500;
    font-size: 15px;
    line-height: 26px;
    color: ${theme.textColor2};
  }

  .transaction-info-value {
    font-weight: 500;
    font-size: 15px;
    line-height: 26px;
  }

  .selected-validator {
    font-weight: 500;
    font-size: 18px;
    line-height: 28px;
    margin-top: 5px;
  }

  .bonding-auth-container {
    padding-left: 15px;
    padding-right: 15px;
  }

  .validator-expected-return {
    font-size: 14px;
    color: ${theme.textColor3};
  }

  .validator-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }

  .validator-header {
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .identityIcon {
    border: 2px solid ${theme.checkDotColor};
  }
  .validator-item-container {
    margin-top: 10px;
    margin-bottom: 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: ${theme.backgroundAccountAddress};
    padding: 10px 15px;
    border-radius: 8px;
    gap: 10px;
  }

  .close-button-confirm {
    font-size: 20px;
    cursor: pointer;
  }

  .header-title-confirm {
    width: 85%;
    text-align: center;
  }

  .header-confirm {
    width: 100%;
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 24px;
    font-weight: 500;
    line-height: 36px;
    font-style: normal;
    box-shadow: ${theme.headerBoxShadow};
    padding-top: 20px;
    padding-bottom: 20px;
    padding-left: 15px;
    padding-right: 15px;
  }

  .close-button-confirm {
    font-size: 20px;
    cursor: pointer;
  }

  .subwallet-modal {
    max-width: 460px;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    border-radius: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid ${theme.extensionBorder};
  }
`));
