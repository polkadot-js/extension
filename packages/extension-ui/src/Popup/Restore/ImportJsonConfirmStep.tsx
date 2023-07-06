// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ResponseJsonGetAccountInfo } from '@polkadot/extension-base/background/types';
import type { ThemeProps } from '../../types';

import React, { FormEvent, useCallback, useId, useMemo, useState } from 'react';
import styled from 'styled-components';

import {
  Address,
  BackButton,
  Button,
  ButtonArea,
  Checkbox,
  FileNameDisplay,
  Input,
  InputWithLabel,
  Label,
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
  onNextStep: (jsonSignatureMissing: boolean) => void;
  accountsInfo: ResponseJsonGetAccountInfo[];
  requirePassword: boolean;
  isBusy: boolean;
  isPasswordError: boolean;
  onChangePass: (pass: string) => void;
  fileName: string;
}

function ImportJsonConfirmStep({
  accountsInfo,
  className,
  fileName,
  isBusy,
  isPasswordError,
  onChangePass,
  onNextStep,
  onPreviousStep,
  requirePassword
}: Props): React.ReactElement {
  const { t } = useTranslation();

  const formId = useId();

  const [isDisabled, setIsDisabled] = useState<boolean>(true);
  const [isExportFromA0Signer, setIsExportFromA0Signer] = useState(true);

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

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    onNextStep(!isExportFromA0Signer);
  };

  return (
    <>
      <ScrollWrapper>
        <form
          className={className}
          id={formId}
          onSubmit={onSubmit}
        >
          <FileNameDisplay fileName={fileName} />
          {accountsInfo.map(({ address, genesisHash, name, type = DEFAULT_TYPE }, index) => (
            <StyledAddress
              address={address}
              genesisHash={genesisHash}
              key={`${index}:${address}`}
              name={name}
              type={type}
            />
          ))}
          {requirePassword && (
            <>
              <PasswordContainer className={`${isPasswordError ? 'error' : ''}`}>
                <ValidatedInput
                  component={InputWithLabel}
                  isError={isPasswordError}
                  label={t<string>('Password')}
                  onValidatedChange={_onChangePass}
                  type='password'
                  validator={isPasswordValid}
                />
                {isPasswordError && (
                  <StyledWarning
                    isBelowInput
                    isDanger
                  >
                    {t<string>('Unable to decode using the supplied passphrase.')}
                  </StyledWarning>
                )}
              </PasswordContainer>
              <div>
                <Checkbox
                  checked={isExportFromA0Signer}
                  label={
                    <>
                      {t('The JSON has been exported from the Aleph Zero Signer.')}
                      <Hint>
                        {t(
                          `Uncheck only if the JSON has NOT been exported from the Aleph Zero Signer.
                             Unchecking turns off some additional safety measures that the Aleph Zero Signer
                             introduces and is only available for compatibility with other extensions.`
                        )}
                      </Hint>
                    </>
                  }
                  onChange={setIsExportFromA0Signer}
                />
              </div>
            </>
          )}
        </form>
      </ScrollWrapper>
      <VerticalSpace />
      <ButtonArea>
        <BackButton onClick={onPreviousStep} />
        <Button
          form={formId}
          isBusy={isBusy}
          isDisabled={isDisabled}
          type='submit'
        >
          {t<string>('Import')}
        </Button>
      </ButtonArea>
    </>
  );
}

const StyledAddress = styled(Address)`
  && {
    width: 100%;
  }

  margin-bottom: 16px;
`;

const PasswordContainer = styled.div`
  margin-top: 24px;
  margin-bottom: 24px;
`;

const StyledWarning = styled(Warning)`
  margin-top: 8px;
`;

const Hint = styled.span`
  display: block;
  font-size: 12px;
  line-height: 1.2;
  letter-spacing: 0.06em;
  color: ${({ theme }: ThemeProps) => theme.subTextColor};
  opacity: 0.6;
  margin-top: 5px;
`;

export default styled(ImportJsonConfirmStep)`
    ${Label}:not(.label) {
      width: 100%;
    }
    .error {
      ${ValidatedInput} ${Input} {
        border: 1px solid ${({ theme }: ThemeProps) => theme.dangerBackground};
      }
    }
`;
