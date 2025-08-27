/* CLIENTS DETAIL */
(function() {
  'use strict';
  angular.module('app').controller('RaDetController', RaDetController);

  function RaDetController($scope, $state, $stateParams, dataService) {
    const vm = this;
    const vp = $scope.$parent.vm;

    $scope.userLogged = vp.user.Login;

    var data = {};

    vm.page = {
      files: [],
      expectativa: '',
      currentFileName: '',
      currentFileDesc: '',
      currentFileContent: '',
      feedbackList: [],
      fileInserted: fileInserted,
      attachFile: attachFile,
      fileDescChange: fileDescChange
    };

    vm.address = {};

    activate();

    function activate() {
      vp.activate();

      if ( ! $stateParams.data) {
        $state.go('ras');
        return;
      }

      console.log("ras-det $stateParams", $stateParams);
      
      var ra = $stateParams.data;
      
      console.log("ras-det ra", ra);
      
      var nra = ra.NumeroRA;
      var nf = ra.NumeroNF;

      data.nra = nra;
      data.nf = nf;

      detailRA(nra).then(function (resp) {
        var itensPedido = [];

        if ( ! resp) {
          console.log("DETAILRA invalid response");
          return;
        }

        if (resp.Itens) {
          itensPedido = resp.Itens;
        } else {
          console.log("DETAILRA no items found");
        }

        itensPedido = itensPedido.map(function (item) {

          // resp
          // DescMaterial: "BI STRETCH BRANCO"
          // MaterialCode: "P11AF011800001"
          // NotaRa: "000300000010"
          // Qtd: "0.000"
          // QtdMaterial: "5.000"
          // QtdeMultiplo: "0.000"
          // UnidMedida: "M"

          // ITENS PEDIDO (VIEW)
          // MaterialCode
          // DescMat
          // QtdeMultiplo
          // UnidMed
          // Qtd
          // QtdMaterial

          // item.MaterialCode = item.MaterialCode;
          item.DescMat = item.DescMaterial;
          // item.QtdeMultiplo = item.;
          item.UnidMed = item.UnidMedida;
          // item.Qtd = item.;
          // item.QtdMaterial = item.;

          return item;
        });


        var infoDetail = {};

        // DETALHE RA (VIEW)
        // CodeRa
        // QtdRa
        // CodePv
        // CodeNF
        // RaDate
        // RndRa
        // CnpjCli
        // NomeCli
        // ObsPv
        // Msg
        // Items
        // ObvsRa

        if (typeof resp.Dias != "undefined") {
          infoDetail.diasCorridos = resp.Dias;
        }

        if (typeof resp.QtdRA != "undefined") {
          infoDetail.QtdRa = resp.QtdRA;
        }

        if (typeof resp.Status != "undefined") {
          infoDetail.Status = resp.Status;
        }

        if (typeof resp.Motivo != "undefined") {
          infoDetail.Motivo = resp.Motivo;
        }
        
        infoDetail.CodeRa = ra.NumeroRA;
        infoDetail.CodePv = ra.Pedido;
        infoDetail.CodeNF = ra.NumeroNF;
        infoDetail.RaDate = ra.DtInicioRA;
        infoDetail.CnpjCli = ra.CnpjCli;
        infoDetail.NomeCli = ra.Cliente;
        infoDetail.Items = itensPedido;

        vm.ra = infoDetail;

        console.log("24f45t5 itensPedido", itensPedido);

        if (resp.Files && resp.Files.length) {
          resp.Files.forEach(function (file) {
            vm.page.files.push({
              name: file.NomeAnexo,
              desc: file.DescricaoAnexo,
              url: getDownloadUrl("FileRA/" + file.FileId)
            });
          });
        }

        if (resp.Feedback && resp.Feedback.length) {
          vm.page.feedbackList = resp.Feedback;
        } else {
          console.log("DETAILRA no Feedback found");
        }

        if (resp.Expectativa) {
          vm.page.expectativa = resp.Expectativa.toUpperCase();
        } else {
          console.log("DETAILRA no Expectativa found");
        }
        
        console.log("detailRA resp", resp);
        // console.log("VM", vm);
        // console.log("VP", vp);
      });

      bindFileInputChange();
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
          NumeroRA: data.nra,
          NotaFiscal: data.nf,
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

    function bindFileInputChange() {
      var input = document.querySelector("#up-ra");
      input.onchange = function () {
        fileInserted(this);
      }
    }

    function uploadFile(data) {
      return dataService.postFile('RAFiles', data);
    }

    function detailRA(nra) {
      return dataService.postData('DetailRA', { nra });
    }

    function getDownloadUrl(url) {
      return dataService.baseUrl(url);
    }
  }
})();
