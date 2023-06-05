// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import helpIcon from '../../assets/help.svg';
import { Button, ButtonArea, HelperFooter, Hero, LearnMore, Svg } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { LINKS } from '../../links';

type Props = {
  className?: string;
  onNextStep: () => void;
};

const WrapperRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
  width: 100%;
`;

const StyledFooter = styled(HelperFooter)`
  .icon {
    margin-bottom: 10px;
  }
`;

function SafetyFirst({ className, onNextStep }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const footer = (
    <StyledFooter>
      <WrapperRow>
        <Svg
          className='icon'
          src={helpIcon}
        />
        <span>
          {t<string>('Why it is critical to store your secret\nphrase in a safe place?')}&nbsp;
          <LearnMore href={LINKS.SAFETY} />
        </span>
      </WrapperRow>
    </StyledFooter>
  );

  return (
    <>
      <Hero
        className={className}
        headerText={t<string>('Safety first!')}
        iconType='lock'
      >
        {t<string>(
          "In the next step, you'll generate a secret phrase that allows you to access your account. Anyone who manages to access it will have a full control over your account,\nso read, save, and store it safely."
        )}
      </Hero>
      <ButtonArea footer={footer}>
        <Button
          onClick={window.close}
          secondary
        >
          {t<string>('Cancel')}
        </Button>
        <Button onClick={onNextStep}>{t<string>('Next')}</Button>
      </ButtonArea>
    </>
  );
}

export default React.memo(SafetyFirst);
