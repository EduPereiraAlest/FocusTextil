/* global corReady:true utils:true */
/* RA */
(function() {
  'use strict';
  angular.module('app').controller('RaAddController', RaAddController);

  function RaAddController($scope, $state, $q, ngDialog, localService, dataService, $stateParams) {
    let data;
    const vm = this;
    const vp = $scope.$parent.vm;

    vp.tempSave = vp.tempSave || {};

    var raNF = $stateParams.id;
    var CodeOv = $stateParams.CodeOv;

    console.log("RA ADD VP", $stateParams, vp);

    vm.submitForm = submitForm;

    vm.orders = [];

    vm.page = {
      name: 'RA',
      search: '',
      motivos: [],
      motivo: '',
      files: [],
      currentFileName: '',
      currentFileDesc: '',
      currentFileContent: '',
      expectativas: [],
      fileInserted: fileInserted,
      attachFile: attachFile,
      fileDescChange: fileDescChange,
      uniqueSelectExpectativa: uniqueSelectExpectativa,
      validate: validate,
      createRA: createRA,
      backToDet: backToDet
    };

    loadCached(raNF);
    assertRaOrderData(CodeOv);

    activate();

    function assertRaOrderData(CodeOv) {
      if ( ! vp.raOrder) {
        dataService.postData('Order', { CodeOv: CodeOv }).then(({ Results }) => {
          vp.raOrder = Results;
          console.log('[Order]', vp.raOrder);
        }, localService.errorHandler);
      }
    }

    function backToDet() {
      saveCache(raNF, {
        motivo: vm.page.motivo,
        ObvsRa: vm.page.ObvsRa,
        expectativas: vm.page.expectativas,
        detalheExpectativa: vm.page.detalheExpectativa,
        files: vm.page.files
      });

      $state.go('orders-det', { id: CodeOv, isRA: raNF });
    }

    function loadCached(raNF) {
      if (vp.tempSave[raNF]) {
        Object.assign(vm.page, vp.tempSave[raNF]);
        delete vp.tempSave[raNF];
        setTimeout(function () {
          validate();
        }, 0);
      }
    }

    function saveCache(raNF, cache) {
      vp.tempSave[raNF] = {};
      Object.assign(vp.tempSave[raNF], cache);
    }

    function activate() {
      console.log('Activate', 'RaAdd');
      if (vm.page.motivos.length == 0) {
        loadMotivos();
      }
      
      if (vm.page.expectativas.length == 0) {
        loadExpectativas();
      }

      bindFileInputChange();
      vp.activate();
    }

    function submitForm(event) {
      document.activeElement.blur();
      event.preventDefault();
      data = {
        Search: vm.page.search.toLowerCase(),
        Limit: 20,
        Page: 1,
        OrderBy: 'CodeOv',
        Filter: '',
        Dates: '',
        Outlet: '',
        Focus24: ''
      };
      // vm.orders = [];
      // return loadData();
    }

    function loadData() {
      searchNF({nf: vm.page.search, representante: 268}).then(function(resp) {
        if (resp) {
          console.log(resp);
          // vm.orders = orders;
        }
      }, localService.errorHandler);
    }

    function searchNF(params) {
      var representante = params.representante;
      var nf = params.nf;
      var dataNF = params.dataNF;
      var pedido = params.pedido;

      var defer = $q.defer();
      var promise = defer.promise;

      var isValidRequest = !!representante && !!(nf || dataNF || pedido);

      if (isValidRequest) {
        console.log("searchNF(params)", params);
        
        dataService.postData('searchNF', params).then(function success(resp) {
          return defer.resolve(resp);
        }, function fail(err) {
          return defer.reject(err);
        });

      } else {
        console.log("Invalid NF Search");
        defer.reject();
      }

      return promise;
    }

    function loadMotivos() {
      return getMotivos().then(function success(resp) {
        var motivos = resp.Results.map(function (motivo) {
          return { name: motivo.Desc, value: motivo.Cod, TpNota: motivo.TCod, GrupoMotivo: motivo.GrupoMotivo,  }
        });

        console.log("MOTIVOS", motivos);

        vm.page.motivos = motivos;

        return motivos;
        
      }, function fail(err) {
        console.log("ERROR GETTING MOTIVOS", err);
      })
    }

    function getMotivos() {
      let paramsMotivos = {};
      let eAdmVendas = localService.getData('loginPathAdv');
      let eGestor =  localService.getData('loginPathGs');
      if(eAdmVendas){
        paramsMotivos = {tipo: 'ADMVENDAS'};
      }else if(eGestor){
        paramsMotivos = {tipo: 'Gestor'};
      }else{
        paramsMotivos = {tipo: 'Representante'};
      }
      return dataService.postData('MotivosRA', paramsMotivos);
    }

    function loadExpectativas() {
      return getExpectativas().then(function success(resp) {
        console.log("loadExpectativas RESOLVED", resp);
        var expectativas = resp.Results;

        expectativas = expectativas.map(function (expec) {
          var expectativa = {};
          expectativa.id = expec.Cod;
          expectativa.desc = expec.Desc;
          expectativa.selected = false;

          return expectativa;
        });

        vm.page.expectativas = expectativas;

        return expectativas;
        
      }, function fail(err) {
        console.log("ERROR GETTING EXPECTATIVAS", err);
      })
    }

    function getExpectativas() {
      return dataService.postData('ExpectativasRa');
    }

    function uniqueSelectExpectativa(thisExp) {
      var toggled = thisExp.selected;
      vm.page.expectativas.forEach(function (expec) {
        expec.selected = false;
      });
      thisExp.selected = toggled;
      validate();
    }

    function uploadFile(data) {
      return dataService.postFile('RAFiles', data);
    }

    function attachFile() {
      var desc = document.querySelector(".fileDesc");
      var button = document.querySelector(".btn.attach");

      if (
        vm.page.currentFileName &&
        vm.page.currentFileDesc &&
        vm.page.currentFileContent
      ) {
        vm.page.files.push({
          name: vm.page.currentFileName,
          desc: vm.page.currentFileDesc,
          content: vm.page.currentFileContent
        });

        desc.disabled = true;
        button.disabled = true;

        uploadFile({
          NotaFiscal: raNF,
          Name: vm.page.currentFileName,
          Desc: vm.page.currentFileDesc,
          Upld: vm.page.currentFileContent
        });

        vm.page.currentFileName = '';
        vm.page.currentFileDesc = '';
        vm.page.currentFileContent = '';

      } else {
        console.log("NOT VALID TO ADD");
        // must show message

      }

    }

    function fileInserted(input) {
      vm.page.currentFileContent = input.files[0];
      var desc = document.querySelector(".fileDesc");
      var file = vm.page.currentFileContent;
      
      if ( ! file) {
        console.log("NO FILE SELECTED");
        
        vm.page.currentFileName = '';
        vm.page.currentFileDesc = '';
        vm.page.currentFileContent = '';
        
        desc.disabled = true;

        $scope.$apply();
        
        return;
      }

      var name = file.name;
      console.log("fileInserted", name);
      vm.page.currentFileName = name;
      desc.disabled = false;
      desc.focus();
      $scope.$apply();
    }

    function bindFileInputChange() {
      var input = document.querySelector("#up-ra");
      input.onchange = function () {
        fileInserted(this);
      }
    }

    function fileDescChange() {
      var input = document.querySelector(".fileDesc");
      var button = document.querySelector(".btn.attach");

      if (input.value) {
        // enable attach
        console.log("ENABLE ATTACH");
        button.disabled = false;

      } else {
        // disable attach
        console.log("DISABLE ATTACH");
        button.disabled = true;
      }
    }

    function invalid(id) {
      document.querySelector(".concluir-ra").disabled = true;
    }

    function validate() {
      // required:
      // motivo (vm.page.motivo)
      // detalhes (ObvsRa)
      // expectativa
      // detalhe da expectativa

      var expectativa = document.querySelector(".expectativa:checked");
      expectativa = expectativa && expectativa.value;

      // console.log("validation", vm.page.motivo, vm.page.ObvsRa, expectativa, vm.page.detalheExpectativa);

      if ( ! vm.page.motivo) {
        console.log("validation FAIL: MOTIVO MISSING");
        invalid("motivo");
        return;
      }

      if ( ! vm.page.ObvsRa) {
        console.log("validation FAIL: DETALHE RA MISSING");
        invalid("detalhe-ra");
        return;
      }

      if ( ! expectativa) {
        console.log("validation FAIL: EXPECTATIVA MISSING");
        invalid("expectativa");
        return;
      }

      if ( ! vm.page.detalheExpectativa) {
        console.log("validation FAIL: DETALHEEXPECTATIVA MISSING");
        invalid("detalhe-expectativa");
        return;
      }

      console.log("VALID! unblock conclusion of RA");

      document.querySelector(".concluir-ra").disabled = false;

      return true;
    }

    function createRA() {
      // build RA structure
      // call service
      // treat errors with message

      var params = {};

      var motivo = vm.page.motivos.filter(mot => mot.value == vm.page.motivo)[0];

      console.log("createRA >>> MOTIVO", motivo);

      var expectativa = document.querySelector(".expectativa:checked");
      expectativa = expectativa && expectativa.value;

      var TpNota = motivo.TpNota;
      var TextoBreve = "";
      var CriadoPor = "";
      var CodigoMotivo = motivo.value;
      var GrupoMotivo = motivo.GrupoMotivo;
      var CodigoExpectativa = expectativa;
      var TextoExpectativa = vm.page.detalheExpectativa;
      var TextoNavig = [{
        TpNota : TpNota,
        TpTexto : "",
        TextoBreve : vm.page.ObvsRa
      }];

      var ItemNavig = buildItemNavig(TpNota);
      var ParceiroNavig = {
        "TpNota" : TpNota, // (TCod, que vem do serviço de Motivo)
        "FuncParceiro" : "ZR", // (texto "ZR" fixo)
        "ParceiroRa" : vp.user.Pernr // (código do representante, PERNR)
      };

      params.TpNota = TpNota;
      params.TextoBreve = TextoBreve;
      params.CriadoPor = CriadoPor;
      params.CodigoMotivo = CodigoMotivo;
      params.CodigoExpectativa = CodigoExpectativa;
      params.TextoExpectativa = TextoExpectativa;
      params.TextoNavig = TextoNavig;
      params.ItemNavig = ItemNavig;
      params.ParceiroNavig = ParceiroNavig;
      params.GrupoMotivo = GrupoMotivo;
      params.NumeroNota = raNF;

      console.log("CREATE RA NOW", params);
//       console.log("ABORTED!!!!!!!!!!!!!!"); return;

      postRAData(params).then(function (resp) {
        console.log("postRAData", resp);

        if (resp && resp.Results) {
          localService.openModal(resp.Results);
        }

        $state.go('orders');

      }, localService.errorHandler);
    }

    function AddItensToArr(TpNota, item, index, CodeOv){
    
      var postObj = {
        "TpNota"        : TpNota, // (TCod, que vem do serviço de Motivo)
        "NumeroItem"    : index+1, // (índice da lista de Itens da RA)
        "TextoBreve"    : "", // (EM BRANCO)
        "Pedido"        : CodeOv, // (Master.CodeOv)
        "ItemPedido"    : item.ItemPedido, // (dentro de Item904, chave "ItemOv")
        "Produto"       : item.Produto, // (MaterialCode)
        "Denominacao"   : item.Denominacao, // (descrição do material, "DescMat")
        "QtdReferencia" : item.raQtd || "0", // (quantidade informada no campo texto da tela)
        "Unidade"       : item.Unidade, // (UnidMed)
        "ValorUnitario" : utils.helpers.parseCurr(item.PrcSale, 5) // (Preço BRL)
      }

      return postObj;
    }


    function buildItemNavig(TpNota) {
      var items = [];
      console.log("buildItemNavig");

      var Item904 = vp.raOrder.Master.Item904.filter(function (item) {
        console.log("buildItemNavig item.CodeOv == CodeOv", item.CodeOv, CodeOv, item.CodeOv == CodeOv);
        return item.CodeOv == CodeOv;
      })[0];

      var isLegado = vp.raOrder.Master['Legado'];

      var ItemOv = Item904.ItemOv;

      console.log("2ed3r4 vp.raItens", vp.raItens);

      vp.raItens.forEach(function (item, index) {
        // envia apenas RA selecionado
        /*
        if (item.raSelected != true) {
          return;
        }
        */
        console.log("buildItemNavig RA ITEM", item);

        if(isLegado){
          if(item.raSelected){
            items.push(AddItensToArr(TpNota, item, index, CodeOv))
          }
        }else{
          if(item.raSelected && item.Abgru == ''){
            items.push(AddItensToArr(TpNota, item, index, CodeOv))
          }
        }

        //TO:DO set here bypess OV Legado

      
      });

      // como recolher a informação dos itens
      // ao trazer os dados, precisa gravar em um local visível
      // RESPOSTA: vp = $scope.$parent.vm;
      // use o VP para comunicação intercontroller
      // salve os itens da nota, e o número da NF no VP
      // use o VP também para manter estado das telas ! EUREKA !

      // itera sobre os itens selecionados na tela anterior
      // monta cada seleção com os itens:
        // "TpNota" : "", (TCod, que vem do serviço de Motivo)
        // "NumeroItem" : "", (índice da lista de Itens da RA)
        // "TextoBreve" : "", (EM BRANCO)
        // "Pedido" : "", (Master.CodeOv)
        // "ItemPedido" : "", (dentro de Item904, chave "ItemOv")
        // "Produto" : "", (MaterialCode)
        // "Denominacao" : "", (descrição do material, "DescMat")
        // "QtdReferencia" : "", (quantidade informada no campo texto da tela)
        // "Unidade" : "" (UnidMed)
      // retorna uma array de objetos desse tipo

      return items;
    }

    function postRAData(params) {
      return dataService.postData('CreateRA', params);
    }
  }
})();