/* SERVIÇO PARA CHAMADA DAS FUNÇÕES CORDOVA OFFLINE */

(() => {
  'use strict';
  angular.module('app').service('cordovaService', cordovaService);
  cordovaService.$inject = ['$q', 'localService', 'loadingStatusInterceptor'];

  /* @ngInject */
  function cordovaService($q, localService, loadingStatusInterceptor) {
    let token, headers;

    return {
      postFunc: postFunc,
      startFunc: startFunc,
      validateFunc: validateFunc,
      loginFunc: loginFunc,
      imageFunc: imageFunc
    };

    function postFunc(action, data) {
      let deff = $q.defer();
      let arr = _.values(data) || [];

      loadingStatusInterceptor.request(true);
      cordova.exec(
        res => {
          loadingStatusInterceptor.response(true);
          return res.Error ? deff.reject(res) : deff.resolve(res);
        },
        err => {
          loadingStatusInterceptor.responseError(err);
          return deff.reject({ Error: 'Erro Cordova: ' + err });
        },
        'Core',
        'cordova' + action,
        arr
      );
      return deff.promise;
    }

    function loginFunc(data) {
      let deff = $q.defer();
      let arr = _.values(data) || [];

      loadingStatusInterceptor.request(true);
      cordova.exec(
        res => {
          loadingStatusInterceptor.response(true);
          if (res.data.Error) {
            deff.reject(res.data);
          } else {
            localService.setData('user', res.data.User);
            setHeader(res.data.User);
            deff.resolve(res.data);
          }
        },
        err => {
          loadingStatusInterceptor.responseError(err);
          return deff.reject({ Error: 'Erro Cordova: ' + err });
        },
        'Core',
        'cordovaLogin',
        arr
      );
      return deff.promise;
    }

    function startFunc() {
      let deff = $q.defer();
      let user = localService.getData('user') || {};

      token = user.Token;
      cordova.exec(
        data => deff.notify(data),
        err => deff.reject({ Error: 'Erro Cordova: ' + err }),
        'Core',
        'cordovaImportData',
        [token]
      );
      return deff.promise;
    }

    function validateFunc(data) {
      let deff = $q.defer();
      let arr = _.values(data) || [];

      cordova.exec(
        res => {
          let response = res.data;

          headers = response ? { headers: { 'x-access-token': response.Token } } : {};
          deff.resolve(response);
        },
        err => deff.reject({ Error: 'Erro Cordova.' + err }),
        'Core',
        'cordovaValidateLogin',
        [...arr, token]
      );
      return deff.promise;
    }

    function imageFunc(id, type) {
      let deff = $q.defer();
      let path = type === 'DETAILS' ? 'large_' : 'small_';

      cordova.exec(
        data => deff.resolve(data),
        err => deff.reject({ Error: 'Erro Cordova: ' + err }),
        'Core',
        'cordovaGetImage',
        [path + id + '.jpg']
      );
      return deff.promise;
    }

    function setHeader(user) {
      token = user.Token;
      headers = user ? { headers: { 'x-access-token': token } } : {};
      return headers;
    }
  }
})();
