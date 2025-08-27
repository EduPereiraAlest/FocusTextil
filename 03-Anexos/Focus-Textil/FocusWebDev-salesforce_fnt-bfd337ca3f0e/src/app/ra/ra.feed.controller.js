/* CLIENTS DETAIL */
(function() {
  'use strict';
  angular.module('app').controller('RaFeedController', RaFeedController);

  function RaFeedController($scope, $stateParams, dataService, localService) {
    const vm = this;
    const vp = $scope.$parent.vm;

    vm.address = {};

    vm.ra = {
      CodeRa: '110276',
      CodePv: 'LHR41H',
      QtdRa: 3,
      CodeNF: '03022010',
      RaDate: '26/09/11 16:20',
      RndRa: '110',
      NomeCli: 'ABB CONFECCOES LTDA EPP',
      CodeCli: 1384235707,
      CnpjCli: '03078438000180'
    };

    activate();

    function activate() {
      vp.activate();
      console.log($stateParams.id);

      // return dataService
      //   .postData("Order", { CodeOv: $stateParams.id })
      //   .then(function(res) {
      //     vm.order = res.Results;
      //     vm.delivery = vm.order.Master.DelivLoc;
      //     console.log(vm.order);
      //     return vm.order;
      //   }, localService.errorHandler);
    }
  }
})();
