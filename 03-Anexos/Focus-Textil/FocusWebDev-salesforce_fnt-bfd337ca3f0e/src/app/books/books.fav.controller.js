/* BOOKS FAVORITE */
(function() {
  'use strict';
  angular.module('app').controller('BooksFavController', BooksFavController);

  function BooksFavController($state, dataService, localService) {
    const vm = this;

    vm.selectMaterial = selectMaterial;

    activate();

    function activate() {
      localVars(vm);

      return vm.kart
        ? dataService
            .postData('FavoriteMaterial', { CodeCli: vm.kart.Master.CodeCli })
            .then(({ Results }) => (vm.materials = Results), localService.errorHandler)
        : $state.go('home');
    }

    function localVars(ctrl) {
      let local = _.pick(localService.getAll(), 'kart', 'pages');

      return _.extend(ctrl, local);
    }

    function selectMaterial(material) {
      return setPage({
        name: 'BOOKS',
        search: material.MaterialCode,
        info: '',
        sort: '',
        filters: '',
        grammage: ''
      });
    }

    function setPage(page) {
      _.mergeBy(vm.pages, page, 'name');
      localService.setData('pages', vm.pages);
      return $state.go('books');
    }
  }
})();
