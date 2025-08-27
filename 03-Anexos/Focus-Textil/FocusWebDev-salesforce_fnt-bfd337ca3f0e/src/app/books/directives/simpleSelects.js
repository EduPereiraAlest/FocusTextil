(function() {
  'use strict';
  angular.module('app').directive('selects', selects);

  function selects() {
    return {
      scope: {},
      replace: true,
      controller: selectsController,
      controllerAs: '$ctrl',
      bindToController: {
        model: '=',
        items: '=',
        onChange: '&',
        classes: '@',
        disabled: '@',
        firstOption: '@'
      },
      templateUrl: 'app/books/directives/simpleSelects.html'
    };

    /** @this selectsController */

    function selectsController($timeout) {
      this.asyncChange = () => {
        $timeout(() => {
          this.onChange();
        });
      };
    }
  }
})();
