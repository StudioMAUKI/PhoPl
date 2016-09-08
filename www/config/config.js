'use strict';

angular.module('phopl.ctrls')
.controller('configCtrl', ['$scope', '$state', 'PKFileStorage', function($scope, $state, PKFileStorage) {
  var config = this;
  config.version = '1.0.0';

  //////////////////////////////////////////////////////////////////////////////
  //  public methods
  //////////////////////////////////////////////////////////////////////////////
  config.logout = function() {
    console.info('logout');
    PKFileStorage.reset();
    $state.go('register');    
  }
}]);
