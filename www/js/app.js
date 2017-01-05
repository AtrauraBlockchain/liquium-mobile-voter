// Ionic Starter App

angular.module('underscore', [])
.factory('_', function() {
  return window._; // assumes underscore has already been loaded on the page
});

angular.module('ApiURL', [])
.factory('ApiURL', function() {
    return {
        url : "http://liquium.solucionesblockchain.com"
    };
});

angular.module('ContractAddress', [])
.factory('ContractAddress', function() {
    return {
        address : "0x30861e0fa53f5d9d3fea736439817047412d1aca"
    };
});

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('liquium', [
  'ionic',
  'angularMoment',
  'liquium.controllers',
  'liquium.directives',
  'liquium.filters',
  'liquium.services',
  'liquium.factories',
  'liquium.config',
  'liquium.views',
  'underscore',
  'ngMap',
  'ngResource',
  'ngCordova',
  'slugifier'
])

.run(function($ionicPlatform, PushNotificationsService, $rootScope, $ionicConfig, $timeout) {

  $ionicPlatform.on("deviceready", function(){
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }

    PushNotificationsService.register();
  });

  // This fixes transitions for transparent background views
  $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams){
    if(toState.name.indexOf('auth.walkthrough') > -1)
    {
      // set transitions to android to avoid weird visual effect in the walkthrough transitions
      $timeout(function(){
        $ionicConfig.views.transition('android');
        $ionicConfig.views.swipeBackEnabled(false);
      	console.log("setting transition to android and disabling swipe back");
      }, 0);
    }
  });
  $rootScope.$on("$stateChangeSuccess", function(event, toState, toParams, fromState, fromParams){
    if(toState.name.indexOf('app.feeds-categories') > -1)
    {
      // Restore platform default transition. We are just hardcoding android transitions to auth views.
      $ionicConfig.views.transition('platform');
      // If it's ios, then enable swipe back again
      if(ionic.Platform.isIOS())
      {
        $ionicConfig.views.swipeBackEnabled(true);
      }
    	console.log("enabling swipe back and restoring transition to platform default", $ionicConfig.views.transition());
    }
  });

  $ionicPlatform.on("resume", function(){
    PushNotificationsService.register();
  });

})


.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
  $stateProvider

  .state('app', {
    url: "/app",
    abstract: true,
    templateUrl: "views/app/side-menu.html",
    controller: 'AppCtrl'
  })

  //POLLS
  .state('app.polls-categories', {
    url: "/polls-categories",
    views: {
      'menuContent': {
        templateUrl: "views/app/polls/polls-categories.html",
        controller: 'PollsCategoriesCtrl'
      }
    }
  })

  .state('app.category-polls', {
    url: "/:category/polls",
    views: {
      'menuContent': {
        templateUrl: "views/app/polls/category-polls.html",
        controller: 'CategoryPollsCtrl'
      }
    }
  })

  .state('app.category-delegates', {
    url: "/:category/delegates",
    views: {
      'menuContent': {
        templateUrl: "views/app/delegates/category-delegates.html",
        controller: 'CategoryDelegatesCtrl'
      }
    }
  })

  .state('app.polls-list', {
    url: "/polls/",
    views: {
      'menuContent': {
        templateUrl: "views/app/polls/polls-list.html",
        controller: 'PollsListCtrl'
      }
    }
  })

  .state('app.poll', {
    url: "/polls/:pollId",
    views: {
      'menuContent': {
        templateUrl: "views/app/polls/poll.html",
        controller: 'PollCtrl'
      }
    }
  })

  .state('app.profile', {
    url: "/profile",
    views: {
      'menuContent': {
        controller: "ProfileCtrl",
        templateUrl: "views/app/profile.html"
      }
    }
  })

  .state('app.delegates', {
    url: "/delegates/",
    views: {
      'menuContent': {
        templateUrl: "views/app/delegates/delegates.html",
        controller: 'DelegatesCtrl'
      }
    }
  })

  .state('app.delegationPanel', {
    url: "/delegation-panel/",
    views: {
      'menuContent': {
        templateUrl: "views/app/delegates/delegate-panel.html",
        controller: 'DelegatePanelCtrl'
      }
    }
  })

;

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('app/polls/');
});
