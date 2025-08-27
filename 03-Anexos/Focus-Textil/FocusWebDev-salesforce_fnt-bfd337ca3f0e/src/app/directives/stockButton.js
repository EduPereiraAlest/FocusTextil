(function() {
  'use strict';
  angular.module('app').directive('stockButton', stockButton);

  function stockButton(dataService, localService) {
      return {
          replace: true,
          scope: {
              model: '=',
              kart: '=',
              code: '<',
              items: '<'
          },
          templateUrl: 'app/directives/stockButton.html',
          link: function(scope) {
              scope.parseStock = function(value) {
                  return Math.floor(value);
              };



              scope.saveChange = function(code, selectedDateAtcDelv, onMaterial) {
                if (scope.kart && scope.code) {
                  let items = scope.kart.Master.Item902;

                  selectedDateAtcDelv = selectedDateAtcDelv.split(',');
                  let existsMaterialInCart = false;

                  angular.forEach(items, item => {
                    if (item.MaterialCode === code && item.Segmento === onMaterial) {
                      item.DateAtcDelv = selectedDateAtcDelv[0];
                      item.Date = selectedDateAtcDelv[0];
                      item.Centro = selectedDateAtcDelv[1];
                      existsMaterialInCart = true;
                    }
                  });

                  if (items && items.length && existsMaterialInCart) {
                    saveKart(scope.kart);
                  } else {
                    scope.model.DateAtcDelv = selectedDateAtcDelv[0];
                    onMaterial.CentroSelecionado = selectedDateAtcDelv[1]
                    onMaterial.Centro =  selectedDateAtcDelv[1];
                    onMaterial.Date = selectedDateAtcDelv[0];
                    onMaterial.DateAtcDelv = selectedDateAtcDelv[0];
                    saveKart(scope.kart);
                  }
                }
              };

              function saveKart(kart) {
                return dataService
                  .postData('SaveShoppingCart', {
                    Cart: angular.toJson(kart),
                    Check: 'false'
                  })
                  .then(({ Cart }) => localService.setData('kart', Cart), localService.errorHandler);
              }
          }
      };
  }
})();
