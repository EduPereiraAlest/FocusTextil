// COMPONENTE CONTROLE DE TABELAS
// USADO NAS TELAS ORDERS E STATUS

(() => {
  'use strict';
  angular.module('app').controller('TableController', TableController);

  function TableController(localService) {
    const vm = this;

    vm.records = [];
    vm.pages = [];
    vm.data = {};
    vm.page = {
      info: {},
      search: '',
      sort: ' ',
      filters: '',
      scroll: 0
    };

    vm.setInfo = setInfo;
    vm.setPage = setPage;
    vm.startPage = startPage;
    vm.checkScroll = checkScroll;
    vm.setRecords = setRecords;

    function setInfo(info, response) {
      let { CurrentPage, Records, TotalPages, TotalRecords } = response;

      return { CurrentPage, Records, TotalPages, TotalRecords, ...info };
    }

    function startPage(attrs) {
      vm.page = { ...vm.page, ...attrs };
      vm.pages = localService.getData('pages') || [];
      vm.page = vm.pages.find(page => page.name === attrs.name) || vm.page;
      return vm.page;
    }

    function setPage(page) {
      vm.pages = vm.pages || [];
      vm.page = { ...vm.page, ...page };

      _.mergeBy(vm.pages, page, 'name');
      return localService.setData('pages', vm.pages);
    }

    function setRecords(records, key) {
      vm.records = records ? removeDuplicates([...vm.records, ...records], key) : [];
      return vm.records;
    }

    function removeDuplicates(myArr, prop) {
      return myArr.filter((obj, pos, arr) => {
        return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
      });
    }

    function checkScroll() {
      if (
        +vm.page.info.CurrentPage < +vm.page.info.TotalPages &&
        +vm.page.info.TotalRecords > vm.records.length
      ) {
        vm.data.Page = +vm.page.info.CurrentPage + 1;
        vm.page.info.CurrentPage = vm.data.Page;
        return true;
      }
      return false;
    }
  }
})();
