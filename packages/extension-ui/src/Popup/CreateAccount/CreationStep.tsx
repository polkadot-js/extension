// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '../../types';

import React from 'react';
import styled from 'styled-components';

import { ActionText, Title } from '../../components';
import useTranslation from '../../hooks/useTranslation';

interface Props {
  step: number;
  onClick: () => void;
  className?: string;
}

function CreationStep ({ className, onClick, step }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <div className={className}>
      <div>
        <CreateAnAccount />
        <CurrentStep>{step}</CurrentStep>
        <TotalSteps>/2</TotalSteps>
      </div>
      <ActionText
        onClick={onClick}
        text={step === 1 ? t('Cancel') : t('Back')}
      />
    </div>
  );
}

// FIXME i18n
const CreateAnAccount = styled(Title).attrs(() => ({
  children: 'Create an account:'
}))`
  display: inline;
  margin-right: 10px;
`;

const CurrentStep = styled.span`
  font-size: ${({ theme }: ThemeProps): string => theme.labelFontSize};
  line-height: ${({ theme }: ThemeProps): string => theme.labelLineHeight};
  color: ${({ theme }: ThemeProps): string => theme.primaryColor};
  font-weight: 600;
`;

const TotalSteps = styled.span`
  font-size: ${({ theme }: ThemeProps): string => theme.labelFontSize};
  line-height: ${({ theme }: ThemeProps): string => theme.labelLineHeight};
  color: ${({ theme }: ThemeProps): string => theme.textColor};
  font-weight: 600;
`;

export default styled(CreationStep)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 17px;
`;
