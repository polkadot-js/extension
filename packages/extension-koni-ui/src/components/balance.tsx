import BigN from 'bignumber.js'
import React from 'react'

type BalanceViewProps = {
  value: string | BigN
  symbol?: string
  startWithSymbol?: boolean
  withComma?: boolean
  withSymbol?: boolean
}

export const BalanceVal = ({ value, symbol, startWithSymbol = false, withComma = true, withSymbol = true }: BalanceViewProps) => {
  let [prefix, postfix] = value.toString().split('.')
  if (startWithSymbol) {
    postfix = postfix?.substring(0, 3)
  } else {
    postfix = postfix?.substring(0, 4)
  }

  const lastSymbol = postfix?.slice(-1)
  const isString = /^[KMB]/.test(lastSymbol)

  const postfixValue = postfix || '00'

  const symbolView = prefix && <span className='kn-balance-val__symbol'>{symbol}</span>
  return (
    <span className='kn-balance-val'>
      {startWithSymbol && withSymbol && symbolView}<span className='kn-balance-val__prefix'>{withComma ? new Intl.NumberFormat().format(Number(prefix)) : prefix}</span>

      .<span className='kn-balance-val__postfix'>
        {isString ? postfixValue.slice(0, -1) : postfixValue}
      </span>
      {isString && lastSymbol}
      <> {!startWithSymbol && withSymbol && symbolView}</>
    </span>
  )
}
