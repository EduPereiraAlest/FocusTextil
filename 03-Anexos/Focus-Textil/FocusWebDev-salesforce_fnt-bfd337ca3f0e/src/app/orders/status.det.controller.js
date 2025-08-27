/* global utils:true */
/* CLIENTS DETAIL */
(function() {
  'use strict';
  angular.module('app').controller('StatusDetController', StatusDetController);

  function StatusDetController($state, $stateParams, dataService, localService) {
    const vm = this;
    var pdMask;

    vm.address = {};
    vm.subTotal = subTotal;
    vm.setOrder = setOrder;
    vm.parseCurr = utils.helpers.parseCurr;
    vm.pdMask = pdMask;
    vm.activateRedispCentro = activateRedispCentro;

    console.log(vm)
    activate();

    function activate() {
      return dataService.postData('Cart', { CodePv: $stateParams.id }).then(({ Results }) => {
        vm.order = Results;
        vm.pdMask = vm.order.Master.CodePv.replace(/^0+/, "");
        vm.delivery = vm.order.Master.DataDelivLoc;
      
        // SOMENTE NO PEDIDO!! load order item centers
        let allCenters = vm.order.Master.Item902.map(item => item.Centro);
        let centers = [...new Set(allCenters)].sort();
        vm.cartCenters = centers;

        
        if (vm.cartCenters && vm.cartCenters.length) {
          vm.redispCenterSelected = vm.cartCenters[0];
        }

        // load tabs
        // load information about each tab

        vm.redespachoData = {};
        /*
        for (let item of vm.order.Master.Item902) {
          if (item.CnpjRedisp) {
            loadRedispatchData(item.CnpjRedisp, item.Centro);
          }
        }
        */
      }, localService.errorHandler);
    }

    function loadRedispatchData(cnpj, centro) {
      if (cnpj && cnpj.length === 14) {
        getRedespachoData(cnpj).then(function (data) {
          vm.redespachoData[centro] = data;

          if (vm.redespachoData[centro].CnpjAdr) {
            vm.redespachoData[centro].CnpjAdrPretty = vm.redespachoData[centro].CnpjAdr.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
          }

          if (vm.redispCenterSelected === centro) {
            activateRedispCentro(centro);
          }
          console.log("DADO DE REDESPACHO CARREGADO", centro, data);
        });
      } else {
        console.trace();
        console.log("CNPJ INVALIDO", centro, cnpj);
      }
    }

    function activateRedispCentro(centro) {
      vm.redespacho = vm.redespachoData[centro];
      vm.redispCenterSelected = centro;
    }

    function getRedespachoData(cnpj) {
      if ( ! cnpj) return;

      return dataService
        .postData('RedespachoData', { cnpj })
        .then(data => {
          if (data) {
            return data;

          } else {
            console.log("NO DATA FOUND RedespachoData", cnpj, data);
          }

        }, localService.errorHandler);
    }

    function setOrder() {
      const pages = localService.getData('pages') || [];
      const page = {
        name: 'ORDERS',
        search: vm.order.Master.OrderNum || '',
        status: vm.order.Master.CodePv,
        date: {start: "", end: ""},
        info: {}
      };

      _.mergeBy(pages, page, 'name');

      localService.setData('pages', pages);

      return $state.go('orders');
    }

    function subTotal(material) {
      return vm.parseCurr(material.Stock.QtdMaterial * material.PrcMaterial);
    }
  }
})();
