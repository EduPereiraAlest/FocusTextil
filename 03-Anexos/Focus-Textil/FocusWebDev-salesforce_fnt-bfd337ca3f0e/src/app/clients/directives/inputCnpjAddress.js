(function() {
  'use strict';

  angular.module('app').directive('inputCnpjAddress', inputCnpjAddress);

  function inputCnpjAddress(dataService, localService) {
    return {
      scope: {
        model: '=ngModel',
        name: '@'
      },
      require: 'ngModel',
      replace: true,
      link: link,
      templateUrl: 'app/clients/directives/inputCnpjAddress.html'
    };

    function link(scope, element, attrs, ctrl) {
      let input = element.find('input');

      input.on('blur', () => {
        let value = ctrl.$modelValue.CnpjAdr;

        if (value) {
          element.attr('disabled', '');
          verifyCnpj(value);
          return scope.$apply();
        }
        return false;
      });

      input.on('keydown keypress', event => (event.which === 13 ? event.target.blur() : false));

      function verifyCnpj(cnpj) {
        return cnpj
          ? dataService.postData('VerifyAddress', { CnpjCli: cnpj }).then(({ Results }) => {
              let obj = {
                Isento: true,
                Exist: false
              };
              let kind = attrs.name.substr(-3).toLowerCase();
              let address = scope.model;

              element.removeAttr('disabled');

              if (Results.length) {
                obj = Results[0].Master;
                obj.Isento = obj.InscEstAdrCli === 'ISENTO';
                obj.Exist = true;
                obj.CepCli = obj.CepCli.replace(/[^0-9]/g, '');
                obj.FoneAdr = obj.FoneAdr.replace(/[^0-9]/g, '');
                obj.TpAdrCli = kind.toUpperCase();

                _.extend(address, obj);
              } else {
                obj.TpAdrCli = kind.toUpperCase();
                _.extend(address, obj);
                ctrl.$setValidity('usedCpnj', true);
              }
            }, checkError)
          : element.removeAttr('disabled');
      }

      function checkError(res) {
        element.removeAttr('disabled');
        localService.errorHandler(res);
        return ctrl.$setValidity('usedCpnj', false);
      }
    }
  }
})();
