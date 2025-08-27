/*  UPLOAD */
(function() {
  'use strict';
  angular.module('app').controller('CliUpController', CliUpController);

  function CliUpController($scope, dataService) {
    const vm = this;
    const vp = $scope.$parent.vm;

    vm.data = { Desc: '' };
    vm.kinds = [
      // { value: '001', name: 'Contrato Social' },
      // { value: '002', name: 'Contrato Fiança' },
      // { value: '003', name: 'Carta de Anuência' },
      // { value: '004', name: 'Duplicatas' },
      // { value: '005', name: 'DECA' },
      // { value: '006', name: 'Sentença Judicial' },
      // { value: '007', name: 'Certidões' },
      // { value: '008', name: 'Copia de Cheques S/ Fundos' },
      // { value: '009', name: 'Nota Promissoria' },
      // { value: '010', name: 'Balanço' },
      // { value: '011', name: 'Procuração' },
      // { value: '012', name: 'Serasa' },
      // { value: '013', name: 'Declaração de Imposto de Renda' },
      // { value: '014', name: 'Fotos da Empresa' }
    ];

    vm.uploadFile = uploadFile;

    checkItem();
    loadDocumentType();

    function loadDocumentType() {
      return dataService.postData('DocumentType').then(function (resp) {
        console.log("DocumentType resp", resp);
        if (resp && resp.Results && resp.Results.length) {
          var kinds = resp.Results.map(function (doctype) {
            var adapted = {
              value: doctype.Codigo,
              name: doctype.Descricao
            };
            return adapted;
          });

          vm.kinds = kinds;
        }
      });
    }

    function uploadFile(event) {
      event.preventDefault();

      vm.data.Path = vm.data.File.name;
      vm.data.KindDesc = getKind(vm.data.Kind);

      return $scope.closeThisDialog(vm.data);
    }

    function getKind(kind) {
      return _.findWhere(vm.kinds, { value: kind }).name;
    }

    function checkItem() {
      let item;

      $scope.$watch('vm.data.Desc', description => {
        if (description) {
          item = _.findWhere(vp.files, { Desc: description }) || false;
          $scope.formage.desc.$setValidity('desc', !item);
          return $scope.formage.$setSubmitted();
        }
        return false;
      });
    }
  }
})();
