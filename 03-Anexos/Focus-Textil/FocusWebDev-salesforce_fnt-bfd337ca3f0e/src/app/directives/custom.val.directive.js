(function() {
  'use strict';
  angular.module('app').directive('customValidate', customValidate);
  customValidate.$inject = ['rulesService', 'localService', '$timeout'];

  function customValidate(rulesService, localService, $timeout) {
    return {
      link: link,
      require: 'ngModel',
      restrict: 'A'
    };

    function link(scope, element, attrs, ctrl) {
      let viewModel;
      const vm = scope.$ctrl;
      const isNumber = n => isFinite(n) && +n === n;

      $timeout(onLoad, 500);

      function customValidator(ngModelValue, load) {
        let { currency } = vm.page;
        let material = scope.material;
        let test = { Error: false };
        ngModelValue = parseFloat((""+ngModelValue).replace(",", "."));
        let cleanModel = ngModelValue ? ngModelValue.toString().replace(/[^\d.-]/g, '') : 0;
        let parsedModel = parseFloat(ngModelValue);

        if (material.TpStockCode !== 'C') {
          if (vm.kart.Master.PayCond != "A007") {
            if (parsedModel) {
              test = rulesService.overPrice(
                material.Price[material.Segmento].PrcMat['Preco' + currency.capitalize() + '90'],
                parsedModel,
                vm.params.OVP
              )
            } else {
              // REGRA DESCARTADA PELO MARANI test = { Error: 'Campo não pode ser 0.' };
            }
          }
        }

        if (parseFloat(cleanModel) !== parsedModel) {
          test.Error = 'Valor inválido.';
        }

        if (test.Error) {
          $timeout(localService.openModal, 500, true, test.Error);
          ctrl.$render();
          return false;
        }


          if (!load) {
            vm.getTotal();
          }


        return true;
      }

      element.on('blur', () => {
        let validation = customValidator(ctrl.$modelValue);

        ctrl.$setValidity(attrs.customValidate, validation);
        scope.$apply();
      });

      element.on('focus', e => {
        e.target.setSelectionRange(0, 99999);
      });

      element.on('keydown keypress', ({ target, which }) => (which === 13 ? target.blur() : false));

      function onLoad() {
        let model = ctrl.$modelValue || 0;

        let validation = customValidator(model, true);

        viewModel = isNumber(model) ? model.toFixed(2) : model;

        ctrl.$setValidity(attrs.customValidate, validation);
        scope.$apply();
      }
    }
  }
})();
