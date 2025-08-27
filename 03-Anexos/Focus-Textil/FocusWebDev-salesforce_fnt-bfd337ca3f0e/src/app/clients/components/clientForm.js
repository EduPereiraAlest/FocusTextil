(function() {
  'use strict';

  angular.module('app').directive('clientForm', clientForm);

  function clientForm() {
    // '<', '=', '&', '@'
    return {
      replace: true,
      templateUrl: 'app/clients/components/clientForm.html',
      controller: clientFormController,
      controllerAs: '$ctrl',
      bindToController: {
        model: '<',
        formName: '@',
        title: '@',
        disabled: '@'
      }
    };


    function clientFormController($scope) {
      this.sectors = [
        { value: '0001', name: 'Varejo' },
        { value: '0002', name: 'Não contribuintes' },
        { value: '0003', name: 'PF' },
        { value: '0004', name: 'Industria' },
        { value: '0005', name: 'Atacado' },
        { value: '0006', name: 'Confecções' },
        { value: '0007', name: 'Simples - Frete' },
        { value: '0008', name: 'Suframa' },
        { value: '0009', name: 'Optante Simples' },
        { value: '0010', name: 'Não Opt. Simples 4%' },
        { value: '0011', name: 'Não Opt. Simples 10%' },
        { value: '0012', name: 'ICMS - Frete' },
        { value: '0013', name: 'MEI - Sem IE' }
      ];

      $scope.$watch('vm.segments', function(newVal) {
        if (newVal) {
          $scope.$parent.vm.segments = newVal;
        }
      });

      $scope.$watch('vm.subsegments', function(newVal) {
        if (newVal) {
          $scope.$parent.vm.subsegments = newVal;
        }
      });

      $scope.$watch('vm.managers', function(newVal) {
        if (newVal) {
          $scope.$parent.vm.managers = newVal;
        }
      });

    }
  }
})();
