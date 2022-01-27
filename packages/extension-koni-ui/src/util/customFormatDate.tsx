// [object Object]
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
  const time = new Date(dateMilli);
  let YYYY: any, YY: string, MMMM: string, MMM: string, MM: any, M: any, DDDD: any, DDD: any, DD: any, D: any,
    hhhh: any, hhh: any, hh: any, h: any, mm: any, m: any, ss: any, s: any, ampm: string, AMPM: string, dMod: any,
    th: any;

  YY = ((YYYY = time.getFullYear()) + '').slice(-2);
  MM = (M = time.getMonth() + 1) < 10 ? ('0' + M) : M;
  MMM = (MMMM = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][M - 1]).substring(0, 3);
  DD = (D = time.getDate()) < 10 ? ('0' + D) : D;
  DDD = (DDDD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][time.getDay()]).substring(0, 3);
  th = (D >= 10 && D <= 20) ? 'th' : ((dMod = D % 10) == 1) ? 'st' : (dMod == 2) ? 'nd' : (dMod == 3) ? 'rd' : 'th';
  formatString = formatString.replace('#YYYY#', YYYY).replace('#YY#', YY).replace('#MMMM#', MMMM).replace('#MMM#', MMM).replace('#MM#', MM).replace('#M#', M).replace('#DDDD#', DDDD).replace('#DDD#', DDD).replace('#DD#', DD).replace('#D#', D).replace('#th#', th);
  h = (hhh = time.getHours());
  if (h == 0) h = 24;
  if (h > 12) h -= 12;
  hh = h < 10 ? ('0' + h) : h;
  hhhh = hhh < 10 ? ('0' + hhh) : hhh;
  AMPM = (ampm = hhh < 12 ? 'am' : 'pm').toUpperCase();
  mm = (m = time.getMinutes()) < 10 ? ('0' + m) : m;
  ss = (s = time.getSeconds()) < 10 ? ('0' + s) : s;

  return formatString.replace('#hhhh#', hhhh).replace('#hhh#', hhh).replace('#hh#', hh).replace('#h#', h).replace('#mm#', mm).replace('#m#', m).replace('#ss#', ss).replace('#s#', s).replace('#ampm#', ampm).replace('#AMPM#', AMPM);
};
