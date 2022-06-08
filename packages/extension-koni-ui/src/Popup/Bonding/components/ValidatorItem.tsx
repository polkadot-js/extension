// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import Button from '@subwallet/extension-koni-ui/components/Button';
import Identicon from '@subwallet/extension-koni-ui/components/Identicon';
import Tooltip from '@subwallet/extension-koni-ui/components/Tooltip';
import useGetNetworkJson from '@subwallet/extension-koni-ui/hooks/screen/home/useGetNetworkJson';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { toShort } from '@subwallet/extension-koni-ui/util';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  validatorInfo: ValidatorInfo,
  networkKey: string
}

function ValidatorItem ({ className, networkKey, validatorInfo }: Props): React.ReactElement<Props> {
  const networkJson = useGetNetworkJson(networkKey);
  const [showDetail, setShowDetail] = useState(false);

  const handleOnClick = useCallback(() => {
    setShowDetail(!showDetail);
  }, [showDetail]);

  return (
    <div className={className}>
      <div
        className={'validator-item-container'}
        onClick={handleOnClick}
      >
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
            text={'Expected returns'}
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

      {
        showDetail && <div className={'validator-detail-container'}>
          <div className={'validator-att-container'}>
            <div className={'validator-att'}>
              <div className={'validator-att-title'}>Total stake</div>
              <div className={'validator-att-value'}>{validatorInfo.totalStake}</div>
            </div>

            <div className={'validator-att'}>
              <div className={'validator-att-title'}>Own stake</div>
              <div className={'validator-att-value'}>{validatorInfo.ownStake}</div>
            </div>
          </div>

          <div className={'validator-att-container'}>
            <div className={'validator-att'}>
              <div className={'validator-att-title'}>Nominator count</div>
              <div className={'validator-att-value'}>{validatorInfo.nominatorCount}</div>
            </div>

            <div className={'validator-att'}>
              <div className={'validator-att-title'}>Commission</div>
              <div className={'validator-att-value'}>{validatorInfo.commission}</div>
            </div>
          </div>

          <Button className={'staking-button'}>
            Start staking
          </Button>
        </div>
      }
    </div>
  );
}

export default React.memo(styled(ValidatorItem)(({ theme }: Props) => `
  background: ${theme.accountAuthorizeRequest};

  .validator-verified {
    color: ${theme.textColor3};
    font-size: 12px;
  }

  .validator-att-title {
    color: ${theme.textColor2};
    font-size: 14px;
  }

  .validator-att-value {
    color: ${theme.textColor3};
    font-size: 14px;
  }

  .staking-button {
    margin-top: 10px;
    margin-bottom: 10px;
    width: 50%;
  }

  .validator-att-container {
    width: 100%;
    margin-bottom: 15px;
    display: flex;
    gap: 20px;
  }

  .validator-att {
    width: 50%;
  }

  .validator-detail-container {
    background: ${theme.accountAuthorizeRequest};
    padding: 10px 15px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  .validator-expected-return {
    font-size: 14px;
    color: ${theme.textColor3};
  }

  .validator-item-toggle {
    border-style: solid;
    border-width: 0 2px 2px 0;
    display: inline-block;
    padding: 2.5px;
  }

  .validator-item-toggle-container {
    display: flex;
    align-items: center;
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
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: ${theme.backgroundAccountAddress};
    padding: 10px 15px;
    border-radius: 8px;
    gap: 10px;
  }
`));
