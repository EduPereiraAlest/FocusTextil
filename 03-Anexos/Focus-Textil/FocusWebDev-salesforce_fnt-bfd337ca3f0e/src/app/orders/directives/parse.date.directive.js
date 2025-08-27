/* global utils:true */
(function() {
  'use strict';
  angular.module('app').directive('parseDate', parseDate);

  function parseDate() {
    return {
      require: 'ngModel',
      link: link,
      restrict: 'A'
    };

    function link(scope, element, attrs, ngModel) {
      ngModel.$formatters.push(utils.helpers.parseStringDate);
    }
  }
})();
