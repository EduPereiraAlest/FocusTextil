/* global utils:true */
/* CLIENTS DETAIL */
(function() {
  'use strict';
  angular.module('app').controller('OrdersDetController', OrdersDetController);

  function OrdersDetController($scope, $state, $stateParams, dataService, localService) {
    const vm = this;
    const vp = $scope.$parent.vm;

    vp.tempRaCache = vp.tempRaCache || {};

    var CodeOv = $stateParams.id;
    var raNF = $stateParams.isRA;
    var ValorOV = 0;
    var ValorFaturada = 0;
    var ovMask;
    var pdMask;

    vm.address = {};
    vm.parseCurr = utils.helpers.parseCurr;
    vm.ValorOV = ValorOV;
    vm.ValorFaturada = ValorFaturada;
    vm.ovMask = ovMask;
    vm.pdMask = pdMask;
    vm.isRedesp = false;

    $scope.isRA = raNF;
    $scope.goToRaAdd = goToRaAdd;

    vm.actionScope = {
      order: { Acao: null },
      data: {},
      actions: [
        { Cod: '01', Desc: 'Confirmar Pedido' },
        { Cod: '03', Desc: 'Cancelar Pedido' },
        { Cod: '04', Desc: 'Data Prorrogada' }
      ],
      getDates: ({ CodeOv }) => {
        return dataService.postData('OrderDates', { CodeOv }).then(({ Results }) => {
          vm.actionScope.dates = Results;
          vm.actionScope.data.CodeOv = CodeOv;
        });
      },
      sendAction: event => {
        if (event) {
          event.preventDefault();
        }

        let data = _.extend({ DateAtc: ' ', Text: ' ' }, vm.actionScope.data);

        return dataService.postData('SendOrderAction', data).then(res => {
          vm.actionScope.order.Acao = false;
        }, err => {
          console.log("ERROR", err);
          if (err && err.Error) {
            localService.openModal(err.Error)
          }
        });
      }
    };

    activate();

    function activate() {
      if (raNF) {
        if (vp.tempRaCache[raNF]) {
          // console.log('[RA NF] GET ITEMS FROM CACHE', vp.tempRaCache[raNF]);
          //TO:DO GET FROM SERVICE RA
          vm.raItens = vp.raItens = vp.tempRaCache[raNF];
          delete vp.tempRaCache[raNF];

        } else {
          // console.log('[RA NF] NO CACHE, SearchNF', raNF);
          dataService.postData('SearchNF', { nf: raNF, pedido: CodeOv }).then(function (resp) {
            var hasItems = resp && resp.Results && resp.Results[0] && resp.Results[0].ItemNavig;
            if (hasItems) {
              var ItemNavig = resp.Results[0].ItemNavig;

              ItemNavig = ItemNavig.map(function (item) {
                item.MaterialCode = item.Produto;
                item.DescMat = item.Denominacao;
                item.UnidMed = item.Unidade;

                return item;
              });

              if (resp && resp.QtdRA) {
                var qtdRa = resp.QtdRA;
                if (resp.QtdRA === 1) {
                  localService.openModal('Já existe 1 RA para essa Nota Fiscal');
                } else if (resp.QtdRA > 1) {
                  localService.openModal('Já existem ' + qtdRa + ' RAs para essa Nota Fiscal');
                }
              }

              // console.log('[SearchNF] ITENS FOUND', ItemNavig);
              if (vp.raItens) {
                // console.log('[ftg6h6h6h] CACHE FOUND', vp.raItens);
                // O MAPEAMENTO DEVE SER FEITO POR CÓDIGO DE ITEM, E NÃO POR INDICE
                // console.log("0i0i0i0ii0 vp.raItens.length", vp.raItens.length);
                // console.log("0i0i0i0ii0 ItemNavig.length", ItemNavig.length);

                vm.raItens = vp.raItens = vp.raItens.map((item, i) => {
                  let coitem = ItemNavig.filter(x => {
                    return x.ItemPedido === item.ItemOv
                  })[0];

                  if (coitem) {
                    return Object.assign(item, coitem);
                  } else {
                    return item;
                  }
                });

              } else {
                // console.log('[ftg6h6h6h] NO CACHE FOUND', vp.raItens);
                vm.raItens = vp.raItens = ItemNavig;
              }
            } else {
              // console.log('[SearchNF] NO ITENS FOUND', resp);
            }

            updateTableOrderItems(vm.raItens, "load SearchNF");

          }, localService.errorHandler);
        }

        updateTableOrderItems(vm.raItens, "if raNF");
      }

      vm.actionScope.getDates({ CodeOv });

      return dataService.postData('Order', { CodeOv: CodeOv }).then(({ Results }) => {
        vm.order = vp.raOrder = Results;

        var orderListItems = vm.order.Master.Item904;
        var notCanceled = orderListItems.filter(x => x.Abgru === "");
        const reducer = (accumulator, currentValue) => accumulator + currentValue;

        var Values = notCanceled.map(function(item){return parseFloat(item.ovSubtotal, 10);})
        vm.ValorOV = Values.reduce(reducer, 0).toFixed(2);

        var ValueFaturado = notCanceled.map(function(item){return parseFloat(item.nfSubtotal, 10);})
        vm.ValorFaturada = ValueFaturado.reduce(reducer, 0).toFixed(2);

        vm.delivery = vm.order.Master.DelivLoc;
        // vm.redespacho = vm.order.Master.RedespNavig;

        vm.ovMask = vm.order.Master.CodeOv.replace(/^0+/, "");
        vm.pdMask = vm.order.Master.CodePv.replace(/^0+/, "");

        vm.order.Master.NfenumPrint = vm.order.Master.Nfenum.replace(/^0+/, "");

        // console.log('[redespacho]', vm.redespacho);
        console.log('[Order]', vm.order);

        vm.actionScope.order.Acao = !!vm.order.Master.Acao;

        // leaf update
        // vm.raItens = vp.raItens = vm.order.Master.Item904;

        if (vm.raItens) {
        console.log('8u8u8u8 vm.raItens JÁ EXISTE', vm.raItens);
          // adiciona se já tiver itens no cache
          vm.raItens = vp.raItens = vm.raItens.map((item, i) => {
            let origin = item;
            let dest = vm.order.Master.Item904[i];

            if (origin.CodeOv === dest.CodeOv) {
              return Object.assign(item, dest);

            } else {
              return item;
            }
          });
        } else {
        // console.log('8u8u8u8 vm.raItens NÃO EXISTE, pega da ordem', vm.order.Master.Item904);
          vm.raItens = vp.raItens = vm.order.Master.Item904;
        }

        updateTableOrderItems(vm.raItens, "load Order");
        loadRedispatchData();

        return vm.order;
      }, localService.errorHandler);

    }

    function loadRedispatchData() {
      // ORDER tem apenas 1 centro
      // ou seja, os dados de redespacho vão para os únicos campos da tela
      // carrega customer
      let cnpj = vm.order.Master.Item904[0].CnpjRedisp;
      if(cnpj != ''){
        vm.isRedesp = true;
      }else{
        vm.isRedesp = false;
      }

      let infoCnpj = getRedespachoData(cnpj);

      if ( ! infoCnpj) return;

      return infoCnpj.then(function (data) {
        if (data) {
          vm.redespacho = data;
          vm.redespacho.ComplCli = vm.redespacho.Complemento;
        }
        return data;
      });
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

    function requestRedispatchData(CodeDelivLoc) {
      if (CodeDelivLoc) {
        let CodeCli = CodeDelivLoc;
        dataService.postData('CustomerDetail', { CodeCli })
        .then(function({ Results }) {
          let client = Results;
          let address = client.Master.Address;
          let principal = address.filter(x => x.TpAdrCli === "CLI")[0];
        });
      }
    }

    function goToRaAdd() {
      var atLeastOneSelected = false;
      vp.raItens.forEach(function (item) {
        atLeastOneSelected = atLeastOneSelected || item.raSelected;
      });

      if ( ! atLeastOneSelected) {
        localService.openModal('Por favor selecione pelo menos 1 item para continuar.');
        return;
      }

      vp.tempRaCache[raNF] = vp.raItens;
      $state.go('ras-add', { id: raNF, CodeOv: CodeOv });
    }

    function updateTableOrderItems(items, origin) {
        if (items) {
          $scope.tableOrderItems = items;
        } else {
          console.log("898u98u updateTableOrderItems NO ITEMS TO UPDATE", items, origin);
        }
    }
  }
})();
