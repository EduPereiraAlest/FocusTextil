(function() {
  'use strict';
  angular.module('app').directive('checkEqual', checkEqual);

  function checkEqual() {
    return {
      scope: {
        model: '=',
        click: '&',
        type: '@'
      },
      replace: true,
      link: link,
      templateUrl: 'app/clients/directives/checkEqual.html'
    };

    function link(scope, element) {
      scope.name = 'check' + scope.type;
      let box = element.parent().parent();

      scope.setEqual = () => {
        if (scope.model) {
          box.removeClass('active');
        }
        scope.click({ type: scope.type, flag: scope.model });
      };
    }
  }
})();
