const utils = utils || {};

utils.helpers = {
  setScrollTop: (value = 0) => {
    let el = document.querySelector('.table tbody');

    if (el) {
      el.scrollTop = value;
    }
    return el;
  },
  getScrollTop: () => {
    let el = document.querySelector('.table tbody');

    return el.scrollTop;
  },
  deepGet: (obj, properties) => {
    // If we have reached an undefined/null property
    // then stop executing and return undefined.
    if (obj === undefined || obj === null) {
      return false;
    }

    // If the path array has no more elements, we've reached
    // the intended property and return its value.
    if (properties.length === 0) {
      return obj;
    }

    // Prepare our found property and path array for recursion
    let foundSoFar = obj[properties[0]];
    let remainingProperties = properties.slice(1);

    return utils.helpers.deepGet(foundSoFar, remainingProperties);
  },
  parseCurr: (value, digits = 2) => {
    return value
      ? Number(value)
          .toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: digits
          })
          .split('$')[1]
          .replace(/\s+/g, '')
      : value;
  },
  dispDate: (days = 0, date = new Date()) => {
    date.setDate(date.getDate() + days);
    return [('0' + date.getDate()).slice(-2), ('0' + (date.getMonth() + 1)).slice(-2)].join('/');
  },
  checkDate: date => {
    return +date || (date && date.includes('/')) ? date.replaceAll('-', '/') : '-';
  },
  parseDate: date => {
    return date ? [('0' + (date.getMonth() + 1)).slice(-2), date.getFullYear()].join('/') : '';
  },
  parseDateProgramada: date => {
    return date && Date.prototype.isPrototypeOf(date)
      ? [
          ('0' + date.getDate()).slice(-2),
          ('0' + (date.getMonth() + 1)).slice(-2),
          date.getFullYear()
        ].join('/')
      : '';    
  },
  parseFullDate: date => {
    return date && Date.prototype.isPrototypeOf(date)
      ? [
          ('0' + date.getDate()).slice(-2),
          ('0' + (date.getMonth() + 1)).slice(-2),
          date.getFullYear()
        ]
          .reverse()
          .join('')
      : '';
  },

  parseStringDate: str => {
    let date, parse;

    if (str && (parse = str.match(/^(\d{4})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$/))) {
      date = new Date(+parse[1], +parse[2] - 1, +parse[3]);
      if (date.getMonth() === Number(parse[2]) - 1) {
        return [
          ('0' + date.getDate()).slice(-2),
          ('0' + (date.getMonth() + 1)).slice(-2),
          date.getFullYear()
        ].join('/');
      }
    }
    return +str === 0 ? '' : str;
  }
};
