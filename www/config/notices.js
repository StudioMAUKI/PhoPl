'use strict';

angular.module('phopl.ctrls')
.controller('noticesCtrl', ['$scope', '$state', 'RemoteAPIService', 'PKSessionStorage', 'PostHelper', function($scope, $state, RemoteAPIService, PKSessionStorage, PostHelper) {
  var notices = this;

  //////////////////////////////////////////////////////////////////////////////
  //  Private Methods
  //////////////////////////////////////////////////////////////////////////////

  //////////////////////////////////////////////////////////////////////////////
  //  Event Handler
  //////////////////////////////////////////////////////////////////////////////
  $scope.$on('$ionicView.afterEnter', function() {
	  RemoteAPIService.getNotices()
    .then(function(res) {
      notices.notices = res.results;
      for (var i = 0; i < notices.notices.length; i++) {
        notices.notices[i].datetime = PostHelper.getTimeString(notices.notices[i].created);
      }
    }, function(err) {
      console.error('notices: getNotices', err);
    });
	});

  //////////////////////////////////////////////////////////////////////////////
  //  Public Methods
  //////////////////////////////////////////////////////////////////////////////
  notices.showNotice = function(index) {
    PKSessionStorage.set('noticeToShow', notices.notices[index]);
    $state.go('tab.notice', {noticeId: notices.notices[index].id});
  };
}]);
