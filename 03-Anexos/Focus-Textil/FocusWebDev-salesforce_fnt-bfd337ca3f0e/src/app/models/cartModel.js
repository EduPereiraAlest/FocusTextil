/* global utils:true */
(function () {
  'use strict';
  angular.module('app').factory('CartModel', () => {
    'use strict';
    return {
      Abgru: record => record.Abgru,
      MaterialCode: record => record.MaterialCode,
      MaterialCodOld: record => record.MaterialCodOld,
      DescMat: record => record.DescMat,
      NcmCode: record => record.NcmCode,
      PercIpi: record => record.PercIpi,
      DatePeProg: record => record.DatePeProg,
      QtdMaterial: record => record.QtdMaterial,
      PrcMaterial: record => record.PrcMaterial,
      GroupMaterial: record => record.GroupMaterial,
      Ipad: record => record.Ipad,
      IpadX: record => record.IpadX,
      UnidMed: record => record.UnidMed,
      QtdeMultiplo: record => record.QtdeMultiplo,
      CorteMin: record => record.CorteMin,
      StockDetail: record => record.StockDetail,
      TpStockCode: (record, params) => params.stockCode,
      ParsedMult: record =>
        utils.helpers.parseCurr(record.QtdeMultiplo) + ' ' + record.UnidMed,
      Price: record => record.Price,
      PrcMat: record => {
        const existsMaterialTypeZipper = record.Master.MaterialZipper || null
        const isMaterialZipperToFourDecimalPrice = existsMaterialTypeZipper ? 4 : 2

        return {
          BRL: utils.helpers.parseCurr(record.Price.PrecoBrl90, isMaterialZipperToFourDecimalPrice),
          USD: utils.helpers.parseCurr(record.Price.PrecoUsd90, isMaterialZipperToFourDecimalPrice)
        }
      },
      StkMat: (record, params) => {
        const stock = record.Stock[params.stockCode] || {};
        return ['QtdEstApos', 'QtdEstendida', 'QtdProntEntreg'].reduce(function (
          result,
          key
        ) {
          result[key] = Math.floor(+stock[key]) || '-';
          return result;
        },
          {});
      }
    };
  });
})();
