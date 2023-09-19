// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { LanguageType } from '@subwallet/extension-base/background/KoniTypes';

interface MonthDefine {
  full: string[];
  brief: string[];
  prefix: string;
  suffix: string;
}

interface DayDefine {
  full: string[];
  brief: string[];
  prefix: string;
  suffix: string;
}

interface YearDefine {
  prefix: string;
  suffix: string;
}

interface TimeDefine {
  month: MonthDefine;
  day: DayDefine;
  year: YearDefine;
}

interface PartTimeDefine {
  month?: Partial<MonthDefine>;
  day?: Partial<DayDefine>;
  year?: Partial<YearDefine>;
}

const DEFAULT_TIME_DEFINE: TimeDefine = {
  month: {
    full: [],
    brief: [],
    prefix: '',
    suffix: ''
  },
  day: {
    full: [],
    brief: [],
    prefix: '',
    suffix: ''
  },
  year: {
    prefix: '',
    suffix: ''
  }
};

const mergeTimeDefine = (part: PartTimeDefine): TimeDefine => {
  const temp = Object.assign({}, DEFAULT_TIME_DEFINE);

  return {
    year: {
      ...temp.year,
      ...part?.year
    },
    month: {
      ...temp.month,
      ...part?.month
    },
    day: {
      ...temp.day,
      ...part?.day
    }
  };
};

const DEFAULT_LANGUAGE_TIME_DEFINE: Record<LanguageType, TimeDefine> = {
  en: mergeTimeDefine({
    month: {
      full: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    },
    day: {
      full: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    }
  }),
  vi: mergeTimeDefine({}),
  zh: mergeTimeDefine({
    year: {
      suffix: '年'
    },
    month: {
      suffix: '月'
    },
    day: {
      suffix: '日'
    }
  }),
  ja: mergeTimeDefine({
    year: {
      suffix: '年'
    },
    month: {
      suffix: '月'
    },
    day: {
      suffix: '日'
    }
  }),
  ru: mergeTimeDefine({}),
  th: mergeTimeDefine({}),
  ur: mergeTimeDefine({}),
  tr: mergeTimeDefine({}),
  pl: mergeTimeDefine({}),
  fr: mergeTimeDefine({})
};

// Reformat

DEFAULT_LANGUAGE_TIME_DEFINE.en.month.brief = DEFAULT_LANGUAGE_TIME_DEFINE.en.month.full.map((str) => str.substring(0, 3));
DEFAULT_LANGUAGE_TIME_DEFINE.en.day.brief = DEFAULT_LANGUAGE_TIME_DEFINE.en.day.full.map((str) => str.substring(0, 3));

export const customFormatDate = (dateMilli: string | number | Date, formatString: string, lang: LanguageType = 'en') => {
  // #sYYYYs#: 4-digit year with prefix and suffix
  // #YYYY#: 4-digit year
  // #YY#: 2-digit year
  // #MMMM#: full month name
  // #MMM#: 3-letter month name
  // #MM#: 2-digit month number
  // #M#: month number
  // #sMs#: month number with prefix and suffix
  // #DDDD#: full weekday name
  // #DDD#: 3-letter weekday name
  // #DD#: 2-digit day number
  // #D#: day number
  // #sDs#: day number with prefix and suffix
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

  const timeDefine = DEFAULT_LANGUAGE_TIME_DEFINE[lang] || DEFAULT_LANGUAGE_TIME_DEFINE.en;

  const YYYY = time.getFullYear().toString();
  const sYYYYs = timeDefine.year.prefix + YYYY + timeDefine.year.suffix;
  const YY = YYYY.slice(-2);

  const month = time.getMonth() + 1;
  const M = month.toString();
  const sMs = timeDefine.month.prefix + M + timeDefine.month.suffix;
  const MM = month < 10 ? ('0' + M) : M;
  const MMMM = timeDefine.month.full[month - 1] || '';
  const MMM = timeDefine.month.brief[month - 1] || '';

  const date = time.getDate();
  const D = date.toString();
  const sDs = timeDefine.day.prefix + D + timeDefine.day.suffix;
  const DD = D.toString().padStart(2, '0');
  const day = time.getDay();

  const DDDD = timeDefine.day.full[day] || '';
  const DDD = timeDefine.day.brief[day] || '';

  const dMod = date % 10;
  const th = (date >= 10 && date <= 20) ? 'th' : (dMod === 1) ? 'st' : (dMod === 2) ? 'nd' : (dMod === 3) ? 'rd' : 'th';

  formatString = formatString
    .replace('#sYYYYs#', sYYYYs)
    .replace('#YYYY#', YYYY)
    .replace('#YY#', YY)
    .replace('#MMMM#', MMMM)
    .replace('#MMM#', MMM)
    .replace('#MM#', MM)
    .replace('#M#', M)
    .replace('#sMs#', sMs)
    .replace('#DDDD#', DDDD)
    .replace('#DDD#', DDD)
    .replace('#DD#', DD)
    .replace('#D#', D)
    .replace('#sDs#', sDs)
    .replace('#th#', th);

  const hour = time.getHours();
  const hhh = hour.toString();
  const hourInHalf = hour === 0 ? 24 : hour > 12 ? hour - 12 : hour;
  const h = hourInHalf.toString();
  const hh = h.padStart(2, '0');
  const hhhh = hhh.padStart(2, '0');

  const ampm = hour < 12 ? 'am' : 'pm';
  const AMPM = ampm.toUpperCase();

  const minute = time.getMinutes();
  const m = minute.toString();
  const mm = m.padStart(2, '0');

  const second = time.getSeconds();
  const s = second.toString();
  const ss = s.padStart(2, '0');

  return formatString
    .replace('#hhhh#', hhhh)
    .replace('#hhh#', hhh)
    .replace('#hh#', hh)
    .replace('#h#', h)
    .replace('#mm#', mm)
    .replace('#m#', m)
    .replace('#ss#', ss)
    .replace('#s#', s)
    .replace('#ampm#', ampm)
    .replace('#AMPM#', AMPM);
};

export const formatHistoryDate = (dateMilli: string | number | Date, language: LanguageType, type: 'list' | 'detail'): string => {
  const now = new Date();
  const time = new Date(dateMilli);
  const sameYear = now.getFullYear() === time.getFullYear();

  if (type === 'list') {
    switch (language) {
      case 'vi':
      case 'ru':
        return customFormatDate(dateMilli, '#DD#/#MM#/#YYYY#', language);
      case 'zh':
      case 'ja':
        return sameYear ? customFormatDate(dateMilli, '#sMs# #sDs#', language) : customFormatDate(dateMilli, '#sYYYYs# #sMs# #sDs#', language);
      case 'en':
      default:
        return customFormatDate(dateMilli, '#MMM# #DD#, #YYYY#', 'en');
    }
  } else {
    switch (language) {
      case 'vi':
      case 'ru':
        return customFormatDate(dateMilli, '#hhhh#:#mm# - #DD#/#MM#/#YYYY#', language);
      case 'zh':
      case 'ja':
        return sameYear ? customFormatDate(dateMilli, '#hhhh#:#mm# - #sMs# #sDs#', language) : customFormatDate(dateMilli, '#hhhh#:#mm# - #sYYYYs# #sMs# #sDs#', language);
      case 'en':
      default:
        return customFormatDate(dateMilli, '#hhhh#:#mm# - #MMM# #DD#, #YYYY#', 'en');
    }
  }

  return customFormatDate(dateMilli, '#MMM# #DD#, #YYYY#', 'en');
};
