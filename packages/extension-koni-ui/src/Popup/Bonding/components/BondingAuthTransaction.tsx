// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Modal from '@subwallet/extension-koni-ui/components/Modal';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, {useCallback, useState} from 'react';
import styled from 'styled-components';
import Identicon from "@subwallet/extension-koni-ui/components/Identicon";
import {toShort} from "@subwallet/extension-koni-ui/util";
import Tooltip from "@subwallet/extension-koni-ui/components/Tooltip";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCircleCheck} from "@fortawesome/free-solid-svg-icons";
import useGetNetworkJson from "@subwallet/extension-koni-ui/hooks/screen/home/useGetNetworkJson";

interface Props extends ThemeProps {
  className?: string;
  setShowConfirm: (val: boolean) => void;
}

const validatorInfo: ValidatorInfo = {
  address: '5GTD7ZeD823BjpmZBCSzBQp7cvHR1Gunq7oDkurZr9zUev2n',
  blocked: true,
  commission: 0,
  expectedReturn: 22.56074522099225,
  identity: 'Parity Westend validator 6',
  isVerified: false,
  minBond: 1,
  nominatorCount: 2,
  otherStake: 54635.096605487954,
  ownStake: 11555.529114384852,
  totalStake: 66190.6257198728
};

const networkKey = 'westend';

function BondingAuthTransaction ({ className, setShowConfirm }: Props): React.ReactElement<Props> {
  const [loading, setLoading] = useState(false);
  const networkJson = useGetNetworkJson(networkKey);

  const hideConfirm = useCallback(() => {
    if (!loading) {
      setShowConfirm(false);
    }
  }, [loading, setShowConfirm]);

  return (
    <div className={className}>
      <Modal>
        <div className={'header-confirm'}>
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

            <div className={'validator-item-toggle-container'}>
              <div
                className={'validator-item-toggle'}
                style={{ transform: showDetail ? 'rotate(45deg)' : 'rotate(-45deg)' }}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default React.memo(styled(BondingAuthTransaction)(({ theme }: Props) => `
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
