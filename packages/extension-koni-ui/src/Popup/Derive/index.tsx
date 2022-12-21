// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { HeaderWithSteps } from '@subwallet/extension-koni-ui/partials';
import AutoPath from '@subwallet/extension-koni-ui/Popup/Derive/AutoPath';
import ConfirmDerive from '@subwallet/extension-koni-ui/Popup/Derive/ConfirmDerive';
import CustomPath from '@subwallet/extension-koni-ui/Popup/Derive/CustomPath';
import SelectParent from '@subwallet/extension-koni-ui/Popup/Derive/SelectParent';
import { DeriveAccount } from '@subwallet/extension-koni-ui/types/derive';
import CN from 'classnames';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

interface Props {
  className?: string;
}

function Derive ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const [step, setStep] = useState(1);
  const [autoPath, setAutoPath] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [parentAddress, setParentAddress] = useState('');
  const [deriveAccounts, setDeriveAccounts] = useState<DeriveAccount[]>([]);

  const onBackClick = useCallback(() => {
    setStep((val) => val - 1);
  }, []);

  return (
    <div className={className}>
      <HeaderWithSteps
        isBusy={isBusy}
        maxStep={3}
        onBackClick={onBackClick}
        showStep={false}
        step={step}
        text={t<string>('Derive account')}
      />
      {
        step === 1 && (
          <SelectParent
            autoPath={autoPath}
            parentAddress={parentAddress}
            setAutoPath={setAutoPath}
            setParentAddress={setParentAddress}
            setStep={setStep}
          />
        )
      }
      {
        step > 1 && (
          autoPath
            ? (
              <AutoPath
                className={CN({ 'd-none': step !== 2 })}
                isBusy={isBusy}
                parentAddress={parentAddress}
                setDeriveAccounts={setDeriveAccounts}
                setIsBusy={setIsBusy}
                setStep={setStep}
              />
            )
            : (
              <CustomPath
                className={CN({ 'd-none': step !== 2 })}
                isBusy={isBusy}
                parentAddress={parentAddress}
                setDeriveAccounts={setDeriveAccounts}
                setIsBusy={setIsBusy}
                setStep={setStep}
              />
            )
        )
      }
      {
        step === 3 && (
          <ConfirmDerive
            deriveAccounts={deriveAccounts}
            isBusy={isBusy}
            parentAddress={parentAddress}
            setIsBusy={setIsBusy}
            setStep={setStep}
          />
        )
      }
    </div>
  );
}

export default styled(React.memo(Derive))`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;

  .d-none {
    display: none !important;
  }
`;
