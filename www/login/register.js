'use strict';

angular.module('phopl.ctrls')
.controller('registerCtrl', ['$scope', '$state', 'PKFileStorage', function($scope, $state, PKFileStorage) {
  var register = this;

  //////////////////////////////////////////////////////////////////////////////
  //  private methods
  //////////////////////////////////////////////////////////////////////////////

  //////////////////////////////////////////////////////////////////////////////
  //  event handler
  //////////////////////////////////////////////////////////////////////////////

  //////////////////////////////////////////////////////////////////////////////
  //  public methods
  //////////////////////////////////////////////////////////////////////////////
  register.proceedToProfile = function() {
    console.info('프로필 확정 뷰로 이동해야 함.');
    PKFileStorage.set('accountID', 'test');
    if (PKFileStorage.get('hasConfirmedProfileInfo')) {
      $state.go('tab.config');
    } else {
      $state.go('confirmProfile');
    }
  }
}]);
