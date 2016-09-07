'use strict';

angular.module('phopl.ctrls')
.controller('loginCtrl', ['$scope', '$ionicPopup', '$state', function($scope, $ionicPopup, $state) {
  var login = this;
  login.loginned = false;

  //////////////////////////////////////////////////////////////////////////////
  //  private methods
  //////////////////////////////////////////////////////////////////////////////
  function tryLogin() {
    console.info('tryLogin');
    login.loginned = false;

    if (!login.loginned) {
      $ionicPopup.alert({
        title: 'PHOPL<sup>Beta</sup><br><small>사진을 공유하는 새로운 방법!</small>',
        template: '<small>포플은 현재 베타서비스 중입니다.</small><br><small>여러분의 진심 어린 피드백을 기다립니다.^^</small>'
      })
      .then(function() {
        console.info('위치동의 페이지로 넘어가야 함.');
        $state.go('confirmLocation');
      })
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  //  event handler
  //////////////////////////////////////////////////////////////////////////////
  $scope.$on('$ionicView.loaded', tryLogin);

  //////////////////////////////////////////////////////////////////////////////
  //  public methods
  //////////////////////////////////////////////////////////////////////////////
}]);
