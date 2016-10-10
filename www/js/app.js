// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('phopl', ['ionic', 'ngCordova', 'ngCordovaOauth', 'phopl.config', 'phopl.ctrls', 'phopl.directives', 'phopl.services'])
.run(['$ionicPlatform', '$window', 'PKLocalStorage', function($ionicPlatform, $window, PKLocalStorage) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }

    // 언어, 국가 정보 얻어오기. 이코드는 디바이스에서만 작동됨
    if (ionic.Platform.isIOS() || ionic.Platform.isAndroid()) {
      navigator.globalization.getPreferredLanguage(function(result) {
          var arr = result.value.split('-');
          PKLocalStorage.set('lang', arr[0]);
          PKLocalStorage.set('country', arr[1]);
        },
        function(error) {
          console.error(error);
      });
    } else {
      PKLocalStorage.set('lang', 'ko');
      PKLocalStorage.set('country', 'KR');
    }

    if (ionic.Platform.isIOS()) {
      document.body.classList.remove('platform-android');
      document.body.classList.add('platform-ios');
    } else if (ionic.Platform.isAndroid()) {
      document.body.classList.remove('platform-ios');
      document.body.classList.add('platform-android');
    } else {
      document.body.classList.remove('platform-ios');
      document.body.classList.remove('platform-android');
      document.body.classList.add('platform-ionic');
    }

    //  app-link part
    $window.addEventListener('LaunchUrl', function(event) {
      console.debug('app-link event', event);
      // gets page name from url
      var param =/.*:[/]{2}([^?]*)[?]?(.*)/.exec(event.detail.url)[2];
      var uplace_uuid = param.substr(12);
      console.debug('uplace_uuid: ' + uplace_uuid);

      // $state.go('tab.'+ page, {});
    });
  });
}]);

angular.module('phopl.ctrls', []);
angular.module('phopl.directives', []);
angular.module('phopl.services', []);

function handleOpenURL(url) {
  setTimeout(function() {
    var event = new CustomEvent('LaunchUrl', {detail: {'url': url}});
    window.dispatchEvent(event);
  }, 0);
}
