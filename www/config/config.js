'use strict';

angular.module('phopl.ctrls')
.controller('configCtrl', ['$scope', '$state', function($scope, $state) {
  var config = this;
  config.version = '1.0.0';

  //////////////////////////////////////////////////////////////////////////////
  //  public methods
  //////////////////////////////////////////////////////////////////////////////
  config.logout = function() {
    console.info('logout');
    $state.go('register');
  }
}]);
