/* global utils:true */

(function() {
  'use strict';
  angular.module('app').controller('CartsConfirmationController', CartsConfirmationController);
  CartsConfirmationController.$inject = ['$scope', '$state', 'localService', 'dataService'];

  /* @ngInject */

  function CartsConfirmationController($scope, $state, localService, dataService) {
    // Prazo atual que a focus dá para venda programada é 150 dias
    const VALUE_MAX_ACTUAL_FOCUS_SCHEDULATION_SALES = 180
    const vm = this;
    const openModal = localService.openModal;
    const parseDate = utils.helpers.parseDateProgramada;
    let initialDate = new Date()

    vm.datePE = initialDate

    vm.formatDate = utils.helpers.parseDate

    var isEfocusCustomer = localService.getData('isEfocusCustomer');
    $scope.isEfocusCustomer = isEfocusCustomer;
    $scope.cnpjLoaded = false;

    vm.parseDate = parseDate
    vm.validationQualityRequest = validationQualityRequest
    vm.sendKart = sendKart;
    vm.backKart = backKart;
    vm.parseCurr = utils.helpers.parseCurr;
    vm.backToCarts = backToCarts;
    vm.backToDelivery = backToDelivery;
    vm.getRedespachoData = getRedespachoData;
    vm.showPremiere = showPremiere;
    vm.initialDateSchedule = initialDateSchedule
    vm.isEnableScheduledSale = isEnableScheduledSale
    vm.isScheduledSales = calculteStockByScheduleDate
    vm.isValidScheduledSale = false && isEnableScheduledSale()
    vm.maxAcceptSchduledSales = maxAcceptSchduledSales
    vm.sendKartPremiere = sendKartPremiere
    vm.closeModalPremiere = closeModalPremiere
    vm.options = {};
    vm.page = {
      currency: 'BRL',
      deadline: 'Z013',
      date: '',
      dateProgramado: '',
      confirmationPremiere: '',
      delivery: '',
      total: 0,
      qaorder: ''
    };

    activate();

    function initialDateSchedule ()  {
      if (!isEnableScheduledSale()) {
        vm.page.date = utils.helpers.parseDateProgramada(new Date())
        return vm.page.date
      } else {
        return ''
      }
    }

    function activate() {
      vm.kart = localService.getData('kart');
      vm.pages = localService.getData('pages');

      vm.page = {
        ...vm.page,
        currency: vm.kart.Master.CodeCurr,
        deadline: vm.kart.Master.PayCond
      };

      vm.kart.Master.CodeDelivLoc = vm.kart.Master.CodeDelivLoc || vm.kart.Master.CodeCli;

      if (vm.kart.Master.CnpjRedisp) {
        getRedespachoData(vm.kart.Master.CnpjRedisp);
      }

      // Caso existir uma data programada (Angdt e datePEProgramado são praticamente iguais)
      if (vm.kart.Master.Angdt !== null && vm.kart.Master.Angdt !== '' && vm.kart.Master.Angdt) vm.page.date = vm.kart.Master.Angdt

      return cartOptions();
    }

    /**
     * @info `Validação para habilitar o campo de qualidade do pedido`
     */
    function validationQualityRequest () {

      // Flag I = Cartão de crédito, não permite
      if (vm.kart.Master.Zlsch === "I") return true;

      // validar se tem algum material do tipo pilotagem, se tiver, bloquear
      const isMaterialStockP = vm.kart.Master.Item902.filter((itemKart) => itemKart.TpStockCode === 'P')
      if (isMaterialStockP.length) return true
      if (vm.kart.Master.Editavel) return true
      if (vm.options.QaOrder && !vm.options.QaOrder.length) return true

      return false
    }

    function cartOptions() {
      return dataService
        .postData('ShoppingCartOptions', { CodeCli: vm.kart.Master.CodeCli })
        .then(({ Results }) => {
          let CndistCli = Results.CndistCli;
          delete Results.CndistCli;

          // Mapear e remover itens do Qualidade do Pedido em branco
          Results.QaOrder =  Results.QaOrder.filter((opts) => {
            if (opts.Cod) return opts.Cod
          })

          console.log()

          _.each(Results, (value, key) => {
            vm.options[key] =
              key === 'Address'
                ? parseOptions(value, ['CodeCli', 'Razao01Cli'])
                : parseOptions(value);
          });

          vm.delivery = Results.Address;

          if (vm.kart.Master["Redispatch"] === "0") {
            vm.page.delivery = "X";

          } else {
            vm.page.delivery = "";

          }

          var hasDIFAL = CndistCli === '0002';
          if (hasDIFAL) {
            localService.openModal('Cliente com incidência de DIFAL');
          }

          return vm.options;
        }, localService.errorHandler);
    }

    function parseOptions(list, params = _.keys(list[0])) {
      return list.map(item => ({
        name: item[params[1]] || item[params[0]],
        value: item[params[0]]
      }));
    }

    function sendKart(premiere, dataProgramada) {
      _.extend(vm.kart.Master, setKartAttrs(vm.kart.Master));

      // vm.redform.$setSubmitted();

      var cartClone = JSON.parse(JSON.stringify(vm.kart));

      // SAP EXIGE CAMPO STRING, mas o campo da tela não permite
      cartClone.Master.NumAddrRedisp = typeof cartClone.Master.NumAddrRedisp === "undefined" ? "" : cartClone.Master.NumAddrRedisp;
      cartClone.Master.NumAddrRedisp += "";

      if (isEfocusCustomer) {
        cartClone.Master.Item902 = cartClone.Master.Item902.map(function (item) {
          var stock = item.Stock;
          stock.PrecoMaterial = "0.01";
          stock.PrcMat = "0.01";
          return item;
        });
      }

      //TO:DO SET premiere here
      if(premiere){
        cartClone.Master['Premiere'] = premiere;

        if(dataProgramada == ""){
          localService.openModal('Data inválida');
          return false;
        }

        if(dataProgramada != null){
          var AtcDelvArr = []
          cartClone.Master.Item902 = cartClone.Master.Item902.map(function (item) {
            if(item.DateAtcDelv){
              var DateAtcDelvObj = item.DateAtcDelv.split(",");
              var AtcDelv = DateAtcDelvObj[0].split("/");
              var d = new Date();
              d.setFullYear(AtcDelv[2], (AtcDelv[1] - 1), AtcDelv[0]);
              AtcDelvArr.push(d);
            }
            return item;
          });

          const maxDate = new Date(Math.max.apply(null, AtcDelvArr));

          if((maxDate.getTime() > new Date(dataProgramada).getTime())){
            cartClone.Master['DatePremiere'] = "" + maxDate.getDate() + "/" + (maxDate.getMonth() + 1) + "/" + maxDate.getFullYear();
          }else{
            var d = dataProgramada.split("-");
            cartClone.Master['DatePremiere'] = "" + d[2] + "/" + d[1] + "/" + d[0];
          }
        }
      }



      var shopCart = { Cart: angular.toJson(cartClone) };

      return vm.page.delivery && !vm.redform.$valid
        ? openModal('Dados de Redespacho Incorretos.')
        : dataService
            .postData('SendShoppingCart', shopCart)
            .then(({ Results }) => {
              openModal(Results);
              return _.delay(resetClient, 500);
            }, localService.errorHandler);
    }

    function closeModalPremiere () {
      const modal = document.querySelector("#modalPremiere")
      modal.style.display = "none";
      vm.page.dateProgramado = ''
      vm.page.confirmationPremiere = ''
    }


    function sendKartPremiere () {
      if(vm.page.dateProgramado != '' || vm.page.dateProgramado != undefined) {

        if ((new Date().getTime() > new Date(vm.page.dateProgramado).getTime())) {
          localService.openModal('Data inválida');
        } else{
          if(vm.page.dateProgramado == ""){
            localService.openModal('Data inválida');
          } else  {
            const modal = document.querySelector("#modalPremiere")
            modal.style.display = "none";
            sendKart("00" +vm.page.confirmationPremiere, vm.page.dateProgramado);
          }
        }
      }
    }

    function showPremiere() {

      localService.openModalPremiere().then(confirm => {
        if(confirm == 1){
          sendKart("00" + confirm, null);
        }

        if(confirm == 2){
          //TODO: foi implementado totalmente errado este modal, REFATORAR
          //Feito via vanilha para conseguir pegar o evento do click
          //O HTML está sem o NG-CONTROLLER, então toda implementação de change exige cuidado
          const modal = document.querySelector("#modalPremiere")
          // TODO: esse confirm vem do modal ???????? não era para existir validação assim, ajustado assim devido a necessidade


          modal.style.display = "block";

          window.addEventListener("click", (event) => {
            if (event.target === modal) {
              modal.style.display = "none";
            }
          });

          vm.page.dateProgramado = ''
          const valueDateProgram = document.querySelector('#dataProgramada')
          valueDateProgram.addEventListener('change', function (){
            vm.page.confirmationPremiere = confirm
            vm.page.dateProgramado = valueDateProgram.value
          })

        }

      });
    }


    function backKart(event) {
      if (
        event &&
        event.relatedTarget &&
        event.relatedTarget.classList.contains('ordem-concluir')
      ) {
        return;
      }

      return dataService
        .postData('SaveShoppingCart', {
          Cart: angular.toJson(vm.kart),
          Check: 'false'
        })
        .then(res => {
          localService.setData('kart', vm.kart);
        }, localService.errorHandler);
    }

    function getRedespachoData(cnpj) {
      if ( ! cnpj) return;
      return dataService
        .postData('RedespachoData', { cnpj })
        .then(res => {
          if (res) {
            vm.kart.Master.NeighRedisp = res.BairroCli; // : "Jardim Presidente Dutra"
            vm.kart.Master.PostCodRedisp = res.CepCli.replace(/[^\d]/g, ''); // : "07172-100"
            vm.kart.Master.CityRedisp = res.CityCli; // : "Guarulhos"
            vm.kart.Master.ComplRedisp = res.Complemento; // : ""
            vm.kart.Master.ContactRedisp = res.Email; // : ""
            vm.kart.Master.PhoneRedisp = res.FoneAdr; // : ""
            vm.kart.Master.InsSttRedisp = res.InscEstAdrCli; // : "796348278111"
            vm.kart.Master.AddrRedisp = res.LogrCli; // : "Marinópolis"
            vm.kart.Master.NumAddrRedisp = res.NumHouseCli; // : "773"
            vm.kart.Master.NmTransRedisp = res.Razao01Cli; // : "TPL LOGISTICA NORTE LTDA"
            vm.kart.Master.SufrRedisp = res.Suframa; // : ""
            vm.kart.Master.StateRedisp = res.UfCliAdr; // : "SP"
          } else {
            vm.kart.Master.NeighRedisp = "";
            vm.kart.Master.PostCodRedisp = "";
            vm.kart.Master.CityRedisp = "";
            vm.kart.Master.ComplRedisp = "";
            vm.kart.Master.ContactRedisp = "";
            vm.kart.Master.PhoneRedisp = "";
            vm.kart.Master.InsSttRedisp = "";
            vm.kart.Master.AddrRedisp = "";
            vm.kart.Master.NumAddrRedisp = "";
            vm.kart.Master.NmTransRedisp = "";
            vm.kart.Master.SufrRedisp = "";
            vm.kart.Master.StateRedisp = "";
          }

          $scope.cnpjLoaded = true;
        }, localService.errorHandler);
    }

    function setKartAttrs(Master) {
      const attrs = [
        'Razao01Cli',
        'LogrCli',
        'ComplCli',
        'NumHouseCli',
        'BairroCli',
        'CityCli',
        'UfCliAdr'
      ];

      var cartAttrs = {
        VsartDesc: Master.Vsart
          ? _.findWhere(vm.options.Expedition, { value: Master.Vsart }).name
          : '',
        DescMagazine: Master.NumMagazine
          ? _.findWhere(vm.options.Magazine, {
              value: Master.NumMagazine
            }).name
          : '',
        // DataDelivLoc: vm.delivery
        //   ? _.chain(vm.delivery)
        //       .findWhere({ CodeCli: Master.CodeDelivLoc })
        //       .pick(attrs)
        //       .value()
        //   : '',
        Angdt: vm.page.date,
        QaOrder: vm.page.qaorder
      };

      vm.kart.Master.Item902.forEach(function (item) {
        item.QtdMaterial = item.Stock.QtdMaterial;
      });

      console.log('cartAttrs', cartAttrs)
      return cartAttrs;
    }

    function resetClient() {
      localService.setData('kart', '');

      setPage({
        name: 'BOOKS',
        search: '',
        info: '',
        sort: '',
        filters: '',
        grammage: ''
      });

      return $state.go('home');
    }

    function setPage(page) {
      vm.pages = vm.pages || [];
      _.mergeBy(vm.pages, page, 'name');
      localService.setData('pages', vm.pages);
    }

    function backToCarts() {
      backKart().then(function () {
        $state.go('carts');
      });
    }

    function backToDelivery() {
      backKart().then(function () {
        $state.go('carts-delv');
      });
    }

    function calculteStockByScheduleDate () {
      const materialItems = vm.kart.Master.Item902
      let isScheduledSales = false

      for (const items of materialItems) {
        const quantityMaterial = items.Stock.QtdProntEntreg + items.Stock.QtdEstApos
        const quantityMaterialRequestUser = items.QtdMaterial
        if(quantityMaterialRequestUser > quantityMaterial) {
          isScheduledSales = true
          break
        }
      }
      return isScheduledSales
    }

    /**
     *
     * @Params vm.kart.Master.isFutureSales (Retorna do backend se o client é selecionado para fazer venda futura)
     * @params TpStockCode (Verificar dentro dos materiais do carrinho se existe algum com TpStockCode P, que é pilotagem)
     * @Result Boolean | Apenas retornar true se os dois acima satisfazerem a condição
     */
    function isEnableScheduledSale () {
      const enableScheduledSalesByClient = vm.kart.Master.isFutureSales ? true : false
      let isEnabledScheduleSaleForTypeStockPilotagem = true

      if (!vm.kart.Master.Item902.length) return true

      // Verificar dentro dos materiais do carrinho se existe algum com TpStockCode P, que é pilotagem
      for (const item of vm.kart.Master.Item902) {
        if (item.TpStockCode === 'P') {
          isEnabledScheduleSaleForTypeStockPilotagem = false
        }
      }

      if (isEnabledScheduleSaleForTypeStockPilotagem === true && enableScheduledSalesByClient === true) {
        return false
      } else {
        return true
      }
    }

    // validador de menssagem de data acima do que a focus faz
    // passar valor inserido ao DatePeProg de cada material para o carrinho
    function maxAcceptSchduledSales(event) {
      if(event && event.target.value){
        const formatterDateInsert = event.target.value.split('/')
        const insertDate = new Date(`${formatterDateInsert[2]}/${formatterDateInsert[1]}/${formatterDateInsert[0]}`)
        const dateNow = new Date()
        const calculedMaxDate = dateNow.setDate(dateNow.getDate() + VALUE_MAX_ACTUAL_FOCUS_SCHEDULATION_SALES)

        if (insertDate < calculedMaxDate) {
          localService.openModal('Data Programada inferior a 180 Dias. Não será possível a recompra')
        }

        const dateSales = formatterDate(insertDate)

        vm.page.date = dateSales
        vm.kart.Master.Item902.forEach((item) => {
          item.DatePeProg = dateSales
        })
      } else vm.page.date = ''
    }
  }

  function formatterDate (date) {
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const day = date.getDate().toString().padStart(2, '0')
    return `${day}/${month}/${year}`
  }

})();
