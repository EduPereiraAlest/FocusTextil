angular.module('app').config(routesConfig);

function routesConfig($stateProvider, $urlRouterProvider) {
  // $locationProvider.hashPrefix('!');
  // $locationProvider.html5Mode(false).hashPrefix('!');

  $urlRouterProvider.otherwise('/');
  $stateProvider
    .state('download', {
      url: '/download',
      controller: 'VersionController as vm',
      templateUrl: 'app/download/version.html'
    })
    .state('login', {
      url: '/login',
      controller: 'LoginController',
      controllerAs: 'vm',
      templateUrl: 'app/login/login.html',
      headers:{'Cache-Control': 'no-cache'}
    })
    .state('home', {
      url: '/',
      controller: 'HomeController as vm',
      templateUrl: 'app/home/home.html',
      resolve: {
        auth: authTest
      },
      headers:{'Cache-Control': 'no-cache'}
    }) // BOOKS
    .state('books', {
      url: '/books',
      controller: 'BooksController as vm',
      templateUrl: 'app/books/books.html',
      resolve: {
        auth: authTest,
        params: paramTest
      }
    })
    .state('books-fav', {
      url: '/books-fav',
      controller: 'BooksFavController as vm',
      templateUrl: 'app/books/booksFav.html',
      resolve: {
        auth: authTest
      }
    }) // CLIENTS
    .state('clients', {
      url: '/clients',
      controller: 'ClientController as vm',
      templateUrl: 'app/clients/clients.html',
      resolve: {
        auth: authTest
      }
    })
    .state('clients-fav', {
      url: '/clients-fav',
      controller: 'ClientFavController as vm',
      templateUrl: 'app/clients/clientsFav.html',
      resolve: {
        auth: authTest
      }
    })
    .state('clients-det', {
      url: '/clients-det/:id',
      controller: 'ClientDetController as vm',
      templateUrl: 'app/clients/clientsDet.html',
      resolve: {
        auth: authTest,
        info: usefulTest
      }
    })
    .state('clients-add', {
      url: '/clients-add/:id?',
      controller: 'ClientAddController as vm',
      templateUrl: 'app/clients/clientsAdd.html',
      resolve: {
        auth: authTest
      }
    }) // CARTS
    .state('carts', {
      url: '/carts',
      controller: 'CartsController as vm',
      templateUrl: 'app/carts/carts.html',
      resolve: {
        auth: authTest,
        params: paramTest
      }
    })
    .state('carts-delv', {
      url: '/carts-delv',
      controller: 'CartsDelvController as vm',
      templateUrl: 'app/carts/cartsDelv.html',
      resolve: {
        auth: authTest
      }
    })
    .state('carts-confirmation', {
      url: '/carts-confirmation',
      controller: 'CartsConfirmationController as vm',
      templateUrl: 'app/carts/cartsConfirmation.html',
      resolve: {
        auth: authTest
      }
    }) // STATUS
    .state('status', {
      url: '/status',
      controller: 'StatusController as vm',
      templateUrl: 'app/orders/status.html',
      resolve: {
        auth: authTest
      }
    })
    .state('status-det', {
      url: '/status-det/:id?',
      controller: 'StatusDetController as vm',
      templateUrl: 'app/orders/statusDet.html',
      resolve: {
        auth: authTest,
        params: paramTest
      }
    }) // ORDERS
    .state('orders', {
      url: '/orders',
      controller: 'OrdersController as vm',
      templateUrl: 'app/orders/orders.html',
      resolve: {
        auth: authTest
      }
    })
    .state('orders-det', {
      url: '/orders-det/:id?/:isRA?',
      controller: 'OrdersDetController as vm',
      templateUrl: 'app/orders/ordersDet.html',
      resolve: {
        auth: authTest,
        params: paramTest
      }
    }) // CONTACT
    .state('contact', {
      url: '/contact',
      controller: 'ContactController as vm',
      templateUrl: 'app/contact/contact.html',
      resolve: {
        auth: authTest
      }
    }) // FAQ
     .state('faq', {
      url: '/faq',
      controller: 'FaqController as vm',
      templateUrl: 'app/faq/faq.html',
      resolve: {
        auth: authTest
      }
    })
    // Commission
    .state('commission', {
      url: '/commission',
      controller: 'CommissionController as vm',
      templateUrl: 'app/commission/commission.html',
      resolve: {
        auth: authTest
      }  
    })
    // RAS
    .state('ras', {
      url: '/ras',
      controller: 'RaController as vm',
      templateUrl: 'app/ra/ra.html',
      resolve: {
        auth: authTest
      }
    })
    .state('ras-det', {
      url: '/ras-det',
      controller: 'RaDetController as vm',
      templateUrl: 'app/ra/raDet.html',
      params: {
        data: null
      },
      resolve: {
        auth: authTest
      }
    })
    .state('ras-add', {
      url: '/ras-add/:id?/:CodeOv?',
      controller: 'RaAddController as vm',
      templateUrl: 'app/ra/raAdd.html',
      resolve: {
        auth: authTest
      }
    })
    .state('ras-itens', {
      url: '/ras-itens/:id?',
      controller: 'RaItensController as vm',
      templateUrl: 'app/ra/raItn.html',
      resolve: {
        auth: authTest
      }
    })
    .state('ras-feed', {
      url: '/ras-feed/:id?',
      controller: 'RaFeedController as vm',
      templateUrl: 'app/ra/raFeed.html',
      resolve: {
        auth: authTest
      }
    });

  function authTest($q, localService) {
    const userInfo = localService.getData('user');

    return userInfo ? $q.when(userInfo) : $q.reject({ authenticated: false });
  }

  function paramTest($q, dataService) {
    return dataService.postData('FinancyFactor', {}).then(
      function(response) {
        return response.Results;
      },
      function() {
        console.log('[Error FinancyFactor]');
        return false;
      }
    );
  }

  function usefulTest($q, dataService) {
    return dataService.postData('Useful', {}).then(
      function(response) {
        return response.Results;
      },
      function() {
        console.log('[Error Useful]');
        return false;
      }
    );
  }

  // function versionTest($q, dataService) {
  //   return dataService.postData('App', {}).then(
  //     res => {
  //       return res.Results;
  //     },
  //     () => {
  //       console.log('[Error Version]');
  //       return false;
  //     }
  //   );
  // }
}

angular.module('app').config([
  'ngDialogProvider',
  ngDialogProvider => {
    ngDialogProvider.setDefaults({
      className: 'ngdialog-theme-default',
      plain: true,
      showClose: true,
      closeByDocument: true,
      closeByEscape: true
    });
  }
]);

angular.module('app').config($httpProvider => {
  $httpProvider.useApplyAsync(true);
});
