(function() {
  'use strict';

  class PendListController {
    constructor($scope) {
      var continuousScroll = {
        pendenciasShowLoader: function () {
          var listaPendenciasLoader = document.querySelector("div.pendencias-loader");
          listaPendenciasLoader.style.display = "block";
        },
        pendenciasHideLoader: function () {
          var listaPendenciasLoader = document.querySelector("div.pendencias-loader");
          listaPendenciasLoader.style.display = "none";
        }
      };

      $scope.$on('loader-lista-pendencias-enabled', continuousScroll.pendenciasShowLoader);
      $scope.$on('loader-lista-pendencias-disabled', continuousScroll.pendenciasHideLoader);
    }

    selectPend(item) {
      this.onClick({ pend: item });
    }
  }

  PendListController.$inject = ["$scope"];

  const pendList = {
    templateUrl: 'app/home/components/pendencies.html',
    bindings: {
      open: '=',
      items: '=',
      onClick: '&'
    },
    controller: PendListController
  };

  const ptaxList = {
    templateUrl: 'app/home/components/ptax.html',
    bindings: {
      items: '='
    }
  };

  angular
    .module('homePage', [])
    .component('pendList', pendList)
    .component('ptaxList', ptaxList);
})();
