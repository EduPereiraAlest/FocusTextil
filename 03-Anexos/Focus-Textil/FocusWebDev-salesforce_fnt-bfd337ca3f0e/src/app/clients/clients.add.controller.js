/* CLIENTS DETAIL */
(function() {
  'use strict';
  angular.module('app').controller('ClientAddController', ClientAddController);

  function ClientAddController($scope, $state, $stateParams, dataService, localService, ngDialog) {
    const vm = this;

    console.log("ClientAddController()", vm);

    // VARIABLES
    vm.tab = '1';
    vm.address = {};
    vm.equal = {};
    vm.perfil = {};
    vm.segcom = {};
    vm.today = new Date().toISOString();
    vm.percentage = 0
    vm.segmentoSelecinado = undefined;
    vm.subsegmentoSelecinado = undefined;

    // FUNCTIONS
    vm.getZip = getZip;
    vm.checkEqual = checkEqual;
    vm.removeItem = removeItem;
    vm.addItem = addItem;
    vm.nextStep = nextStep;
    vm.prevStep = prevStep;
    vm.openUpload = openUpload;
    vm.checkRem = checkRem;
    vm.funcSum = funcSum;
    vm.checkSalesPercentage = checkSalesPercentage;
    vm.checkParticipationPercentage = checkParticipationPercentage;
    vm.addNumberRightToLeft = addNumberRightToLeft;
    vm.saveClient = saveClient;
    vm.discardClientAdd = discardClientAdd;
    vm.ListNewCustomerFiles = ListNewCustomerFiles;
    vm.online = localService.online;
    vm.user = localService.getData('user');

    vm.page = {
      files: []
    };

    vm.deps = [
      { Cod: '0001', Desc: 'Private Label' },
      { Cod: '0002', Desc: 'Franquias' },
      { Cod: '0003', Desc: 'Magazines' },
      { Cod: '0004', Desc: 'Representantes' },
      { Cod: '0005', Desc: 'Loja Própria' }
    ];

    vm.distributors = [{ Cod: '0001', Desc: 'Comércio' }, { Cod: '0002', Desc: 'Exclusivo' }];

    vm.activity = [
      { Cod: '10', Desc: 'Moda' },
      { Cod: '20 ', Desc: 'Calçados' },
      { Cod: 'S3', Desc: 'Jeans' },
      { Cod: 'S4', Desc: 'Home' },
      { Cod: 'S5', Desc: 'Genérico' }
    ];

    vm.forms = {
      files: '90700Documento',
      addres: '90701Endereco',
      contacs: 'ContatoNavig',
      sugest: '90703Perfil00',
      respem: '90704Perfil01',
      funcim: '90705Perfil02',
      segcom: '90706Perfil03',
      insatv: '90707Perfil04',
      sidists: '90708Perfil05',
      fornecs: '90709Perfil06',
      sifatr: '90710Perfil07'
    };

    activate();

    getSegmentos();

    $scope.$watch('vm.tab', changeTab);

    $scope.onChangeSegment = function(segmentSelecionado) {
      vm.segmentoSelecinado = segmentSelecionado;
      getSubSegmentos(vm.segmentoSelecinado);
      getGestores(vm.segmentoSelecinado);
    };

    $scope.onChangeSubSegment = function(subsegmentSelecionado) {
      vm.subsegmentoSelecinado = subsegmentSelecionado;
      getGestores(vm.segmentoSelecinado, vm.subsegmentoSelecinado);
    }

    function getSegmentos(){

      var data = {
        Search:  "*",
        Limit: 1000,
        Page: 1,
        OrderBy: ''
      };

      var segments = [];

      dataService.postData('Segments', data).then(({ Segments }) => {
        Segments.forEach(function(item){
          segments.push({name: item.DESCRIPTION.toUpperCase(), value: item.CODE});
        })
      }, localService.errorHandler).then(function(){
        vm.segments = segments;
      });
    }

    function getSubSegmentos(segment){

      var data = {
        Search:  "*",
        Limit: 1000,
        Page: 1,
        OrderBy: '',
        CodeSegment: segment
      };

      var subegments = [];

      dataService.postData('SubSegments', data).then(({ SubSegments }) => {
        SubSegments = SubSegments.filter(function(item){
          return item.CODE.split('-')[0] == segment;
        });

        SubSegments.forEach(function(item){
          subegments.push({name: item.DESCRIPTION.toUpperCase(), value: item.CODE});
        })
      }, localService.errorHandler).then(function(){
        vm.subsegments = subegments;
      });


    }

    function getGestores(segment, subegment){

      var data = {
        Search:  "*",
        Limit: 1000,
        Page: 1,
        OrderBy: ''
      };

      var gestores = [];
      dataService.postData('GetGestores', data).then(({ Gestores }) => {

        var apenasSelecinados = [];
        if(segment != undefined && subegment != undefined){
          apenasSelecinados = Gestores.filter(function(item){
            return item.Subsegmento == subegment && item.Segmento == segment;
          });
        }
        else if (segment != undefined){
          apenasSelecinados = Gestores.filter(function(item){
            return item.Segmento == segment;
          });
        }

        apenasSelecinados.forEach(function(item){
          gestores.push({name: item.FullName.toUpperCase(), value: item.Code});
        });

      }, localService.errorHandler).then(function(){
        vm.managers = gestores;
      });
    }

    function activate() {
      return dataService
        .postData('NewCustomer', { CnpjCli: $stateParams.id || ' ' })
        .then(({ Results }) => {
          vm.client = cleanDefault(Results.Master);

          _.each(vm.forms, (value, key) => {
            if (key.substr(-1) === 's') {
              vm[key] = vm.client.CodeRepres ? Results.Master[value] : [];
            } else if (vm.client.CodeRepres && Results.Master[value]) {
              vm[key] = Results.Master[value][0];
            }
          });


          vm.client.CodeRepres = vm.user.Pernr;
          vm.address.cli = _.findWhere(vm.addres, { TpAdrCli: 'CLI' }) || {
            TpAdrCli: 'CLI',
            Isento: true
          };
          vm.address.fat = _.findWhere(vm.addres, { TpAdrCli: 'FAT' });
          vm.address.cob = _.findWhere(vm.addres, { TpAdrCli: 'COB' });

          vm.sugest = vm.sugest || { PgAntCli: true };
        }, localService.errorHandler);
    }

    function discardClientAdd() {
      console.log("discardClientAdd()", vm.client);

      var CnpjCli = vm && vm.client && vm.client.CnpjCli;

      if ( ! CnpjCli) {
        console.log("discardClientAdd() NO CNPJ FOUND");
        return;
      }

      return localService.confirmModal('Deseja realmente descartar esse cadastro?').then(confirm => {
        if (confirm) {
          return dataService
            .postData('DiscardNewCustomer', { CnpjCli: CnpjCli })
            .then(({ Results }) => {
              console.log("RESP DiscardNewCustomer", Results);
              $state.go('home');
            }, localService.errorHandler);
        }
      });
    }

    function ListNewCustomerFiles() {
      console.log("ListNewCustomerFiles()");

      var CnpjCli = vm && vm.client && vm.client.CnpjCli;

      if ( ! CnpjCli) {
        console.log("ListNewCustomerFiles() NO CNPJ FOUND");
        return;
      }

      return dataService
        .postData('ListNewCustomerFiles', { CnpjCli: CnpjCli })
        .then(({ Results }) => {
          console.log("RESP ListNewCustomerFiles", Results);
          vm.page.files = Results;
        }, localService.errorHandler);
    }

    function cleanDefault(obj) {
      return _.mapObject(obj, (val, key) => {
        return key !== 'StatusProcess' && val === '0' ? '' : val;
      });
    }

    function addItem(name, list, event) {
      let item;

      if (event) {
        event.preventDefault();
      }
      if (name === 'addrem') {
        vm.addrem.TpAdrCli = 'REM';
        item = _.findWhere(vm[list], { CnpjAdr: vm[name].CnpjAdr });
        if (item) {
          return localService.openModal('Endereço já cadastrado.');
        }
      }
      vm[list].push(vm[name]);
      vm[name] = {};
      vm[name + 'Form'].$setPristine();

      return saveClient();
    }

    function removeItem(item, list) {
      console.log("78h7gg Client add removeItem", item, list, vm);

      return localService.confirmModal('Deseja realmente remover?').then(confirm => {
        var CnpjCli = vm.client.CnpjCli;
        if (confirm) {
          dataService
            .postData('DeleteNewCustomerFile', { CnpjCli: CnpjCli, NameFileCli: item.Path })
            .then(({ Results }) => {
              console.log("RESP DeleteNewCustomerFile", Results);

            }, localService.errorHandler);
          // inject remove here DeleteNewCustomerFile
          return confirm && (vm.page[list] = _.reject(vm.page[list], removed => _.isEqual(removed, item)));

        } else {
          return confirm;
        }

      });
    }

    function saveClient() {
      const custumer = { _type: 'NewCustomer' };
      let data = {};

      angular.forEach(vm.forms, function(value, key) {
        if (vm[key]) {
          vm.client[value] = _.isArray(vm[key]) ? vm[key] : [vm[key]];
        }
      });

      custumer.Master = vm.client;
      data.Customer = angular.toJson(custumer);

      return dataService.postFile('SaveCustomer', data).then(({ Results }) => {
        if (vm.client.StatusProcess === 'LIB' && Results === 'Success') {
          localService.openModal('Cliente enviado com sucesso!');

          return _.delay($state.go, 500, 'home');
        }
        return false;
      }, function fail(err) {

        let isTooBig = (
          err.code &&
          err.message &&
          err.code === 4 &&
          err.message === 'The object requested is too big to store in the server'
        );

        if (isTooBig) {
          localService.errorHandler({Code:4, Error: "O tamanho total de cada cadastro não pode exceder 15 MB. Verifique o tamanho total dos arquivos."});
        } else {
          localService.errorHandler({});
        }
      });
    }

    function changeTab(tab, ntab) {
      if (!vm.client || tab < ntab) {
        return false;
      }

      let test = checkTab(ntab);

      return test.Erro
        ? (localService.openModal(test.Erro), (vm.tab = ntab.toString()))
        : saveClient();
    }

    function checkTab(tab) {
      let min, diff;

      // 1. Dados Basicos
      if (tab === '1') {
        vm.client.EmailCli = vm.client.EmailCli.toLowerCase()

        if (!vm.clientForm.$valid) {
          vm.clientForm.$setSubmitted();
          return { Erro: 'Favor preencher todos os campos corretamente.' };
        }

        if (vm.segmentoSelecinado && !vm.subsegmentoSelecinado) {
          vm.clientForm.$setSubmitted();
          return {
            Erro: 'Favor Selecione um SubSegmento.'
          }
        }

        vm.address.cli.CnpjAdr = vm.client.CnpjCli;
        vm.address.cli.Razao01Cli = vm.client.Razao01Cli;

        setEqual();
      }

      // 2. Endereços
      if (tab === '2') {
        if (!vm.addcliForm.$valid) {
          vm.addcliForm.$setSubmitted();
          return { Erro: 'Favor preencher todos os campos corretamente.' };
        }
        min = [];
        _.each(vm.equal, (val, key) => {
          if (!val) {
            vm['add' + key + 'Form'].$setSubmitted();
            min.push(vm['add' + key + 'Form'].$valid);
          }
        });
        if (!_.every(min)) {
          return { Erro: 'Favor preencher todos os endereços.' };
        }

        diff = _.where(vm.addres, { TpAdrCli: 'REM' });
        vm.addres = Object.values(vm.address)
          .filter(e => e)
          .concat(diff);

        ListNewCustomerFiles();
      }

      // 3. Complementos
      if (tab === '3') {
        vm.sugestForm.$setSubmitted();
        min = vm.contacs.filter(contac => contac.NfeCli);

        if (!min.length) {
          return { Erro: 'Favor preencher ao menos um contato com NFe.' };
        }

        if (!vm.sugestForm.$valid) {
          return {
            Erro: 'Sugira um valor de limite de crédito ou escolha Pagamento Antecipado.'
          };
        }
        if (vm.sugest.PgAntCli) {
          vm.client.StatusProcess = 'LIB';
        }
      }

      // 4. Segmentação
      if (tab === '4') {
        if (!Object.keys(vm.segcom).length) {
          return { Erro: 'Selecione ao menos uma alternativa.' };
        }
      }

      // 5. Perfil
      if (tab === '5') {
        min = _.every([
          vm.respemForm.$valid,
          vm.sifatrForm.$valid,
          vm.insatvForm.$valid,
          vm.sifatrForm.$valid,
          vm.sidists.length,
          vm.fornecs.length
        ]);

        if (!vm.sugest.PgAntCli && !min) {
          return { Erro: 'Favor preencher todos os campos corretamente.' };
        }

        vm.client.StatusProcess = 'LIB';
      }

      if (vm.client.StatusProcess === 'LIB') {
        vm.contacs = vm.contacs.map(contac => {
          contac.DtNascCli = parseDate(contac.DtNascCli);
          return contac;
        });

        vm.addres = vm.addres.map(addr => {
          addr.CepCli = addr.CepCli.insert('-', 5);
          addr.InscEstAdrCli = addr.Isento ? 'ISENTO' : addr.InscEstAdrCli;
          return _.omit(addr, ['Isento', 'ZipBlock']);
        });
      }

      return {};
    }

    function nextStep() {
      var currentTab = +vm.tab;

      if (currentTab == 3 && vm.sugest.PgAntCli) {
        // flickering case, don't change tabs
        changeTab('3', '3');
        return vm.tab+"";
      }

      let tab = currentTab + 1;

      vm.tab = tab.toString();
      return vm.tab;
    }

    function prevStep() {
      let tab = +vm.tab - 1;

      vm.tab = tab.toString();
      return vm.tab;
    }

    // 2. Endereços

    function getZip(address) {
      let zip = address.CepCli;

      return dataService
        .postData('ZipAddress', { ZipCode: zip.insert('-', 5) })
        .then(({ Results }) => {
          return Results.Cidade
            ? _.extend(
                address,
                _.omit(
                  {
                    LogrCli: Results.Rua || null,
                    BairroCli: Results.Bairro,
                    CityCli: Results.Cidade,
                    UfCliAdr: Results.Estado,
                    PaisCli: 'BR',
                    ZipBlock: Results
                  },
                  _.isEmpty
                )
              )
            : localService.openModal('Cep não encontrado.');
        }, localService.errorHandler);
    }

    function setEqual() {
      return _.each(vm.address, (value, key) => {
        if (key !== 'cli') {
          vm.equal[key] = true;
          if (value && value.CnpjAdr) {
            vm.equal[key] = false;
            checkEqual(key, vm.equal[key]);
          }
        }
      });
    }

    function checkEqual(type, flag) {
      let address = { ...vm.address };

      console.log('!vm.addcliForm', !vm.addcliForm)
      if (vm.addcliForm && !vm.addcliForm.$valid) {
        return (
          localService.openModal('Preencha o Endereço de Cliente corretamente.'),
          vm.addcliForm.$setSubmitted(),
          (vm.equal[type] = false)
        );
      }

      if (!flag) {
        address[type] = vm.address[type] || {
          TpAdrCli: type.toUpperCase(),
          Isento: true
        };
      }

      return (vm.address = address);
    }

    function checkRem() {
      return _.where(vm.addres, { TpAdrCli: 'REM' }).length;
    }

    // 3. Complementos
    function parseDate(date) {
      if (!date) {
        return '';
      }

      return _.isDate(date)
        ? [
            ('0' + date.getDate()).slice(-2),
            ('0' + (date.getMonth() + 1)).slice(-2),
            date.getFullYear()
          ].join('/')
        : reParse(date);
    }

    function reParse(value) {
      return value
        .split('T')[0]
        .split('-')
        .reverse()
        .join('/');
    }

    // 4. Segmentação
    function openUpload() {
      let data = { CnpjCli: vm.client.CnpjCli };

      return ngDialog
        .open({
          template: 'app/clients/clientsUp.html',
          controller: 'CliUpController as vm',
          plain: false,
          scope: $scope
        })
        .closePromise.then(({ value }) => {
          if (value.File) {
            data.Upld1 = value.File;
            value.FileName = value.Path;
            delete value.File;
          } else {
            console.log("NO FILE SELECTED");
            return;
          }
          data.Docs = angular.toJson([value]);
          data.Status = 'ELB';
          vm.page.files.push(value);

          return !value || !value.Desc
            ? false
            : dataService.postFile('AttachDocs', data).then(({ Results }) => {
                return (
                  Results === 'Success' && localService.openModal('Arquivo enviado com sucesso.')
                );
              }, localService.errorHandler);

          // return !value || !value.Desc ? false : vm.files.push(value);
        });
    }

    // 5. Perfil
    function funcSum() {
      vm.funcim.NroFuncTot =
        Number(vm.funcim.NroFuncPrd || 0) +
        Number(vm.funcim.NroFuncAdm || 0) +
        Number(vm.funcim.NroFuncVend || 0);
    }

    function checkSalesPercentage(event, field) {
      const number = parseInt(event.key)
      let vista = vm.sifat.VendVista == undefined ? 0 : vm.sifat.VendVista,
        cheque = vm.sifat.VendCheque == undefined ? 0 : vm.sifat.VendCheque,
        prazo = vm.sifat.VendPrazo == undefined ? 0 : vm.sifat.VendPrazo,
        outr = vm.sifat.VendOutr == undefined ? 0 : vm.sifat.VendOutr

      switch (field) {
        case 1:
          vista = parseFloat(vm.addNumberRightToLeft(vista, number))
          break;

        case 2:
          cheque = parseFloat(vm.addNumberRightToLeft(cheque, number))
          break;

        case 3:
          prazo = parseFloat(vm.addNumberRightToLeft(prazo, number))
          break;

        case 4:
          outr = parseFloat(vm.addNumberRightToLeft(outr, number))
          break;

        default:
          break;
      }

      vm.percentage = parseFloat((vista + cheque + prazo + outr).toFixed(2))
      console.log({percentage: vm.percentage, isHigher: vm.percentage > 1})
      if (vm.percentage > 1) {
        event.preventDefault()
        return false
      }
    }

    function checkParticipationPercentage(event, field) {
      const number = parseInt(event.key)
      let winter = vm.sifat.PartFocInv == undefined ? 0 : vm.sifat.PartFocInv,
        summer = vm.sifat.PartFocVer == undefined ? 0 : vm.sifat.PartFocVer

      switch (field) {
        case 1:
          winter = parseFloat(vm.addNumberRightToLeft(winter, number))
          break;

        case 2:
          summer = parseFloat(vm.addNumberRightToLeft(summer, number))
          break;

        default:
          break;
      }

      const percentage = parseFloat((winter + summer).toFixed(2))
      console.log({percentage: percentage, isHigher: percentage > 1})
      if (percentage > 1) {
        event.preventDefault()
        return false
      }
    }

    function addNumberRightToLeft(number, value) {
      number = ((number * 10) + (value / 100)).toFixed(2);
      return number;
    }
  }
})();
