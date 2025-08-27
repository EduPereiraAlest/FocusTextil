/* global utils:true */

(() => {
  'use strict';
  angular.module('app').controller('CartsController', CartsController);
  CartsController.$inject = [
    '$scope',
    '$rootScope',
    '$state',
    "$timeout",
    'localService',
    'dataService',
    'rulesService',
    'params'
  ];

  /* @ngInject */

  function CartsController($scope, $rootScope, $state, $timeout, localService, dataService, rulesService, params) {
    const vm = this;
    const vp = $scope.$parent.vm;
    var blockPaymentMet = false;
    var errorList = [];
    var valoresList = [];
    var listaErrosTela = [];
    var listaWarningTela = [];

    // FUNCTIONS
    vm.setSuframa = setSuframa;
    vm.setPrice = setPrice;
    vm.saveKart = saveKart;
    vm.validarSalvarCarrinho = validarSalvarCarrinho;
    // vm.validarCarrinho = validarCarrinho;
    vm.getTotal = getTotal;
    vm.discardCart = discardCart;
    vm.parseCurr = utils.helpers.parseCurr;
    vm.blockPaymentMet = blockPaymentMet;
    vm.valoresList = valoresList;
    vm.existsMaterialZipperToDecimalPrice = false
    // vm.getMult = $scope.getMult();
    // vm.getMult = getMult;
    vm.params = params;
    vm.materials = [];
    vm.listaErrosTela = listaErrosTela;
    vm.listaWarningTela = listaWarningTela;
    vm.errorList = errorList;
    vm.showErrors = showErrors;
    vm.showWarnings = showWarnings;
    vm.page = {
      atc: false,
      currency: 'BRL',
      deadline: 'Z090',
      payment: [],
      total: 0
    };
    vm.activeBtnSuframa = '';
    vm.currs = [{
      name: 'BRL',
      value: 'BRL'
    }, {
      name: 'USD',
      value: 'USD'
    }];

    activate();

    $timeout(function () {
      if (vm.kart.Master.isSufr) {
        setSuframa(true, false);
      }
    }, 1000);


    function activate() {
      vp.activate();
      vm.kart = vp.kart || localService.getData('kart');

      if (!vm.kart || !vm.kart.Master.Item902) {
        return $state.go('home');
      }

      vm.kart.Master.Item902.forEach((item) => {
        if (item.MaterialZipper) vm.existsMaterialZipperToDecimalPrice = true
      })

      _.extend(vm.page, {
        currency: vm.kart.Master.CodeCurr || 'BRL',
        deadline: vm.kart.Master.PayCond || 'Z090',
        flag: vm.kart.Master.FlagSchedDeliv || false
      });

      setTimeout(function () {
        if (
          vm &&
          vm.kart &&
          vm.kart.Master &&
          vm.kart.Master.CodeCurr
        ) {
          vm.page.currency = vm.kart.Master.CodeCurr;
        } else {
          vm.page.currency = 'BRL';
        }
      }, 0);

      $scope.$watch('vm.page.currency', function (oldValue, newValue) {
        if (
          vm.kart &&
          vm.kart.Master &&
          vm.kart.Master.CodeCurr != vm.page.currency
        ) {
          vm.kart.Master.CodeCurr = vm.page.currency;
          $timeout(function () {

            if (vm.kart.Master.isSufr) {
              setPriceSuframa(true, false);
            }

          }, 1500);
        }
      });

      if (
        vm.kart &&
        vm.kart.Master &&
        vm.kart.Master.CodeOv
      ) {
        vm.kart.Master.CodeOvPrint = vm.kart.Master.CodeOv.replace(/^0+/, "");
      }

      return vm.kart.Master.Open ?
        setMaterials(vm.kart.Master.Item902) :
        console.log('[Activate Carts]');




    }

    function setMaterials(list) {
      const modelList = [];
      angular.forEach(list, item => {
        const parseCurr = utils.helpers.parseCurr;
        // let PrcUsd = item.PrcUsd || item.Price.PrecoUsd90;
        const model = {
          ...item
        };
        modelList.push(model);
      });

      vm.materials = _.sortBy(modelList, 'DescMat');

      return getTotal();
    }


    if (vm.kart.Master.TypeOv === 'Z03' || vm.kart.Master.TypeOv === 'Z19') {
      vm.blockPaymentMet = false;
    } else {
      vm.blockPaymentMet = true;
    }


    function saveKart(check) {
      if (window.cancelSaveKart) return;

      if (vm.page.payment.length) {
        _.extend(vm.kart.Master, setKartAttrs());
      }

      vm.page.online = navigator.onLine;

      if (vm.kart.Master && vm.kart.Master.Total) {
        const verifyValueTotal = acumuloValor()
        const isMaterialZipperToFourDecimalPrice = vm.existsMaterialZipperToDecimalPrice ? 4 : 2
        vm.kart.Master.Total = (parseFloat(verifyValueTotal, 10) + parseFloat(vm.page.ipi, 10)).toFixed(isMaterialZipperToFourDecimalPrice)
      }

      return dataService
        .postData('SaveShoppingCart', {
          Cart: angular.toJson(vm.kart),
          Check: check || 'false'
        })
        .then(res => {



          if (res.Results == 'Success') {
            vm.kart = res.Cart ? {
              ...res.Cart
            } : vm.kart;

            if (vm.kart.Master && vm.kart.Master.Item902 && vm.kart.Master.Item902.length) {
              let limits = getWarnings(vm.kart.Master.Item902);

              vm.materials = vm.kart.Master.Item902;
              vm.warnings = {
                ...res.Warnings,
                ...limits
              };

              localService.setData('kart', vm.kart);
              vp.kart = vm.kart;
              $scope.TotalCarrinhoVisual();
              var canContinue = !Object.keys(vm.warnings).length;
              if (check === 'true' && canContinue) {
                return $state.go('carts-delv');
              }
              return false;
            } else {
              console.log("!!!!!!! KART ITEMS NOT FOUND 77y98", vm.kart);
              localService.setData('kart', vm.kart);
              vp.kart = vm.kart;


              return $state.go('home');
            }

          }
          // return resetKart();
        }, errorHandlerV2);
    }

    function getWarnings(materials) {

      return materials
        .map(material => ({
          MaterialCode: material.MaterialCode,
          TpStockCode: material.TpStockCode,
          Error: rulesService.checkMaterialStockLimits(
            vm.params.StockLimits,
            material.Stock.QtdMaterial,
            material,
            vm.page.deadline,
            vm.kart.Master.Editavel
          ).Error
        }))
        .filter(material => material.Error);
    }

    function add(accumulator, a) {
      return accumulator + a;
    }

    function acumuloValor() {

      let list = vm.kart.Master.Item902
      vm.valoresList = [];
      angular.forEach(list, item => {
        if (item.Abgru != '') { // ignora item removido para calcular total
          return;
        }

        if (item.Stock.SegmentoEstoque) {
          const segprice = item.Price[item.Stock.SegmentoEstoque].SegmentPrice;
          if (segprice) {
            item.PrcMaterial = segprice.BRL;
            item.PrcBrl = segprice.BRL;
            item.PrcUsd = segprice.USD;
          }
        }

        const parseCurr = utils.helpers.parseCurr;
        let valorMaterial = item.PrcMaterial;
        let quantidadeMaterial = item.Stock.QtdMaterial;
        let subTotalItem = parseCurr(+valorMaterial * +quantidadeMaterial) || 0;
        vm.valoresList.push(parseFloat(subTotalItem.toString().replace(/\./g, "").replace(',', ".")));
      });

      vm.kart.Master.Total = vm.valoresList.reduce(add, 0);
      return vm.kart.Master.Total;
    }

    $scope.TotalCarrinhoVisual = function () {
      const isMaterialZipperToFourDecimalPrice = vm.existsMaterialZipperToDecimalPrice ? 4 : 2

      let valorPrincipal = 0;
      valorPrincipal = acumuloValor();
      const parseCurr = utils.helpers.parseCurr;
      vm.page.materialTotal = parseCurr(valorPrincipal, isMaterialZipperToFourDecimalPrice);
      vm.page.ipiTotal = parseCurr(vm.page.ipi, isMaterialZipperToFourDecimalPrice);
      vm.page.cartTotal = parseCurr(parseFloat(valorPrincipal, 10) + parseFloat(vm.page.ipi, 10), isMaterialZipperToFourDecimalPrice);
    }

    function validarSalvarCarrinho() {
      $scope.TotalCarrinhoVisual();

      if (vm.errorList.length == 0) {
        vm.saveKart('true', true);

      } else {
        vm.disableBtn = true;
      }
    }

    // function validarCarrinho(){
    //   if(vm.kart.Master.Item902){
    //     $scope.validaMultiplo();
    //     $scope.TotalCarrinhoVisual();
    //   }
    //  }

    $scope.$watch('vm.kart.Master.Item902', function (newVal, oldVal) {
      if (vm.kart.Master.Item902.length > 0) {

        if (vm.kart.Master.isSufr) {
          setPriceSuframa(true, false);
        }

        $scope.validaMultiplo();
        $scope.validaWarning();
        $scope.TotalCarrinhoVisual();
      }
    }, true);

    $scope.$watch('vm.kart.Master.PayCond', function (newVal, oldVal) {
      if (vm.kart.Master.Item902.length > 0) {

        if (vm.kart.Master.isSufr) {
          setPriceSuframa(true, false);
        }

        $scope.validaMultiplo();
        $scope.validaWarning();
        $scope.TotalCarrinhoVisual();
      }
    }, true);

    $scope.$watch('vm.kart.Master.CodeCurr', function (newVal, oldVal) {
      if (vm.kart.Master.Item902.length > 0) {

        if (vm.kart.Master.isSufr) {
          setPriceSuframa(true, false);
        }

        $scope.validaMultiplo();
        $scope.validaWarning();
        $scope.TotalCarrinhoVisual();
      }
    }, true);


    $scope.validaWarning = function () {
      vm.warningsBtn = false;
      let warnings = undefined;
      vm.warningList = []

      return vm.kart.Master.Item902.map(material => ({
        Error: rulesService.checkStockCentro(
          material.MaterialCode,
          material.Centro,
          material.Stock.QtdProntEntreg,
          vm.kart.Master.Editavel,
          material.DateAtcDelv
        ).Error
      }))
        .filter(material => {
          material.Error;
          warnings = material.Error;
          vm.warningList.push(warnings);
          vm.warningList.join(" ");
          vm.warningList = vm.warningList.filter(function (element) {
            return element !== undefined;
          });
          let len = vm.warningList.length, i;
          for (i = 0; i < len; i++)
            vm.warningList[i] && vm.warningList.push(vm.warningList[i]);
          vm.warningList.splice(0, len);
          vm.warningList = RemoveDuplicate(vm.warningList);
          vm.listaWarningTela = vm.warningList.join();
          vm.listaWarningTela = vm.listaWarningTela.replace(/,/g, '');
          if (warnings) {
            switch (warnings) {
              case warnings:
                vm.warningsBtn = true;
                break;
              case warnings = undefined:
                vm.warningsBtn = false;
                break;
              default:
                vm.warningsBtn = false;
            }
          }

        });



    }

    $scope.validaMultiplo = function () {
      vm.disableBtn = false;
      let erro = undefined;
      vm.errorList = [];

      return vm.kart.Master.Item902.map(material => ({
        Error: rulesService.checkMultiple(
          material.Stock.QtdMaterial,
          (material.StockMATC) ? material.StockMATC : material.Stock.QtdEstApos,
          vm.kart.Master.PayCond,
          material.MaterialCode,
          material.Stock.QtdProntEntreg,
          material.QtdeMultiplo,
          material.CorteMin,
          material.TpStockCode,
          material.Abgru,
          vm.kart.Master.Editavel,
          material.QtdMaterialOrg,
          material.DateAtcDelv,
          material.StockATC,
          material.QtdMaterialOld,
          vm.kart.Master.isPE
        ).Error
      }))
        .filter(material => {
          material.Error;
          erro = material.Error;
          vm.errorList.push(erro);
          vm.errorList.join(" ");
          vm.errorList = vm.errorList.filter(function (element) {
            return element !== undefined;
          });
          let len = vm.errorList.length, i;
          for (i = 0; i < len; i++)
            vm.errorList[i] && vm.errorList.push(vm.errorList[i]);
          vm.errorList.splice(0, len);
          vm.errorList = RemoveDuplicate(vm.errorList);
          vm.listaErrosTela = vm.errorList.join();
          vm.listaErrosTela = vm.listaErrosTela.replace(/,/g, '');
          if (erro) {

            switch (erro) {
              case erro:
                vm.disableBtn = true;
                break;
              case erro = undefined:
                vm.disableBtn = false;
                break;
              default:
                vm.disableBtn = false;
            }
          }

        });
    }





    function RemoveDuplicate(a) {
      var seen = {};
      return a.filter(function (item) {
        return seen.hasOwnProperty(item) ? false : (seen[item] = true);
      });
    }

    function showErrors() {
      localService.openModalError(vm.listaErrosTela);
    }

    function showWarnings() {
      localService.openModalWarning(vm.listaWarningTela);
    }


    function resetKart(avoidGoHome) {
      return dataService
        .postData('OpenShoppingCart', {
          CodeCli: vm.kart.Master.CodeCli
        })
        .then(({
          Results
        }) => {
          let {
            NomeCli,
            AntCli
          } = vm.kart.Master;
          let Master = {
            NomeCli,
            AntCli,
            ...Results.Master
          };

          localService.setData('kart', {
            ...vm.kart,
            Master
          });

          if (avoidGoHome) {
            return;
          } else {
            return $state.go('home');
          }

        }, errorHandler);
    }

    function discardCart() {
      return localService.confirmModal('Deseja realmente descartar o carrinho?').then(confirm => {
        if (confirm) {
          return resetKart(true).then(function () {
            var localCart = localService.getData('kart');
            localCart.Master.Item902 = [];
            localCart.Master.Redisp902 = [];
            vm.kart.Master.Item902 = [];
            vm.kart.Master.Redisp902 = [];
            localService.setData('kart', localCart);
            vm.materials = [];
            if (
              vm &&
              vm.kart &&
              vm.kart.Master &&
              !vm.kart.Master.Editavel
            ) {
              vm.saveKart();
            }

            return $state.go('home');
          });
        }
      });
    }

    function setKartAttrs() {
      return {
        Open: vm.materials.length !== 0,
        CodeCurr: vm.page.currency,
        Zlsch: vm.page.payment.find(x => x.value === vm.page.deadline).Zlsch,
        PayCond: vm.page.deadline,
        FlagSchedDeliv: vm.page.flag ? 'X' : '',
        PayCondDesc: _.findWhere(vm.page.payment, {
          value: vm.page.deadline
        }).desc,
        Total: (parseFloat(vm.kart.Master.Total, 10) + parseFloat(vm.page.ipi, 10)).toFixed(2),
        Item902: vm.materials
      };
    }

    $rootScope.$on("CallParentMethod", function () {
      vm.saveKart();
    });

    function checkPayment() {
      let deadline;
      let data = {
        CodeCli: vm.kart.Master.CodeCli,
        ValorTotal: vm.page.total || 10,
        Type: vm.page.currency,
        Ov: vm.page.deadline
      };

      return dataService.postData('PaymentCondition', data).then(({
        Results
      }) => {

        //TO:DO Regras do chamado 150596.01
        //Quando o representante colocar uma OV a prazo, não permitir alterar o prazo de pagamento para antecipado.
        //Quando for antecipado, bloquear o botão de condição de pagamento.
        //regra aplicada somente na edição

        vm.page.payment = parsePay(Results);
        deadline = getDeadline();
        vm.page.deadline = deadline.value || vm.page.deadline;

        if (vm.kart.Master.Editavel) {
          if (vm.page.deadline != 'A001') {
            vm.page.payment = vm.page.payment.filter(x => {
              return x.value != 'A001';
            });
          }
          else {
            vm.page.payment = vm.page.payment.filter(x => {
              return x.value == 'A001';
            });
          }
          const seen = new Set();
          const filteredArr = vm.page.payment.filter(el => {
            const duplicate = seen.has(el.value);
            seen.add(el.value);
            return !duplicate;
          });

          vm.page.payment = filteredArr;

        }

        return setPrice();
      }, localService.errorHandler);
    }

    function parsePay(results) {
      return results.map(pay => ({
        name: parsePrz(pay.PrzMed) + pay.PayCondDesc,
        Zlsch: pay.Zlsch,
        desc: pay.PayCondDesc,
        prz: pay.PrzMed,
        value: pay.PayCond
      }));
    }

    function parsePrz(num) {
      return parseInt(num, 10) > 0 ? '(' + num + ') ' : '';
    }

    function setPrice() {
      let currPrice = 'Preco' + vm.page.currency.capitalize();
      let finance = vm.params.FinancyFactor;
      let deadline = getDeadline();

      angular.forEach(
        vm.materials,
        function (material) {
          const isMaterialZipperToFourDecimalPrice = material.MaterialZipper ? 4 : 2

          return (material.Price[material.Segmento].PrcMat[currPrice + '90'] = rulesService
            .calcFinancy(
              parseFloat(parseWithComma(material.Price[material.Segmento].PrcMat[currPrice]), 10),
              +deadline.prz,
              finance.FatorRedutor,
              finance['FatorFinanceiro' + vm.page.currency],
              false
            )
            .toFixed(isMaterialZipperToFourDecimalPrice));
        }
      );

      /*
    angular.forEach(
      vm.materials,
      function (material) {
        console.log(currPrice.toUpperCase())
        console.log(material.Price[material.Segmento].Price[vm.page.currency.toUpperCase()])
        return (material.Price[material.Segmento].PrcMat[currPrice + '90'] = rulesService
          .calcFinancy(
            parseFloat(parseWithComma(material.Price[material.Segmento].Price[vm.page.currency.toUpperCase()]), 10), //parseFloat(parseWithComma(material.Price[material.Segmento].PrcMat[currPrice]), 10),
            +deadline.prz,
            finance.FatorRedutor,
            finance['FatorFinanceiro' + vm.page.currency],
            false
          )
          .toFixed(2));
      }
    );
      */


      return _.delay(saveKart, 300);
    }

    function setSuframa(isSetPrice, isResetPrice) {
      let currPrice = 'Preco' + vm.page.currency.capitalize();
      let currPriceSufr = 'Prc' + vm.page.currency.capitalize();
      let finance = vm.params.FinancyFactor;
      let deadline = getDeadline();

      console.log("SCOPE =========")
      console.log($scope);

      if (vm.activeBtnSuframa == '') {
        console.log("Ligou suframa")
        vm.activeBtnSuframa = 'activeBtnSuframa';
        angular.forEach(
          vm.materials, function (material) {
            if (isSetPrice) {
              material.Price[material.Segmento].Price.BRL = material.suframa.PrcBrl; //material.Price[material.Segmento].Price.BRL = material.suframa.PrcBrl;
              material.Price[material.Segmento].Price.USD = material.suframa.PrcUsd;//material.Price[material.Segmento].Price.USD = material.suframa.PrcUsd;
            }
            else {
              material.Price[material.Segmento].Price.BRL = material.suframa.PrcBrl; //material.Price[material.Segmento].Price.BRL = material.suframa.PrcBrl;
              material.Price[material.Segmento].Price.USD = material.suframa.PrcUsd;//material.Price[material.Segmento].Price.USD = material.suframa.PrcUsd;
              material.Price[material.Segmento].PrcMat.PrecoBrl90 = material.suframa.Prc90Brl;
              material.Price[material.Segmento].PrcMat.PrecoUsd90 = material.suframa.Prc90Usd;
            }


            /*
            //Valor Padrão CASH sendo adicionado no preço venda
            material.PrcBrl = material.suframa.PrcBrl;
            material.PrcUsd = material.suframa.PrcUsd;
            */
            if (isResetPrice) {
              //material.PrcBrl = parseWithComma(material.suframa.Prc90Brl);
              //material.PrcUsd = parseWithComma(material.suframa.Prc90Usd);
              //material.PrcMaterial = parseFloat(parseWithComma(material[currPriceSufr]), 10);

            }
            /*
            let prz = item.replace(/\D/g, '');

            price = (""+price).replace(",", ".");
            price = price.replace(/\.(?![^.]+$)|[^0-9.]/, "");

            var parsedPrice = parseFloat(price, 10);

            const calculated = rulesService
                .calcFinancy(
                    parsedPrice,
                    prz,
                    finance.FatorRedutor,
                    finance['FatorFinanceiro' + curr],
                    false
                )
                .toFixed(2);
             */

            var returnPrice = (material.Price[material.Segmento].PrcMat[currPrice + '90'] = rulesService
              .calcFinancy(parseFloat("" + material.suframa[currPriceSufr].replace(",", ".").replace(/\.(?![^.]+$)|[^0-9.]/, ""), 10),
                +deadline.prz,
                finance.FatorRedutor,
                finance['FatorFinanceiro' + vm.page.currency],
                false
              )
              .toFixed(2));
            //return (material.Price[material.Segmento].PrcMat[currPrice + '90'] = material.suframa[currPrice90]);
            $scope.validaMultiplo();
            $scope.validaWarning();
            $scope.TotalCarrinhoVisual();
            return returnPrice;
          }
        );
      }
      else {
        console.log("Desligou suframa")
        vm.activeBtnSuframa = ''
        angular.forEach(
          vm.materials,
          function (material) {
            console.log(material);

            material.Price[material.Segmento].Price.BRL = material.suframa.OldPrcBrl;
            material.Price[material.Segmento].Price.USD = material.suframa.OldPrcUsd;

            if (isResetPrice) {
              //material.PrcBrl = parseWithComma(material.suframa.OldPrc90Brl);
              //material.PrcUsd = parseWithComma(material.suframa.OldPrc90Usd);
              //material.PrcMaterial = parseFloat(parseWithComma(material[currPriceSufr]), 10);
            }

            var returnPrice = (material.Price[material.Segmento].PrcMat[currPrice + '90'] = rulesService
              .calcFinancy(parseFloat(parseWithComma(material.Price[material.Segmento].PrcMat[currPrice]), 10), +deadline.prz, finance.FatorRedutor, finance['FatorFinanceiro' + vm.page.currency], false)
              .toFixed(2));
            $scope.validaMultiplo();
            $scope.validaWarning();
            $scope.TotalCarrinhoVisual();
            return returnPrice;
          }
        );

      }

      _.delay(saveKart, 500);
    }

    function setPriceSuframa(isSetPrice, isResetPrice) {
      let currPrice = 'Preco' + vm.page.currency.capitalize();
      let currPriceSufr = 'Prc' + vm.page.currency.capitalize();
      let finance = vm.params.FinancyFactor;
      let deadline = getDeadline();

      if (vm.activeBtnSuframa != '') {
        angular.forEach(
          vm.materials, function (material) {
            console.log(material);

            if (isSetPrice) {
              material.Price[material.Segmento].Price.BRL = material.suframa.PrcBrl; //material.Price[material.Segmento].Price.BRL = material.suframa.PrcBrl;
              material.Price[material.Segmento].Price.USD = material.suframa.PrcUsd;//material.Price[material.Segmento].Price.USD = material.suframa.PrcUsd;
            }
            else {
              material.Price[material.Segmento].Price.BRL = material.suframa.PrcBrl; //material.Price[material.Segmento].Price.BRL = material.suframa.PrcBrl;
              material.Price[material.Segmento].Price.USD = material.suframa.PrcUsd;//material.Price[material.Segmento].Price.USD = material.suframa.PrcUsd;

              material.Price[material.Segmento].PrcMat.PrecoBrl90 = material.suframa.Prc90Brl;
              material.Price[material.Segmento].PrcMat.PrecoUsd90 = material.suframa.Prc90Usd;
            }


            /*
            //Valor Padrão CASH sendo adicionado no preço venda
            material.PrcBrl = material.suframa.PrcBrl;
            material.PrcUsd = material.suframa.PrcUsd;
            */
            if (isResetPrice) {
              //material.PrcBrl = parseWithComma(material.suframa.Prc90Brl);
              //material.PrcUsd = parseWithComma(material.suframa.Prc90Usd);
              //material.PrcMaterial = parseFloat(parseWithComma(material[currPriceSufr]), 10);

            }



            var returnPrice = (material.Price[material.Segmento].PrcMat[currPrice + '90'] = rulesService
              .calcFinancy(parseFloat(parseWithComma(material.suframa[currPriceSufr]), 10), +deadline.prz, finance.FatorRedutor, finance['FatorFinanceiro' + vm.page.currency], false)
              .toFixed(2));
            //return (material.Price[material.Segmento].PrcMat[currPrice + '90'] = material.suframa[currPrice90]);
            $scope.validaMultiplo();
            $scope.validaWarning();
            $scope.TotalCarrinhoVisual();
            return returnPrice;
          }
        );
      }
      else {
        angular.forEach(
          vm.materials,
          function (material) {
            console.log(material);

            material.Price[material.Segmento].Price.BRL = material.suframa.OldPrcBrl;
            material.Price[material.Segmento].Price.USD = material.suframa.OldPrcUsd;

            if (isResetPrice) {
              //material.PrcBrl = parseWithComma(material.suframa.OldPrc90Brl);
              //material.PrcUsd = parseWithComma(material.suframa.OldPrc90Usd);
              //material.PrcMaterial = parseFloat(parseWithComma(material[currPriceSufr]), 10);
            }

            var returnPrice = (material.Price[material.Segmento].PrcMat[currPrice + '90'] = rulesService
              .calcFinancy(parseFloat(parseWithComma(material.Price[material.Segmento].PrcMat[currPrice]), 10), +deadline.prz, finance.FatorRedutor, finance['FatorFinanceiro' + vm.page.currency], false)
              .toFixed(2));
            $scope.validaMultiplo();
            $scope.validaWarning();
            $scope.TotalCarrinhoVisual();
            return returnPrice;
          }
        );

      }
      saveKart;
    }

    function parseWithComma(value) {
      return parseFloat(("" + value).replace(",", "."), 10); // fix values with ","
    }

    function getDeadline() {
      return _.findWhere(vm.page.payment, {
        value: vm.page.deadline
      }) || vm.page.payment[0];
    }

    function getTotal() {
      let [total, ipi] = [0, 0];
      let priceCurr = 'Prc' + vm.page.currency.capitalize();

      angular.forEach(vm.materials, material => {
        material.PrcMaterial = +Number(material[priceCurr].toString().replace(',', '.')) || 0;
        total += +material.PrcMaterial * material.QtdMaterial;
        ipi += +material.PrcMaterial * +material.QtdMaterial * (material.PercIpi / 100);
      });

      vm.page.total = total || 0;
      vm.page.ipi = ipi || 0;
      vm.page.atc = vm.materials.find(({
        StockDetail
      }) => StockDetail) || false;

      return checkPayment();
    }

    function errorHandler(res) {
      if (res.Abort) {
        resetKart();
      }

      return res.Code === 401 ?
        (localService.setAll(), $state.go('login')) :
        localService.openModal(res.Error);
    }

    function errorHandlerV2(res) {
      //return false;
      if (res.Activated) {
        return false;
      } else {
        return localService.openModal(res.Error);
      }
    }
  }


})();
