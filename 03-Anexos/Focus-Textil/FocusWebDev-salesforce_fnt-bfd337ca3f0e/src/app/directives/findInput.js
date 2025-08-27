(function() {
  'use strict';
  angular.module('app').directive('findInput', findInput);

  function findInput() {
    return {
      scope: {},
      replace: true,
      transclude: true,
      controller: findInputController,
      controllerAs: 'ctrl',
      bindToController: {
        model: '=',
        title: '@',
        info: '@',
        send: '&',
        focus: '&'
      },
      templateUrl: 'app/directives/findInput.html'
    };

    function findInputController() {}
  }
})();
