(function() {
  'use strict';

  angular.module('app').directive('contactsForm', contactsForm);

  function contactsForm() {
    return {
      replace: true,
      transclude: true,
      templateUrl: 'app/clients/components/contactsForm.html',
      controller: contactsFormController,
      controllerAs: '$ctrl',
      bindToController: {
        contacts: '=',
        save: '&'
      }
    };

    function contactsFormController() {
      console.log('[contacts]');
      this.model = { CargoCli: '' };

      this.departaments = [
        { value: '', name: 'Selecione' },
        { value: '0001', name: 'Direção' },
        { value: '0002', name: 'Compras' },
        { value: '0003', name: 'Venda' },
        { value: '0004', name: 'Organização' },
        { value: '0005', name: 'Administração' },
        { value: '0006', name: 'Produção' },
        { value: '0007', name: 'Garant. Qualidade' },
        { value: '0008', name: 'Secretaria' },
        { value: '0009', name: 'Dpto. Financeiro' },
        { value: '0010', name: 'Dpto. Jurídico' },
        { value: 'Z001', name: 'Produto' },
        { value: 'Z002', name: 'Estilo' },
        { value: 'Z003', name: 'Transporte' },
        { value: 'Z004', name: 'Sócio / Proprietário' },
        { value: 'ZF24', name: 'Focus 24H' },
        { value: 'ZBOL', name: 'Boleto' },
        { value: 'ZNFE', name: 'Nota Fiscal Eletrônica' }
      ];

      this.submitForm = event => {
        event.preventDefault();
        this.model.EmailCli = this.model.EmailCli.toLowerCase()
        this.contacts.push({ ...this.model });
        this.model = { CargoCli: '' };
        this.form.$setPristine();
        return this.save();
      };

      this.setNfe = () => {
        if (this.model.NfeCli) {
          this.model.CargoCli = 'ZNFE';
          this.model.CargoDesc = 'Nota Fiscal Eletrônica';
        } else {
          this.model.CargoCli = '';
          this.model.CargoDesc = '';
        }
      };

      this.getDep = dep => {
        this.model.CargoDesc = _.findWhere(this.departaments, {
          value: dep
        }).name;
      };
    }
  }
})();
