/* global utils:true */
(() => {
  'use strict';
  angular.module('app').factory('BookModel', () => {
    'use strict';

    return {
      MaterialCode: record => record.Master.MaterialCode,
      MaterialCodOld: record => record.Master.MaterialCodOld,
      NomeMercado: record => record.Master.NomeMercado,
      DescMat: record => record.Master.DescMat,
      DescCor: record => record.Master.DescCor,
      Disp: record => record.Master.EstoqueDisp,
      EstoqueNavig: record => record.Master.EstoqueNavig,
      NcmCode: record => record.Master.NcmCode,
      PercIpi: record => record.Master.PercIpi,
      PntCode: record => record.Master.Pnt,
      ImgEtq: record => record.Master.CodeImgEtq,
      Gramatura: record => record.Master.Gramatura,
      GramaturaM2: record => record.Master.GramaturaM2,
      LargTotal: record => record.Master.LargTotal,
      GroupMaterial: record => record.Master.GroupMaterial,
      Ipad: record => record.Master.Ipad,
      Composition: record => record.Master.Composition,
      Similaridade: record => record.Master.Similaridade,
      UnidMed: record => record.Master.UnidMed,
      QtdeMultiplo: record => record.Master.QtdeMultiplo,
      CorteMin: record => record.Master.CorteMin,
      Rendimento: record => record.Master.Rendimento,
      TpStockCode: (record, params) => params.stockCode,
      LargUtil: record => (+record.Master.LargUtil).toFixed(2),
      LargRap: record => (record.Master.LargRap || 0) + '',
      CompRap: record => (record.Master.CompRap || 0) + ' cm',
      BookMat: record => record.Master.EbooksCodePage || ""/*record.Master.EbookCode + '/' + (record.Master.EbookPage || 0)*/,
      Ounce: record => (+record.Master.Gramatura / 34).toFixed(2) + ' oz',
      Oncas: record => (+record.Master.Oncas).toFixed(1) + ' oz',
      Elasticidade: record => record.Master.Elasticidade,
      Estabilidade: record => record.Master.Estabilidade1,
      Acabamento: record => record.Master.Acabamento,
      protecaoUV: record => (record.Master.Protecaouv) ? 'FPS ' + record.Master.Protecaouv : '-',
      Pilling: record => record.Master.Pilling,
      Construcao: record => record.Master.Construcao,
      MaterialZipper: record => record.Master.MaterialZipper,
      Certificados: record => record.Master.Certificados,
      Modelagem: record => {
        return {
          Top: {
            Ampla: record.Master.OversizeTop,
            Regular: record.Master.FitTop,
            Justa: record.Master.SlimTop
          },
          Bottom: {
            Ampla: record.Master.OversizeBt,
            Regular: record.Master.FitBt,
            Justa: record.Master.SlimBt
          }
        }

      },
      ParsedMult: record =>
        utils.helpers.parseCurr(record.Master.QtdeMultiplo) + ' ' + record.Master.UnidMed,
      ParsedMin: record =>
        utils.helpers.parseCurr(record.Master.CorteMin) +
        ' ' +
        record.Master.UnidMed.toLowerCase(),
      Price: (record, { params }) => {

        /**
         * @typedef {Object} SegmentPrice?
         * @property {number} PrecoBrl
         * @property {number} PrecoUsd
         */

        /**
         * @typedef {Object} Stock
         * @property {string} Deposito
         * @property {number} QtdProntEntreg
         * @property {number} QtdEstendida
         * @property {number} QtdEstApos
         * @property {string} SegmentoEstoque
         * @property {SegmentPrice | null} SegmentPrice
         */

        /**
         * @type {Stock}
         */
        const stock = utils.helpers.deepGet(record.Master, [
          'EstoqueNavig'
        ]);

        const priceSeg = utils.helpers.deepGet(record.Master, [
          'PrecoSegNavig',
          'T100',
          '10' // canal de distribuição (10: comercio, 20: exclusivo)
        ]);
        const priceDefault = utils.helpers.deepGet(record.Master, [
          'PrecoNavig',
          'T100',
          '10' // canal de distribuição (10: comercio, 20: exclusivo)
        ]);

        let prices = {};

        const existsMaterialTypeZipper = record.Master.MaterialZipper || null
        const isMaterialZipperToFourDecimalPrice = existsMaterialTypeZipper ? 4 : 2

        // Aqui é onde determina o preço/casas/centenas dos materiais
        Object.keys(stock).forEach(function (segmento) {
          // price[segmento] = priceSeg[segmento] || priceDefault;
          let price = priceSeg[segmento] || priceDefault;


          /**
           * @typedef {Object} SegmentPrice
           * @property {number} PrecoBrl
           * @property {number} PrecoUsd
           */

          /**
           * @typedef {Object} StockItem
           * @property {string} Deposito
           * @property {number} QtdProntEntreg
           * @property {number} QtdEstendida
           * @property {number} QtdEstApos
           * @property {string} SegmentoEstoque
           * @property {SegmentPrice | null} SegmentPrice
           * @property {string} Tonalidade
           * @property {string} Nuance
           * @property {string} TomNuance
           * @property {number} TomIndex
           */

          /**
           * @type {StockItem[]}
           */
          const getPricesBySegmentMaterial = Object.values(stock[segmento])
          const existsPriceBySegment = getPricesBySegmentMaterial.find((prices) => !!prices.SegmentPrice)
          if (existsPriceBySegment) {

            function calcFinancy(Price, PrzMed, FatorRedutor, FatorFinanceiro, isSuframa) {
              if(isSuframa){
                var calc = Price * FatorRedutor
              }else{
              var calc = PrzMed <= 14 ?
                Price - Price * FatorRedutor :
                Price * Math.pow(FatorFinanceiro, PrzMed / 30);
              }

              return calc;
            }

            price = {
              PrecoBrl: existsPriceBySegment.SegmentPrice.PrecoBrl,
              PrecoUsd: existsPriceBySegment.SegmentPrice.PrecoUsd,
              PrecoBrl90: calcFinancy(existsPriceBySegment.SegmentPrice.PrecoBrl, 90, params.FinancyFactor.FatorRedutor, params.FinancyFactor['FatorFinanceiroBRL'], false),
              PrecoUsd90: calcFinancy(existsPriceBySegment.SegmentPrice.PrecoUsd, 90, params.FinancyFactor.FatorRedutor, params.FinancyFactor['FatorFinanceiroUSD'], false)
            }
          }

          if (!price) return;

          prices[segmento] = {
            Price: {
              BRL: utils.helpers.parseCurr(price.PrecoBrl, isMaterialZipperToFourDecimalPrice),
              USD: utils.helpers.parseCurr(price.PrecoUsd, isMaterialZipperToFourDecimalPrice)
            },
            Price90: {
              BRL: utils.helpers.parseCurr(price.PrecoBrl90, isMaterialZipperToFourDecimalPrice),
              USD: utils.helpers.parseCurr(price.PrecoUsd90, isMaterialZipperToFourDecimalPrice)
            },
            PrcMat: {
              PrecoBrl: utils.helpers.parseCurr(price.PrecoBrl, isMaterialZipperToFourDecimalPrice),
              PrecoUsd: utils.helpers.parseCurr(price.PrecoUsd, isMaterialZipperToFourDecimalPrice),
              PrecoBrl90: utils.helpers.parseCurr(price.PrecoBrl90, isMaterialZipperToFourDecimalPrice),
              PrecoUsd90: utils.helpers.parseCurr(price.PrecoUsd90, isMaterialZipperToFourDecimalPrice),
            }
          }
        });

        return prices;
      },
      RGB: record => {
        var color = record.Master.RGB;
        if (!color) return;
        return "rgb(" + [color.R, color.G, color.B].join(",") + ")";
      },
      IsPreview: (record, params) => {
        // return params.stockCode === 'V';
        return !!record.Master.IsPreview;
      },
      tonalidadeKeys: function (record, params) {
        var stockCode = params.stockCode;

        if (params.stockCode === 'V' || params.stockCode === 'C') {
          stockCode = 'N';
        }

        var segmentos = Object.keys(record.Master.EstoqueNavig).filter(function (key) {
          return key.charAt(0) === stockCode;
        }).sort();

        // console.log("45t5g5 >>> ", segmentos);

        return segmentos.map(function (segmento, index) {
          var tpStock = segmento.slice(0, 2);
          var tom = segmento.slice(2, 4);
          var nuance = segmento.slice(4);
          var tomNuance = tom + nuance;

          return { name: tom, value: index };
        });
      },
      Stock: (record, { branchCode, stockCode }) => {
        const filtersSegments = []

        const stock = utils.helpers.deepGet(record.Master, [
          'EstoqueNavig'
        ]);

        if (!stock) {
          console.log("bookModel NO STOCK FOUND", record);
          return {};
        }

        const segmentsInMaterial = Object.keys(stock)

        if (stockCode === 'N') {
          const initialSegments = ['N', 'M', 'C']
          segmentsInMaterial.forEach((segment) => {
            if (initialSegments.includes(segment[0])) filtersSegments.push(segment)
          })
        }

        if (stockCode === 'P') {
          const initialSegments = ['P']
          segmentsInMaterial.forEach((segment) => {
            if (initialSegments.includes(segment[0])) filtersSegments.push(segment)
          })
        }

        if (stockCode === 'L') {
          const initialSegments = ['L']
          segmentsInMaterial.forEach((segment) => {
            if (initialSegments.includes(segment[0])) filtersSegments.push(segment)
          })
        }

        if (stockCode === 'C') {
          segmentsInMaterial.map((segment) => filtersSegments.push(segment))
        }


        return filtersSegments.map((segmento, index) => {
          let tone = segmento.slice(2, 4);
          let nuance = segmento.slice(4);

          let centers = Object.keys(stock[segmento]);
          centers.forEach(function (center) {
            let stockInfo = stock[segmento][center]
            let ton = 0
            // stockInfo.ListDisp = stockInfo.filter(x => x.Centro === center);

            // return N0T0 or Undefined
            const getTonInSegmentValue = Object.keys(stock)
              .find((stock) => stock === segmento)


            // index da tonalidade pegada pelo n0t -> 0 <-
            if (getTonInSegmentValue) {
              ton = Number(getTonInSegmentValue[3])
            }

            stock[segmento][center] = {
              ...stockInfo,
              Tonalidade: tone,
              Nuance: nuance,
              TomNuance: tone + nuance,
              TomIndex: ton
            };
          });

          return stock[segmento];
        });
      },
      PrecoPromo: record => record.Master.PrecoPromoNavig,
      Tipo: record => record.Master.Tipo
    };
  });
})();
