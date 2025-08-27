/* eslint-disable no-unused-vars */
/* eslint-disable angular/controller-as */
/* eslint-disable no-empty */
/* eslint-disable no-trailing-spaces */
/* eslint-disable no-plusplus */
/* eslint-disable angular/controller-as-vm */
/* eslint-disable angular/timeout-service */
/* eslint-disable linebreak-style */
/*  CONTACT */


(function() {
  'use strict';
  angular.module('app').controller('FaqController', FaqController);

  function FaqController($scope, ngDialog, localService, dataService) {

    const answerFAQ = [
      {
        open: false,
        index: 1,
        question: 'Pedido com o status EM ELABORAÇÃO',
        answer: 'Quando o status fica dessa forma, significa que ele não foi concluído. Para entrar no pedido e conclui-lo, você deve ir na TELA INICIAL, na lista de PENDÊNCIAS. Clicar em cima do NÚMERO DO PEDIDO, que está em laranja, você será direcionado para a tela do CARRINHO, para dar o andamento. Acompanhar na aba PEDIDOS STATUS'
      },
      {
        open: false,
        index: 2,
        question: 'Fiz um pedido e aparece ENVIADO COM SUCESSO, mas não aparece em ORDENS DE VENDAS',
        answer: 'Após colocar um pedido, você pode fazer o acompanhamento na aba de PEDIDOS STATUS. Qualquer ocorrência com o processamento, será informado na tela.'
      },
      {
        open: false,
        index: 3,
        question: 'O status do pedido está como ERRO NO PROCESSAMENTO',
        answer: 'Quando o status fica com essa mensagem, clicar no botão DETALHES, e dentro do título DADOS DO PEDIDO deve procurar a opção MENSAGENS. Estará descrito qual foi o motivo para o pedido não ter processado.'
      },
      {
        open: false,
        index: 4,
        question: 'Como faço para EDITAR um pedido que deu ERRO NO PROCESSAMENTO',
        answer: 'Clicar no botão REENVIAR. Abrirá tela do CARRINHO. Você pode editar: remover algum item, alterar a quantidade, alterar valores, endereço de entrega e etc. Com a opção REENVIAR, os principais campos do pedido se abrem permitindo a alteração. Após finalizara edição, pode CONCLUIR novamente o pedido'
      },
      {
        open: false,
        index: 5,
        question: 'Após EDITAR um pedido, é enviado uma nova cópia para o cliente?',
        answer: 'Não! Você deve clicar no ícone do ENVELOPE que fica no final da linha do pedido na aba ORDENS DE VENDA. O sistema não envia automaticamente a cópia de um pedido editado'
      },
      {
        open: false,
        index: 6,
        question: 'Não estou conseguindo colocar um pedido para um cliente que acabei de cadastrar.',
        answer: 'Você só vai conseguir colocar o pedido quando o status desse novo cliente for APROVADO. Após o cadastro de um novo cliente, o mesmo passa por algumas aprovações internas da Focus.'
      },
      {
        open: false,
        index: 7,
        question: 'Nas condições de pagamento do meu cliente só aparece a opção ANTECIPADO:',
        answer: 'Neste caso procurar a área de Crédito e solicitar a liberação das condições de pagamento para o cliente.'
      },
      {
        open: false,
        index: 8,
        question: 'Como faço para visualizar as imagens dos artigos pesquisados no Catálogo do Webrep?',
        answer: 'Por padrão, o Webrep sempre exibe os artigos em LISTA. Para visualizar as IMAGENS da sua busca, clicar no botão IMAGEM, que fica localizado no canto superior direito da tela. Manterão os mesmos dados, com as imagens de cada SKU. Para ampliar a imagem e ver mais detalhes, composição, baixar Ficha Técnica e etc, clicar em cima da imagem, que abrirá a tela de DETALHES.'
      }
    ];

    const vm = this;
    const vp = $scope.$parent.vm;

    vp.activate();
    vm.accordion = 0;
    vm.model = { search: '' };
    setTimeout(() => {
      seteventclick();
    }, 500);

    vm.faqs = answerFAQ;

    vm.myFAQsSearchFun = myFAQsSearchFun();
    vm.submitForm = submitForm;


    function myFAQsSearchFun() {
          let input, filter, ul, li, a, i, txtValue;

          input = vm.model.search;
          filter = input.toUpperCase();

          vm.faqs.forEach((faq) => {
            if (faq.question.toUpperCase().indexOf(filter) > -1 || faq.answer.toUpperCase().indexOf(filter) > -1) {
                faq.hidden = false;
            } else {
                faq.hidden = true;
            }
          });
    }

    function submitForm(event = {}) {
      document.activeElement.blur();

      if (event.preventDefault) {
        event.preventDefault();
      }

      myFAQsSearchFun();

    }

    function seteventclick() {
      let acc = document.getElementsByClassName('accordion');
      let i;

      for (i = 0; i < acc.length; i++) {
        acc[i].addEventListener('click', function() {
          this.classList.toggle('active');
          let panel = this.nextElementSibling;

          if (panel.style.display === 'block') {
            panel.style.display = 'none';
          } else {
            panel.style.display = 'block';
          }
        });
      }
    }

    function removehighlight() {
      const spansQuestionsHighLights = document.querySelectorAll('.item-question-faq');
      const spansAnswerHighLights = document.querySelectorAll('.item-answer-faq');

      spansQuestionsHighLights.forEach((span) => {
        span.innerHTML = restoreHtml(span.innerHTML);
      });
      spansAnswerHighLights.forEach((span) => {
        span.innerHTML = restoreHtml(span.innerHTML);
      });
      return null;
    }

    function restoreHtml(innerHTML) {

      innerHTML = innerHTML.replace(/\<span class="highlight"\>.+?\<\/span>/g, function(matched) {
          let text = matched.substring(matched.indexOf('>') + 1, matched.lastIndexOf('<'));

          return text;
      });


      return innerHTML;
    }

    $scope.onCleanSearch = function(event) {
      const valueSearch  = document.querySelector('.input-search-text-faq');

      valueSearch.value = '';
      document.querySelector('.remove-search-faq').style.display = 'none';

      answerFAQ.forEach((faq) => {
        faq.open = false;
      });

      vm.faqs = answerFAQ;
      removehighlight();

    };

    $scope.onButtonClean = function(event) {

      if (event === '') {
        document.querySelector('.remove-search-faq').style.display = 'none';
        return null;
      }

      document.querySelector('.remove-search-faq').style.display = 'block';
    };

    $scope.myFunct = function(keyEvent) {
      if (keyEvent.which === 13) {

        removehighlight();

        if (keyEvent.target.value === '') {
          answerFAQ.map((question) => {
            question.open = false;
          });

          vm.faqs = answerFAQ;

          return;
        }

        const filterFAQ = answerFAQ.filter((answer) => {
          return answer.question.trim().toUpperCase().indexOf(keyEvent.target.value.trim().toUpperCase()) !== -1 ||
          answer.answer.trim().toUpperCase().indexOf(keyEvent.target.value.trim().toUpperCase()) !== -1;
        });

        filterFAQ.map((question) => {
          if (question.answer.trim().toUpperCase().indexOf(keyEvent.target.value.trim().toUpperCase()) !== -1) {
            question.open = true;
          }
        });

        vm.faqs = filterFAQ;

        highlight(keyEvent.target.value);
        setTimeout(() => {
          removehighlight();
          highlight(keyEvent.target.value);
        }, 100);


      }
    };

    function highlight(search) {
      document.querySelectorAll('.item-question-faq, .item-answer-faq').forEach((inputText) => {
        let text = inputText.innerHTML;

        let textTemp = text.toLowerCase();

        let loop = 0;
        let savedWords = [];

        while (textTemp.indexOf(search.toLowerCase()) > -1) { // enquanto achar a palavra no texto
            loop++;
            let index = textTemp.indexOf(search.toLowerCase());

            savedWords.push(text.substring(index, index + search.length)); // salva a palavra encontrada (sensitive case)
            text = text.substring(0, index) + memorySpace(search) + text.substring(index + search.length);

            textTemp = textTemp.replace(search.toLowerCase(), function(matched) {
                return memorySpace(matched);
            });
        }

        savedWords.forEach(function(word) {
            text = text.replace(/¨+/, '<span class="highlight">' + word + '</span>');
        });

        inputText.innerHTML = text;


      });

    }

    function memorySpace(word) {
      return word.replace(/./g, '¨');
    }

  }
})();
