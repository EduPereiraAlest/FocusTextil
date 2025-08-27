/* SERVIÇO PARA CHAMADA DAS FUNÇÕES DO SERVIDOR DA APLICAÇÃO */

/* global corReady:true */
(() => {
  'use strict';
  angular.module('app').service('dataService', dataService);
  dataService.$inject = ['$http', '$q', 'localService', 'cordovaService'];

  function dataService($http, $q, localService, cordovaService) {
    const envDomain = process.env.API_URL;

    const path = envDomain;

    const service = {
      postData: postData,
      loadData: loadData,
      postFile: postFile,
      loginData: loginData,
      valData: valData,
      baseUrl: baseUrl,
      setHeader: setHeader
    };

    let headers;

    return service;

    function postData(action, data) {
      let jsonData;
      let deferred = $q.defer();

      const cordovaFunctions = [
        'App',
        'Alerts',
        'Ptax',
        'Pendencies',
        'FinancyFactor',
        'Ebook',
        'Material',
        'MaterialDetail',
        'FavoriteMaterial',
        'AddFavoriteMaterial',
        'RemoveFavoriteMaterial',
        'Customer',
        'CustomerDetail',
        'NewCustomer',
        'FavoriteCustomer',
        'AddFavoriteCustomer',
        'RemoveFavoriteCustomer',
        'SaveShoppingCart',
        'OpenShoppingCart',
        'PaymentCondition',
        'SendShoppingCart',
        'SendCopyOv',
        'StockUpdate',
        'Cart',
        'Carts',
        'Order',
        'Orders',
        'LogOff',
        'ChangePassword',
        'ForgotPassword',
        'OrderStatus',
        'DanfeXmlNFSet'
      ];

      headers = headers || setHeader();

      if (corReady && cordovaFunctions.includes(action)) {
        return cordovaService.postFunc(action, data);
      }

      jsonData = angular.toJson(data);

      $http.post(path + action, jsonData, headers).then(
        res => {
          return res.data.Error ? deferred.reject(res.data) : deferred.resolve(res.data);
        },
        err => {
          return deferred.reject({
            Error: 'Instabilidade na conexão. Por favor, tente novamente. ' + err.statusText
          });
        }
      );
      return deferred.promise;
    }

    /**
     * [loadData]
     * @returns {Function} [Função de Carregar Pacotes]
     */
    function loadData() {
      return cordovaService.startFunc();
    }

    function transformRequest(data) {
      const fd = new FormData();

      angular.forEach(data, (value, key) => {
        if (key.includes('Upld')) {
          fd.append('Files', value);
        } else {
          fd.append(key, value);
        }
      });
      return fd;
    }

    /**
     * [postFile - Envia Formulário com Arquivos ]
     * @param  {String} action  [ Nome da Função no Serviço]
     * @param  {Object} data    [ Data ]
     * @returns {Promise} [Teste]
     */
    function postFile(action, data) {
      let deferred = $q.defer();
      let user = user || localService.getData('user');
      let request = {
        method: 'POST',
        url: path + action,
        data: data,
        headers: {
          'Content-Type': undefined,
          'x-access-token': user.Token
        },
        transformRequest: transformRequest
      };

      console.log('[SERVICE]', action);

      $http(request).then(
        res => {
          if (res.data.Error) {
            deferred.reject(res.data);
          } else {
            deferred.resolve(res.data);
          }
        },
        error => {
          console.log(error);
          deferred.reject({
            Error: 'Instabilidade na conexão. Por favor, tente novamente.'
          });
        }
      );
      return deferred.promise;
    }

    function loginData(data) {
      let deferred = $q.defer();
      let jsonData = angular.toJson(data);

      if (corReady) {
        return cordovaService.loginFunc(data);
      }

      $http.post(path + 'Login', jsonData).then(
        res => {
          if (res.data.Error) {
            deferred.reject(res.data);
          } else if (res.data && res.data.User && (res.data.User.Reps || res.data.User.Gestores)) {
            deferred.resolve(res.data); // gestor ou admv login
          } else if (
            res.data &&
            res.data.User &&
            res.data.User.Sistemas &&
            res.data.User.Sistemas.indexOf('WebRep') == -1
          ) {
            deferred.resolve(res.data);
          } else {
            localService.setData('user', res.data.User);
            setHeader(res.data.User);
            deferred.resolve(res.data);
          }
        },
        error => deferred.reject(error)
      );
      return deferred.promise;
    }

    function valData(data) {
      let deferred = $q.defer();
      let jsonData = angular.toJson(data);

      if (corReady) {
        return cordovaService.validadeFunc(data);
      }

      $http.post(path + 'ValidateLogin', jsonData, headers).then(
        res => {
          let response = res.data;

          headers = response ? {
            headers: {
              'x-access-token': response.Token
            }
          } : {};
          deferred.resolve(response);
        },
        error => {
          deferred.reject(error);
        }
      );
      return deferred.promise;
    }

    function setHeader() {
      let user = localService.getData('user');

      headers = user ? {
        headers: {
          'x-access-token': user.Token
        }
      } : {};
      return headers;
    }

    function baseUrl(url) {
      return path + url;
    }
  }
})();
