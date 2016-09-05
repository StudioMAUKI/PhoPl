'use strict';

angular.module('phopl.ctrls')
.controller('noticesCtrl', ['$scope', function($scope) {
  var notices = this;

  notices.items = [
    {
      date: '16.08.29',
      title: '시스템 점검 일정에 대한 안내'
    },
    {
      date: '16.07.25',
      title: '시스템 점검 일정에 대한 안내'
    },
    {
      date: '16.07.03',
      title: '시스템 점검 일정에 대한 안내'
    },
    {
      date: '16.06.15',
      title: '시스템 점검 일정에 대한 안내'
    }
  ];
}]);
