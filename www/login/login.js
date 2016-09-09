'use strict';

angular.module('phopl.ctrls')
.controller('loginCtrl', ['$scope', '$ionicPopup', '$state', '$ionicPlatform', 'PKFileStorage', 'RemoteAPIService', function($scope, $ionicPopup, $state, $ionicPlatform, PKFileStorage, RemoteAPIService) {
  var login = this;
  login.loginned = false;
  login.height = calculateHeight();

  //////////////////////////////////////////////////////////////////////////////
  //  private methods
  //////////////////////////////////////////////////////////////////////////////
  function calculateHeight() {
    var height = document.getElementsByClassName('scroll-content')[0].clientHeight;
    console.info('Height of content: ' + height);
    return height;
  }

  function goToNextStep() {
    //  회원 등록 페이지로 이동시킴
    //  위치 정보 이용에 동의했으면, 바로 로그인 화면으로 보내고, 그렇지 않으면
    //  위치 정보 이용 동의를 먼저 받는다.
    if (PKFileStorage.get('hasAgreedWithLocationPolicy')) {
      $state.go('register');
    } else {
      $state.go('confirmLocation');
    }
  }

  function doLogin() {
    RemoteAPIService.registerUser()
    .then(function(token) {
      // 유저 로그인
      RemoteAPIService.loginUser(token)
      .then(function() {
        if (PKFileStorage.get('accountID')) {
          // VD 등록
          RemoteAPIService.registerVD()
          .then(function(token) {
            // VD 로그인
            RemoteAPIService.loginVD(token)
            .then(function(token) {
              console.log('login success.');
              PKFileStorage.set('auth_vd_token', token);
              login.loginned = true;

              RemoteAPIService.checkVerified()
              .then(function(result) {
                if (result) {
                  var data =JSON.parse(result.data);
                  if (!result.nickname || !data.profileImg) {
                    $state.go('confirmProfile');
                  } else {
                    PKFileStorage.set('nickname', result.nickname);
                    PKFileStorage.set('profileImg', data.profileImg);
                    PKFileStorage.set('email', result.email);
                    $state.go('tab.config');
                  }
                } else if (result === null) {
                  $ionicPopup.alert({
                    title: '잠시만요!',
                    template: '입력하신 이메일 주소로 확인 메일이 발송되었습니다. 메일에 포함된 링크를 클릭 하신 후 계속 진행해 주세요.'
                  })
                  .then(function() {
                    doLogin(); //  !!!
                  });
                }
              }, function(err) {
                alertAndExit('서버와 통신 중');
              });
            }, function(err) {
              console.error('loginVD failed.', err);
              PKFileStorage.remove('accountID');
              PKFileStorage.remove('auth_vd_token');
              goToNextStep();
            });
          }, function(err) {
            console.error('registerVD failed', err);
            PKFileStorage.remove('accountID');
            PKFileStorage.remove('auth_vd_token');
            goToNextStep();
          });
        } else {
          goToNextStep();
        }
      }, function(err) {
        console.error('loginUser failed', err);
				PKFileStorage.remove('auth_user_token');
        $state.go('register');
      });
    }, function(err) {
      console.error('registerUser failed', err);
			PKFileStorage.remove('auth_user_token');
			$state.go('register');
    });
  }

  function alertAndExit(msg) {
    $ionicPopup.alert({
      title: '죄송합니다!',
      template: msg + ' 오류가 발생했습니다. 앱을 완전히 종료하시고, 다시 시작해 주세요.'
    })
    .then(function() {
      ionic.Platform.exitApp();
    });
  }

  //////////////////////////////////////////////////////////////////////////////
  //  event handler
  //////////////////////////////////////////////////////////////////////////////
  $scope.$on('$ionicView.afterEnter', function() {
    $ionicPlatform.ready(function() {
      PKFileStorage.init()
      .then(function() {
        if (PKFileStorage.get('initial_popup_viewed') !== true) {
          $ionicPopup.alert({
            title: 'PHOPL<sup>Beta</sup><br><small>사진을 공유하는 새로운 방법!</small>',
            template: '<small>포플은 현재 베타서비스 중입니다.</small><br><small>여러분의 진심 어린 피드백을 기다립니다.^^</small>'
          })
          .then(function() {
            PKFileStorage.set('initial_popup_viewed', true);
            doLogin();
          })
        } else {
          doLogin();
        }
      }, function(err) {
        console.error(err);
      });
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  //  public methods
  //////////////////////////////////////////////////////////////////////////////
}]);
