(() => {
  angular
    .module('loadingStatus', [])

    .config($httpProvider => $httpProvider.interceptors.push('loadingStatusInterceptor'))

    .directive('loadingSpinner', () => ({
      link: ($scope, $element) => {
        const show = () => {
          $element.css('display', 'block');
        };

        const hide = () => {
          $element.css('display', 'none');
        };

        $scope.$on('loadingStatusActive', show);
        $scope.$on('loadingStatusInactive', hide);
        hide();
      }
    }))

    .factory('loadingStatusInterceptor', ($q, $rootScope, $timeout) => {
      var endpointToIdMap = {
        "/api/v1/Material": "lista-materiais", // $scope.$on('loader-lista-materiais-enabled', showLoader);
        "/api/v1/Pendencies": "lista-pendencias",
        "/api/v1/Ptax": "lista-ptax",
        "/api/v1/Orders": "lista-ordens",
        "/api/v1/Carts": "lista-pedidos",
        "/api/v1/Maintenance": "lista-manutencao"

      };

      var activeRequests = 0;
      var loaderQueue = {};

      var modalRequestManager = {
        started: function () {
          if (activeRequests === 0) {
            $rootScope.$broadcast('loadingStatusActive');
            activateLoaderQueue(false);
          }
          activeRequests += 1;
        },
        ended: function () {
          activeRequests -= 1;
          if (activeRequests === 0) {
            $rootScope.$broadcast('loadingStatusInactive');
            activateLoaderQueue(true);
          }
        }
      };

      function activateLoaderQueue(enable) {
        var action = enable ? "enabled" : "disabled";
        
        // console.log("ENABLE ALL NON MODAL LOADERS", enable, Object.keys(loaderQueue));
        
        Object.keys(loaderQueue).forEach(function (loader) {
          var toggleLoader = 'loader-' + loader + '-' + action;
          $rootScope.$broadcast(toggleLoader);
        });
      }

      function getLoaderId(url) {
        var path = urlExtract("pathname", url);

        var loaderId;
        Object.keys(endpointToIdMap).forEach(function (endpoint) {
          if (endpoint == path) {
            loaderId = endpointToIdMap[endpoint];
          }
        });

        return loaderId;
      }

      function queueLoader(enable, url) {
        var loaderId = getLoaderId(url);

        if (enable) {
        } else {
        }
      }

      function enableTargetLoader(enable, url) {
        var loaderId = getLoaderId(url);
        var broadcastId;

        if (enable) {
          broadcastId = 'loader-' + loaderId + '-enabled';
          loaderQueue[loaderId] = true;
          // console.log("QUEUE LOADER: ", loaderId);
        } else {
          broadcastId = 'loader-' + loaderId + '-disabled';
          delete loaderQueue[loaderId];
          // console.log("UNQUEUE LOADER: ", loaderId);
        }

        if (activeRequests == 0) {
          // console.log("BROADCAST LOADER: ", broadcastId);
          $rootScope.$broadcast(broadcastId);
        } else {
          // console.log("DON'T BROADCAST LOADER: ", broadcastId);
        }
      }

      function urlExtract(segment, url) {
        var extractor = document.createElement("a");
        extractor.href = url;
        var extracted = extractor[segment];
        extractor = null;
        return extracted;
      }

      function canShowModalLoader(url) {
        var hasId;

        if (url !== true) { // if not cordova request
          hasId = getLoaderId(url);

        } else { // if cordova request
          hasId = false;
        }

        return !hasId;
      }

      function getUrlFromReqResp(type, param) {
        var url;
        if (param !== true) { // if not cordova
          if (
            type == "request" &&
            param &&
            param.url
          ) {
            url = param.url;

          } else if (
            type == "response" &&
            param &&
            param.config &&
            param.config.url
          ) {
            url = param.config.url;

          } else if (
            type == "responseError" &&
            param &&
            param.config &&
            param.config.url
          ) {
            url = param.config.url;

          } else {
            url = true; // default behavior
            console.log("ERROR: no valid param from ", type, param);
          }

          return url;

        } else {
          console.log("CORDOVA indistinguishable ", type, param);
          return true;
        }
      }

      function coreModalIntercept(type, param) {
        var op = {
          request: config => {
            var url = getUrlFromReqResp(type, param);

            var isModal = canShowModalLoader(url);
            
            if (isModal) {
              modalRequestManager.started();
            } else {
              // NOT MODAL SPECIAL FLOW
              enableTargetLoader(true, url);
            }

            return config || $q.when(config);
          },
          response: response => {
            var url = getUrlFromReqResp(type, param);

            var isModal = canShowModalLoader(url);

            if (isModal) {
              $timeout(modalRequestManager.ended, 500);

            } else {
              // NOT MODAL SPECIAL FLOW
              enableTargetLoader(false, url);
            }

            return response || $q.when(response);
          },
          responseError: rejection => {
            var url = getUrlFromReqResp(type, param);

            var isModal = canShowModalLoader(url);
            
            if (isModal) {
              // console.log("INTERCEPT responseError", rejection);
              modalRequestManager.ended();

            } else {
              // NOT MODAL SPECIAL FLOW
              enableTargetLoader(false, url);
            }

            return $q.reject(rejection);
          }
        };

        if (typeof op[type] == "function") {
          return op[type](param);
        }
      }

      return {
        request: config => {
          return coreModalIntercept("request", config);
        },
        response: response => {
          return coreModalIntercept("response", response);
        },
        responseError: rejection => {
          return coreModalIntercept("responseError", rejection);
        }
      };
    });
})();
