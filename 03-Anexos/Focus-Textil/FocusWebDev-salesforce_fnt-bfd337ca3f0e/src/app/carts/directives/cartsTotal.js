/* global utils:true */
(function() {
  'use strict';

  angular.module('app').directive('cartsTotal', cartsTotal);

  function cartsTotal() {
    return {
      replace: true,
      scope: {
        model: '<'
      },
      templateUrl: 'app/carts/directives/cartsTotal.html',
      link: link
    };

    function link(scope) {
      const parseCurr = utils.helpers.parseCurr;

      scope.$watch(
        () => scope.model,
        (newModel, oldModel) => {
          if (
            !scope.cartTotal ||
            newModel.total !== oldModel.total ||
            newModel.ipi !== oldModel.ipi
          ) {
            console.log('[total]', newModel);
            scope.materialTotal = parseCurr(newModel.total);
            scope.ipiTotal = parseCurr(newModel.ipi);
            scope.cartTotal = parseCurr(newModel.total + newModel.ipi);
          }
        },
        true
      );
    }
  }
})();
