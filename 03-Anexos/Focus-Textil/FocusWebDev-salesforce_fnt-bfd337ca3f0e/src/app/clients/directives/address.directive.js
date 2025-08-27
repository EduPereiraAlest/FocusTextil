(function() {
  'use strict';
  angular.module('app').directive('checkAddress', checkAddress);

  /* @ngInject */
  function checkAddress(dataService, localService) {
    let old;

    return {
      link: link,
      require: 'ngModel',
      restrict: 'A'
    };

    function link(scope, element, attrs, ctrl) {
      const vm = scope.vm;

      function verifyCnpj(cnpj) {
        return cnpj
          ? dataService
              .postData('VerifyAddress', { CnpjCli: cnpj })
              .then(res => {
                let obj = {
                  Isento: true,
                  Exist: false
                };
                let kind = attrs.name.substr(-3).toLowerCase();
                let address = kind === 'rem' ? vm.addrem : vm.address[kind];

                element.removeAttr('disabled');

                if (res.Results.length) {
                  obj = res.Results[0].Master;
                  obj.Isento = obj.InscEstAdrCli === 'ISENTO';
                  obj.Exist = true;
                  obj.CepCli = obj.CepCli.replace(/[^0-9]/g, '');
                  obj.FoneAdr = obj.FoneAdr.replace(/[^0-9]/g, '');

                  _.extend(address, obj);
                } else {
                  obj.TpAdrCli = kind.toUpperCase();
                  _.extend(address, obj);
                  ctrl.$setValidity('usedCpnj', true);
                }
              }, checkError)
          : (element.removeAttr('disabled'), console.log('null'));
      }

      function checkError(res) {
        element.removeAttr('disabled');
        localService.errorHandler(res);
        return ctrl.$setValidity('usedCpnj', false);
      }

      element.on('blur', function() {
        if (ctrl.$modelValue !== old) {
          return (
            element.attr('disabled', ''),
            verifyCnpj(ctrl.$modelValue),
            scope.$apply()
          );
        }
        return false;
      });

      element.on('keydown keypress', function(event) {
        if (event.which === 13) {
          event.target.blur();
        }
      });
    }
  }
})();
