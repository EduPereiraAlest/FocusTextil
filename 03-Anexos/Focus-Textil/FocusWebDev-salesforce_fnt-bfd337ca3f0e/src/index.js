/* eslint angular/window-service: 0 */
/* eslint angular/definedundefined: 0 */

Object.defineProperty(Object.prototype, 'hass', {
  value: function(needle) {
    let obj = this || {};
    let needles = needle.split('.');

    for (let prop of needles) {
      if (!obj.hasOwnProperty(prop)) {
        return false;
      }
      obj = obj[prop];
    }
    return true;
  }
});

String.prototype.removeAccents = function() {
  const accents = 'ÀÁÂÃÄÅàáâãäåÒÓÔÕÕÖØòóôõöøÈÉÊËèéêëðÇçÐÌÍÎÏìíîïÙÚÛÜùúûüÑñŠšŸÿýŽž';
  const accentsOut = 'AAAAAAaaaaaaOOOOOOOooooooEEEEeeeeeCcDIIIIiiiiUUUUuuuuNnSsYyyZz';

  return this.split('')
    .map(letter => {
      let accentIndex = accents.indexOf(letter);

      return accentIndex === -1 ? letter : accentsOut[accentIndex];
    })
    .join('');
};

String.prototype.capitalize = function() {
  return this.toLowerCase().replace(/(^|\s)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());
};
String.prototype.replaceAll = function(find, replace) {
  return this.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace);
};
String.prototype.insert = function(what, index) {
  return index > 0 ? this.replace(new RegExp('.{' + index + '}'), '$&' + what) : what + this;
};

if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, 'includes', {
    enumerable: false,
    value: function(obj) {
      let newArr = this.filter(el => el === obj);

      return newArr.length > 0;
    }
  });
}

_.mixin({
  mergeBy: function mergeBy(arr, obj, idProp) {
    let index = _.findIndex(
      arr,
      elem => typeof elem[idProp] !== 'undefined' && elem[idProp] === obj[idProp]
    );

    if (index > -1) {
      _.extend(arr[index], obj);
    } else {
      arr.push(obj);
    }
    return arr;
  }
});

// CORDOVA;

window.addEventListener('load', function() {
  window.scrollTo(0, 0);
});

function hoverTouchUnstick() {
  if ('ontouchstart' in document.documentElement) {
    for (let sheet of document.styleSheets) {
      if (sheet && sheet.cssRules) {
        for (let rule of sheet.cssRules) {
          rule.selectorText = rule.selectorText
            ? rule.selectorText.replace(':hover', ':active')
            : rule.selectorText;
        }
      }
    }
  }
}

angular.module('app', [
  'ui.router',
  'ui.utils.masks',
  'loadingStatus',
  'rzModule',
  'ngDialog',
  'ngAnimate',
  'homePage',
  '720kb.datepicker',
  'swipe',
  'vs-repeat'
]);

// angular.module('app').run(function() {
//   FastClick.attach(document.body);
// });

let corReady = false;

angular.element(document).ready(function() {
  if (window.cordova) {
    console.log("Running in Cordova, will bootstrap AngularJS once 'deviceready' event fires.");
    document.addEventListener(
      'deviceready',
      function() {
        corReady = true;
        console.log('Deviceready event has fired, bootstrapping AngularJS.', corReady);
        angular.bootstrap(document.body, ['app']);
        hoverTouchUnstick();
      },
      false
    );
  } else {
    console.log('Running in browser, bootstrapping AngularJS now.');
    angular.bootstrap(document.body, ['app']);
  }
});
