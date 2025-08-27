// client.service.js
(function() {
    'use strict';

    angular.module('app').service('ClientService', ClientService);

    ClientService.$inject = ['dataService', '$q', 'localService'];

    function ClientService(dataService, $q, localService) {
      let self = this;

      self.client = null;

      self.loadClient = function(codeCli) {
        if (!codeCli) {
          return $q.reject('CodeCli não informado');
        }
        return dataService
          .postData('CustomerDetail', { CodeCli: codeCli })
          .then(function(response) {
            self.client = response.Results;
            return self.client;
          }, localService.errorHandler);
      };
    }
  })();
