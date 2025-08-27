(function() {
  'use strict';
  angular.module('app').directive('inputQtd', inputQtd);
  inputQtd.$inject = ['localService', '$timeout'];

  function inputQtd(localService, $timeout) {
    return {
      link: link,
      require: 'ngModel',
      restrict: 'A'
    };

    function link(scope, element, attrs, ctrl) {
      const vm = scope.$ctrl;
      const material = scope.material;
      let oldModel;

      scope.$watch('$ctrl.warnings', warnings => {
        ctrl.$setValidity('cart', true);
        oldModel = ctrl.$modelValue;
        angular.forEach(warnings, warn => {
          if (
            warn.MaterialCode === material.MaterialCode &&
            warn.TpStockCode === material.TpStockCode && 
            material.Abgru === ""
          ) {
            ctrl.$setValidity('cart', false);
            $timeout(localService.openModal, 500, true, warn.MaterialCode + ': ' + warn.Error);
          }
        });
      });

      element.on('blur', () => {
        if (!ctrl.$modelValue) {
          ctrl.$setValidity('cart', false);
          return localService.openModal('Quantidade não pode ser igual a zero');
        }
        console.log('[Teste]', ctrl.$modelValue, oldModel);
        if (ctrl.$modelValue !== oldModel) {
          oldModel = ctrl.$modelValue;
          return vm.getTotal();
        }
        return false;
      });

      element.on('keydown keypress', ({ target, which }) => (which === 13 ? target.blur() : false));
    }
  }
})();
