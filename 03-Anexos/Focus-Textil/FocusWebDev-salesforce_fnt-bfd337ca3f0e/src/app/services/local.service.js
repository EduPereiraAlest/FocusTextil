(() => {
  'use strict';
  angular.module('app').factory('localService', localService);
  localService.$inject = ['$window', '$state', 'ngDialog'];

  /* @ngInject */

  function localService($window, $state, ngDialog) {
    let dialog = {};

    return {
      online: false,
      loading: false,
      env: process.env.APP_ENV.toUpperCase(),
      version: process.env.APP_VERSION,
      scrollTop: 0,
      slideTrack: {},
      getData: getData,
      getAll: getAll,
      setData: setData,
      setAll: setAll,
      openModal: openModal,
      openModalError: openModalError,
      openModalWarning: openModalWarning,
      openModalPremiere: openModalPremiere,
      openModalPremiereProgramado: openModalPremiereProgramado,
      confirmModal: confirmModal,
      errorHandler: errorHandler
    };

    function getData(key) {
      return angular.fromJson($window.localStorage.getItem(key));
    }

    function getAll() {
      return _.mapObject($window.localStorage, val => angular.fromJson(val) || '');
    }

    function setData(key, data) {
      $window.localStorage.setItem(key, angular.toJson(data || ''));
    }

    function setAll(data) {
      return _.mapObject($window.localStorage, (val, key) => {
        $window.localStorage[key] = data || null;
      });
    }

    function errorHandler(res) {
      const stageVerifyStatusCode = res.Code === 401;
      const stageVerifyExistsErrors = res.Error.length ? openModal(res.Error) : null;

      return stageVerifyStatusCode ? (setAll(), $state.go('login')) : (console.log('[errorHandler]', res), stageVerifyExistsErrors);
    }

    function openModal(msg) {
      if (_.isString(msg)) {
        let modalText = _.isString(msg) ? msg : 'Erro na resposta do servidor.';

        if (!dialog.id || (dialog.id && !ngDialog.isOpen(dialog.id))) {
          return (dialog = ngDialog.open({ template: '<p>' + modalText + '</p>' }));
        }
        return false;
      }
        return false;

    }

    function openModalError(msg) {
      let modalText = (msg) ? msg : 'Erro na resposta do servidor.';

      if (!dialog.id || (dialog.id && !ngDialog.isOpen(dialog.id))) {
        return (dialog = ngDialog.open({
          template: '<h3 class"teste">Mensagens:</h3> <p>' + modalText + '</p>',
          className: 'dialog-big'
        }));
      }
      return false;
    }

    function openModalWarning(msg) {
      let modalText = (msg) ? msg : 'Erro na resposta do servidor.';

      if (!dialog.id || (dialog.id && !ngDialog.isOpen(dialog.id))) {
        return (dialog = ngDialog.open({
          template: '<h3 class"teste">Alertas:</h3> <p>' + modalText + '</p>',
          className: 'dialog-big'
        }));
      }
      return false;
    }

    function openModalPremiere() {
      return ngDialog
        .openConfirm({
          template: '<p style="margin-bottom: 20px;">Selecione a forma de faturamento para concluir o Pedido</p>' +
            '<button class="btn btn-icon-right ordem-concluir" ng-class="{active: vm.page.stock}" ng-click="confirm(1)"><span class="icon icon-clock"></span> Faturamento Imediato</button>' +
            '<button class="btn btn-icon-right ordem-concluir" ng-class="{active: vm.page.stock}" ng-click="confirm(2)" style="margin-left: 30px;"><span class="icon icon-calendar"></span> Pedido Programado</button>',
          className: 'dialog-finish'
        })
        .then((value) => value, () => 'cancel');
    }

    function openModalPremiereProgramado() {
      return ngDialog
        .openConfirm({
          template: '<p style="margin-bottom: 20px;">Insira a data de faturamento</p>' +
            '<input title="Data Doc" type="date" name="dataDoc" id="dataProgramada" class="form-control date" ng-model="vm.page.dateProgramado">' +
            '<button class="btn btn-icon-right ordem-concluir" ng-class="{active: vm.page.stock}" ng-click="confirm(2)" style="margin-left: 30px;"><span class="icon icon-checkmark"></span> Concluir</button>',
          className: 'dialog-finish'
        })
        .then((value) => value, () => 'cancel');
    }


    function confirmModal(msg) {
      return ngDialog
        .openConfirm({
          template:
            '<p>' +
            msg +
            '</p><div class="ngdialog-buttons">' +
            '<button type="button" class="ngdialog-button ngdialog-button-secondary" ' +
            'ng-click="closeThisDialog(0)">Não</button>' +
            '<button type="button" class="ngdialog-button ngdialog-button-primary" ' +
            ' ng-click="confirm(1)">Sim</button></div>'
        })
        .then(() => true, () => false);
    }
  }
})();
