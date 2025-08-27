(() => {
  'use strict';

  const favoriteButton = () => {
    return {
      scope: {},
      controller: favoriteButtonController,
      replace: true,
      controllerAs: '$ctrl',
      bindToController: {
        model: '<'
      },
      templateUrl: 'app/books/directives/favoriteButton.html'
    };

    function favoriteButtonController(dataService, localService) {
      const kart = localService.getData('kart');

      this.toggleFav = function() {
        let action;
        let data = {
          CodeCli: kart.Master.CodeCli,
          MaterialCode: this.model.MaterialCode || this.model.Master.MaterialCode
        };

        this.model.Favorito = !this.model.Favorito;
        action = this.model.Favorito ? 'Add' : 'Remove';
        return dataService
          .postData(action + 'FavoriteMaterial', data)
          .then(() => null, localService.errorHandler);
      };
    }
  };

  angular.module('app').directive('favoriteButton', favoriteButton);
})();
