/* global corReady:true */
(function () {
  'use strict';
  angular.module('app').controller('MainController', MainController);

  MainController.$inject = ['$scope', '$state', '$location', '$window', 'localService', 'dataService', 'ngDialog', '$sce'];

  /**
   * [MainController - Controle Principal da App]
   * @param {[type]} $state [App State]
   * @param {[type]} $window [Window Object]
   * @param {[type]} localService [ Serviço de Controle de LocalStorage e Variveis Globais ]
   * @param {[type]} dataService  [ Serviço de Requisição de Chamadas Externas ]
   */
  function MainController($scope, $state, $location, $window, localService, dataService, ngDialog, $sce) {
    const vm = this;
    const checkit = _.once(addOnlineEvents);
    var MaintenanceRes;
    var ScheduledMaintenance = false;
    var MaintenanceInProgress = false;
    var UnderMaintenance = false;

    vm.items = 0;
    vm.process = '';
    vm.version = '';
    vm.activate = activate;
    vm.exitApp = exitApp;
    vm.getAppVersion = getAppVersion;
    vm.PernrFormat = getFormatPenr();
    vm.getFormatPenr = getFormatPenr;
    vm.selectClient = selectClient;
    vm.MaintenanceRes = MaintenanceRes;
    vm.ScheduledMaintenance = ScheduledMaintenance;
    vm.MaintenanceInProgress = MaintenanceInProgress;
    vm.UnderMaintenance = UnderMaintenance;
    vm.LogoutMaintenance = LogoutMaintenance;
    vm.customerPtax = customerPtax;
    vm.showChangelog = showChangelog;
    activate();

    function activate() {
      localVars(vm);

      vm.qa = localService.env || false;
      vm.version = localService.version;
      vm.localVersion = localService.getData('version') || false;
      vm.online = navigator.onLine;
      vm.kart = localService.getData('kart');
      

      vm.inside = true;
      localService.online = navigator.onLine;

      vm.loginPathGs = localService.getData('loginPathGs');
      vm.loginPathAdv = localService.getData('loginPathAdv');

      vm.isEfocusCustomer = localService.getData('isEfocusCustomer');

      if (corReady && vm.user && !localService.loading) {
        /**
         * Carrega Pacotes IPAD
         */
        dataService
          .loadData()
          .then(
            res => console.log('[MainLoad Data]', res),
            localService.errorHandler,
            notifyResponse => {
              localService.loading = true;
              let notefy =
                notifyResponse.type === 'Images' ?
                notifyResponse.type + ' ' + notifyResponse.value :
                notifyResponse.type + ' ' + parseInt(notifyResponse.value, 10) + '%';

              vm.process =
                notifyResponse.type === 'End' || notifyResponse.type === 'Start' ? '' : notefy;
            }
          );
      }
      // DISABLE MAINTENANCE PING
      // CallMaintenanceService();
      //getAppVersion();

      return checkit();
    }




    /**
     * [addOnlineEvents]
     */

    function addOnlineEvents() {
      $window.addEventListener('offline', () => {
        localService.online = false;
        vm.online = false;
      });
      $window.addEventListener('online', () => {
        localService.online = true;
        vm.online = true;
      });
    }

    function getAppVersion() {
      return dataService.postData('version').then(res => {
        vm.appVersion = res;
      }, localService.errorHandler);
    }

    function exitApp() {
      localService.setAll();
      localService.loading = false;
      vm.kart = '';
      vm.user = '';
      return dataService.postData('LogOff').then(() => {
        $state.go('login');
      }, localService.errorHandler);
    }


    // Validar se o sistema está em manutenção

    // DISABLE MAINTENANCE PING
    //setInterval(function () {
       //CallMaintenanceService();
    // }, 3000)

    function LogoutMaintenance() {
      localService.setAll();
      localService.loading = false;
      vm.kart = '';
      vm.user = '';
      return dataService.postData('LogOff').then(() => {
        $state.go('login');
        vm.UnderMaintenance = false;
        //set localversion
        localService.setData('version', vm.MaintenanceRes.version)

      }, localService.errorHandler);
    }

    function CallMaintenanceService() {
      dataService
        .postData('Maintenance', {})
        .then((res) => {
          vm.MaintenanceRes = res;
          if (Object.keys(vm.MaintenanceRes).length > 0) {
            var actualDate = new Date();
            var CompDate = new Date(vm.MaintenanceRes.StartsIn);

            var versionControl = vm.MaintenanceRes.version;
            console.log("LOCAL VERSION =======");
            console.log(vm.localVersion);

            if(!vm.localVersion || vm.localVersion != versionControl){
              vm.UnderMaintenance = true;
              vm.ScheduledMaintenance = false;
              vm.MaintenanceInProgress = true;
            }else{
              vm.UnderMaintenance = false;
              vm.ScheduledMaintenance = true;
              vm.MaintenanceInProgress = false;
            }
          } else {
            vm.UnderMaintenance = false;
          }

          if ($location.path() === '/login') {
            vm.UnderMaintenance = false;
          }
        });
    }

    function localVars(ctrl) {
      let local = _.pick(localService.getAll(), 'user', 'kart');

      return _.extend(ctrl, local);
    }


    function getFormatPenr(Pernr) {
      let PernrFormat;
      if (Pernr) {
        if (typeof Pernr == 'string') {
          PernrFormat = Pernr;
        } else {
          PernrFormat = Pernr[0];
        }
        PernrFormat = PernrFormat.replace(/^0+/, '');
        vm.PernrFormat = PernrFormat;
      } else {
        vm.PernrFormat = '';
      }
    }

    function selectClient(client) {
      return dataService
        .postData('OpenShoppingCart', { CodeCli: client.CodeCli, Pernr: client.Pernr, eFocus: client.eFocus })
        .then(({ Results }) => {
          Results.Master.AntCli = client.flagAntecipado;
          localService.setData('kart', Results);

          return $state.go('home');
        }, localService.errorHandler);
    }

    function customerPtax() {
      var ptaxModalController = function ($scope) {
        $scope.ptaxList = JSON.parse(localStorage.ptax);
      };

      ptaxModalController.$inject = ['$scope'];
      
      var ptaxModal = ngDialog.open({
        template: 'app/home/components/ptaxModal.html',
        controller: ptaxModalController,
        plain: false,
        scope: $scope
      });
    }

    function parseBold(str) {
      return str.split("\n").map(x => x[0] === "*" ? "<strong>" + x + "</strong>" : x).join("\n");
    }

    function parseBr(str) {
      return str.split("\n").join("<br>");
    }

    function parseParagraph(str) {
      return str.split("\n").map(paragraph => {
        var isParagraph = paragraph[0] === "+";
        var tagged = '<span class="item">' + paragraph + "</span>";
        console.log("parseParagraph", paragraph[0], isParagraph, tagged);
        return isParagraph ? tagged : paragraph;
      }).join("\n");
    }

    function showChangelog() {
      var changelogModalController = function ($scope) {
        $scope.changelogBody = $sce.trustAsHtml("Carregando...");
        dataService
        .postData('VersionLoad', { changelog: true })
        .then(result => {
          let changelog = result.changelog.replace(/\\n/g, "\n").trim();
          changelog = parseBold(changelog);
          changelog = parseParagraph(changelog);
          changelog = parseBr(changelog);
          $scope.changelogBody = $sce.trustAsHtml(changelog);
        }, localService.errorHandler);
      };

      changelogModalController.$inject = ['$scope'];

      var changelogModal = ngDialog.open({
        template: '<h1 class="changelog-title">Histórico de Versões</h1><div class="changelog-body" ng-bind-html="changelogBody"></div>',
        controller: changelogModalController,
        plain: true,
        scope: $scope
      });
    }
  }
})();

// DETECT AUTHENTICATION ON STATE CHANGE

angular.module('app').run([
  '$state',
  $state => {
    $state.defaultErrorHandler(error => {
      console.log('[stateErrorHandler]', 'Sair', error);
      if (!error.authenticated) {
        $state.go('login');
      }
    });
  }
]);
