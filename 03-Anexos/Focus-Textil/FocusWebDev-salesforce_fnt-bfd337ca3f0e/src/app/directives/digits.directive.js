(function() {
  'use strict';
  angular.module('app').directive('onlyDigits', onlyDigits);
  function onlyDigits() {
    return {
      require: 'ngModel',
      restrict: 'A',
      link: (scope, element, attr, ctrl) => {
        element.attr('pattern', '[0-9]*');
        const inputValue = val => {
          if (val) {
            const digits = parseInt(val, 10);

            if (digits !== val) {
              ctrl.$setViewValue(digits);
              ctrl.$render();
            }
            return digits;
          }
          return null;
        };

        ctrl.$parsers.push(inputValue);
      }
    };
  }
})();
