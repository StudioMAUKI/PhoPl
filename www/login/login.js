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
              $state.go('tab.config');
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
