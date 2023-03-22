// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ResponseJsonGetAccountInfo } from '@polkadot/extension-base/background/types';
import type { ThemeProps } from '../../types';

import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';

import viewOff from '../../assets/viewOff.svg';
import viewOn from '../../assets/viewOn.svg';
import {
  Address,
  BackButton,
  Button,
  ButtonArea,
  FileNameDisplay,
  Input,
  InputWithLabel,
  ScrollWrapper,
  ValidatedInput,
  VerticalSpace,
  Warning
} from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { DEFAULT_TYPE } from '../../util/defaultType';
import { isNotShorterThan } from '../../util/validators';

interface Props {
  className?: string;
  onPreviousStep: () => void;
  onNextStep: () => void;
  accountsInfo: ResponseJsonGetAccountInfo[];
  requirePassword: boolean;
  isPasswordError: boolean;
  onChangePass: (pass: string) => void;
  fileName: string;
}

function ImportJsonConfirmStep({
  accountsInfo,
  className,
  fileName,
  isPasswordError,
  onChangePass,
  onNextStep,
  onPreviousStep,
  requirePassword
}: Props): React.ReactElement {
  const { t } = useTranslation();
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [isDisabled, setIsDisabled] = useState<boolean>(true);

  const _handleInputTypeChange = useCallback(() => {
    setIsPasswordVisible(!isPasswordVisible);
  }, [isPasswordVisible]);

  const MIN_LENGTH = 0;
  const isPasswordValid = useMemo(() => isNotShorterThan(MIN_LENGTH, t<string>('Password is too short')), [t]);

  const _onChangePass = useCallback(
    (pass: string) => {
      if (!onChangePass) {
        return;
      }

      if (!pass) {
        setIsDisabled(true);

        return;
      }

      onChangePass(pass);
      setIsDisabled(false);
    },
    [onChangePass]
  );

  return (
    <>
      <ScrollWrapper>
        <div className={className}>
          <FileNameDisplay fileName={fileName} />
          {accountsInfo.map(({ address, genesisHash, name, type = DEFAULT_TYPE }, index) => (
            <Address
              address={address}
              genesisHash={genesisHash}
              key={`${index}:${address}`}
              name={name}
              type={type}
            />
          ))}
          {requirePassword && (
            <div className={`${isPasswordError ? 'error' : ''}`}>
              <ValidatedInput
                component={InputWithLabel}
                isError={isPasswordError}
                label={t<string>('Password')}
                onValidatedChange={_onChangePass}
                showPasswordElement={
                  <div className='password-icon'>
                    <img
                      onClick={_handleInputTypeChange}
                      src={isPasswordVisible ? viewOn : viewOff}
                    />
                  </div>
                }
                type={isPasswordVisible ? 'text' : 'password'}
                validator={isPasswordValid}
              />
              {isPasswordError && (
                <Warning
                  isBelowInput
                  isDanger
                >
                  {t<string>('Unable to decode using the supplied passphrase')}
                </Warning>
              )}
            </div>
          )}
        </div>
      </ScrollWrapper>
      <VerticalSpace />
      <ButtonArea>
        <BackButton onClick={onPreviousStep} />
        <Button
          isDisabled={isDisabled}
          onClick={onNextStep}
        >
          {t<string>('Import')}
        </Button>
      </ButtonArea>
    </>
  );
}

export default styled(ImportJsonConfirmStep)`
    margin-top: 32px;

    .error {
      ${ValidatedInput} ${Input} {
        border: 1px solid ${({ theme }: ThemeProps) => theme.dangerBackground};
      }
    }
`;
