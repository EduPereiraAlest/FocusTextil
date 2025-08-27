/* global corReady:true utils:true */
/* BOOKS  */
(function() {
  'use strict';
  angular.module('app').controller('BooksController', BooksController);

  function BooksController($scope, $stateParams, dataService, localService, ModelBuilder, BookModel, params) {
    const vm = this;
    const vp = $scope.$parent.vm;
    let data = {};
    var kartTypeN = false;
    var kartTypeP = false;
    var flags = {
      isLoadingBooks: false,
      isLoadingMore: false
    };
    var blockSelect = false;
    const defaultLimit = 3500; //REQUEST LIMIT

    var isEfocusCustomer = localService.getData('isEfocusCustomer');

    var scopedLocalErrorHandler = function () {
      flagSet("isLoadingBooks", false);
      flagSet("isLoadingMore", false);
      localService.errorHandler.apply(this, [...arguments]);
    };

    // VARIABLES
    vm.params = params; // <<< route resolved param, FinancyFactor
    vm.materials = [];
    vm.materialTypes = [
      { name: 'Geral', value: 'null' },
      { name: 'Pré Lançamento', value: 'preview' },
      { name: 'Outlet', value: 'outlet' },
      { name: 'Promo', value: 'promo' },
      { name: 'Sales', value: 'sales' },
      { name: 'Promo Colors', value: 'promo-colors' },
    ];
    vm.types = [
      { name: 'Normal', value: 'N' },
      { name: 'Leves Defeitos', value: 'L' },
      { name: 'Pilotagem', value: 'P' },
      { name: 'Mostruário', value: 'C' }
    ];
    vm.branches = [
      { name: 'Espírito Santo', value: 'T101' },
      { name: 'São Paulo', value: 'T102' },
      { name: 'Santa Catarina', value: 'T103' },
      { name: 'Jaguaré', value: 'T104' },
      { name: 'Maracanaú', value: 'T106' }
    ];
    vm.currs = [{ name: 'BRL', value: 'BRL' }, { name: 'USD', value: 'USD' }];


    vm.stockCentersPreview = [
      { name: 'Todos', value: '' },
      { name: 'S201 - SP - São Paulo', value: 'S201' }
    ];

    vm.stockCenters = [
      { name: 'Todos', value: '' },
      { name: 'T101 - ES - Serra', value: 'T101' },
      { name: 'T103 - SC - Araquari', value: 'T103' },
      { name: 'T104 - ES - Aracruz', value: 'T104' },
      { name: 'T105 - PE - Cabo de Santo Agostinho', value: 'T105' },
      { name: 'T106 - CE - Maracanaú', value: 'T106' }
    ];

    vm.conditionalCenters = vm.stockCenters;

    vm.page = {
      name: 'BOOKS',
      currency: 'BRL',
      list: true,
      books: false,
      stock: false,
      offcor: false,
      type: 'N',
      materialType: 'null',
      branch: '',
      grammage: '',
      ebook: '',
      info: {},
      search: '',
      sort: 'Master._DescMat',
      filters: '',
      scroll: 0
    };

    setPage(vm.page);

    // FUNCIONS
    vm.submitForm = submitForm;
    vm.clearForm = clearForm;
    vm.loadMore = loadMore;
    vm.blockSelect = blockSelect;
    vm.setSort = setSort;
    vm.setStock = setStock;
    vm.setBook = setBook;
    vm.setTableView = syncViews;
    vm.setBookView = setBookView;
    vm.updateStock = updateStock;
    vm.kartTypeN = kartTypeN;
    vm.kartTypeP = kartTypeP;
    vm.validateConditionalCenter = validateConditionalCenter;
    vm.currentSearch = '';

    vm.clearFilters = () => null;
    vm.setOffFilters = setOffFilters;

    activate();

    function activate() {
      vp.activate();
      localVars(vm);

      loadFilters();

      vm.kart = vp.kart;
      vm.updated = [];

      setTimeout(function () {
        if (
          vm &&
          vm.kart &&
          vm.kart.Master &&
          vm.kart.Master.CodeCurr
        ) {
          vm.page.currency = vm.kart.Master.CodeCurr;
        } else {
          vm.page.currency = 'BRL';
        }

        toggleMostruario();
        validateConditionalCenter();
      }, 0);

      $scope.$watch('vm.page.currency', function(oldValue, newValue) {
        if (
          vm.kart &&
          vm.kart.Master &&
          vm.kart.Master.CodeCurr != vm.page.currency &&
          !vm.kart.Master.Editavel
        ) {

          vm.kart.Master.CodeCurr = vm.page.currency;
          localService.setData('kart', vm.kart);
        }
      });


      var paramsBookView = localStorage.paramsBookView && JSON.parse(localStorage.paramsBookView);


      if (paramsBookView && paramsBookView.view && paramsBookView.search && paramsBookView.view == "image") {
        vm.page.search = paramsBookView.search;
        setTableView('image');
        submitForm();
      }

      if (vm.pages && vm.pages.length) {
        vm.page = _.findWhere(vm.pages, { name: 'BOOKS' }) || vm.page;
        return vm.page.info.Records ? fillData() : submitForm();
      }


      return console.log('[Activate Books]');
    }

    function toggleMostruario() {
      if (vm.page.type == "C") {
        if ( ! isArrEqual(vm.conditionalCenters, vm.stockCentersPreview)) {
          vm.conditionalCenters = vm.stockCentersPreview;
          vm.page.branch = '';
        }
      } else {
        if ( ! isArrEqual(vm.conditionalCenters, vm.stockCenters)) {
          vm.conditionalCenters = vm.stockCenters;
          vm.page.branch = '';
        }
      }
    }

    function isArrEqual(arr1, arr2) {
      return JSON.stringify(arr1) === JSON.stringify(arr2);
    }

    function localVars(ctrl) {
      let local = _.pick(localService.getAll(), 'pages', 'kart');

      return _.extend(ctrl, local);
    }

    function fillData() {
      data = searchModel(true);
      vm.page.books = false;
      vm.materials = [];
      vm.updated = [];
      return loadData();
    }

    function submitForm(event = {}) {
      document.activeElement.blur();

      if (event.preventDefault) {
        event.preventDefault();
      }

      toggleMostruario();
      validateConditionalCenter();

      clearForm(vm.page.search, event.type === 'submit');

      if (vm.page.books) {
        return loadBooks();
      }

      data = searchModel();

      return loadData();
    }

    function searchModel(fill) {
      let currentPage = fill ? vm.page.info.CurrentPage || 1 : 1;
      let tipoStock;

      if (vm.page.type === 'C') {
        tipoStock = 'car';
      } else {
        if (vm.page.type === 'V') {
          tipoStock = 'pl';
        } else {
          tipoStock = 'sku';
        }
      }

      if (vm.page.materialType != "null" && typeof vm.page.materialType != "undefined") {
        tipoStock += "|" + vm.page.materialType;
      }

      var bStock = vm.page.stock ? vm.page.type : 'X';
      bStock = vm.page.type === "L" ? "L": bStock;

      var paramOutlet = vm.kart && vm.kart.Master && vm.kart.Master.Outlet;

      if (typeof paramOutlet === "undefined" || paramOutlet === "false" || paramOutlet === "" || paramOutlet === false || paramOutlet === null) {
        paramOutlet = "false"
      } else {
        paramOutlet = "true";
      }

      var model = {
        Search: vm.page.search.toLowerCase(),
        Type: tipoStock,
        Outlet: paramOutlet,
        Stock: bStock,
        Limit: defaultLimit * currentPage,
        Page: 1,
        Werks: conditionalBranch(),
        Filter: vm.page.filters,
        Grammage: vm.page.grammage,
        OrderBy: vm.page.sort
      };

      if (vm.kart && vm.kart.Master && vm.kart.Master.CodeCli) {
        model.CodeCli = vm.kart.Master.CodeCli;
      }

      return model;
    }

    function loadBooks() {
      if (vm.page.search) {
        vm.page.ebook = vm.page.search;
        dataService
          .postData('Ebook', { Ebook: vm.page.ebook, OrderBy: vm.page.sort })
          .then(({ Results }) => {
            console.log(Results, 'RESULTADO TESTE')
            if (!Results.length) {
              clearForm(vm.page.search);
              return localService.openModal('Nenhum book encontrado.');
            }
            vm.books = Results;
            return false;
          });
      }
    }

    function debugMaterials(vm) {

      function rnd() {
        return "XX" + Math.random().toString(36).substr(2).toUpperCase();
      }

      function deepClone(obj) {
        try {
          return JSON.parse(JSON.stringify(obj));
        } catch(err) {
          console.log("deepClone ERROR: ", obj, err);
        }
      }

      function rndItem(base) {
        var clone = deepClone(base);
        clone.DescCor = rnd();
        clone.DescMat = rnd();
        clone.MaterialCode = rnd();
        return clone;
      }

      function generateMockup(max) {
        var materialItem = rndItem(vm.materials[0]);
        var totalMockup = max || 100;

        while(totalMockup--) {
          materialItem = rndItem(materialItem);
          materialItem.debugModelIndex = vm.materials.length;
          vm.materials.push(materialItem);
        }
      }

      generateMockup();

      // vm.materials.forEach(function (mat) {
      //   var baseSize = 15;
      //   if (mat.Stock && mat.Stock.length) {
      //     mat.vscrollMultiplier = baseSize * mat.Stock.length;
      //   } else {
      //     mat.vscrollMultiplier = baseSize * 1;
      //   }
      //   console.log("vscrollMultiplier", mat.vscrollMultiplier);
      // });

    }

    function conditionalBranch() {
      // if (vm.page.type == 'C') {
      //   return 'S201'; QUEBRA O FLUXO
      // } else {
        return vm.page.branch;
      // }
    }

    function loadFilters() {
      dataService.postData('FilterLoad').catch(function (err) {
        console.log("COULDN'T LOAD FILTERS", err);
      }).then(function (data) {
        if (data) {
          localService.setData('filterload', data.Results);
        } else {
          console.log("COULDN'T LOAD FILTERS", data);
        }
      });
    }

    function flagSet(flag, value) {
      flags[flag] = value;
    }

    function loadData(callback) {
      // P11AF011800001
      var canLoadData = data.Search && !flags.isLoadingBooks;


      if (canLoadData) {
        flagSet("isLoadingBooks", true);
        data.eFocus = isEfocusCustomer;
        dataService.postData('Material', data).then(res => {;

          vm.currentSearch = data.Search.toUpperCase();

          if (!res.TotalRecords) {
            clearForm(data.Search);
            flagSet("isLoadingBooks", false);
            flagSet("isLoadingMore", false);
            return localService.openModal('Nenhum registro encontrado.');
          }

          let bookModel = ModelBuilder.buildModelList(res.Results, BookModel, {
            stockCode: vm.page.type,
            branchCode: conditionalBranch(),
            params: vm.params
          });



          var cleanMaterials = removeDuplicates([...vm.materials, ...bookModel], 'MaterialCode');

          // filtra materiais sem estoque
          // (não deveria acontecer, mas quando acontece quebra o layout)
          cleanMaterials = cleanMaterials.filter(function (mat) {

            var keepMaterial = !((typeof mat.Stock == "object") && (Object.keys(mat.Stock).length == 0));

            if ( ! keepMaterial) {
              console.log(" ! ! ! INCONSISTENT MATERIAL", mat.MaterialCode, mat);
            }

            return keepMaterial;
          });

          vm.materials = cleanMaterials;

          // debugMaterials(vm);

          vm.page.info = setInfo(vm.page.info, res);
          vm.page.offcor = corReady && navigator.onLine;
          data.Limit = defaultLimit;

          vm.materials = vm.materials.map(function (mat, index) {




            // injeção raíz de material
            mat.MaterialCodeTrack = mat.MaterialCode + '-' + index;
            mat.debugModelIndex = index;

            mat.selectedTom = 0;

            var centros = Object.keys(mat.Stock[mat.selectedTom]).sort();
            mat.Centros = centros;

            if (mat.Stock[mat.selectedTom].T101) {
              mat.CentroSelecionado = "T101";
            } else {
              mat.CentroSelecionado = centros[0];
            }

            mat['Tons'] = []
            mat['QtdPETotal'] = 0;


            mat.Centros.forEach(function(item, index){
              mat['QtdPETotal'] = mat['QtdPETotal'] + mat.Stock[mat.selectedTom][item].QtdProntEntreg;
              mat['Tons'].push({
                centro: item,
                QtdProntEntreg: mat.Stock[mat.selectedTom][item].QtdProntEntreg
              })
            })

            return mat;
          });


          safeApply(function () {
            console.log("loadData SAFE APPLY");
          });

          updateData();

          flagSet("isLoadingBooks", false);
          flagSet("isLoadingMore", false);

          if (angular.isFunction(callback)) {
            return _.delay(callback, 300);
          }

          $scope.$root.$broadcast('materialsUpdate');

          return false;
        }, scopedLocalErrorHandler);
      }
    }

    function safeApply(fn) {
      setTimeout(function () {
        var thisScope = $scope.$root;
        var phase = thisScope.$$phase;
        if(phase == '$apply' || phase == '$digest') {
          console.log("bc safeApply exec WITHOUT APPLY");
          if(fn && (typeof(fn) === 'function')) {
            fn();
          }
        } else {
          console.log("bc safeApply exec WITH APPLY");
          thisScope.$apply(fn);
        }
      }, 0);
    }

    function setInfo(info, response) {
      let { CurrentPage, Records, TotalPages, TotalRecords } = response;

      return { CurrentPage, Records, TotalPages, TotalRecords, ...info };
    }

    function removeDuplicates(myArr, prop) {
      return myArr.filter((obj, pos, arr) => {
        return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
      });
    }

    function updateData() {
      setPage();
      loadFavs();
      setCart();
      updateView();
    }

    function updateView() {
      var isTableBook = vm.page.list && !vm.page.books;
      var isSlidesBook = !vm.page.list;
      if (isSlidesBook) {
        vm.updateSlidesView();
      }
    }

    // ACTION FUNCIONS

    function clearForm(search = '', all = true) {
      if (all) {
        vm.page.sort = 'Master._DescMat';
        vm.page.ebook = '';
        // vm.page.filters = '';
        // vm.clearFilters();
      }

      if (vm.page.books) {
        vm.page.ebook = '';
      }

      vm.page.info = {};
      vm.materials = [];
      vm.updated = [];
      vm.books = [];
      vm.page.search = search;
      data = {};
      localService.slideTrack = {};
      utils.helpers.setScrollTop();
      return setPage();
    }

    function updateStock(list) {
      let materials = list || vm.materials.map(material => material.MaterialCode);

      if (vm.page.offcor && materials.length && vm.page.type !== 'C') {
        dataService.postData('StockUpdate', materials).then(({ Results, Stock }) => {
          if (Results === 'Sucesso') {
            let updated = Stock.map(material => {


              return {
                MaterialCode: material['_key'].split('|')[1],
                QtdeMultiplo: material.QtdeMultiplo,
                CorteMin: material.CorteMin,
                Stock: material.Stock
              };
            });

            vm.updated = vm.updated.concat(updated);
            setUpdated(vm.updated);
          }
        }, scopedLocalErrorHandler);
      }
      return false;
    }

    function loadMore(callback) {
      var canLoadMore = +vm.page.info.CurrentPage < +vm.page.info.TotalPages &&
        +vm.page.info.TotalRecords > vm.materials.length;

      canLoadMore = canLoadMore && !flags.isLoadingBooks && !flags.isLoadingMore;

      if (canLoadMore) {
        flagSet("isLoadingMore", true);
        data.Page = +vm.page.info.CurrentPage + 1;
        vm.page.info.CurrentPage = data.Page;
        return _.delay(loadData, 300, callback);
      }
      return false;
    }

    // START FUNCTIONS

    function loadFavs() {
      return vm.kart
        ? dataService
            .postData('FavoriteMaterial', { CodeCli: vm.kart.Master.CodeCli })
            .then(({ Results }) => setFavs(Results), scopedLocalErrorHandler)
        : false;
    }

    function setBookView() {
      vm.page.books = !vm.page.books;
      if (vm.page.books) {
        vm.page.search = vm.page.ebook;
        vm.page.list = true;
        vm.page.sort = ' ';
        loadBooks();
      } else {
        vm.page.search = data.Search || '';
        loadData();
      }
    }

    function getImageListIndexHead() {
      var scroller = document.querySelector('.gallery-content .gallery-scroll');
      var screenPos = parseInt(getComputedStyle(scroller).getPropertyValue('left'), 10);

      var indexElement;
      var slides = 4;
      var visibleList = scroller.querySelectorAll(".material-item");

      if (screenPos == 0) {
        indexElement = visibleList[0];
      } else {
        indexElement = visibleList[slides];
      }

      var imageListIndexHead = angular.element(indexElement).scope().material.debugModelIndex;

      return imageListIndexHead;
    }

    function syncViews(type) {

      var scroller = document.querySelector('.table-scroll tbody'); // text list

      if ( ! scroller) {
        scroller = document.querySelector('.gallery-content .gallery-scroll'); // image list

      } else {

      }

      var fromImageToList = type == "list";
      vm.page.list = fromImageToList;

      var jumpToIndex = 0;

      if (fromImageToList) { // from image to list
        jumpToIndex = getImageListIndexHead();
        localService.syncViewIndex = jumpToIndex;
        setTimeout(function(){
          tableJumpTo(jumpToIndex);
        }, 0);

      } else {  // from list to image
        jumpToIndex = firstTextListVisible();
        localService.syncViewIndex = jumpToIndex;
      }

      return setPage();
    }

    window.debugFirstVisible = firstTextListVisible.bind(this);
    function firstTextListVisible() {
      var tbody = document.querySelector(".table-scroll tbody");

      if ( ! tbody) {
        return;
      }

      var rows = tbody.querySelectorAll("tr.vs-repeat-repeated-element");
      var padElement = tbody.querySelector("tr.vs-repeat-before-content");
      var firstRendered = rows[0];
      var verticalPad = parseInt(getComputedStyle(padElement).getPropertyValue('height'), 10);
      var scrollView = tbody.scrollTop;
      var baseSize = parseInt(getComputedStyle(firstRendered).getPropertyValue('height'), 10);
      var visibleIndex = Math.ceil((scrollView - verticalPad) / baseSize);
      var targetElement = rows[visibleIndex];
      var indexHead = targetElement.getAttribute("data-model-index");
      indexHead = parseInt(indexHead, 10);
      indexHead = (indexHead - ( indexHead % 4));

      return indexHead;
    }

window.debugTableJumpTo = tableJumpTo.bind(this);
    function tableJumpTo(index) {
      index = parseInt(index, 10);
      index = (index - ( index % 4));

      var tbody = document.querySelector(".table-scroll tbody");
      var rows = tbody.querySelectorAll("tr.vs-repeat-repeated-element");
      var firstRendered = rows[0];
      var baseSize = parseInt(getComputedStyle(firstRendered).getPropertyValue('height'), 10);

      var tbodyScope = angular.element(tbody).scope();
      var renderModel = tbodyScope.$ctrl.renderModel;
      var targetIndex = renderModel.findIndex(row => row.debugModelIndex === index);
      var indexToScroll = baseSize * targetIndex;
      tbody.scrollTop = indexToScroll;
    }

    function setTableView(type) {
      let el = document.querySelector('.table-scroll tbody');

      vm.page.list = type === 'list';

      if (vm.page.list) {
        _.delay(utils.helpers.setScrollTop, 200, localService.scrollTop);
      } else if (el) {
        localService.scrollTop = el.scrollTop;
        localService.slideTrack.left = Math.floor(el.scrollTop / 180) * -1000 + 'px';
      }

      return setPage();
    }

    function setStock() {
      vm.page.stock = !vm.page.stock;
      return submitForm();
    }

    function setSort(sort) {
      vm.page.sort = sort;
      return submitForm();
    }

    function setBook(book, hyer) {
      let hyerProd = '(master._hyerprod:' + hyer.split('.').join('') + ')';

      vm.page.books = false;
      vm.page.filters = '(master.ebookcode:' + book + ')';
      vm.page.search = '*';
      vm.page.sort = ' ';

      return submitForm();
    }

    function setOffFilters(cleaner) {
      vm.clearFilters = cleaner;
    }

    function setFavs(favorites = []) {
      angular.forEach(favorites, favorite => {
        return _.chain(vm.materials)
          .find(material => material.MaterialCode === favorite.MaterialCode)
          .extend({ Favorito: true });
      });
    }

    if (
      vm &&
      vm.kart &&
      vm.kart.Master &&
      vm.kart.Master.Editavel
    ) {
      validateCartTpStockCode();
      if(vm.kartTypeN){
        vm.page.type = 'N';
        vm.blockSelect = true;
      }else if(vm.kartTypeP){
        vm.page.type = 'P';
        vm.blockSelect = true;
      }
    }

    function validateConditionalCenter(){
      if (
        vm &&
        vm.kart &&
        vm.kart.Master &&
        vm.kart.Master.Item902 &&
        vm.kart.Master.Item902.length &&
        vm.kart.Master.Item902[0].Centro &&
        vm.kart.Master.Editavel
      ) {
        let centro = vm.kart.Master.Item902[0].Centro;

        vm.page.branch = centro;
        vm.disableConditionalCenter = true;
      } else {
        vm.disableConditionalCenter = false;
      }
    }

    function validateCartTpStockCode(){
      if (
        ! (
          vm &&
          vm.kart &&
          vm.kart.Master &&
          vm.kart.Master.Item902 &&
          vm.kart.Master.Item902.length
        )
      ) {
        return false;
      }

      if(vm.kart.Master.Item902[0].TpStockCode === 'N') {
        return vm.kartTypeN = true;
      } else if (vm.kart.Master.Item902[0].TpStockCode === 'P'){
        return vm.kartTypeP = true;
      }
    }

    function setCart() {

      if (vm.kart && vm.kart.Master.Item902) {
        let items = vm.kart.Master.Item902;


        angular.forEach(items, kartItem => {

          let currentMaterial = vm.materials.find(
            function (material) {
              var isCurrent = material.MaterialCode === kartItem.MaterialCode
              return isCurrent;
            }
          );


          if ( ! currentMaterial) {
            console.log("setCart ERROR: NO VALID MATERIAL FOUND IN CART", currentMaterial);
            return;
          }

          // no em cada item do carrinho
          // procura o item carregado


          // se achar o item do carrinho na lista de materiais carregados
          // aqui precisa setar as quantidades para todas as tonalidades

          var centro = kartItem.Centro;
          var tom;

          if (typeof kartItem.TomIndex == 'undefined') {
            tom = currentMaterial.Centros.indexOf(centro);
          } else {
            tom = kartItem.TomIndex;
          }



          // DUVIDA: A Array do Stock é para cada tonalidade? Por enquanto, sim.

          // let currentStock = currentMaterial.Stock.find(
          //   stock => stock.Tonalidade === item.Stock.Tonalidade
          // );

          // vale preencher do carrinho? !!!!!!!!!!!!!!
          // a questão é pegar os itens do carrinho, pegar o indice da tonalidade do carrinho
          if(kartItem.QtdMaterial && currentMaterial && currentMaterial.Stock && currentMaterial.Stock[tom] && currentMaterial.Stock[tom][centro]) {
            currentMaterial.Stock[tom][centro].QtdMaterial = kartItem.QtdMaterial;
          } 

          // currentStock precisa ser Stock[TOM][CENTRO]
          // currentStock.QtdMaterial = kartItem.QtdMaterial;

          console.log('[setCart]', kartItem, currentMaterial);
        });
      }
      return false;
    }

    function setUpdated(updateList = []) {
      console.log(updateList);

      // angular.forEach(updateList, ({ Stock, QtdeMultiplo, CorteMin, MaterialCode }) => {
      //   let item = vm.materials.find(material => material.MaterialCode === MaterialCode);

      //   return _.extend(item, {
      //     Stock,
      //     QtdeMultiplo,
      //     CorteMin,
      //     Atual: true,
      //     StkMat: parseStock(Stock[item.TpStockCode]),
      //     ParsedMult: utils.helpers.parseCurr(QtdeMultiplo) + ' ' + item.UnidMed,
      //     ParsedMin: utils.helpers.parseCurr(CorteMin) + ' ' + item.UnidMed.toLowerCase()
      //   });
      // });
    }

    function parseStock(stock = {}) {
      return ['QtdEstApos', 'QtdEstendida', 'QtdProntEntreg'].reduce(function(result, key) {
        result[key] = Math.floor(+stock[key]) || 0;
        return result;
      }, {});
    }

    // DEFAULT FUNCTIONS

    function setPage() {
      vm.detail = null;
      vm.pages = vm.pages || [];
      _.mergeBy(vm.pages, vm.page, 'name');
      return localService.setData('pages', vm.pages);
    }

    $scope.$on('loader-lista-materiais-enabled', showLoader);

    $scope.$on('loader-lista-materiais-disabled', hideLoader);

    function hideLoader() {
      var listaMateriaisLoader = document.querySelector("div.materiais-loader");
      listaMateriaisLoader.style.display = "none";
    }

    function showLoader() {
      var listaMateriaisLoader = document.querySelector("div.materiais-loader");
      listaMateriaisLoader.style.display = "block";
    }
  }
})();
