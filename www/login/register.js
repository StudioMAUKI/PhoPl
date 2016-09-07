'use strict';

angular.module('phopl.ctrls')
.controller('registerCtrl', ['$scope', '$state', function($scope, $state) {
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
    $state.go('confirmProfile');
  }
}]);
