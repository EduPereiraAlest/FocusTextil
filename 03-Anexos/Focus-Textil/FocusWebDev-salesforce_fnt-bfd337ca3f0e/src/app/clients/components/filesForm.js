(function() {
  'use strict';

  angular.module('app').directive('filesForm', filesForm);

  function filesForm() {

    filesFormController.$inject = ['$scope', 'dataService'];

    return {
      scope: true,
      replace: true,
      templateUrl: 'app/clients/components/filesForm.html',
      controller: filesFormController,
      controllerAs: '$ctrl',
      bindToController: {
        files: '=',
        remove: '&',
        submit: '&'
      }
    };

    function filesFormController($scope, dataService) {
      console.log("filesFormController($scope)", $scope);

      var vm = this;
      var customer, CnpjCli;

      vm.page = {
        context: '',
        files: [],
        kinds: {}
      };


      $scope.$watch(() => $scope.$parent.vm.client, items => {
        if ($scope.$parent.vm.client) {
          console.log("93dje9ji CLIENT LOADED", $scope.$parent.vm.client);
          init();
        }
      });

      function init() {
        if (isCustomerDetailPage($scope.$parent.vm.client)) {
          vm.page.context = 'clients-det';
          customer = $scope.$parent.vm.client.Master;
          CnpjCli = customer.CnpjCli;
          console.log("93dje9ji IS client AVAILABLE", $scope.$parent.vm.client);
        } else {
          vm.page.context = 'clients-add';
        }
        
        loadDocumentType(loadFiles);
      }

      function loadFiles() {
        if (isCustomerDetailPage($scope.$parent.vm.client)) {
          customer = $scope.$parent.vm.client.Master;
          CnpjCli = customer.CnpjCli;

          console.log("93dje9ji IS DETAIL PAGE AND client AVAILABLE", $scope.$parent.vm.client);
          
          var customerFiles = customer.DocClienteListNavig;

          if (customerFiles && customerFiles.length) {
            vm.files = [];
            customerFiles.forEach(function (doc) {
              var kind = vm.page.kinds[doc.TpDocCli];

              vm.files.push({
                name: doc.NameFileCli,
                desc: kind,
                url: getDownloadUrl(CnpjCli, doc.NameFileCli, doc.TpDocCli),
                Desc: doc.TpDocCli,
                Path: doc.NameFileCli.toLowerCase(),
                KindDesc: kind
              });
            });
          } else {
            console.log("93dje9ji NO DocClienteListNavig AVAILABLE", customer.DocClienteListNavig);
          }
          
          console.log("93dje9ji vm.page.files", vm.files);
        }
      }

      function isCustomerDetailPage(obj) {
        return !!(obj && obj.Master && obj.Master.CnpjCli);
      }

      function getDownloadUrl(cnpj, name, type) {
        return dataService.baseUrl("CustomerFile/" + cnpj + "/" + name + "/" + type);
      }

      function loadDocumentType(callback) {
        return dataService.postData('DocumentType').then(function (resp) {
          console.log("DocumentType resp", resp);
          if (resp && resp.Results && resp.Results.length) {
            var kinds = resp.Results.forEach(function (doctype) {
              vm.page.kinds[doctype.Codigo] = doctype.Descricao;
            });

            callback();
          }
        });
      }

      function uploadFile(data) {
        console.log("8uh8hu uploadFile data", data);
        return dataService.postFile('AttachDocs', data);
      }

      this.submitForm = event => {
        event.preventDefault();

        return this.submit(event);
      };

      this.removeItem = file => this.remove({ item: file, list: 'files' });
    }
  }
})();
