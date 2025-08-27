/* ACTIONS */
(function() {
  'use strict';
  angular.module('app').controller('OrderActController', OrderActController);

  function OrderActController($scope, order, dataService) {
    const vm = this;

    vm.data = {};
    vm.sendAction = sendAction;

    activate();

    function activate() {
      return dataService.postData('OrderDates', { CodeOv: order.CodeOv }).then(({ Results }) => {
        vm.dates = Results;
        vm.data.CodeOv = order.CodeOv;
      });
    }

    vm.actions = [
      { Cod: '01', Desc: 'Confirmar Pedido' },
      { Cod: '03', Desc: 'Cancelar Pedido' },
      { Cod: '04', Desc: 'Data Prorrogada' }
    ];

    function sendAction() {
      vm.data = _.extend({ DateAtc: ' ', Text: ' ' }, vm.data);
      return dataService.postData('SendOrderAction', vm.data).then(res => {
        console.log(res);
        return $scope.closeThisDialog();
      });
    }
  }
})();
