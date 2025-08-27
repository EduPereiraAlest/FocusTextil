/* global utils:true */
/* CLIENTS */
(function() {
  'use strict';
  angular.module('app').controller('ClientController', ClientController);

  function ClientController($scope, $state, $rootScope, localService, dataService) {
    const vm = this;
    const openModal = localService.openModal;
    let data;
    var profileBlocked = false;
    var managerProfile = '';
    var advProfile = ''

    vm.submitForm = submitForm;
    vm.clearForm = clearForm;
    vm.selectClient = selectClient;
    vm.parseDate = utils.helpers.parseStringDate;
    vm.managerProfile = managerProfile;
    vm.advProfile = advProfile;
    vm.profileBlocked = profileBlocked;

    $scope.onlyFav = false;
    vm.toggleOnlyFav = toggleOnlyFav;

    vm.page = {
      name: 'CLIENTS',
      search: ''
    };

    vm.advProfile = localService.getData('loginPathAdv');
    vm.managerProfile = localService.getData('loginPathGs');


    if(vm.advProfile || vm.managerProfile){
      vm.profileBlocked = true;
    }

    vm.formatCityUf = function(cityUf) {
      if (!cityUf || cityUf === 'undefined-undefined') {
          return '-';
      }
      var parts = cityUf.split('-');
      if (parts[0] === 'undefined') parts[0] = '';
      if (parts[1] === 'undefined') parts[1] = '';
      return parts.filter(Boolean).join('-') || '-';
  }

    activate();

    function activate() {
      vm.pages = localService.getData('pages') || [];
      if (vm.pages.length) {
        vm.page = _.findWhere(vm.pages, { name: 'CLIENTS' }) || vm.page;
        return _.delay(submitForm);
      }
    }


    function toggleOnlyFav(event) {
      // o submit do searchbox está disparando o onclick do button... pq???
      // button sem type="button"

      if (event) {
      //   var isClick = event.isTrusted === false;

        console.log("9i9i9i event", event);
        // console.log("9i9i9i isClick", isClick);
        // if (isClick) {
        //   window.debugClick = event;
        // } else {
        //   window.debugSubmit = event;
        // }
      }

      $scope.onlyFav = !$scope.onlyFav;

      submitForm();

      // console.log("9i9i9i event", event);

    }

    function selectClient(client) {
      var hasDIFAL = client.CndistCli === '0002';
      if (hasDIFAL) {
        localService.openModal('Cliente com incidência de DIFAL');
      }
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

    function submitForm(event) {
      document.activeElement.blur();

      if (event) {
        event.preventDefault();
      }


      data = {
        Search: vm.page.search.toLowerCase(),
        Limit: 1000,
        Page: 1,
        OrderBy: ''
      };

      if ($scope.onlyFav) {
        // redirect request to FavoriteCustomer
        return data.Search
        ? dataService.postData('FavoriteCustomer', data).then(({ Results }) => {
            return Results && Results.length
              ? ((vm.clients = Results), setPage(vm.page))
              : ((vm.clients = ''), openModal('Nenhum registro encontrado.'));
          }, localService.errorHandler)
        : false;
      }

      const gestorID = localService.getData('gestorReps')
      if(gestorID !== null) {
        data.gestorID = gestorID
      }

      return data.Search
        ? dataService.postData('Customer', data).then(({ Results }) => {
            return Results && Results.length
              ? ((vm.clients = Results), setPage(vm.page))
              : ((vm.clients = ''), openModal('Nenhum registro encontrado.'));
          }, localService.errorHandler)
        : false;
    }

    function clearForm() {
      vm.page.search = '';
      vm.clients = '';
      setPage(vm.page);
    }

    function cleanEbook() {
      return setPage({
        name: 'BOOKS',
        currency: 'BRL',
        list: true,
        type: 'N',
        branch: 'T101',
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
