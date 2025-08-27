/* CLIENTS FAVORITE */
(function() {
  'use strict';
  angular.module('app').controller('ClientFavController', ClientFavController);

  function ClientFavController($state, dataService, localService) {
    const vm = this;

    vm.selectClient = selectClient;
    vm.clients = [];

    activate();

    function activate() {
      return dataService.postData('FavoriteCustomer', {}).then(({ Results }) => {
        return (vm.clients = Results);
      }, localService.errorHandler);
    }

    function selectClient(client) {
      return dataService
        .postData('OpenShoppingCart', { CodeCli: client.CodeCli })
        .then(({ Results }) => {
          Results.Master.NomeCli = client.Razao01Cli;
          Results.Master.AntCli = client.Antecipado;
          if(client.CndistCli == "0008"){
            Results.Master['isSufr'] = "X"
          }else{
            Results.Master['isSufr'] = ""
          }

          //checar se o cliente é do Ceará, se SIM, aplicar controlador de fator da T106 
          /*
          if(client.CityUf.includes("-CE")){
            Results.Master['CEisFactor'] = true;
          }
          */
         
          localService.setData('kart', Results);
          cleanEbook();

          return $state.go('home');
        }, localService.errorHandler);
    }

    function cleanEbook() {
      return setPage({
        name: 'BOOKS',
        currency: 'BRL',
        list: true,
        type: 'N',
        search: '',
        info: '',
        sort: '',
        filters: '',
        grammage: ''
      });
    }

    function setPage(page) {
      vm.pages = vm.pages || [];
      _.mergeBy(vm.pages, page, 'name');
      return localService.setData('pages', vm.pages);
    }
  }
})();
