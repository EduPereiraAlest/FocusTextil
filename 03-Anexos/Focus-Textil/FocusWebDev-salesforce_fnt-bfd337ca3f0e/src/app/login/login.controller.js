/* LOGIN */
(function () {
  'use strict';
  angular.module('app').controller('LoginController', LoginController);

  function LoginController($scope, $state, $anchorScroll, $rootScope, localService, ngDialog, dataService, $location, $window) {
    const vm = this;
    let data;
    let storeManagerObj = [];

    // login via url com token
    var uid = $location.search().uid;
    var usr = $location.search().usr;
    var usuarioAutenticado = false;
    var gestorValid = false
    var ZeroGestRep = false;
    var loginAdv = false;
    var rootVm = $scope.$parent.vm;

    window.history.replaceState(null, null, window.location.pathname);

    var flagTokenLogin = true;
    var BlockLoginTst = false;

    if (flagTokenLogin && uid && usr) {
      flagTokenLogin = false;
      login();
    }

    // FUNCTIONS
    vm.modal = modal;
    vm.validate = validate;
    vm.login = login;
    vm.forgotten = forgotten;
    vm.newpass = newpass;
    vm.gestorLogin = gestorLogin;
    vm.voltarModalGestores = voltarModalGestores;
    vm.storeManagerObj = storeManagerObj;
    vm.usuarioAutenticado = usuarioAutenticado;
    vm.gestorValid = gestorValid;
    vm.ZeroGestRep = ZeroGestRep;
    vm.loginAdv = loginAdv;
    vm.BlockLoginTst = BlockLoginTst;

    /*     vm.loginPath = localService.getData('loginPath');
        var localCart = localService.getData('loginPath'); */

    vm.managerModalToggle = false;

    // VARIABLES
    vm.page = {
      action: ''
    };
    
    vm.env = localService.env
    vm.version = localService.version;
    vm.current = {};
    vm.info = {};

    $scope.$parent.vm.loginPathGs = localService.getData('loginPathGs');
    $scope.$parent.vm.loginPathAdv = localService.getData('loginPathAdv');

    function modal(page) {
      vm.current = ngDialog.open({
        template: 'app/login/' + page + 'Modal.html',
        plain: false,
        scope: $scope
      });
      return vm.current;
    }

    vm.BlockLoginTst = true;

    // DISABLE MAINTENANCE PING
    // CallMaintenanceService();

    function validate(event) {
      event.preventDefault();

      if (vm.info.npass !== vm.info.vpass) {
        return localService.openModal('Passwords devem ser iguais.');
      }
      data = {
        User: vm.info.user,
        Password: vm.info.npass
      };

      return dataService.valData(data).then(res => {
        return res.Error ?
          localService.openModal(res.Error) :
          $state.go('home', {}, {
            reload: true
          });
      });
    }

    function forgotten(event) {
      event.preventDefault();

      return dataService.postData('ForgotPassword', {
        User: vm.info.user
      }).then(({
        Results
      }) => {
        vm.current.close();
        return localService.openModal(Results);
      }, localService.errorHandler);
    }


    function getLoginPath() {
      return JSON.parse(localStorage.loginPath);
    }


    function setLoginPath(loginPath) {
      return JSON.stringify(loginPath);
    }

    function CallMaintenanceService() {
      dataService
        .postData('Maintenance', {})
        .then((res) => {
          vm.MaintenanceRes = res;
          if (Object.keys(vm.MaintenanceRes).length > 0) {
            vm.UnderMaintenance = true;
            var actualDate = new Date();
            var CompDate = new Date(vm.MaintenanceRes.StartsIn);
            if (actualDate <= CompDate) {
              vm.ScheduledMaintenance = true;
              vm.MaintenanceInProgress = false;
            } else {
              vm.ScheduledMaintenance = false;
              vm.MaintenanceInProgress = true;
            }
          } else {
            vm.UnderMaintenance = false;
          }

          if ($location.path() === '/login') {
            vm.UnderMaintenance = false;
          }
        });
    }

    // setInterval(function () {
    //   CallMaintenanceService();
    // }, 300000)

    function LogoutMaintenance() {
      localService.setAll();
      localService.loading = false;
      vm.kart = '';
      vm.user = '';
      return dataService.postData('LogOff').then(() => {
        $state.go('login');
        vm.UnderMaintenance = false;
      }, localService.errorHandler);
    }

    function newpass(event) {
      event.preventDefault();

      if (vm.info.npass !== vm.info.vpass) {
        return localService.openModal('Passwords devem ser iguais.');
      }

      data = {
        User: vm.info.user,
        Password: vm.info.pass,
        NewPassword: vm.info.npass
      };

      return dataService.postData('ChangePassword', data).then(({
        Results
      }) => {
        vm.current.close();
        vm.info.pass = '';
        return localService.openModal(Results);
      }, localService.errorHandler);
    }

    function gestorLogin(rep) {
      vm.info.user = rep.Login;
      vm.info.pass = rep.Token;
      login();
    }

    function login(event) {
      if (event) {
        event.preventDefault();
      }
      if (uid && usr) {
        data = {
          User: usr,
          Password: uid
        };

        usr = null;
        uid = null;
      } else {
        data = {
          User: vm.info.user,
          Password: vm.info.pass
        };
      }
      return dataService.loginData(data).then(({
        User
      }) => {
        vm.UserObj = User;
        if (
          User &&
          User.Sistemas &&
          User.Sistemas.length &&
          User.Sistemas.indexOf("WebRep") != -1
          // && User.Tipo.toLowerCase() != "cliente" // CUSTOMER LOGIN DISABLED
          /* && User.Tipo.toLowerCase() != "cliente"*/ // TIRAR ESSA LINHA PARA HABILITAR LOGIN DE CLIENTE
        ) {
          if (
            User.isValidated
          ) {
            console.log("authorized");
            vm.usuarioAutenticado = true

            // salvar o id do gestor logado..
            if (vm.gestorPernr) {
              localService.setData('gestorReps', vm.gestorPernr);
            }

            console.log("LOGIN DATA", User);

            if (User.Tipo.toLowerCase() == "representante") {
              $scope.$parent.vm.getFormatPenr(User.Pernr);
            }

            if (User.Tipo.toLowerCase() == "cliente") {
              let clientObj = {
                eFocus: true,
                Pernr: User.codRep,
                CodeCli: User.CodeCli,
                Razao01Cli: User.Razao01Cli,
                Antecipado: User.flagAntecipado
              };
              localService.setData('isEfocusCustomer', true);
              rootVm.selectClient(clientObj);
              rootVm.isEfocusCustomer = true;
            } else {
              localService.setData('isEfocusCustomer', false);
            }

            if (User.Tipo.toLowerCase() == "gestor") {

              vm.managerModalToggle = true;
              vm.managerModalTitle = "Representantes";
              vm.gestorReps = User.Reps;
              vm.gestorPernr = User.Pernr[0]
              ValidaListaGestor();
              localService.setData('loginPathGs', User.Login);
              $scope.$parent.vm.loginPathGs = localService.getData('loginPathGs');
              vm.gestorValid = true;

              resetScroll();

              if ($scope.$parent.vm.loginPathAdv === '') {
                vm.loginAdv = false;
              } else {
                vm.loginAdv = true;
              }
            } else if (User.Tipo.toLowerCase() == "admvendas") {
              vm.managerModalToggle = true;
              vm.managerModalTitle = "Gestores";
              vm.gestorReps = User.Gestores;
              ValidaListaGestor();
              storeManagerObj = vm.gestorReps;
              localService.setData('loginPathAdv', User.Login);
              $scope.$parent.vm.loginPathAdv = localService.getData('loginPathAdv');
              vm.gestorValid = false;

              resetScroll();

            } else {
              $state.go('home', {}, {
                reload: true
              });
            }
          } else {
            vm.valid = true;
          }
        } else {
          localService.openModal('Não Autorizado');
        }
      }, localService.errorHandler);
    }

    function resetScroll() {
      let scroller = document.querySelector('.lista-manag');
      if (scroller) {
        scroller.scrollTo(0, 0);
      }
    }

    function voltarModalGestores() {
      if (storeManagerObj.length == 0) {
        localService.openModal('Ação disponível apenas para ADM de vendas');
        return
      }
      vm.managerModalToggle = true;
      vm.managerModalTitle = "Gestores";
      vm.gestorReps = storeManagerObj;
      vm.gestorValid = false;
      document.querySelector('tbody').scrollTo(0, 0);
      ValidaListaGestor();
    }



    function ValidaListaGestor() {
      if (vm.gestorReps.length <= 0) {
        vm.ZeroGestRep = true;
      } else {
        vm.ZeroGestRep = false;
      }
    }

    function getAppVersion() {
      return dataService.postData('version').then(res => {
        vm.appVersion = res;
        console.log("[ app version ]", res);
      }, localService.errorHandler);
    }

    //getAppVersion();
  }
})();
