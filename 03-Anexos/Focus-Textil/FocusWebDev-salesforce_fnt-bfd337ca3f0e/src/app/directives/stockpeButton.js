(function() {
  'use strict';
  angular.module('app').directive('stockpeButton', stockpeButton);

  function stockpeButton(dataService, localService) {
      return {
          replace: true,
          scope: {
              model: '=',
              kart: '=',
              code: '<',
              items: '<'
          },
          templateUrl: 'app/directives/stockpeButton.html',
          link: function(scope) {

              scope.updateListDisp = function(material) {
                scope.model = true;
                filterListDisp(material);
              };

              scope.centerSelectedInPE = 'T101';

              (function() {
                const currentTons = scope.items.Tons
                const currentMaterialCode = scope.items.MaterialCode

                if (!currentTons || currentTons.length === 0) return;

                const materials = (scope.kart && scope.kart.Master && scope.kart.Master.Item902) || [];
                if (!materials || materials.length === 0) return;

                const matchedMaterial = materials.find(mat => mat.MaterialCode === currentMaterialCode);
                if (!matchedMaterial) return;

                const matchedTon = currentTons.find(ton => ton.centro === matchedMaterial.Centro);
                if (matchedTon) {
                  scope.centerSelectedInPE = matchedTon.centro
                  return
                }

                return;
              })()

              function filterListDisp(material) {
                material.TomIndex = material.TomIndex || 0;

                let CentroSelecionado = material.CentroSelecionado;
                const findObjectInCenter = material.Stock.find((stck) => Object.keys(stck)[0] === material.CentroSelecionado)
                let Stock = findObjectInCenter[CentroSelecionado];
                let SegmentoEstoque = Stock.SegmentoEstoque;
                let hasListDisp = material.Disp[SegmentoEstoque] && material.Disp[SegmentoEstoque].ListDisp;
              }

          }
      };
  }
})();
