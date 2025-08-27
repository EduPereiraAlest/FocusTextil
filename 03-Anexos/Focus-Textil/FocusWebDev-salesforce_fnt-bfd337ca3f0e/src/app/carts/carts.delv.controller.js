/* global utils:true */

(function () {
  'use strict';
  angular.module('app')
    .controller('CartsDelvController', CartsDelvController);
  CartsDelvController.$inject = ['$scope', '$state', 'localService', 'dataService'];

  /* @ngInject */

  function CartsDelvController($scope, $state, localService, dataService) {
    const vm = this;
    const openModal = localService.openModal;
    const parseDate = utils.helpers.parseDate;

    var isEfocusCustomer = localService.getData('isEfocusCustomer');
    var undoRedispHandle = "{}";

    $scope.isEfocusCustomer = isEfocusCustomer;
    $scope.EditRedispFields = {};
    $scope.registerRedispDataVisible = false;
    $scope.updateRedispDataVisible = false;

    vm.RedispatchOk = true;
    vm.isRedispatchEdit = false

    vm.sendKart = sendKart;
    vm.cartConfirmation = cartConfirmation;
    vm.backKart = backKart;
    vm.parseCurr = utils.helpers.parseCurr;
    vm.backToCarts = backToCarts;
    vm.getRedespachoData = getRedespachoData;
    vm.activateRedispCentro = activateRedispCentro;
    vm.changeRedispCentro = changeRedispCentro;
    vm.registerRedispData = registerRedispData;
    vm.updateRedispData = updateRedispData;
    vm.cancelUpdateRedispData = cancelUpdateRedispData;
    vm.changeDeliveryLocation = changeDeliveryLocation;

    vm.redespachoData = {};
    vm.redespachoModel = {};
    vm.redispModel = {};
    vm.RedispatchRequiredCenter = {};
    vm.RedispatchFilledCenter = {};
    vm.RedispCondition = [];

    let origins = {
      'T101': 'ES',
      'T103': 'SC',
      'T104': 'ES',
      'T105': 'PE',
      'T106': 'CE'
    };
    vm.origins = origins;
    vm.RedispatchRequired = false;

    vm.options = {};
    vm.page = {
      currency: 'BRL',
      deadline: 'Z013',
      date: '',
      delivery: '',
      total: 0,
      qaorder: ''
    };

    activate();

    function activate() {
      vm.kart = localService.getData('kart');
      vm.pages = localService.getData('pages');

      vm.page = {
        ...vm.page,
        currency: vm.kart.Master.CodeCurr,
        deadline: vm.kart.Master.PayCond
      };

      vm.kart.Master.CodeDelivLoc = vm.kart.Master.CodeDelivLoc || vm.kart.Master.CodeCli;


      //TO:DO set to get in Redisp902
      if (vm.kart.Master.Editavel) {
        for (let item of vm.kart.Master.Item902) {
          vm.redispCenterSelected = item.Centro;
          getRedespachoData(item.CnpjRedisp, vm.redispCenterSelected);
        }
      } else {
        try {
          setTimeout(() => {
            vm.redispCenterSelected = vm.kart.Master.Redisp902[0].Centro;
            getRedespachoData(vm.kart.Master.Redisp902[0].CnpjRedisp, vm.redispCenterSelected);
          }, 1300);
          /*
          for (let item of vm.kart.Master.Redisp902) {
            vm.redispCenterSelected = vm.kart.Master.Redisp902[0].Centro;
            getRedespachoData(vm.kart.Master.Redisp902[0].CnpjRedisp, vm.redispCenterSelected);
          }
          */
        } catch (e) {

        }
      }

      if (vm.kart.Master.CodeOv) {
        console.log('vai virar true...')
        vm.isRedispatchEdit = true
      }


      console.log('[Activate Cars Delv]', vm.kart, vm.page);
      return cartOptions();
    }

    function cartOptions() {
      return dataService
        .postData('ShoppingCartOptions', { CodeCli: vm.kart.Master.CodeCli })
        .then(({ Results }) => {
          let CndistCli = Results.CndistCli;
          delete Results.CndistCli;

          _.each(Results, (value, key) => {
            vm.options[key] =
              key === 'Address'
                ? parseOptions(value, ['CodeCli', 'Razao01Cli'])
                : parseOptions(value);
          });

          vm.delivery = Results.Address;
          if (vm.kart.Master["Redispatch"] == "X") {
            //if (vm.kart.Master["Redispatch"] === "0") {
            vm.page.delivery = "X";

          } else {
            vm.page.delivery = "";

          }

          if (
            (
              (!!vm.options.Address.length && !vm.kart.Master.CodeOv) ||
              (vm.kart.Master.Editavel && (vm.kart.Master.CodeCli != vm.kart.Master.CodeDelivLoc))
            ) && (
              !(vm.kart.Master.TipoOrdem == 'ZVSR' || vm.kart.Master.TipoOrdem == 'ZVSF')
            )
          ) {
            localService.openModal('Este cliente possui mais de um Local de Entrega.');
          }

          var hasDIFAL = CndistCli === '0002';
          if (hasDIFAL) {
            localService.openModal('Cliente com incidência de DIFAL');
          }

          loadCartCenters(vm.kart);

          return vm.options;
        }, localService.errorHandler);
    }

    function changeDeliveryLocation() {
      loadCartCenters(vm.kart);
    }

    function updateCartData(cart) {
      localService.setData('kart', cart);
      vm.kart = cart;
    }

    function cancelUpdateRedispData(centro) {
      vm.redispModel = JSON.parse(undoRedispHandle);
      undoRedispHandle = "{}";
      $scope.updateRedispDataVisible = true;
      $scope.EditRedispFields[centro] = false;
      $scope.registerRedispDataVisible = false;
    }

    function enableEditRedisp(centro) {
      undoRedispHandle = JSON.stringify(vm.redispModel);
      $scope.updateRedispDataVisible = true;
      $scope.EditRedispFields[centro] = true;
      $scope.registerRedispDataVisible = false;
    }

    function onRedispSaved(centro, data) {
      setCentroFilled(centro, data);
      $scope.updateRedispDataVisible = true;
      $scope.EditRedispFields[centro] = false;
      $scope.registerRedispDataVisible = false;
    }

    function updateRedispData(centro) {
      let isSaving = $scope.EditRedispFields[centro];
      let formElement = vm.redform.$$element[0];
      if (isSaving) {
        if (formElement.reportValidity()) {
          registerRedispData(centro).then((data) => {
            validateRedispCondition(centro, data);
            onRedispSaved(centro, data);
          });
        }
      } else {
        enableEditRedisp(centro);
      }
    }

    function registerRedispData(centro) {
      return dataService.postData('RegisterRedisp', vm.redispModel)
        .then(function (data) {
          setCentroFilled(centro, data);
        });
    }

    function getRedispCondition(done) {
      dataService.postData('RedispCondition')
        .then(function ({ Results }) {
          vm.RedispCondition = Results;
          done(Results);
        });
    }

    function getCustomerData(cart, done) {
      let CodeCli = cart.Master.CodeDelivLoc || cart.Master.CodeCli;
      dataService.postData('CustomerDetail', { CodeCli })
        .then(function ({ Results }) {
          let client = Results;
          let address = client.Master.Address;
          let principal = address.filter(x => x.TpAdrCli === "CLI")[0];
          let transpzone = principal.Transpzone;

          for (let item of cart.Master.Item902) {
            item.rotaDestino = transpzone;
            item.rota = item.rotaOrigem + item.rotaDestino;
            //TO:DO Get Rota for tons
            for (let itemTon of item.Tons) {
              itemTon.rota = itemTon.rotaOrigem + item.rotaDestino;
            }
          }

          vm.cartRoutes = cart.Master.Item902.map(x => x.rota);

          updateCartData(cart);

          done(cart);
        });
    }

    function verifyRedispCondition(condition, cart, isChangeDeliveryLocation) {
      let required = condition;
      let isRequired = route => required.indexOf(route) !== -1;

      //vm.page.delivery = "";
      vm.RedispatchRequired = false;
      vm.RedispatchOk = true;


      for (let item of cart.Master.Item902) {
        if (isChangeDeliveryLocation) {
          for (let itemTon of item.Tons) {
            vm.RedispatchRequiredCenter[itemTon.centro] = false;
          }
        } else {
          vm.RedispatchRequiredCenter[item.Centro] = false;
        }
      }


      for (let item of cart.Master.Item902) {
        let isRotaRequired = false;
        let RedispRequiredCenterControl = false;

        for (let itemTon of item.Tons) {
          isRotaRequired = isRequired(itemTon.rota);

          let isTypeRedispAllowed = item.TpStockCode === "L" || item.TpStockCode === "N";
          let isRedispatchRequired = isRotaRequired && isTypeRedispAllowed;
          if (item.TpStockCode === "L") isRedispatchRequired = true

          if (isRedispatchRequired) {
            //if(itemTon.QtdProntEntreg > 0 || itemTon.QtdAtc > 0){
            vm.page.delivery = "X";
            vm.RedispatchRequired = true;
            vm.RedispatchOk = false;
            item.RedispatchRequired = true;
            if (vm.kart.Master.Editavel) {
              if (!RedispRequiredCenterControl) {
                vm.RedispatchRequiredCenter[itemTon.centro] = true;
                RedispRequiredCenterControl = true
              }
            } else {
              vm.RedispatchRequiredCenter[itemTon.centro] = true;
              RedispRequiredCenterControl = true
            }

            if(!(vm.cartCenters.filter(center => center === 'T104').length > 0)){
              vm.cartCenters.push('T104');
              vm.RedispatchRequiredCenter['T104'] = true;
            }
            //}
            /*else{
              vm.RedispatchRequiredCenter[itemTon.centro] = false;
            }
            */

          } else {
            item.RedispatchRequired = false;
          }

        }
      }





      updateCartData(cart);

      recoverRedispData(cart);

      ////TO:DO Checar centro obrigaório e selecionar o mesmo
      if (vm.cartCenters && vm.cartCenters.length > 1) {
        for (let itemCenter of vm.cartCenters) {
          if (vm.RedispatchRequiredCenter[itemCenter]) {
            //activateRedispCentro(itemCenter);
            changeRedispCentro(itemCenter)
            return false;
          }
        }
      } else {
        changeRedispCentro(vm.cartCenters[0]);
        //activateRedispCentro(vm.cartCenters[0]);
      }
    }

    function loadCartCenters(cart) {
      let allcenters = [];
      let centers

      for (let item of cart.Master.Item902) {
        //TO:DO set rotaOrigem here

        for (let itemTon of item.Tons) {
          itemTon.rotaOrigem = origins[itemTon.centro];
        }

        item.rotaOrigem = origins[item.Centro];

        for (let itemTon of item.Tons) {
          //if (itemTon.QtdProntEntreg > 0 || itemTon.QtdAtc > 0){
          allcenters.push(itemTon.centro);
          //}
        }
      }

      if (vm.isRedispatchEdit == true) {
        let oneCenters = cart.Master.Item902.map(item => item.Centro);
        centers = [...new Set(oneCenters)].sort();
      } else {
        centers = [...new Set(allcenters)].sort();
      }

      if(vm.kart.Master.Item902.filter(item => item.RedispatchRequired).length > 0){   //obrigatoriedade de redespacho para centro t104
        if(!(centers.filter(center => center === 'T104').length > 0)){
          centers.push('T104');
          vm.RedispatchRequiredCenter['T104'] = true;
        }
      }
      // let allCenters = cart.Master.Item902.map(item => item.Centro);

      // let centers = [...new Set(allcenters)].sort();
      vm.cartCenters = centers

      for (let centro of centers) {
        setRedespachoModel(centro, null);
      }

      getCustomerData(cart, function (cart) {
        getRedispCondition(function (condition) {
          // console.log("y7y7y7y condition", condition);
          verifyRedispCondition(condition, cart, true);
        });
      })
    }

    function parseOptions(list, params = _.keys(list[0])) {
      return list.map(item => ({
        name: item[params[1]] || item[params[0]],
        value: item[params[0]]
      }));
    }

    function recoverRedispData(cart) {
      if (cart.Master.Editavel) {
        for (let item of cart.Master.Item902) {
          if (item.RedispatchRequired && item.CnpjRedisp) {
            getRedespachoData(item.CnpjRedisp, item.Centro);
          }
        }
      } else {
        try {
          for (let item of cart.Master.Redisp902) {
            getRedespachoData(item.CnpjRedisp, item.Centro);
          }
        } catch (e) {

        }
      }
      updateCartData(cart);
    }

    // Validando se existe algum centro selecionado...
    function validationCenters() {
      let isValid = false
      const redisp = vm.kart.Master.Redisp902

      // ir nos redisp, caso achar um com um centro colocar true
      for (const centers of redisp) {
        centers.center ? isValid = true : isValid
        if (isValid) {
          break
        }
      }

      // se tiver centro nao necessario colocar centro em todos...
      if (isValid) {
        return null
      }

      // caso tiver, pegar os dados do redisp e repilha em todos os centros...
      const redips = []
      for (let x = 0; x < vm.cartCenters.length; x++) {
        const data = {
          ...redisp[0],
          Centro: vm.cartCenters[x]
        }
        redips.push(data)
      }

      return vm.kart.Master.Redisp902 = redips

    }

    function cartConfirmation() {
      if (!vm.kart.Master.Editavel) {
        updateRedispValidation();

        if (vm.kart.Master.Redisp902) validationCenters()

        //Verfica os centros que não estão preenchidos
        const validCenters = vm.cartCenters.filter((centro) => !vm.redespachoData[centro]);

        if (vm.RedispatchOk) {
          vm.kart.Master.Redispatch = vm.page.delivery;

          saveCartData().then(function () {
            $state.go('carts-confirmation');
          });
        } else if(validCenters){
          localService.openModal(`Por favor preencha os dados obrigatórios do centro ${validCenters[0]}`);
        }
        else {
          localService.openModal('Por favor preencha os dados obrigatórios de redespacho antes de continuar.');
        }
      } else {
        vm.kart.Master.Redispatch = vm.page.delivery;

        saveCartData().then(function () {
          $state.go('carts-confirmation');
        });
      }
    }

    function sendKart() {
      _.extend(vm.kart.Master, setKartAttrs(vm.kart.Master));

      vm.redform.$setSubmitted();

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

    function backKart(event) {
      console.log('[backKart]', event, vm.kart);

      if (
        event &&
        event.relatedTarget &&
        event.relatedTarget.classList.contains('ordem-concluir')
      ) {
        console.log("CANCEL SAVE BACKUP KART !");
        return;
      }

      return saveCartData();
    }

    function saveCartData() {

      return dataService
        .postData('SaveShoppingCart', {
          Cart: angular.toJson(vm.kart),
          Check: 'false'
        })
        .then(res => {
          localService.setData('kart', vm.kart);
        }, localService.errorHandler);
    }

    function saveRedespachoModel(centro, model) {
      let saved = {};

      saved.CnpjAdr = model.CnpjRedisp; // CNPJ
      saved.BairroCli = model.NeighRedisp; // : "Jardim Presidente Dutra"
      saved.CepCli = model.PostCodRedisp.replace(/[^\d]/g, ''); // : "07172-100"
      saved.CityCli = model.CityRedisp; // : "Guarulhos"
      saved.Complemento = model.ComplRedisp; // : ""
      saved.Email = model.ContactRedisp; // : ""
      saved.FoneAdr = model.PhoneRedisp; // : ""
      saved.InscEstAdrCli = model.InsSttRedisp; // : "796348278111"
      saved.LogrCli = model.AddrRedisp; // : "Marinópolis"
      saved.NumHouseCli = model.NumAddrRedisp; // : "773"
      saved.Razao01Cli = model.NmTransRedisp; // : "TPL LOGISTICA NORTE LTDA"
      saved.Suframa = model.SufrRedisp; // : ""
      saved.UfCliAdr = model.StateRedisp; // : "SP"

      vm.redespachoData[centro] = saved;
    }

    function setRedespachoModel(centro, model, cnpj) {
      let res = model;
      if (res) {
        vm.redespachoData[centro] = res;
        vm.redispModel.CnpjRedisp = res.CnpjAdr; // CNPJ
        vm.redispModel.NeighRedisp = res.BairroCli; // : "Jardim Presidente Dutra"
        vm.redispModel.PostCodRedisp = res.CepCli.replace(/[^\d]/g, ''); // : "07172-100"
        vm.redispModel.CityRedisp = res.CityCli; // : "Guarulhos"
        vm.redispModel.ComplRedisp = res.Complemento; // : ""
        vm.redispModel.ContactRedisp = res.Email; // : ""
        vm.redispModel.PhoneRedisp = res.FoneAdr; // : ""
        vm.redispModel.InsSttRedisp = res.InscEstAdrCli; // : "796348278111"
        vm.redispModel.AddrRedisp = res.LogrCli; // : "Marinópolis"
        vm.redispModel.NumAddrRedisp = res.NumHouseCli; // : "773"
        vm.redispModel.NmTransRedisp = res.Razao01Cli; // : "TPL LOGISTICA NORTE LTDA"
        vm.redispModel.SufrRedisp = res.Suframa; // : ""
        vm.redispModel.StateRedisp = res.UfCliAdr; // : "SP"
        vm.redispModel.Lifnr = res.Lifnr;

      } else {
        vm.redispModel.CnpjRedisp = cnpj || "";
        vm.redispModel.NeighRedisp = "";
        vm.redispModel.PostCodRedisp = "";
        vm.redispModel.CityRedisp = "";
        vm.redispModel.ComplRedisp = "";
        vm.redispModel.ContactRedisp = "";
        vm.redispModel.PhoneRedisp = "";
        vm.redispModel.InsSttRedisp = "";
        vm.redispModel.AddrRedisp = "";
        vm.redispModel.NumAddrRedisp = "";
        vm.redispModel.NmTransRedisp = "";
        vm.redispModel.SufrRedisp = "";
        vm.redispModel.StateRedisp = "";
        vm.redispModel.Lifnr = "";
      }
    }

    function setCentroFilled(centro, data) {
      if (data && !data.error && data.Lifnr) {
        for (let item of vm.kart.Master.Item902) {
          //if (item.Centro === centro) {
          item.Lifnr = data.Lifnr;
          item['CnpjRedisp'] = data.CnpjAdr;
          //}
        }


        if (vm.kart.Master['Redisp902'] == undefined) {
          vm.kart.Master['Redisp902'] = [];

        }

        var item = vm.kart.Master.Redisp902.find(item => item.Centro == centro);

        if (item) {
          var indexForRemoval = vm.kart.Master.Redisp902.findIndex(item => item.Centro == centro);
          //remove item and add update
          vm.kart.Master.Redisp902.splice(indexForRemoval, 1);

        }

        vm.kart.Master.Redisp902.push({
          CodeCli: vm.kart.Master.CodeCli,
          CodePv: vm.kart.Master.CodePv,
          Centro: centro,
          CodRedespacho: data.Lifnr,
          CnpjRedisp: (data.CnpjAdr || data.CnpjRedisp)
        });


        vm.RedispatchFilledCenter[centro] = (data.CnpjAdr || data.CnpjRedisp).replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");

        updateRedispValidation();
        updateCartData(vm.kart);

        $scope.EditRedispFields[centro] = false;
        $scope.updateRedispDataVisible = true;


      } else {
        console.log("ERROR SETTING REDISP DATA", data);
      }
    }

    function updateRedispValidation() {
      let centros = Object.keys(vm.RedispatchRequiredCenter);

      let valid = centros.reduce((isOk, centro) => {
        return isOk &&
          (
            vm.RedispatchFilledCenter[centro] ||
            !vm.RedispatchRequiredCenter[centro]
          ) &&
          (
            (
              vm.redespachoData[centro] &&
              !vm.redespachoData[centro].invalidRoute
            ) ||
            !vm.RedispatchRequiredCenter[centro]
          );
      }, true);

      if (valid) {
        vm.RedispatchOk = true;
      } else {
        vm.RedispatchOk = false;
      }
    }

    function validateRedispCondition(centro, data) {
      let origin = origins[centro];
      let destination = data.Transpzone;
      let route = origin + destination;
      let invalidRoute = vm.RedispCondition.indexOf(route) !== -1;

      if (invalidRoute) {
        if (vm.redespachoData[centro]) {
          vm.redespachoData[centro].invalidRoute = true;
        }

        vm.RedispatchFilledCenter[centro] = false;

        localService.openModal('Essa rota não é válida, por favor informe outro endereço para redespacho.');

        return false;
      }

      return true;
    }

    function getRedespachoData(cnpj, centro) {
      if (!cnpj) return;

      return dataService
        .postData('RedespachoData', { cnpj })
        .then(data => {
          if (data) {
            setRedespachoModel(centro, data, cnpj);

            setCentroFilled(centro, data);

            $scope.EditRedispFields[centro] = false;
            $scope.updateRedispDataVisible = true;
            $scope.registerRedispDataVisible = false;

            vm.page.delivery = 'X';
            vm.RedispatchRequired = true;

            validateRedispCondition(centro, data);

          } else {
            $scope.EditRedispFields[centro] = true;
            $scope.updateRedispDataVisible = false;
            $scope.registerRedispDataVisible = true;
            setRedespachoModel(centro, null, cnpj);
          }

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
        DataDelivLoc: vm.delivery
          ? _.chain(vm.delivery)
            .findWhere({ CodeCli: Master.CodeDelivLoc })
            .pick(attrs)
            .value()
          : '',
        Redispatch: vm.page.delivery,
        Angdt: parseDate(vm.page.date),
        QaOrder: vm.page.qaorder
      };

      vm.kart.Master.Item902.forEach(function (item) {
        item.QtdMaterial = item.Stock.QtdMaterial;
      });

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

    function activateRedispCentro(centro) {

      if (vm.redispCenterSelected) {
        // salva os valores do model inputado
        saveRedespachoModel(vm.redispCenterSelected, vm.redispModel);
      }

      // seta os valores do novo centro, se tiver
      setRedespachoModel(centro, vm.redespachoData[centro]);

      vm.redispCenterSelected = centro;
    }


    function changeRedispCentro(centro) {

      try {
        console.log(vm.RedispatchFilledCenter[centro]);
        var cnpj = vm.RedispatchFilledCenter[centro].replace(/[^\w\s]/gi, '');
        return dataService
          .postData('RedespachoData', { cnpj: cnpj })
          .then(data => {
            if (data) {
              setRedespachoModel(centro, data, cnpj);
              vm.redispCenterSelected = centro;
            } else {
              setRedespachoModel(centro, null, cnpj);
            }

          }, localService.errorHandler);
      } catch (e) {
        activateRedispCentro(centro)
      }
    }
  }
})();
