(function() {
  'use strict';
  angular.module('app').directive('checkCnpj', checkCnpj);

  /* @ngInject */
  function checkCnpj(dataService, localService) {
    return {
      link: link,
      require: 'ngModel',
      restrict: 'A'
    };

    function link(scope, element, attrs, ctrl) {
      function verifyCnpj(cnpj) {
        return cnpj
          ? dataService.postData('VerifyCnpj', { CnpjCli: cnpj }).then(({ Results }) => {
              element.removeAttr('disabled');
              return Results === 'OK' ? ctrl.$setValidity('usedCpnj', true) : false;
            }, checkError)
          : (element.removeAttr('disabled'), console.log('null'));
      }

      function checkError(res) {
        element.removeAttr('disabled');
        localService.errorHandler(res);
        return ctrl.$setValidity('usedCpnj', false);
      }

      element.on('blur', () => {
        if (ctrl.$modelValue) {
          element.attr('disabled', '');
          verifyCnpj(ctrl.$modelValue);
          return scope.$apply();
        }
        return false;
      });

      element.on('keydown keypress', event => (event.which === 13 ? event.target.blur() : false));
    }
  }
})();
