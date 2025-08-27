/* global utils:true */
(function () {
  'use strict';

  class tableBookController {
    constructor($rootScope, $scope, ClientService, rulesService) {
      this.tableOpen = false;
      this.dispDate = utils.helpers.dispDate;
      this.fakeMaterialTracker = 0;
      this.acronymSegmentCartNormal = ["M", "N", "C"];
      this.acronymSegmentCartPilot = ["P"];
      this.acronymSegmentHeavyDefects = ["L"];
      this.acronymSegmentInventories = ["N0Z"];
      this.rootScope = $rootScope;
      this.$scope = $scope;
      this.ClientService = ClientService;
      console.log(rulesService, 'rulesService');
      this.rulesService = rulesService;

      var scope = this;
      scope.client = null;
      // scope.PricesT106 = {};

      $rootScope.$on("materialsUpdate", function () {
        if (!scope.client) {
          const codeCli =
            this.kart && this.kart.Master ? this.kart.Master.CodeCli : null;

          if (codeCli) {
            this.ClientService.loadClient(codeCli).then((client) => {
              scope.client = client || null;
              console.log("Client loaded", scope.client, "$rootScope.$on");
              scope.processRenderModel();
            });
          } else {
            console.log("Sem client");
            scope.processRenderModel();
          }
        } else {
          console.log("Client already loaded", scope.client, "$rootScope.$on");
          scope.processRenderModel();
        }
      });

      this.replaceSegmentView = function (segView) {
        if (segView[0].toUpperCase() === "N") {
          return "N0";
        }

        return segView;
      };
    }

    $onInit() {
      var scope = this;

      scope.renderModel = [];
      this.getTomProp = getTomProp;

      this.updateListDisp = updateListDisp;
      this.toggle = false;

      function deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
      }

      function tomRow(material) {
        scope.fakeMaterialTracker++;

        material = deepClone(material);
        const uuid = () =>
          Array.from({ length }, () =>
            Math.random().toString(36).charAt(2)
          ).join("");
        material.MaterialCodeTrack =
          material.MaterialCodeTrack +
          "" +
          scope.fakeMaterialTracker +
          "-" +
          uuid();
        const countQtdPETotal = material.Tons.reduce((acc, index) => {
          return acc + index.QtdProntEntreg;
        }, 0);

        material.QtdPETotal = countQtdPETotal;
        return material;
      }

      function getTomProp(material, prop, tom) {
        var stock = material.Stock;
        var centro = material.CentroSelecionado;

        var filter = stock.filter(function (stockItem) {
          if (
            typeof stockItem[centro] == "undefined" ||
            typeof stock[tom][centro] == "undefined"
          ) {
            return false;
          }
          var tomItem = stockItem[centro].Tonalidade;
          var tomStock = stock[tom][centro].Tonalidade;
          var comp = tomItem == tomStock;
          return comp;
        });

        if (!filter.length) {
          return "";
        }

        var tomProp = filter[0][centro][prop];
        return tomProp;
      }

      function adapterDisp(estoqueDisp, tons = []) {
        const segments = Object.keys(estoqueDisp).filter(
          (key) => key.slice(0, 2) === "C0"
        );

        const newStructure = {};
        for (const seg of segments) {
          const ton = seg.slice(0, 4);
          if (!newStructure[ton])
            newStructure[ton] = {
              QtdEstApos: 0,
              ListDisp: [],
            };
        }

        for (const seg of segments) {
          const val = estoqueDisp[seg];
          const structure = newStructure[seg.slice(0, 4)];
          structure.QtdEstApos += val.QtdEstApos;

          for (const currentDisp of val.ListDisp) {
            let exists = false;
            structure.ListDisp.map((stc) => {
              if (
                stc.Centro === currentDisp.Centro &&
                stc.Date === currentDisp.Date
              ) {
                stc.Qtde += currentDisp.Qtde;
                exists = true;
              }
            });

            if (!exists) structure.ListDisp.push(currentDisp);
          }
        }

        for (const segDel of segments) {
          delete estoqueDisp[segDel];
        }

        for (const dips in newStructure) {
          const receivedName = tons.find((seg) => seg.slice(0, 4) === dips);
          if (!receivedName) continue;
          estoqueDisp[receivedName] = newStructure[dips];
        }
      }

      /**
       *
       * @param {{ [x: string]: {
       *  [x: string]: {
       *      Deposito: string
       *      Nuance: string
       *      QtdEstApos: number
       *      QtdEstendida: number
       *      QtdProntEntreg: number
       *      SegmentoEstoque: string
       *      TomIndex: number
       *      TomNuance: string
       *      Tonalidade: string
       *   }
       * } }} estoqueNavig
       * @param {}
       * @return { string[] }
       *
       */
      function unionEqualSegments(estoqueNavig, estoqueDisp) {
        const acceptedSegments = [];

        /**
         * @typedef {Object} StockInfo
         * @property {string} Deposito
         * @property {string} Nuance
         * @property {number} QtdEstApos
         * @property {number} QtdEstendida
         * @property {number} QtdProntEntreg
         * @property {string} SegmentoEstoque
         * @property {number|null} TomIndex
         * @property {string} TomNuance
         * @property {string} Tonalidade
         */
        /**
         * @typedef {Object.<string, Object.<string, StockInfo>>} FilteredData
         */

        /**
         *
         * @param {FilteredData} estoqueNavig
         * @returns {FilteredData}
         */
        const filteredData = Object.keys(estoqueNavig)
          .filter((key) => key.startsWith("C0"))
          .reduce((obj, key) => {
            obj[key] = estoqueNavig[key];
            return obj;
          }, {});

        /**
         * Agrupa por tonalidade os dados que começam com 'C0'
         * @param {FilteredData} estoqueNavig
         * @returns {Object.<string, FilteredData>}
         */
        const groupedByTonalidade = Object.keys(estoqueNavig)
          .filter((key) => key.startsWith("C0"))
          .reduce((acc, key) => {
            const tonalidade = Object.values(
              estoqueNavig[key]
            )[0].SegmentoEstoque.slice(0, 4);

            if (!acc[tonalidade]) {
              acc[tonalidade] = {};
            }

            acc[tonalidade][key] = estoqueNavig[key];
            return acc;
          }, /** @type {Object.<string, FilteredData>} */ ({}));

        const removePropertiesC0 = Object.keys(filteredData);
        for (const segmentC0 of removePropertiesC0) {
          delete estoqueNavig[segmentC0];
        }

        let indexTon = 0;
        for (const segmentTon in groupedByTonalidade) {
          const stocksInTons = Object.values(groupedByTonalidade[segmentTon]);

          /** @type {Array<StockInfo>} */
          const uniontByCenter = {};

          for (const [index, stock] of stocksInTons.entries()) {
            /** @type {StockInfo} */
            const center = Object.keys(stock)[0];
            const values = stock[center];
            
            if (!uniontByCenter[center]) {
              uniontByCenter[center] = {
                Deposito: values.Deposito,
                Nuance: values.Nuance,
                QtdEstApos: 0,
                QtdEstendida: 0,
                QtdProntEntreg: 0,
                SegmentoEstoque: values.SegmentoEstoque,
                TomIndex: indexTon,
                TomNuance: values.TomNuance,
                Tonalidade: values.Tonalidade,
              };
            }

            uniontByCenter[center].QtdEstApos += values.QtdEstApos;
            uniontByCenter[center].QtdEstendida += values.QtdEstendida;
            uniontByCenter[center].QtdProntEntreg += values.QtdProntEntreg;
          }

          const receivedSegmentCode = removePropertiesC0.find(
            (val) => val.slice(0, 4) === segmentTon
          );

          if (receivedSegmentCode) {
            acceptedSegments.push(receivedSegmentCode);
            estoqueNavig[receivedSegmentCode] = {
              ...uniontByCenter,
            };
          }
          indexTon++;
        }

        adapterDisp(estoqueDisp, acceptedSegments);
        return acceptedSegments;
      }

      function adaptMaterialToView(material) {
        material.SegView = material.Segmento.substring(0, 2);
        material.SegName = Object.keys(material.Disp).find(
          (seg) => seg.slice(0, 2) === material.SegView
        );

        if (material.isATCStock) {
          material.QtdEstApos = material.Disp[material.Segmento].QtdEstApos;
        } else {
          const findObjectInCenter = material.Stock.find(
            (stck) => Object.keys(stck)[0] === material.CentroSelecionado
          );
          material.QtdEstApos =
            findObjectInCenter[material.CentroSelecionado].QtdEstApos;
        }

        if (material.tonalidadeRow) {
          material.viewDescMat = "";
          material.viewDescCor = "";
          material.viewMaterialCode = "";
          material.viewMaterialCodOld = "";
          material.viewNomeMercado = "";
          material.viewParsedMult = "";
          material.viewParsedMin = "";
        } else {
          material.viewDescMat = material.DescMat;
          material.viewDescCor = material.DescCor;
          material.viewMaterialCode = material.MaterialCode;
          material.viewMaterialCodOld = material.MaterialCodOld;
          material.viewNomeMercado = material.NomeMercado || "---";
          material.viewParsedMult = material.ParsedMult;
          material.viewParsedMin = material.ParsedMin;
        }
      }

      function parseFinance(
        price = 0,
        item,
        finance = {},
        curr,
        materialZipper = false
      ) {
        let prz = item.replace(/\D/g, "");

        price = ("" + price).replace(",", ".");
        price = price.replace(/\.(?![^.]+$)|[^0-9.]/, "");

        let parsedPrice = parseFloat(price, 10);

        const isMaterialZipperToFourDecimalPrice = materialZipper ? 4 : 2;

        const calculated = scope.rulesService
          .calcFinancy(
            parsedPrice,
            prz,
            finance.FatorRedutor,
            finance["FatorFinanceiro" + curr],
            false
          )
          .toFixed(isMaterialZipperToFourDecimalPrice);

        return calculated;
      }

      function addToRender(material) {
        var addrs =
          scope.client && scope.client.Master && scope.client.Master.Address
            ? scope.client.Master.Address[0]
            : null;
        const hasT106 =
          material &&
          ((material.Centros &&
            Array.isArray(material.Centros) &&
            material.Centros.includes("T106")) ||
            material.Centro === "T106");
        if (hasT106 && addrs && addrs.UfCliAdr === "CE") {
          material.CentroSelecionado = "T106";
          const decimalZipper = material.MaterialZipper ? 4 : 2;
          const isMaterialZipper = material.MaterialZipper;
          const finance = scope.params.FinancyFactor;
          const price = material.Price[material.Segmento].Price;

          //t106 price
          var BRLprice = Number(
            parseFinance(
              price.BRL,
              "A VISTA",
              finance,
              "BRL",
              isMaterialZipper
            ).replace(",", ".")
          );
          var USDprice = Number(
            parseFinance(
              price.USD,
              "A VISTA",
              finance,
              "USD",
              isMaterialZipper
            ).replace(",", ".")
          );

          var itemPreco = {
            BRL: ((10.5 / 100) * BRLprice + BRLprice)
              .toFixed(decimalZipper)
              .toString()
              .replace(".", ","),
            USD: ((10.5 / 100) * USDprice + USDprice)
              .toFixed(decimalZipper)
              .toString()
              .replace(".", ","),
          };

          //t106 90 days
          var BRLprice90 = Number(
            parseFinance(
              price.BRL,
              "90 DIAS",
              finance,
              "BRL",
              isMaterialZipper
            ).replace(",", ".")
          );
          var USDprice90 = Number(
            parseFinance(
              price.USD,
              "90 DIAS",
              finance,
              "USD",
              isMaterialZipper
            ).replace(",", ".")
          );

          var itemPreco90 = {
            BRL: ((10.5 / 100) * BRLprice90 + BRLprice90)
              .toFixed(decimalZipper)
              .toString()
              .replace(".", ","),
            USD: ((10.5 / 100) * USDprice90 + USDprice90)
              .toFixed(decimalZipper)
              .toString()
              .replace(".", ","),
          };
          const t106Ton = material.Tons.find((ton) => ton.centro === "T106");

          if(material.Tons[material.TomIndex].centro !== 'T106' && t106Ton) {
            material.TomIndex = material.Tons.indexOf(t106Ton);
          } 
          material.Price[material.Segmento].PrcMat.PrecoBrl90 = itemPreco90.BRL;
          material.Price[material.Segmento].PrcMat.PrecoUsd90 = itemPreco90.USD;
          material.Price[material.Segmento].PrcMat.PrecoBrl = itemPreco.BRL;
          material.Price[material.Segmento].PrcMat.PrecoUsd = itemPreco.USD;
          material.Price[material.Segmento].Price90.BRL = itemPreco90.BRL;
          material.Price[material.Segmento].Price90.USD = itemPreco90.USD;
        }

        filterListDisp(material);
        adaptMaterialToView(material);
        material.Tons = [];
        material.QtdPETotal = 0;

        for (const center of material.Centros) {
          const findObjectInCenter = material.Stock.find((stck) =>
            stck.hasOwnProperty(center)
          );
          if (findObjectInCenter) {
            const stockData = findObjectInCenter[center];
            material.QtdPETotal += stockData.QtdProntEntreg;
            material.Tons.push({
              centro: center,
              QtdProntEntreg: stockData.QtdProntEntreg,
            });
          }
        }
        scope.renderModel.push(material);
      }

      function updateListDisp(material) {
        filterListDisp(material);
      }

      function filterListDisp(material) {
        material.TomIndex = material.TomIndex || 0;

        const SegmentoEstoque = material.SegmentoEstoque;
        const hasListDisp =
          material.Disp[SegmentoEstoque] &&
          material.Disp[SegmentoEstoque].ListDisp;

        //Calcula o total de estoque ATC nos centros
        let QtdEstAposTotal = 0;
        for (const centro of material.Centros) {
          const findObjectInCenter = material.Stock.find(
            (stck) => Object.keys(stck)[0] === centro
          );
          QtdEstAposTotal += findObjectInCenter[centro].QtdEstApos;
        }

        if (hasListDisp) {
          material.Disp[SegmentoEstoque].ListDispView = hasListDisp;
          material["isATCStock"] = true;
        } else {
          material["isATCStock"] = false;
        }

        if (scope.kart && scope.kart.Master.Item902) {
          const existsMaterialInCart = scope.kart.Master.Item902.find(
            (item) =>
              item.MaterialCode === material.MaterialCode &&
              item.Segmento === material.Segmento
          );

          if (existsMaterialInCart) {
            if (material.isATCStock)
              material.DateAtcDelv = existsMaterialInCart.DateAtcDelv;
            if (existsMaterialInCart.QtdMaterial)
              material.QtdMaterial = existsMaterialInCart.QtdMaterial;
          }
        }
      }

      // MODEL READY FOR RENDERING
      function processRenderModel() {
        console.log("processRenderModel");
        var alreadyProcessed = {};
        var rawModelLength = scope.model.length;
        var renderModelLength = scope.renderModel.length;

        for (var i = 0; i < rawModelLength; i++) {
          let mat = scope.model[i].MaterialCode;
          for (var j = 0; j < renderModelLength; j++) {
            if (mat == scope.renderModel[j].MaterialCode) {
              alreadyProcessed[mat] = true;
              break;
            }
          }
        }

        const materialListToRender = scope.model.filter(
          (x) => !alreadyProcessed[x.MaterialCode]
        );
        const materialView = [];

        for (const material of materialListToRender) {
          let stocksByTypeCart = [];
          let materialsBySegment = [];

          if (scope.page.type === "N")
            Object.keys(material.EstoqueNavig).forEach((key) => {
              if (scope.acronymSegmentCartNormal.includes(key[0])) {
                stocksByTypeCart.push(key);
              }
            });

          if (scope.page.type === "P")
            Object.keys(material.EstoqueNavig).forEach((key) => {
              if (scope.acronymSegmentCartPilot.includes(key[0])) {
                stocksByTypeCart.push(key);
              }
            });

          if (scope.page.type === "L")
            Object.keys(material.EstoqueNavig).forEach((key) => {
              if (scope.acronymSegmentHeavyDefects.includes(key[0])) {
                stocksByTypeCart.push(key);
              }
            });

          if (scope.page.type === "C")
            Object.keys(material.EstoqueNavig).forEach((key) => {
              stocksByTypeCart.push(key);
            });

          stocksByTypeCart = stocksByTypeCart.filter(
            (stock) => stock.slice(0, 2) !== "C0"
          );

          unionEqualSegments(material.EstoqueNavig, material.Disp).forEach(
            (stockC0) => stocksByTypeCart.push(stockC0)
          );

          const stockValues = Object.keys(material.EstoqueNavig);

          for (const segment of stocksByTypeCart) {
            const materialInRowBySegmentAndTonality = Object.assign(
              {},
              material
            );

            const stocksInSegments = material.EstoqueNavig[segment];
            const centersDisp = Object.keys(stocksInSegments);
            const tonality = segment.slice(2, 4);

            const tonsKeysBySegment = stockValues
              .filter((seg) => seg.slice(0, 4) === segment.slice(0, 4))
              .map((val, index) => ({ name: val.slice(2, 4), value: index }));

            materialInRowBySegmentAndTonality.Stock = [];
            materialInRowBySegmentAndTonality.Centros = centersDisp;
            materialInRowBySegmentAndTonality.Segmento = segment;
            materialInRowBySegmentAndTonality.SegmentoEstoque = segment; // repetido muitas vezes em muitos lugares desconexos
            materialInRowBySegmentAndTonality.Tonalidade = tonality;
            materialInRowBySegmentAndTonality.TomIndex =
              tonsKeysBySegment.findIndex(
                (val) => val.name === segment.slice(2, 4)
              );
            materialInRowBySegmentAndTonality.tonalidadeKeys =
              tonsKeysBySegment;
            materialInRowBySegmentAndTonality.tonalidadeRow = true;

            const existCenterSelectedDefaultInMaterial =
              materialInRowBySegmentAndTonality.Centros.includes(
                materialInRowBySegmentAndTonality.CentroSelecionado
              );
            if (!existCenterSelectedDefaultInMaterial) {
              materialInRowBySegmentAndTonality.CentroSelecionado =
                materialInRowBySegmentAndTonality.Centros[0];
            }

            for (const [index, center] of Object.values(
              centersDisp
            ).entries()) {
              const depositInformation = {
                Deposito: material.EstoqueNavig[segment][center].Deposito,
                Tonalidade: tonality,
                SegmentoEstoque: segment,
                QtdEstApos: material.EstoqueNavig[segment][center].QtdEstApos,
                QtdProntEntreg:
                  material.EstoqueNavig[segment][center].QtdProntEntreg,
                QtdEstendida: material.EstoqueNavig[segment][center].QtdEstApos,
                Nuance: segment.slice(4),
                TomNuance: segment.substring(2, 4),
                index,
              };

              materialInRowBySegmentAndTonality.Stock.push({
                [center]: depositInformation,
              });
            }

            const existsObjectPrecoNavig =
              !existsObjectPrecoNavig ||
              !existsObjectPrecoNavig.PrecoNavig ||
              null;
            if (!existsObjectPrecoNavig && !stocksInSegments) continue;

            materialsBySegment.push(materialInRowBySegmentAndTonality);
          }

          materialsBySegment = materialsBySegment.sort((a, b) =>
            a.Segmento.localeCompare(b.Segmento)
          );
          if (materialsBySegment.length > 0)
            materialsBySegment[0].tonalidadeRow = false;

          materialView.push(...materialsBySegment);
        }

        for (const material of materialView) {
          const brl90days = material.Price && material.Price[material.Segmento] && material.Price[material.Segmento].Price90 ? material.Price[material.Segmento].Price90.BRL : null;
          const usd90days = material.Price && material.Price[material.Segmento] && material.Price[material.Segmento].Price90 ? material.Price[material.Segmento].Price90.USD : null;

          if (!brl90days) {
            const price90BRL = recalculatePrices(
              material.Price[material.Segmento].PrcMat.PrecoBrl.replaceAll(
                ",",
                "."
              ),
              "BRL"
            );
            material.Price[material.Segmento].Price90.BRL = price90BRL;
            material.Price[material.Segmento].PrcMat.PrecoBrl90 = price90BRL;
          }

          if (!usd90days) {
            const price90USD = recalculatePrices(
              material.Price[material.Segmento].PrcMat.PrecoUsd.replaceAll(
                ",",
                "."
              ),
              "USD"
            );
            material.Price[material.Segmento].Price90.USD = price90USD;
            material.Price[material.Segmento].PrcMat.PrecoUsd90 = price90USD;
          }

          const materialInRow = tomRow(material);
          addToRender(materialInRow);
        }
      }

      function recalculatePrices(price, coin) {
        /**
         * @type {String}
         */
        return calcFinancy(
          price,
          90,
          scope.params.FinancyFactor.FatorRedutor,
          scope.params.FinancyFactor["FatorFinanceiro" + coin],
          false
        ).toFixed(2);
      }

      function calcFinancy(
        Price,
        PrzMed,
        FatorRedutor,
        FatorFinanceiro,
        isSuframa
      ) {
        if (isSuframa) {
          var calc = Price * FatorRedutor;
        } else {
          var calc =
            PrzMed <= 14
              ? Price - Price * FatorRedutor
              : Price * Math.pow(FatorFinanceiro, PrzMed / 30);
        }

        return calc;
      }

      // function handleT106Price(price) {
      //   scope.PricesT106[price.item] = price;
      //   // console.log(price, scope.PricesT106);
      // }

      // scope.handleT106Price = handleT106Price;
      scope.processRenderModel = processRenderModel;
      if (!scope.client) {
        const codeCli =
          this.kart && this.kart.Master ? this.kart.Master.CodeCli : null;

        if (codeCli) {
          this.ClientService.loadClient(codeCli).then((client) => {
            scope.client = client || null;
            processRenderModel();
          });
        } else {
          console.log("Sem client");
          scope.processRenderModel();
        }
      } else {
        processRenderModel();
      }
    }

    sortStock(stock, stockCode) {
      return "Stock." + stockCode + "." + stock;
    }

    submitForm() {
      return this.sortClick();
    }

    updateLine(materialCode) {
      return materialCode ? this.lineClick({ list: [materialCode] }) : false;
    }
  }

  tableBookController.$inject = ['$rootScope', '$scope', 'ClientService', 'rulesService'];

  const tableBook = {
    controller: tableBookController,
    controllerAs: '$ctrl',
    bindings: {
      model: '=',
      client: '=',
      kart: '=',
      page: '<',
      params: '<',
      sortClick: '&',
      lineClick: '&',
      loadMore: '&'
    },
    templateUrl: 'app/books/components/tableBook.html'
  };

  angular.module('app').component('tableBook', tableBook);
})();
