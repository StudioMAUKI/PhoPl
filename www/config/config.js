'use strict';

angular.module('phopl.ctrls')
.controller('configCtrl', ['$scope', function($scope) {
  var config = this;
  config.version = '1.0.0';

  //////////////////////////////////////////////////////////////////////////////
  //  public methods
  //////////////////////////////////////////////////////////////////////////////
  config.logout = function() {
    console.info('logout');
  }
}]);
