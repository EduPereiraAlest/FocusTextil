(function() {
  'use strict';
  angular.module('app').directive('clientFavorite', clientFavorite);

  function clientFavorite(dataService, localService) {
    return {
      restrict: 'AE',
      scope: {
        model: '=ngModel'
      },
      link: link
    };

    function link(scope, element) {
      let action;

      element.bind('click', () => {
        scope.model.Favorito = !scope.model.Favorito;
        action = scope.model.Favorito ? 'Add' : 'Remove';
        scope.$apply();

        return dataService
          .postData(action + 'FavoriteCustomer', {
            CodeCli: scope.model.CodeCli
          })
          .then(res => {
            console.log(res);
          }, localService.errorHandler);
      });
    }
  }
})();
