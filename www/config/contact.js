'use strict';

angular.module('phopl.ctrls')
.controller('contactCtrl', ['$scope', function($scope) {
  var contact = this;

  document.getElementById('editor').contentDocument.designMode = 'on';

  //////////////////////////////////////////////////////////////////////////////
  //  public methods
  //////////////////////////////////////////////////////////////////////////////
  contact.sendQuestion = function() {
    console.info('sendQuestion');
  }
}]);