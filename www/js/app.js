// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('phopl', ['ionic', 'ngCordova', 'ngCordovaOauth', 'phopl.config', 'phopl.ctrls', 'phopl.directives', 'phopl.services'])
.run(['$ionicPlatform', '$window', '$state', '$ionicHistory', '$rootScope', 'PKLocalStorage', 'loginStatus', 'PKFileStorage', 'PKSessionStorage', 'RemoteAPIService', function($ionicPlatform, $window, $state, $ionicHistory, $rootScope, PKLocalStorage, loginStatus, PKFileStorage, PKSessionStorage, RemoteAPIService) {
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
      // StatusBar.styleDefault();
      StatusBar.styleLightContent();
    }

    // 언어, 국가 정보 얻어오기. 이코드는 디바이스에서만 작동됨
    if (ionic.Platform.isIOS() || ionic.Platform.isAndroid()) {
      try{
        navigator.globalization.getPreferredLanguage(function(result) {
            var arr = result.value.split('-');
            PKLocalStorage.set('lang', arr[0]);
            PKLocalStorage.set('country', arr[1]);
          },
          function(error) {
            console.error(error);
        });
      }catch(e){
        console.error(e);
      }
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
      var params =/.*:[/]{2}([^?]*)[?]?(.*)/.exec(event.detail.url)[2].split('&');
      var uplace_uuid = params[0].substr(12);
      var nickname = params[1].substr(9);
      console.debug('uplace_uuid: ' + uplace_uuid);
      console.debug('nickname: ' + nickname);

      openAlbum(uplace_uuid, nickname);
    });

    function openAlbum(uplace_uuid, nickname) {
      if (loginStatus.isLogin()) {
        PKFileStorage.init()
        .then(function() {
          var localNickname = PKFileStorage.get('nickname');
          if (localNickname === nickname) {
            // alert('이미 내가 갖고 있는 앨범');
            RemoteAPIService.getPost(uplace_uuid)
            .then(function(result) {
              console.debug('uplace', result);
              goToAlbum(result);
            }, function(err) {
              console.error(err);
            });
          } else {
            // alert('타인으로부터 공유받아, 내가 저장하려는 앨범');
            // RemoteAPIService.getIplace(uplace_uuid)
            RemoteAPIService.getPost(uplace_uuid)
            .then(function(result) {
              console.debug('iplace', result);
              goToAlbum(result);
            }, function(err) {
              console.error(err);
            });
          }
        });
      } else {
        console.info('로그인 상태가 아니므로, 로그인이 완료될때까지 링크 열기 대기');
        setTimeout(function() {
          openAlbum(uplace_uuid, nickname);
        }, 1000);
      }
    }

    function goToAlbum(data) {
      PKSessionStorage.set('albumToShow', data);
      PKSessionStorage.set('goToAlbumDirectly', true);
      console.debug('goToAlbum: currentView', $ionicHistory.currentView());
      //  이미 가려고 하는 뷰가 열린 경우에는 $state.go()를 호출해도 반응이 없다.
      //  따라서 이런 경우에는 이벤트를 이용한다.
      if ($ionicHistory.currentView().stateId === 'tab.list') {
        $rootScope.$broadcast('tab.list.goToAlbumDirectly');
      } else {
        $state.go('tab.list');
      }
    }
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
