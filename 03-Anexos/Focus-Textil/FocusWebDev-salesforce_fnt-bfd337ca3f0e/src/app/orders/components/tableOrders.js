/* global utils:true */
(function() {
  'use strict';

  class tableOrdersController {
    constructor($scope, localService) {
      this.tableOpen = false;
      this.parseCurr = utils.helpers.parseCurr;
      this.localService = localService;

      var self = this;
      var vm = $scope.$parent.$parent.vm;


      this.onDataAvailable(self, "items", function () {
        console.log("9898u ITEMS", self.items);
        // self.items = vm.raItens;
      });
    }

    onDataAvailable(root, key, callback) {
      var timeout = 5000;
      var interval = 250;
      var startTime = +new Date();

      function verify() {
        if (root[key]) {
          callback();
        } else {
          if (((+new Date()) - startTime) < timeout) {
            setTimeout(verify, interval);
          }
        }
      }
      
      verify();
    }

    selectAll(self) {
      setTimeout(function () {
        var vm = self.$parent.$ctrl;
        var checked = vm.checkSelectAll;
        vm.items.forEach(function (item) {
          item.raSelected = checked;
        });
        self.$parent.$apply();
      }, 0);
    }

    qtdChanged(item) {
      let max = +item.QtdMaterialAen;
      let itemQtd = item.raQtd.replace(",", ".").replace(/[^.0-9]/g, "");
      let isValid = +itemQtd <= max;

      if (isValid) {
        item.raQtd = itemQtd;
        item.raSelected = true;

      } else {
        item.raQtd = max;
        item.raSelected = true;
        this.localService.openModal('O valor máximo para este item é ' + max);
      }
    }
  }

  /* @ngInject */
  tableOrdersController.$inject = ['$scope', 'localService'];

  const tableOrders = {
    controller: tableOrdersController,
    bindings: {
      items: '=',
      ra: '<',
      isLegado: '='

    },
    templateUrl: 'app/orders/components/tableOrders.html'
  };

  angular.module('app').component('tableOrders', tableOrders);
})();
