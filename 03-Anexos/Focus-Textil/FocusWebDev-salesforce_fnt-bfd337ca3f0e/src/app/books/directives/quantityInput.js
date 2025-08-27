(function () {
  'use strict';
  angular.module('app').directive('quantityInput', quantityInput);

  function quantityInput(localService, rulesService, dataService) {
    return {
      replace: true,
      link: link,
      scope: {
        material: '=',
        currency: '=',
        limits: '=',
        kart: '=',
        finance: '='
      },
      require: 'ngModel',
      template: '<input type="text" class="form-control ctrl-md" only-digits placeholder="0">'
    };

    function link(scope, element, attrs, ctrl) {
      const currency = scope.currency;
      var currentTom = scope.material.TomIndex || scope.material.selectedTom;
      var centroSelecionado = scope.material.CentroSelecionado;

      // console.log("75fh8 QUANTITY INPUT >>", scope.material);

      var segmento = scope.material.Segmento

      // console.log("QUANTITY INPUT checkPrice", scope.material.Price[segmento].Price);

      const price = checkPrice(scope.material.Price[segmento].Price, scope.material.TpStockCode, currency);
      let viewModel;

      if ((price && !scope.kart) || !price) {
        element.attr('disabled', '');
      }

      _.delay(
        newCtrl => {
          viewModel = newCtrl.$viewValue;
        },
        100,
        ctrl
      );

      function customValidator(ngModelValue) {
        updateFilterBook();

        const kart = scope.kart || {};
        const material = scope.material;
        const finance = scope.finance;
        let test = { Error: false };
        let cleanModel = parseInt(ngModelValue, 10);

        // let cleanModel = ngModelValue ? ngModelValue.toString().replace(/[^\d.-]/g, '') : 0;
        let kartItems = kart.Master.Open ? kart.Master.Item902 : [];

        if (!cleanModel && !viewModel && !ngModelValue) {
          // console.log("4f5tgt66 ::", "NÃO TEM VALOR !cleanModel && !viewModel && !ngModelValue", cleanModel, viewModel, ngModelValue);
          return true;
        }

        if (!cleanModel && viewModel) {
          // console.log("4f5tgt66 ::", "NÃO TEM VALOR MAS TEM ALGO !cleanModel && viewModel", cleanModel, viewModel);

          // if (cleanModel === 0) {
          // console.log("4f5tgt66 ::", "novo valor é ZERO, remover do carrinho", cleanModel);
          // }




          kart.Master.Item902 = kartItems;
          viewModel = '';
          saveKart(kart);
          return true;
        }

        test = rulesService.checkStockLimits(
          scope.limits,
          ngModelValue,
          material.TpStockCode,
          material.UnidMed
        );


        const calculatedStockATC = (() => {
          const resultados = [];
          for (const obj of material.Stock) {
            const valores = Object.entries(obj);
            for (const [centro, valor] of valores) {
              if (valor.hasOwnProperty("QtdEstApos")) {
                resultados.push({
                  centro,
                  stockATC: Number(valor.QtdEstApos),
                  tonalidade: valor.Tonalidade || valor.tonalidade
                });
              }
            }
          }
          return resultados;
        })()


        // Se o estoque for P e ATC
        const isValidStockATCtoTypeP = material.DateAtcDelv ? true : false
        const listOfStocksATC = material.Disp[material.Segmento] ? material.Disp[material.Segmento].ListDisp : []

        if (material.TpStockCode === 'P' && isValidStockATCtoTypeP) {
          if (!material.DateAtcDelv) {
            localService.openModal('Atenção!!! Selecionar a data de chegada do ATC.');
            ctrl.$setViewValue(viewModel);
            ctrl.$render();
            return false;
          }


          const [dateATC, stockATC] = material.DateAtcDelv.split(',')
          // Lista de estoques disponiveis para ATC

          // Verificar match entre o centro e a data
          for (const stock of listOfStocksATC) {
            if (stock.Centro === stockATC && stock.Date === dateATC) {
              // verificar se o saldo é maior que o solicitado
              if (stock.Qtde === 0) {
                localService.openModal('Não há estoque ATC disponível');
                ctrl.$setViewValue(viewModel);
                ctrl.$render();
                return false;
              }

              if (ngModelValue > stock.Qtde) {
                localService.openModal('A quantidade máxima deve ser menor ou igual à ' + stock.Qtde);
                ctrl.$setViewValue(viewModel);
                ctrl.$render();
                return false;
              }
            }
          }

          material.CentroSelecionado = stockATC

        } else if (material.TpStockCode === 'P' && !isValidStockATCtoTypeP) {
          const findStocks = material.Stock.map((stck) => ({
            ...Object.values(stck)[0],
            center: Object.keys(stck)[0]
          }))

          let ZeroStocks = 0
          let dispStock = 0

          for (const stock of findStocks) {
            if (stock.QtdProntEntreg === 0) ZeroStocks++
            if (stock.QtdProntEntreg > dispStock) dispStock = stock.QtdProntEntreg
          }

          if (
            ZeroStocks === findStocks.length ||
            ngModelValue > dispStock
          ) {

            let isEmptyOrNotStockATC = 'ATENÇÃO!!! O item selecionado não tem disponibilidade'


            for (const stock of listOfStocksATC) {
              if (stock.Qtde > 0) isEmptyOrNotStockATC = 'Atenção!!! Selecionar a data de chegada do ATC.'
            }

            localService.openModal(isEmptyOrNotStockATC);
            ctrl.$setViewValue(viewModel);
            ctrl.$render();
            return false;
          } else {
            const getStockDisp = findStocks.find((stck) => stck.QtdProntEntreg > material.QtdMaterial)
            if (getStockDisp) material.CentroSelecionado = getStockDisp.center
          }
        }


        material.QtdMaterial = ngModelValue

        // Nem todos os clientes tem esse dado, podendo retornar undefined ou null, por isso o importante tipar caso não exista
        const isProfileFutureSale = kart.Master.isFutureSales ? true : false

        const stockAtc = calculatedStockATC
        test = rulesService.checkMaterialStockLimits(
          scope.limits,
          ngModelValue,
          material,
          null,
          kart.Master.Editavel,
          isProfileFutureSale,
          stockAtc,
          material.DateAtcDelv
        );

        test = test.Error
          ? test
          : rulesService.checkStockType(ngModelValue, kartItems, material.TpStockCode);

        // test = test.Error ? test : rulesService.checkStockDate(material.DateMat.OutVend);

        if (test.Error) {
          localService.openModal(test.Error);
          ctrl.$setViewValue(viewModel);
          ctrl.$render();
          return false;
        }


        if (viewModel !== ngModelValue && cleanModel) {
          kart.Master.Open = true;
          kart.Master.CodeCurr = currency.toUpperCase();


          let isMaterialUpdated = false
          for (const [index, item] of kartItems.entries()) {
            if (
              item.MaterialCode === material.MaterialCode &&
              item.Segmento === material.Segmento
            ) {
              kartItems[index].Stock.QtdMaterial = ngModelValue;
              kartItems[index].Centro = material.CentroSelecionado ?  material.CentroSelecionado : kartItems[index].Centro
              isMaterialUpdated = true
              break;
            }
          }

          if(!isMaterialUpdated) {
            kartItems.push(setKartItems(material, kart.Master.AntCli, kart.Master.isSufr, finance, currency, isProfileFutureSale));
          } else {
            setKartItems(material, kart.Master.AntCli, kart.Master.isSufr, finance, currency, isProfileFutureSale);
          }


          viewModel = ngModelValue;
          kart.Master.Item902 = kartItems;
          saveKart(kart);
          console.log('Kart saved successfully');
        }


        return true;
      }

      element.on('blur', () => {
        let validation = customValidator(ctrl.$viewValue);


        ctrl.$setValidity(attrs.customValidate, validation);
        scope.$apply();

      });

      element.on('keydown keypress', ({ target, which }) => (which === 13 ? target.blur() : false));
    }

    function saveKart(kart) {

      kart.Master.Item902.forEach(function (item) {
        item.QtdMaterial = item.Stock.QtdMaterial;
      });

      return dataService
        .postData('SaveShoppingCart', {
          Cart: angular.toJson(kart),
          Check: 'false'
        })
        .then(({ Cart }) => localService.setData('kart', Cart), localService.errorHandler);
    }

    function setKartItems(material, AntCli, isSufr, finance, currency, isProfileFutureSale) {
      const props = [
        // 'IpadX', // NOT FOUND, don't need it
        'DescMat',
        'MaterialCode',
        'MaterialCodOld',
        'NomeMercado',
        'GroupMaterial',
        'UnidMed',
        'NcmCode',
        'PercIpi',
        'QtdeMultiplo',
        'CorteMin',
        'DateAtcDelv', // NOT FOUND
        'TpStockCode',
        'Ipad',
        'IsPreview',
        'PrecoPromo',
        'Price',
        'Stock',
        'Tons'
      ];

      let Master = _.pick(material, props);
      var Centro = material.CentroSelecionado;
      var OldCentro = material.CentroSelecionado;


      let center = (material.CentroSelecionado || material.Centro)

      if (material.DateAtcDelv) {
        var stockModel = material.DateAtcDelv.split(',')
        material.DateAtcDelv = stockModel[0]

        if (! material.Centro) material.Centro = stockModel[1]

      }

      var TomIndex = material.TomIndex || material.selectedTom;
      const findObjectInCenter = material.Stock.find((stck) => Object.keys(stck)[0] === center)
      var Stock = findObjectInCenter[center];

      var Segmento = material.Segmento; // material.TpStockCode + "0" + stock.Tonalidade + stock.Nuance;


      //TO:DO check pilotagem is < 10
      if (Segmento.substring(0, 1) == "P" && material.Tipo != 'CAR') {
        if (material.QtdMaterial <= 10) {
          Stock.SegmentoEstoque = "P" + Segmento.substring(1);
          Segmento = Stock.SegmentoEstoque;
        }
      }

      let Price = Master.Price[Segmento].PrcMat;

      if (isSufr == "X") {
        if (Segmento != "N0NAZF") {
          Master.Price[Segmento].Price.BRL = (parseFloat(parseWithComma(Master.Price[Segmento].Price.BRL.replace('.', '')), 10) * finance.FatorFinanceiroSUFRAMA).toFixed(2);
          Master.Price[Segmento].Price.USD = (parseFloat(parseWithComma(Master.Price[Segmento].Price.USD.replace('.', '')), 10) * finance.FatorFinanceiroSUFRAMA).toFixed(2);
        }
        var FatorFinanceiroSet = "FatorFinanceiro" + currency.toUpperCase();
        var SufrBrl90 = (parseFloat(Master.Price[Segmento].Price.BRL, 10) * Math.pow(finance[FatorFinanceiroSet], 90 / 30)).toFixed(2);
        var SufrUsd90 = (parseFloat(Master.Price[Segmento].Price.USD, 10) * Math.pow(finance[FatorFinanceiroSet], 90 / 30)).toFixed(2);
        Price.PrecoBrl90 = SufrBrl90;
        Price.PrecoUsd90 = SufrUsd90;

      } else {
        var SufrBrl90 = Master.Price[Segmento].Price90.BRL;
        var SufrUsd90 = Master.Price[Segmento].Price90.USD;

      }



      var dispATCmounth = 0;
      if (material.DateAtcDelv) {
        for (var i = 0; i < material['Disp'][Segmento]['ListDisp'].length; i++) {
          if (material.DateAtcDelv.slice(3) == material['Disp'][Segmento]['ListDisp'][i].Date.slice(3)) {
            dispATCmounth = dispATCmounth + material['Disp'][Segmento]['ListDisp'][i].Qtde;
          }
        }

        // //TO:DO get QtdMaterial do new Center
        // var OldStock = Master.Stock[TomIndex][OldCentro];
        // Stock['QtdMaterial'] = OldStock.QtdMaterial;

      }

      material.Tons = [];

      if (material.Tipo === 'CAR')
      {
        center = 'S201'
      }

      //Check Ton for Tons itens
      for (let item of material.Centros) {
        const findObjectInCenter = material.Stock.find((stck) => Object.keys(stck)[0] === item)
        material.Tons.push({
          centro: item,
          QtdProntEntreg: findObjectInCenter[item].QtdProntEntreg,
          QtdAtc: dispATCmounth
        })
      }

      const isMaterialZipperToFourDecimalPrice = material.MaterialZipper ? 4 : 2

      if (!material.isATCStock && !isProfileFutureSale && material.Tipo !== 'CAR')
      {
        if(!material.Tons.find((t) => t.centro === center && t.QtdProntEntreg > 0)) {
          center = material.Tons.find((t) => t.QtdProntEntreg > 0).centro
        }
      }

      const deposit = material.EstoqueNavig[Segmento][center].Deposito
      Stock.Deposito = deposit

      const isLastLetterNinMaterialCode = material.MaterialCode[material.MaterialCode.length - 1] === 'N'
      if (!material.isATCStock && isLastLetterNinMaterialCode)
      {
        center = 'T104'
      }

      var matInKart = {
        ...Master,
        Centros: material.Centros,
        Centro: center,
        PrcMaterial: Master.PrcMaterial
          ? Master.PrcMaterial
          : (
            currency === 'BRL'
              ? parseFloat(Price.PrecoBrl90.replace(',', '.'))
                .toFixed(isMaterialZipperToFourDecimalPrice)
              : parseFloat(Price.PrecoUsd90.replace(',', '.'))
                .toFixed(isMaterialZipperToFourDecimalPrice)
          ),
        Deposito: deposit,
        Nuance: Stock.Nuance,
        MaterialZipper: material.MaterialZipper,
        Tonalidade: material.Tonalidade,
        TomIndex: TomIndex,
        Segmento: material.Segmento,
        QtdMaterial: material.QtdMaterial,
        Stock: Stock,
        Abgru: '',
        DatePeProg: '00000000',
        PrcBrl: AntCli ? Price.PrecoBrl : Price.PrecoBrl90,
        PrcUsd: AntCli ? Price.PrecoUsd : Price.PrecoUsd90,
        TpStockCode: material.TpStockCode,
        suframa: {
          OldPrcBrl: Master.Price[Segmento].PrcMat.PrecoBrl,
          OldPrcUsd: Master.Price[Segmento].PrcMat.PrecoUsd,
          OldPrc90Brl: Master.Price[Segmento].Price90.BRL,
          OldPrc90Usd: Master.Price[Segmento].Price90.USD,
          PrcBrl: Master.Price[Segmento].Price.BRL,
          PrcUsd: Master.Price[Segmento].Price.USD,
          Prc90Brl: SufrBrl90,
          Prc90Usd: SufrUsd90
        },
        StockMATC: dispATCmounth,
        isATCStock: material.isATCStock,
        Tons: material.Tons
      };

      matInKart.Stock.QtdMaterial = material.QtdMaterial

      if (isProfileFutureSale === false) {
        if (material.TpStockCode !== 'C') {
          if (
            material.QtdPETotal === 0 && !matInKart['DateAtcDelv'] ||
            material.QtdPETotal < Stock.QtdMaterial && !matInKart['DateAtcDelv']
          ) {
            matInKart['DateAtcDelv'] = material.Disp[Stock.SegmentoEstoque].ListDisp[0].Date
          }
        }
      }

      // Se o estoque for do tipo pilotagem, e o centro default estiver zerado, recolocar para o proximo disponivel


      console.log("ENTRADA DE ITEM NO CARRINHO", matInKart)

      return matInKart
    }

    function checkPrice(stockPrice, stockCode, currency = '') {
      console.log('price', stockPrice)
      var rawPrice = stockPrice[currency];
      rawPrice = ("" + stockPrice[currency]).replace(",", ".");
      var consideredPrice = parseFloat(rawPrice, 10);
      var condition = (consideredPrice && stockCode !== 'C') || stockCode === 'C'
      return condition;
    }

    function updateFilterBook() {
      var filterBookRef = document.querySelector("filter-book");
      if (filterBookRef) {
        let vm = (
          angular &&
          angular.element &&
          angular.element(filterBookRef) &&
          angular.element(filterBookRef).scope &&
          angular.element(filterBookRef).scope() &&
          angular.element(filterBookRef).scope().vm
        );

        if (vm && vm.validateConditionalCenter) {
          setTimeout(function () {
            vm.validateConditionalCenter();
          }, 0);
        }
      }
    }

    function parseWithComma(value) {
      return parseFloat(("" + value).replace(",", "."), 10); // fix values with ","
    }

    function removeDuplicates(myArr, prop) {
      return myArr.filter((obj, pos, arr) => {
        return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
      });
    }
  }
})();
