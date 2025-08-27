/* global utils:true */
/* HOME */
(function() {
  'use strict';


  angular.module('app').controller('HomeController', HomeController);
  HomeController.$inject = ['$scope', '$rootScope', '$state', '$timeout', 'localService', 'dataService', 'ngDialog'];

  function HomeController($scope, $rootScope, $state, $timeout, localService, dataService, ngDialog) {
    const vm = this;
    const vp = $scope.$parent.vm;
    var profileBlocked = false;
    var managerProfile = '';
    var advProfile = ''


    vm.parseCurr = utils.helpers.parseCurr;
    vm.selectPend = selectPend;
    vm.openPends = openPends;
    vm.process = '';
    vm.msg = localService.getData('messages');
    vm.managerProfile = managerProfile;
    vm.advProfile = advProfile;
    vm.profileBlocked = profileBlocked;
    vm.customerPtax = customerPtax;

    vm.pendPanel = false;

    vm.advProfile = localService.getData('loginPathAdv');
    vm.managerProfile = localService.getData('loginPathGs');

    $scope.isEfocusCustomer = localService.getData('isEfocusCustomer');
    $scope.goToCarts = goToCarts;

    vm.ptaxText = "R$ 0,0000"


    $scope.materialImageSearch = function (cod) {
      console.log("materialImageSearch", cod);

      // use o localStorage para guardar os params
      localStorage.paramsBookView = JSON.stringify({ view: "image", search: cod });
      $state.go('books');
    };

    if(vm.advProfile || vm.managerProfile){
      vm.profileBlocked = true;
    }

    activate();

    function activate() {
      vp.activate();
      vm.online = vp.online;
      vm.kart = vp.kart;
      // getMessages();
      return _.delay(getPtax, 1000);
    }

    function getMessages() {
      return dataService.postData('Alert', {}).then(({ Results }) => {
        if (!vm.msg && Results && Results[0] && Results[0].Message) {
          localService.openModal(Results[0].Message);
          localService.setData('messages', true);
        }
      });
    }

    function getPtax() {
      return dataService.postData('Ptax', {}).then(({ Results }) => {
        vm.ptax = Results;
        vm.ptaxText = ("R$ "+vm.ptax[0].ValueCot).replace(".", ",");
        localStorage.ptax = JSON.stringify(Results);

        if (!vm.ptax.length) {
          console.log('Carregando PTAX');
          $timeout(() => {
            getPtax();
          }, 10000);
          return false;
        }

        angular.forEach(vm.ptax, ptax => (ptax.ValueCot = vm.parseCurr(ptax.ValueCot, 4)));
        return getPends();
      }, localService.errorHandler);
    }

    function openPends() {
      vm.pendPanel = !vm.pendPanel;
    }

    function getPends() {
      return dataService
        .postData('Pendencies', {})
        .then(({ Results }) => {
          vm.pends = Results;
          if(Results.length){
            localService.setData('pends', Results.length);
          }
        }, localService.errorHandler);
    }

    function selectPend(pend) {
      switch (pend.Type) {
        case 'Cart':
          return pendCard(pend);
        case 'Order':
          return pendOrder(pend);
        case 'Customer':
          return pendCustomer(pend);
        default:
          return localService.openModal('Pendencia não resolvida.');
      }
    }

    function pendOrder({ CodeOv }) {
      const page = {
        name: 'ORDERS',
        search: CodeOv || ''
      };

      setPage(page);

      return $state.go('orders-det', { id: CodeOv });
    }

    function pendCard({ CodePv }) {
      return dataService.postData('Cart', { CodePv }).then(({ Results }) => {
        console.log('[pendCarts]', Results);
        localService.setData('kart', Results);
        vp.kart = Results;
        cleanEbook();

        return $state.go('carts');
      }, localService.errorHandler);
    }

    function pendCustomer(pend) {
      return $state.go('clients-add', { id: pend.CnpjCli });
    }

    function cleanEbook() {
      // AQUI PODE ESTAR O PROBLEMA DE TODOS OS VALORES PADRÃO
      return setPage({
        name: 'BOOKS',
        currency: 'BRL',
        list: true,
        books: false,
        stock: false,
        offcor: false,
        type: 'N',
        materialType: 'null',
        stockCenter: '',
        branch: '',
        grammage: '',
        ebook: '',
        info: {},
        search: '',
        sort: 'Master._DescMat',
        filters: '',
        scroll: 0
      });
    }

    function setPage(page) {
      let pages = localService.getData('pages') || [];

      _.mergeBy(pages, page, 'name');
      return localService.setData('pages', vm.pages);
    }

    function goToCarts() {
      var cart = vp.kart;
      var items = cart.Master.Item902;
      console.log("4r4tf5 KART items", items.length);
      if (items.length) {
        $state.go('carts');
      }
    }

    function customerPtax() {
      var ptaxModalController = function ($scope) {
        $scope.ptaxList = JSON.parse(localStorage.ptax);
      };

      ptaxModalController.$inject = ['$scope'];
      
      var ptaxModal = ngDialog.open({
        template: 'app/home/components/ptaxModal.html',
        controller: ptaxModalController,
        plain: false,
        scope: $scope
      });
    }

    var continuousScroll = {
      ptaxShowLoader: function () {
        var listaPtaxLoader = document.querySelector("div.ptax-loader");
        if (listaPtaxLoader) {
          listaPtaxLoader.style.display = "block";
        }
      },
      ptaxHideLoader: function () {
        var listaPtaxLoader = document.querySelector("div.ptax-loader");
        if (listaPtaxLoader) {
          listaPtaxLoader.style.display = "none";
        }
      }
    };

    $scope.$on('loader-lista-ptax-enabled', continuousScroll.ptaxShowLoader);
    $scope.$on('loader-lista-ptax-disabled', continuousScroll.ptaxHideLoader);

  }
})();
