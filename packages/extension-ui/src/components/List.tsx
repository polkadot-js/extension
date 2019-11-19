import styled from 'styled-components';

export default styled.ul`
  list-style: none;
  padding-inline-start: 10px;
  padding-inline-end: 10px;
  text-indent: -22px;
  margin-left: 21px;  
  
  li {
    margin-bottom: 8px;
  }
    
  li::before {
    content: '\\2022';
    color: ${({ theme }): string => theme.primaryColor};
    font-size: 30px;
    font-weight: bold; 
    margin-right: 10px;
    vertical-align: -20%;
  }
`;
