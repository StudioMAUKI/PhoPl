'use strict';

angular.module('phopl.ctrls')
.controller('noticeCtrl', ['$scope', function($scope) {
  var notice = this;

  notice.item = {
    date: '16.08.29',
    title: '시스템 점검 일정에 대한 안내',
    content: '그냥 그렇다구요.'
  };
}]);
