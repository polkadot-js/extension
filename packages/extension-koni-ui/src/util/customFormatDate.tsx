// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

export const customFormatDate = (dateMilli: any, formatString: string) => {
  // #YYYY#: 4-digit year
  // #YY#: 2-digit year
  // #MMMM#: full month name
  // #MMM#: 3-letter month name
  // #MM#: 2-digit month number
  // #M#: month number
  // #DDDD#: full weekday name
  // #DDD#: 3-letter weekday name
  // #DD#: 2-digit day number
  // #D#: day number
  // #th#: day ordinal suffix
  // #hhhh#: 2-digit 24-based hour
  // #hhh#: military/24-based hour
  // #hh#: 2-digit hour
  // #h#: hour
  // #mm#: 2-digit minute
  // #m#: minute
  // #ss#: 2-digit second
  // #s#: second
  // #ampm#: "am" or "pm"
  // #AMPM#: "AM" or "PM"
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const time = new Date(dateMilli);
  let YYYY: any, YY: string, MMMM: string, MMM: string, MM: any, M: any, DDDD: any, DDD: any, DD: any, D: any,
    hhhh: any, hhh: any, hh: any, h: any, mm: any, m: any, ss: any, s: any, ampm: string, AMPM: string, dMod: any,
    th: any;

  // eslint-disable-next-line prefer-const,@typescript-eslint/restrict-plus-operands
  YY = ((YYYY = time.getFullYear()) + '').slice(-2);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,prefer-const,@typescript-eslint/restrict-plus-operands
  MM = (M = time.getMonth() + 1) < 10 ? ('0' + M) : M;
  // eslint-disable-next-line prefer-const
  MMM = (MMMM = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][M - 1]).substring(0, 3);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/restrict-plus-operands,prefer-const
  DD = (D = time.getDate()) < 10 ? ('0' + D) : D;
  // eslint-disable-next-line prefer-const
  DDD = (DDDD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][time.getDay()]).substring(0, 3);
  // eslint-disable-next-line prefer-const,eqeqeq
  th = (D >= 10 && D <= 20) ? 'th' : ((dMod = D % 10) == 1) ? 'st' : (dMod == 2) ? 'nd' : (dMod == 3) ? 'rd' : 'th';
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  formatString = formatString.replace('#YYYY#', YYYY).replace('#YY#', YY).replace('#MMMM#', MMMM).replace('#MMM#', MMM).replace('#MM#', MM).replace('#M#', M).replace('#DDDD#', DDDD).replace('#DDD#', DDD).replace('#DD#', DD).replace('#D#', D).replace('#th#', th);
  h = (hhh = time.getHours());

  // eslint-disable-next-line eqeqeq
  if (h == 0) {
    h = 24;
  }

  if (h > 12) {
    h -= 12;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/restrict-plus-operands,prefer-const
  hh = h < 10 ? ('0' + h) : h;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,prefer-const,@typescript-eslint/restrict-plus-operands
  hhhh = hhh < 10 ? ('0' + hhh) : hhh;
  // eslint-disable-next-line prefer-const
  AMPM = (ampm = hhh < 12 ? 'am' : 'pm').toUpperCase();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,prefer-const,@typescript-eslint/restrict-plus-operands
  mm = (m = time.getMinutes()) < 10 ? ('0' + m) : m;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,prefer-const,@typescript-eslint/restrict-plus-operands
  ss = (s = time.getSeconds()) < 10 ? ('0' + s) : s;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return formatString.replace('#hhhh#', hhhh).replace('#hhh#', hhh).replace('#hh#', hh).replace('#h#', h).replace('#mm#', mm).replace('#m#', m).replace('#ss#', ss).replace('#s#', s).replace('#ampm#', ampm).replace('#AMPM#', AMPM);
};
