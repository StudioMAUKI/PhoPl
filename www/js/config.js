'use strict';

angular.module('phopl.config', [])
.config(function($ionicConfigProvider, $stateProvider, $urlRouterProvider, $httpProvider) {
	// CSRF token 설정을 위함 (꼭 들어가야 함!!)
	$httpProvider.defaults.xsrfCookieName = 'csrftoken';
	$httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
	$httpProvider.defaults.timeout = 5000;

	$ionicConfigProvider.tabs.position('bottom');

	$stateProvider
	.state('tab', {
    url: '',
    abstract: true,
    templateUrl: 'common/tab.html'
  })
	.state('tab.list', {
    url: '/list/:bypass',
    views: {
      'list': {
        templateUrl: 'list/albums.html',
        controller: 'albumsCtrl',
        controllerAs: 'albums'
      }
    }
  })
	.state('tab.album', {
    url: '/album/:uplace_uuid',
    views: {
      'list': {
        templateUrl: 'list/album.html',
        controller: 'albumCtrl'
      }
    }
  })
	.state('tab.choose', {
    url: '/choose',
    views: {
      'share': {
        templateUrl: 'share/choose.html',
        controller: 'chooseCtrl',
        controllerAs: 'choose'
      }
    }
  })
	.state('tab.share', {
    url: '/share?mode',
    views: {
      'share': {
        templateUrl: 'share/share.html',
        controller: 'shareCtrl',
        controllerAs: 'share'
      }
    }
  })
	.state('tab.shareResult', {
    url: '/share/result',
    views: {
      'share': {
        templateUrl: 'share/result.html',
				controller: 'resultCtrl'
      }
    }
  })
  .state('tab.config', {
    url: '/config',
    views: {
      'config': {
        templateUrl: 'config/config.html',
        controller: 'configCtrl',
        controllerAs: 'config'
      }
    }
  })
  .state('tab.profile', {
    url: '/config/profile',
    views: {
      'config': {
        templateUrl: 'config/profile.html',
        controller: 'profileCtrl',
        controllerAs: 'profile'
      }
    }
  })
  .state('tab.policies', {
    url: '/config/policies',
    views: {
      'config': {
        templateUrl: 'config/policies.html',
        // controller: 'profileCtrl',
        // controllerAs: 'profile'
      }
    }
  })
  .state('tab.policy-basic', {
    url: '/config/policies/basic',
    views: {
      'config': {
        templateUrl: 'config/policies.basic.html',
      }
    }
  })
  .state('tab.policy-privacy', {
    url: '/config/policies/privacy',
    views: {
      'config': {
        templateUrl: 'config/policies.privacy.html',
      }
    }
  })
  .state('tab.policy-location', {
    url: '/config/policies/location',
    views: {
      'config': {
        templateUrl: 'config/policies.location.html',
      }
    }
  })
  .state('tab.notices', {
    url: '/config/notices',
    views: {
      'config': {
        templateUrl: 'config/notices.html',
        controller: 'noticesCtrl',
        controllerAs: 'notices'
      }
    }
  })
	.state('tab.notice', {
    url: '/config/notices/:noticeId',
    views: {
      'config': {
        templateUrl: 'config/notice.html',
        controller: 'noticeCtrl',
        controllerAs: 'notice'
      }
    }
  })
  .state('tab.contact', {
    url: '/config/contact',
    views: {
      'config': {
        templateUrl: 'config/contact.html',
        controller: 'contactCtrl',
        controllerAs: 'contact'
      }
    }
  })
  .state('login', {
    url: '/login',
		templateUrl: 'login/login.html',
		controller: 'loginCtrl',
		controllerAs: 'login'
  })
  .state('confirmLocation', {
    url: '/confirm-location',
		templateUrl: 'login/confirm.location.html',
		controller: 'confirmLocationCtrl',
		controllerAs: 'confirmLocation'
  })
  .state('register', {
    url: '/register',
		templateUrl: 'login/register.html',
		controller: 'registerCtrl',
		controllerAs: 'register'
  })
  .state('confirmProfile', {
    url: '/profile',
		templateUrl: 'login/confirm.profile.html',
		controller: 'confirmProfileCtrl',
		controllerAs: 'confirmProfile'
  });

	$urlRouterProvider.otherwise('/login');
});
