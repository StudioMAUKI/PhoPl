'use strict';

angular.module('phopl.ctrls')
.controller('confirmLocationCtrl', ['$scope', '$state', 'PKFileStorage', function($scope, $state, PKFileStorage) {
  var confirmLocation = this;

  //////////////////////////////////////////////////////////////////////////////
  //  private methods
  //////////////////////////////////////////////////////////////////////////////

  //////////////////////////////////////////////////////////////////////////////
  //  event handler
  //////////////////////////////////////////////////////////////////////////////

  //////////////////////////////////////////////////////////////////////////////
  //  public methods
  //////////////////////////////////////////////////////////////////////////////
  confirmLocation.showPolicy = function() {
    console.info('위치기반 서비스 이용약관 모달창 띄워야 함');
  }
  confirmLocation.preceedToRegister = function() {
    console.info('회원 가입으로 진행');
    PKFileStorage.set('hasAgreedWithLocationPolicy', true);
    $state.go('register');
  }
}]);
