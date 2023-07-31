import React from 'react';
import styled from 'styled-components';

type Props = {
  className?: string;
  title: string;
  text: React.ReactNode;
};

const Header = ({ className, text, title }: Props) => (
  <Container className={className}>
    <Title>{title}</Title>
    <Text>{text}</Text>
  </Container>
);

const Container = styled.header`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  text-align: center;
`;

const Title = styled.h2`
  font-family: ${({ theme }) => theme.secondaryFontFamily};
  color: ${({ theme }) => theme.textColor};
  font-weight: 500;
  font-size: 16px;
  line-height: 125%;
  letter-spacing: 0.06em;
  margin: 0;
`;

const Text = styled.div`
  color: ${({ theme }) => theme.subTextColor};
  font-size: 14px;
  line-height: 145%;
  letter-spacing: 0.07em;
  white-space: pre-line;
`;

export default Header;
