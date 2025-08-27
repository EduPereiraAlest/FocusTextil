/* CLIENTS DETAIL */
(function() {
  'use strict';
  angular.module('app').controller('ClientDetController', ClientDetController);

  function ClientDetController($scope, $stateParams, dataService, localService, ngDialog, info) {
    const vm = this;

    // VARIABLES
    vm.tab = 1;
    vm.info = info;
    vm.address = {};
    vm.equal = {};
    vm.departaments = [
      { Cod: '0001', Desc: 'Direção' },
      { Cod: '0002', Desc: 'Compras' },
      { Cod: '0003', Desc: 'Venda' },
      { Cod: '0004', Desc: 'Organização' },
      { Cod: '0005', Desc: 'Administração' },
      { Cod: '0006', Desc: 'Produção' },
      { Cod: '0007', Desc: 'Garant. Qualidade' },
      { Cod: '0008', Desc: 'Secretaria' },
      { Cod: '0009', Desc: 'Dpto. Financeiro' },
      { Cod: '0010', Desc: 'Dpto. Juridico' },
      { Cod: 'Z001', Desc: 'Produto' },
      { Cod: 'Z002', Desc: 'Estilo' },
      { Cod: 'Z003', Desc: 'Transporte' },
      { Cod: 'Z004', Desc: 'Sócio / Proprietário' },
      { Cod: 'ZF24', Desc: 'Focus 24H' },
      { Cod: 'ZBOL', Desc: 'Boleto' },
      { Cod: 'ZNFE', Desc: 'Nota Fiscal Eletrônica' }
    ];
    vm.segmentoSelecinado = undefined;
    vm.subsegmentoSelecinado = undefined;
    vm.segments = []
    vm.subsegments = []
    vm.managers = []

    // FUNCTIONS
    vm.openUpload = openUpload;
    vm.removeItem = removeItem;

    activate();

    function getSegmentos() {
      var data = {
        Search:  "*",
        Limit: 1000,
        Page: 1,
        OrderBy: ''
      };

      const existsSegment =  vm.client.Master.Segment ? vm.client.Master.Segment : null
      if (!existsSegment) return

      var segments = []
      /**
       * @typedef {Object} Segment
       * @property {CODE} CODE
       * @property {DESCRIPTION} DESCRIPTION
       */

      /**
       * @param {{ Segments: Segment[] }} response
       */
      dataService.postData('Segments', data).then(
      /**
       * @param {{ Segments: Segment[] }} response
       */
      ({ Segments }) => {

        if (Segments && Array.isArray(Segments)) {
          Segments.forEach(function(item){
            segments.push({name: item.DESCRIPTION.toUpperCase(), value: item.CODE});
          })
        }

      }, localService.errorHandler).then(function(){
        vm.segments = segments;
        getSubSegmentos(existsSegment)
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

      const existSubSegment =  vm.client.Master.SubSegment ? vm.client.Master.SubSegment : null
      if (!existSubSegment) return

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
        getGestores(segment, existSubSegment)
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
      const managerSelected = vm.client.Master.ParcPessoal || ''
      vm.client.Master.Manager = managerSelected;

      dataService.postData('GetGestores', data).then(({ Gestores }) => {

        for (const ges of Gestores) {
          if (ges.Code === managerSelected) {
            gestores.push({ name: ges.FullName.toUpperCase(), value: ges.Code });
            break;
          }
        }

      }, localService.errorHandler).then(function(){

        vm.managers = gestores;
      });
    }

    function activate() {
      return dataService
        .postData('CustomerDetail', { CodeCli: $stateParams.id })
        .then(function({ Results }) {
            vm.client = Results;
            vm.addres = vm.client.Master.Address;

            _.each(['CLI', 'FAT', 'COB'], type => {
              let address = _.findWhere(vm.addres, { TpAdrCli: type });

              if (address) {
                address.Isento = address.InscEstAdrCli === 'ISENTO' || false;
                vm.address[type.toLowerCase()] = address || {};
              }
              vm.equal[type.toLowerCase()] = !address;
            });

            vm.rem = checkRem(vm.addres);

            _.each(vm.client.Master.Contacts, contact => {
              contact.CargoDesc = getDep(contact.CargoCli);
            });

            getSegmentos()
            return console.log('[Activate ClientDetail]', vm.client, vm.addres);
        }, localService.errorHandler);
    }

    function getDep(dep) {
      let depart = _.findWhere(vm.departaments, { Cod: dep });

      return depart ? depart.Desc : '-';
    }

    function checkRem(addresses) {
      let rem = _.where(addresses, { TpAdrCli: 'REM' }).length;

      return rem > 0;
    }

    function removeItem(item, list) {
      return localService.confirmModal('Deseja realmente remover?').then(confirm => {
        return confirm && (vm[list] = _.reject(vm[list], deleted => _.isEqual(deleted, item)));
      });
    }

    function openUpload() {
      let data = { CnpjCli: vm.client.Master.CnpjCli };

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
          }
          data.Docs = angular.toJson([value]);
          data.Status = 'LIB';

          return !value || !value.Desc
            ? false
            : dataService.postFile('AttachDocs', data).then(({ Results }) => {
                activate();
                return (
                  Results === 'Success' && localService.openModal('Arquivo enviado com sucesso.')
                );
              }, localService.errorHandler);
        });
    }

    if (
      vm &&
      vm.client &&
      vm.client.Master &&
      vm.client.Master.DocClienteListNavig &&
      vm.client.Master.DocClienteListNavig.length
    ) {
      vm.files = vm.client.Master.DocClienteListNavig;

    } else {
      vm.files = [];
    }
  }
})();
