/* global utils:true */
(function() {
  'use strict';

  class tableStatusController {
    constructor() {
      this.tableOpen = false;
      this.parseCurr = utils.helpers.parseCurr;
    }

    subTotal(material) {
      return this.parseCurr(material.Stock.QtdMaterial * material.PrcMaterial);
    }
  }

  const tableStatus = {
    controller: tableStatusController,
    bindings: {
      items: '='
    },
    templateUrl: 'app/orders/components/tableStatus.html'
  };

  angular.module('app').component('tableStatus', tableStatus);
})();
