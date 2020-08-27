import styled from 'styled-components';

export const Label = styled.label`
  color: ${({ theme }) => theme.colors.highlightText};
  font-size: ${({ theme }) => theme.fontSizes.baseText};
`;
