/* global corReady:true utils:true */
(function() {
  'use strict';

  const slidesBook = {
    controller: slidesBookController,
    bindings: {
      model: '<',
      detail: '=',
      params: '<',
      kart: '<',
      page: '<',
      loadMore: '&'
    },
    templateUrl: 'app/books/components/slidesBook.html'
  };

  /* @ngInject */

  slidesBookController.$inject = ['$timeout', '$scope', '$state', 'localService'];

  function slidesBookController($timeout, $scope, $state, localService) {
    const vp = $scope.$parent.vm;

    vp.updateSlidesView = updateSlidesView;

    const slides = 4;
    const width = 240 + 10;
    let left = 0;
    let total, materials;

    var animTransition = "left 0.3s ease-in-out 0s";

    let scroller = document.querySelector(".gallery-content .gallery-scroll");

    var thisScope = this;

    this.ipad = corReady;
    this.next = _.throttle(next, 300, {trailing: false});
    this.prev = _.throttle(prev, 300, {trailing: false});
    this.pageCount = 1;
    this.setDetail = setDetail;
    this.dispDate = utils.helpers.dispDate;
    this.track = { left: localService.slideTrack.left || 0 };
    this.getTomProp = getTomProp;

    this.selectedTonsModel = {};
    this.detail = null;

    this.centroUpdater = centroUpdater;

    var unregisterModelWatch = $scope.$watch('$ctrl.model', items => {
      if (items.length) { // this is the model ONLOAD
        adaptMaterialsModel();
        if (localService.syncViewIndex) {
          jumpToImageIndex(localService.syncViewIndex);
          localService.syncViewIndex = null;
        } else {
          jumpToImageIndex(0);
        }
        updateState();
        unregisterModelWatch();
      }
      return;
    });

    function next() {
      updateModelNext();
    }

    function prev() {
      updateModelPrev();
    }

    function updateSlidesView() {
      setTimeout(function () {
        jumpToImageIndex(0);
      }, 0);
    }

    function adaptMaterialsModel() {
      return; // movido para o controller
      // thisScope.model = thisScope.model.map(function (material) {
      //   console.log("4ggtg6 adaptMaterialsModel", material);
      //   var centros = Object.keys(material.Stock[material.selectedTom]).sort();
      //   material.Centros = centros;

      //   if (material.Stock[material.selectedTom].T101) {
      //     material.CentroSelecionado = "T101";
      //   } else {
      //     material.CentroSelecionado = centros[0];
      //   }

      //   return material;
      // });
    }

    function centroUpdater(material) {
      var selectedTom = material.selectedTom;
      var tomCentros = Object.keys(material.Stock[selectedTom]).sort();
      material.Centros = tomCentros;
      material.CentroSelecionado = tomCentros[0];

      //TO:DO update sliderbook center stockbutton PE
      //      

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

    function jumpToImageIndex(indexHead) {
      indexHead = parseInt(indexHead, 10);
      indexHead = (indexHead - (indexHead % 4));
      filterListDisp();

      var screenFragment = thisScope.model.slice(indexHead, indexHead + (slides * 2));

      thisScope.fragmentedModel = screenFragment;

      if (indexHead === 0) {
        scroller.style.transition = "none";
        scroller.style.left = '0px';
      }

      console.log("JUMP TO INDEX", indexHead, thisScope.fragmentedModel, thisScope.model);
      updateState();
    }

    function updateModelNext(jumpTo) {
      var indexHead = jumpTo || getIndexHead();
      var isLastScreen = (indexHead + slides) >= (thisScope.model.length);

      if (isLastScreen) {
        return;
      }
      
      var screenFragment = thisScope.model.slice(indexHead, indexHead + (slides * 2));

      thisScope.fragmentedModel = screenFragment;

      function moveToNext() {
        scroller.style.transition = "none";
        scroller.style.left = '0px';
        
        setTimeout(function () {
          scroller.style.transition = animTransition;

          let fixAnim = function(event) {
            scroller.removeEventListener('transitionend', fixAnim, false);
            updateState();
          };

          scroller.addEventListener("transitionend", fixAnim, false);
          scroller.style.left = '-1000px';
        }, 0);
      }
      moveToNext();
    }

    function getIndexHead() {
      var indexHead;
      var screenPos = parseInt(getComputedStyle(scroller).getPropertyValue('left'), 10);

      if (screenPos == 0) {
        indexHead = thisScope.fragmentedModel[0].debugModelIndex;
      } else {
        indexHead = thisScope.fragmentedModel[slides].debugModelIndex;
      }

      return indexHead;
    }

    function updateModelPrev() {
      var indexHead = getIndexHead();
      var isFirstScreen = indexHead == 0;

      if (isFirstScreen) {
        return;
      }

      var screenFragment = thisScope.model.slice(indexHead - slides, indexHead + slides);

      thisScope.fragmentedModel = screenFragment;
      
      function moveToPrev() {
        scroller.style.transition = "none";
        scroller.style.left = '-1000px';

        setTimeout(function () {
          scroller.style.transition = animTransition;

          let fixAnim = function(event) {
            scroller.removeEventListener('transitionend', fixAnim, false);
            updateState();
          };

          scroller.addEventListener("transitionend", fixAnim, false);
          scroller.style.left = '0px';
        }, 0);
      }
      moveToPrev();
    }

    function updateState() {
      setTimeout(function () {
        toggleNavSliders();
        earlyLoadMore();
      }, 0);
    }

    function earlyLoadMore() {
      var indexHead = getIndexHead();
      var slidesEarly = 4;

      if (
        indexHead + (slides * slidesEarly) > thisScope.model.length && 
        thisScope.model.length < thisScope.page.info.TotalRecords
      ) {
        thisScope.loadMore({ callback: function (){
          console.log("LOADED MORE", arguments);
          toggleNavSliders();
        } });
      } else {
        console.log("Don't load more yet...");
      }
    }

    function toggleNavSliders() {
      var indexHead = getIndexHead();
      var isFirstScreen = indexHead == 0;
      var isLastScreen = (indexHead + slides) >= (thisScope.model.length);
      var canShowPrev = !isFirstScreen;
      var canShowNext = !isLastScreen;
      thisScope.showPrev = canShowPrev;
      thisScope.showNext = canShowNext;
      $scope.$apply();
    }

    function setDetail(material, track) {
      var vm = this;
      localService.slideTrack = track;
      vm.detail = null;
      setTimeout(function () {
        // CORRIGE BUG DE NÃO ATIVAÇÃO DA CADEIA DE MODELS
        // quando o vm.detail muda para o mesmo objeto, não dispara a cadeia de eventos
        // então precisa nullificar no escopo principal e em um subescopo 
        // com apply forçado carregar os dados
        vm.detail = material;
        $scope.$apply();
        console.log("555 setDetail", vm, material, track);
      }, 0);
    }

    function getTomProp(material, prop, tom) {
      var stock = material.Stock;
      var centro = material.CentroSelecionado;

      var filter = stock.filter(function (stockItem) {
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

      if ( ! filter.length) {
        return "";
      }

      var tomProp = filter[0][centro][prop];
      return tomProp;
    }

    function filterListDisp() {
      for (let material of thisScope.model) {
        material.TomIndex = material.TomIndex || 0;

        let TomIndex = material.TomIndex;
        let CentroSelecionado = material.CentroSelecionado;
        let Stock = material.Stock[TomIndex][CentroSelecionado];
        let SegmentoEstoque = Stock.SegmentoEstoque;
        let hasListDisp = material.Disp[SegmentoEstoque] && material.Disp[SegmentoEstoque].ListDisp;
  
        //Calcula o total de estoque ATC nos centros 
        var QtdEstAposTotal = 0;
        for(var i = 0; i < material.Centros.length;i++){
          QtdEstAposTotal = QtdEstAposTotal + material.Stock[TomIndex][material.Centros[i]].QtdEstApos;
        }
        
        if (hasListDisp) {
          material.Disp[SegmentoEstoque].ListDispView = hasListDisp
          material['isATCStock'] = true;
        }else{
          material['isATCStock'] = false;
        }
      }
    }

    this.getStock = (material, stock, pageType) => {
      return pageType === 'C' ? 0 : material.Stock[pageType][stock];
    };
  }

  angular.module('app').component('slidesBook', slidesBook);
})();
