// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useEffect } from 'react';
import styled from 'styled-components';

import Hero from './Hero/Hero';

type Props = {
  text: string;
};

const Success = ({ text }: Props) => {
  useEffect(() => {
    const timeoutId = setTimeout(window.close, 2000);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <Container>
      <Hero
        headerText={text}
        iconType='success'
      />
    </Container>
  );
};

export default Success;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 150px;
`;
