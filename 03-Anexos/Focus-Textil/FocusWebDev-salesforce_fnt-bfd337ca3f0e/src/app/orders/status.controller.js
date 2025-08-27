/* global utils:true */
/* STATUS */
(function() {
  'use strict';
  angular.module('app').controller('StatusController', StatusController);

  function StatusController($state, $scope, $rootScope, $controller, localService, dataService) {
    const vm = this;
    var profileBlocked = false;
    var managerProfile = '';
    var advProfile = ''

    vm.clearForm = clearForm;
    vm.parseDate = utils.helpers.parseStringDate;
    vm.submitForm = submitForm;
    vm.reSend = reSend;
    vm.reCreate = reCreate;
    vm.loadMore = loadMore;
    vm.setDetail = setDetail;
    vm.managerProfile = managerProfile;
    vm.advProfile = advProfile;
    vm.profileBlocked = profileBlocked;

    vm.advProfile = localService.getData('loginPathAdv');
    vm.managerProfile = localService.getData('loginPathGs');


    if(vm.advProfile || vm.managerProfile){
      vm.profileBlocked = true;
    }

    angular.extend(
      vm,
      $controller('TableController', {
        vm: vm
      })
    );

    function activate() {
      vm.page = vm.startPage({ name: 'STATUS' });

      return vm.page.search ? vm.submitForm() : false;
    }

    function reCreate(order) {
      return dataService.postData('CartCopy', { CodePv: order.CodePv, PersistCart: true }).then(({ Cart }) => {
        localService.setData('kart', Cart);
        return $state.go('carts');
      }, localService.errorHandler);
    }

    window.recreate = function (qnt, CodePv) {
      CodePv = CodePv || "BL18P1546048";
      console.log("RECREATE: ", CodePv, qnt);
      return dataService.postData('CartCopy', { CodePv: CodePv, PersistCart: true })
        .then(function (result) {
          // console.log("Cart ok: ", result.Results == "Success", result.Cart.Master.CodePv);
          if (result.Results == "Success") {
              // envia o nivel do Master
              // Cart: JSON.stringify(CART)
              // SendShoppingCart
              dataService.postData('SendShoppingCart', { Cart: JSON.stringify(result.Cart) })
              .then(function (resultSend) {
                if (resultSend.Results == "O pedido será enviado em breve.") {
                  console.log("Cart ok: ", result.Cart.Master.CodePv);
                  if (qnt > 1) {
                    window.recreate(qnt - 1, CodePv);
                  } else {
                    console.log("FIM DE TODOS");
                  }
                } else {
                  console.log("ERRO SendShoppingCart", result);
                }
              }, function (err) {
                console.log("ERRO SendShoppingCart reject", err);
              })
          } else {
            console.log("ERRO CartCopy", result);
          }
        }, function (err) {
          console.log("ERRO CartCopy reject", err);
        });
    };

    function reSend(order) {
      return dataService.postData('CartCopy', { CodePv: order.CodePv }).then(({ Cart }) => {
        localService.setData('kart', Cart);
        return $state.go('carts');
      }, localService.errorHandler);
    }

    function submitForm(event) {
      document.activeElement.blur();

      if (event) {
        event.preventDefault();
        vm.page.sort = '-Master.EditDate';
        vm.page.scroll = 0;
        vm.page.info = {};
        utils.helpers.setScrollTop();
      }

      let currentPage = vm.page.info.CurrentPage || 1;

      vm.orders = vm.setRecords();
      var extendedData = {
        Search: vm.page.search.toLowerCase(),
        Limit: currentPage * 48,
        Page: 1,
        OrderBy: vm.page.sort
      };

      if (localService.getData('isEfocusCustomer')) {
        extendedData.eFocus = true;
        extendedData.Pernr = localService.getData('user').codRep;
      }

      // Caso esteja logado como gestor, necessário enviar o ID
      if (localService.getData('gestorReps')) {
        extendedData.gestorID = localService.getData('gestorReps')
      }

      angular.extend(vm.data, extendedData);

      return loadData();
    }

    function setDetail(CodePv) {
      vm.page.scroll = utils.helpers.getScrollTop();
      vm.setPage(vm.page);
      return $state.go('status-det', { id: CodePv });
    }

    function clearForm() {
      utils.helpers.setScrollTop();
      vm.page.search = '';
      vm.page.sort = '-Master.EditDate';
      vm.page.scroll = 0;
      vm.orders = vm.setRecords();
      return vm.setPage(vm.page);
    }

    function loadData() {
      return vm.data.Search
        ? dataService.postData('Carts', vm.data).then(res => {
            vm.page.info = vm.setInfo(vm.page.info, res);
            let loaded = res.Results || [];

            if (loaded.length) {
              vm.orders = vm.setRecords(loaded, 'CodePv');
              vm.data.Limit = 48;

              console.log('[Orders]', vm.orders);

              if (vm.page.scroll) {
                _.delay(utils.helpers.setScrollTop, 200, vm.page.scroll);
              }

              return vm.setPage(vm.page);
            }
            return localService.openModal('Nenhum Pedido Encontrado');
          }, localService.errorHandler)
        : false;
    }

    function loadMore() {
      return vm.checkScroll() ? loadData() : false;
    }

    var continuousScroll = {
      pedidosShowLoader: function () {
        var listaPedidosLoader = document.querySelector("div.pedidos-loader");
        listaPedidosLoader.style.display = "block";
      },
      pedidosHideLoader: function () {
        var listaPedidosLoader = document.querySelector("div.pedidos-loader");
        listaPedidosLoader.style.display = "none";
      }
    };

    $scope.$on('loader-lista-pedidos-enabled', continuousScroll.pedidosShowLoader);
    $scope.$on('loader-lista-pedidos-disabled', continuousScroll.pedidosHideLoader);


    activate();
  }
})();
