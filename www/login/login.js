'use strict';

angular.module('phopl.ctrls')
.controller('loginCtrl', ['$scope', '$ionicPopup', '$state', '$ionicPlatform', 'PKFileStorage', function($scope, $ionicPopup, $state, $ionicPlatform, PKFileStorage) {
  var login = this;
  login.loginned = false;

  //////////////////////////////////////////////////////////////////////////////
  //  private methods
  //////////////////////////////////////////////////////////////////////////////
  function doLogin() {
    if (PKFileStorage.get('accountID')) {
      //  로그인 처리
      setTimeout(function() {
        console.info('로그인 처리 했다 치고..설정 화면으로 이동');
        login.loginned = true;
        $state.go('tab.config');
      }, 1000);
    } else {
      //  회원 등록 페이지로 이동시킴
      //  위치 정보 이용에 동의했으면, 바로 로그인 화면으로 보내고, 그렇지 않으면
      //  위치 정보 이용 동의를 먼저 받는다.
      if (PKFileStorage.get('hasAgreedWithLocationPolicy')) {
        $state.go('register');
      } else {
        $state.go('confirmLocation');
      }
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  //  event handler
  //////////////////////////////////////////////////////////////////////////////
  $scope.$on('$ionicView.loaded', function() {
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
