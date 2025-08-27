/* ORDERS */
/* global utils:true */
(function () {
  'use strict';
  angular.module('app').controller('OrdersController', OrdersController);

  function OrdersController($scope, $controller, $state, ngDialog, localService, dataService, $rootScope) {
    const vm = this;
    const vp = $scope.$parent.vm;
    var profileBlocked = false;
    var managerProfile = '';
    var advProfile = '';
    var visitedOrders = localService.getData('visitedOrders') || {};
    var remessaMask;
    var orderMask;

    var isEfocusCustomer = localService.getData('isEfocusCustomer');

    $scope.isEfocusCustomer = isEfocusCustomer;

    angular.extend(
      vm,
      $controller('TableController', {
        vm: vm
      })
    );

    vm.submitForm = submitForm;
    vm.parseDate = utils.helpers.parseStringDate;
    vm.getStatus = getStatus;
    vm.openAction = openAction;
    vm.loadMore = loadMore;
    vm.setDetail = setDetail;
    vm.clearForm = clearForm;
    vm.clearFilters = clearFilters;
    vm.sendOrder = sendOrder;
    vm.editOrder = editOrder;
    vm.downloadNFe = downloadNFe;
    vm.managerProfile = managerProfile;
    vm.advProfile = advProfile;
    vm.profileBlocked = profileBlocked;
    vm.remessaMask = remessaMask;
    vm.orderMask = orderMask;
    vm.visitedOrders = visitedOrders;

    vm.advProfile = localService.getData('loginPathAdv');
    vm.managerProfile = localService.getData('loginPathGs');


    if (vm.advProfile || vm.managerProfile) {
      vm.profileBlocked = true;
    }

    vm.filters = [{
        name: 'Todos',
        value: ''
      },
      {
        name: 'Faturados',
        value: 'Faturados'
      },
      {
        name: 'Não Faturados',
        value: 'Não Faturados'
      },
      {
        name: 'Cancelados',
        value: 'Cancelados'
      }
    ];

    function activate() {
      vm.page = vm.startPage({
        name: 'ORDERS',
        status: '',
        outlet: '',
        tfour: '',
        date: {
          start: '',
          end: ''
        }
      });

      vm.page.filters = vm.page.filters || '';
      vm.page.info = vm.page.info || {};

      return vm.page.search ? submitForm() : false;
    }

    function submitForm(event) {
      document.activeElement.blur();

      if (event) {
        // console.log("888uuuuu COM EVENTO, nova busca, RESET VISITED");
        vm.page.scroll = 0;
        utils.helpers.setScrollTop();
        resetVisitedOrders();
        event.preventDefault();
      } else {
        // console.log("888uuuuu SEM EVENTO, recuperação, keep");

      }
      //   vm.page.sort = '-Master._DateProcess';
      //   vm.page.status = '';
      //   vm.page.scroll = 0;
      //   vm.page.date = { start: '', end: '' };
      //   utils.helpers.setScrollTop();
      // } else {
      vm.page.date = startDate(vm.page.date);
      // }

      let dates = parseDate(vm.page.date);
      let currentPage = vm.page.info.CurrentPage || 1;

      vm.orders = vm.setRecords();
      vm.page.info = {};

      var sortListBy = '-Master._DateOv';

      if (vm.page.sort && vm.page.sort != " ") {
        sortListBy = vm.page.sort;
      }

      angular.extend(vm.data, {
        Search: vm.page.search.toLowerCase(),
        Limit: 48,
        Page: 1,
        OrderBy: sortListBy,
        Filter: vm.page.filters || '',
        Dates: dates || '',
        Outlet: vm.page.outlet ? 'X' : '',
        Focus24: vm.page.tfour ? 'X' : ''
      });

      return loadData();
    }

    function startDate(dates) {
      return _.mapObject(dates, function (val) {
        return val && angular.isString(val) ? new Date(val) : val;
      });
    }

    function parseDate(dates = {}) {
      let result = [];

      angular.forEach(dates, date => {
        result.push(utils.helpers.parseFullDate(date));
      });

      return dates.start && dates.end ? result.join(':') : '';
    }

    function sendOrder(CodeOv) {
      return dataService
        .postData('SendCopyOv', {
          CodeOv
        })
        .then(({
          Results
        }) => localService.openModal(Results), localService.errorHandler);
    }

    function setVisitedOrder(CodeOv) {
      visitedOrders = localService.getData('visitedOrders');
      visitedOrders[CodeOv] = true;
      localService.setData('visitedOrders', visitedOrders);
    }

    function resetVisitedOrders() {
      visitedOrders = {};
      vm.visitedOrders = visitedOrders;
      localService.setData('visitedOrders', visitedOrders);
    }

    function setDetail(order, isRA) {
      var CodeOv = order.CodeOv;

      setVisitedOrder(CodeOv);

      vm.page.scroll = utils.helpers.getScrollTop();

      vm.setPage(vm.page);

      var params = {
        id: CodeOv
      };

      if (isRA) {
        params.isRA = isRA;
      }

      return $state.go('orders-det', params);
    }

    function clearForm(search) {
      utils.helpers.setScrollTop();
      vm.page.search = search || '';
      vm.page.sort = '-Master._DateOv';
      vm.page.scroll = 0;
      vm.page.info = {};
      vm.page.status = '';
      vm.page.filters = '';
      vm.page.outlet = '';
      vm.page.tfour = '';
      vm.page.date = {
        start: '',
        end: ''
      };
      vm.orders = vm.setRecords();
      return vm.setPage(vm.page);
    }

    function clearFilters() {
      vm.page.filters = '';
      vm.page.date = {
        start: '',
        end: ''
      };
      return submitForm();
    }

    function debugMockup(orders) {
      orders.forEach(function (order) {
        var mockNF = (+order.CodeOv.split("").reverse().join("")).toString(36);
        if ((+(mockNF[0]) % 2) != 0) {
          order.Nfenum = mockNF;
        }
      });
    }

    function downloadNFe(type, nfe, center) {
      center = center.substr(0, 4);
      const url = dataService.baseUrl('DanfeXmlNFSet');
      const headers = dataService.setHeader() || {
        "x-access-token": localService.getData('user').Token || ''
      }
      return fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers.headers || headers
        },
        body: JSON.stringify({
          extension: type,
          nfe,
          center
        })
      }).then((response) => {
        if (response.status === 200) {
          response.blob().then((blob) => {
            let filename = "NFe-" + nfe + "." + type;

            if (!blob || blob.size === 0) {
              return localService.openModal('Erro ao baixar NFe');
            }
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
          }).catch((err) => {
            console.error(err)
            return localService.openModalError('Erro ao baixar NFe. Tente novamente ou utilize outro navegador.');
          });
        } else {
          return localService.openModalError('Erro ao baixar NFe.');
        }
      })
    }

    function loadData(cancelScroll) {
      if (isEfocusCustomer) {
        var userInfo = localService.getData('user');
        vm.data.eFocus = true;
        vm.data.Pernr = userInfo.codRep;
        vm.data.CodeCli = userInfo.CodeCli;
      }

      if (vm.data.Limit !== 48) {
        console.log("6g6tf5f vm.data.Limit !== 48");
        console.trace();
      }

      if (vm.data.Search) {



        vm.data.Search = vm.data.Search.replace(/\s\s+/g, ' ').trim();
        vm.page.search = vm.data.Search;


        const gestorID = localService.getData('gestorReps')
        if(gestorID !== null) {
          vm.data.gestorID = gestorID
        }

        console.log('vm das orders', vm.data)

        return dataService.postData('Orders', vm.data).then(res => {
            vm.page.info = vm.setInfo(vm.page.info, res);
            // console.log('[loadData info (page: ' + vm.data.Page + ')]', vm.page.info, res);
            let loaded = res.Results || [];

            if (loaded.length) {
              vm.orders = vm.setRecords(loaded, 'CodeOv');
              vm.data.Limit = 48;

              for (let index = 0; index < vm.orders.length; index++) {
                let element = vm.orders[index];

                if (element && element.Remessa) {
                  element.remessaView = element.Remessa.replace(/^0+/, "");
                }

                element.OvView = element.CodeOv.replace(/^0+/, "");

                let statusCodes = element.Status;

                if (statusCodes) {
                  let chaves = Object.keys(statusCodes).filter(x => statusCodes[x] !== "07");
                  element.statusBlock = (chaves.length == 0);
                } else {
                  console.log("3d4rf5 NO STATUS FOUND! ", element.CodeOv);
                }

              }

              // debugMockup(vm.orders);

              if ( ! cancelScroll) {
                if (vm.page.scroll) {
                  _.delay(utils.helpers.setScrollTop, 200, vm.page.scroll);
                }
              }

              return vm.setPage(vm.page);
            }
            // clearForm(vm.data.Search);
            return localService.openModal('Nenhuma Ordem Encontrada');
          }, localService.errorHandler);
      }

    }

    function getStatus(order) {

      if (window.cordova) {
        // call OrderStatus
        getOrderStatus(order.CodeOv).then(function (resp) {
          console.log("getOrderStatus resp", resp);
          var updatedOrder;
          if (resp && resp[0]) {
            updatedOrder = resp[0];
          } else {
            updatedOrder = {};
          }

          genStatusList(Object.assign(order, updatedOrder))
        });

      } else {
        // do nothing, normal flow
        genStatusList(order);
      }


      function genStatusList(order) {
        let statusNames, statusClass;

        if (!order.Status) {
          return false;
        }

        if (order.StatusList) {
          return (order.StatusList = '');
        }

        angular.forEach(vm.orders, item => {
          if (item.CodeOv !== order.CodeOv) {
            item.StatusList = '';
          }
        });

        statusNames = {
          STATUS_00: 'Status 100',
          STATUS_01: 'Com. Gestor',
          STATUS_02: 'Com. Diretor',
          STATUS_03: 'Fin. Área de Crédito',
          STATUS_04: 'Fin. Diretor',
          STATUS_05: 'Superint.',
          STATUS_FI: 'Aprov. Ped. Antecip.',
          STATUS_06: 'WM Onda',
          STATUS_07: 'WM Picking',
          STATUS_08: 'WM Embalag.',
          STATUS_09: 'WM Box Exped.',
          STATUS_10: 'WM Exped.',
          STATUS_11: 'WM Carreg.',
          STATUS_12: 'WM Transp.',
          STATUS_OCO01: "Chegada na Unidade",
          STATUS_OCO02: "Saiu para Entrega",
          STATUS_OCO03: "Ocorrencia Entrega",
          STATUS_OCO04: "Entregada Realizada"
        };

        statusClass = {
          '00': 'blank',
          '01': 'warning',
          '02': 'success',
          '03': 'fail',
          '04': 'blank',
          '05': 'warning',
          '06': 'success',
          '07': 'fail'
        };

        order.StatusList = _.chain(statusNames)
          .map((val, key) => {
            return {
              idx: key.split('_')[1],
              name: val,
              style: statusClass[order.Status[key]]
            };
          })
          .value();

        return order.StatusList;
      }
    }

    function getOrderStatus(CodeOv) {
      console.log("getOrderStatus CodeOv", CodeOv);
      return dataService.postData('OrderStatus', {
        CodeOv
      });
    }

    function editOrder(CodeOv) {
      return dataService.postData('Cart', {
        CodePv: CodeOv
      }).then(({
        Results
      }) => {
        localService.setData('kart', Results);
        vp.kart = Results;
        cleanEbook();
        return $state.go('carts');
      }, localService.errorHandler);
    }

    function cleanEbook() {
      return setPage({
        name: 'BOOKS',
        currency: 'BRL',
        list: true,
        type: 'N',
        search: '',
        branch: 'T101',
        info: '',
        sort: '',
        filters: '',
        grammage: ''
      });
    }

    function setPage(page) {
      // console.log("4e4e4e4444 SET PAGE", page);
      let pages = localService.getData('pages') || [];

      _.mergeBy(pages, page, 'name');
      return localService.setData('pages', vm.pages);
    }

    function openAction(order) {
      const modal = ngDialog.open({
        template: 'app/orders/ordersAct.html',
        controller: 'OrderActController as vm',
        plain: false,
        resolve: {
          order: function setOrder() {
            return order;
          }
        },
        scope: $scope
      });

      modal.closePromise.then(({
        value
      }) => {
        console.log('[openAction]', value !== '$closeButton');
        return _.delay(submitForm);
      });
    }

    function loadMore() {
      return vm.checkScroll() ? loadData(true) : false;
    }

    $scope.$on('loader-lista-ordens-enabled', showLoader);

    $scope.$on('loader-lista-ordens-disabled', hideLoader);


    function hideLoader() {
      var listaOrdensLoader = document.querySelector("div.ordens-loader");
      listaOrdensLoader.style.display = "none";
    }

    function showLoader() {
      var listaOrdensLoader = document.querySelector("div.ordens-loader");
      listaOrdensLoader.style.display = "block";
    }

    activate();
  }
})();
