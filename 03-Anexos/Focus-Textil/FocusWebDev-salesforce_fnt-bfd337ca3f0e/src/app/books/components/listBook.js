(function() {
  'use strict';

  class listBookController {
    constructor() {
      this.tableOpen = false;
    }

    setBook(book, hyer) {
      return this.bookClick({ book, hyer });
    }

    submitForm() {
      return this.sortClick();
    }
  }

  const listBook = {
    controller: listBookController,
    bindings: {
      model: '=',
      page: '<',
      sortClick: '&',
      bookClick: '&'
    },
    templateUrl: 'app/books/components/listBook.html'
  };

  angular.module('app').component('listBook', listBook);
})();
