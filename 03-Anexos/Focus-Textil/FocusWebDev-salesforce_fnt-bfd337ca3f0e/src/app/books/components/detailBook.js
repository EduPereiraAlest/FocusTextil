/* global utils:true */
(function() {
  'use strict';

  const detailBook = {
    controller: detailBookController,
    bindings: {
      model: '<',
      params: '<',
      kart: '<',
      page: '<'
    },
    templateUrl: 'app/books/components/detailBook.html'
  };

  /* @ngInject */
  detailBookController.$inject = ['$scope', '$timeout', 'dataService', 'localService', '$interval'];

  function detailBookController($scope, $timeout, dataService, localService, $interval) {
    console.log("detailBookController($scope)", $scope, this);

    var vm = this;

    vm.bookPages = [];

    closePopups();

    $scope.closeDetail = closeDetail;
    $scope.openBooksPopup = showBooks;
    $scope.openSimilaridadesPopup = showSimilaridades;
    $scope.openGreenPopup = showGreen;
    $scope.openPropostaUsoPopup = showPropostaUso;
    $scope.openDimensoesPopup = showDimensoes;
    $scope.openComposicaoPopup = openComposicaoPopup;
    $scope.closePopups = closePopups;

    vm.panel = false;
    vm.dispDate = utils.helpers.dispDate;

    vm.getComp = ({
      Composition
    }) => {
      return _.map(
        Composition,
        item => item.Description && item.Description + ' ' + parseInt(item.Value, 10) + '%;'
      ).join(' ');
    };

    vm.getBook = ({
      BookMat
    }) => {
      return BookMat.replace(/,/g, '\n');
    };

    vm.getBookPages = ({
      BookMat
    }) => {
      var re = /:\s|,\s/;
      return BookMat.split(re);
    };

    vm.getGram = ({
        Gramatura,
        GramaturaM2
      }) =>
      (+Gramatura).toFixed(2) + ' g/m - ' + (+GramaturaM2).toFixed(2) + 'g/m';

    vm.getRend = ({
      Gramatura,
      LargTotal
    }) => {
      let rend = (rend = 1000 / (+Gramatura * +LargTotal));

      return rend.toFixed(2);
    };

    vm.getStock = (material, stockQtd, stockCode) =>
      stockCode === 'C' ? 0 : material.Stock[stockCode][stockQtd];
    
    vm.getTomProp = function(material, prop, tom) {
      var stock = material.Stock;
      var centro = material.CentroSelecionado;
      var filter = stock.filter(function(stockItem) {
        if (
          typeof stockItem[centro] == "undefined" ||
          typeof stock[tom][centro] == "undefined"
        ) {
          return false;
        }
        var tomItem = stockItem[centro].Tonalidade;
        var tomStock = stock[tom][centro].Tonalidade
        var comp = tomItem == tomStock;
        return comp;
      });

      if (!filter.length) {
        return "";
      }

      var tomProp = filter[0][centro][prop];

      return tomProp;
    }

    function showBooks() {
      closePopups();
      var material = vm.model;
      vm.bookPages = vm.getBookPages(material);
      $scope.modalBook = !$scope.modalBook;
    }

    function openComposicaoPopup() {
      closePopups();
      $scope.showModalComposicao = !$scope.showModalComposicao;
    }

    function showSimilaridades() {
      closePopups();
      $scope.modalSim = !$scope.modalSim;
    }

    function showGreen(){
      closePopups();
      $scope.modalGreen = !$scope.modalGreen;
    }

    function showPropostaUso() {
      closePopups();
      $scope.modalProposta = !$scope.modalProposta;
    }

    function showDimensoes() {
      closePopups();
      $scope.modalDimensoes = !$scope.modalDimensoes;
    }


    function closePopups() {
      $scope.modalSim = false;
      $scope.modalGreen = false;
      $scope.modalProposta = false;
      $scope.modalDimensoes = false;
      $scope.modalBook = false;
      $scope.showModalComposicao = false;
    }

    vm.adaptMaterialsModel = function() {
      if (!vm.model || !vm.model.length) return;
      vm.model = vm.model.map(function(material) {
        var centros = Object.keys(material.Stock[material.selectedTom]).sort();
        material.Centros = centros;
        material.CentroSelecionado = centros[0];

        return material;
      });
    }

    vm.centroUpdater = function(material) {
      var selectedTom = material.selectedTom;
      var tomCentros = Object.keys(material.Stock[selectedTom]).sort();
      material.Centros = tomCentros;
      material.CentroSelecionado = tomCentros[0];

      let newTonArr = [];
      let totalQtdPETons = 0;

      material.Centros.forEach(function (item, index) {
        try{
          totalQtdPETons = totalQtdPETons + material.Stock[selectedTom][item].QtdProntEntreg;
          newTonArr.push({
            centro: item,
            QtdProntEntreg: material.Stock[selectedTom][item].QtdProntEntreg
          })
        }catch(e){

        }
      })
      material.QtdPETotal = totalQtdPETons
      material.Tons = newTonArr;

    }

    vm.$onInit = function() {
      console.log("$onInit detailBook", vm);
      vm.adaptMaterialsModel();
    };

    function closeDetail(root, key, callback) {
      vm.model = '';
    }
  }

  angular.module('app').component('detailBook', detailBook);
})();