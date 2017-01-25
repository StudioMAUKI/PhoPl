'use strict';

angular.module('phopl.ctrls')
.controller('contactCtrl', ['$scope', '$ionicPopup', 'RemoteAPIService', function($scope, $ionicPopup, RemoteAPIService) {
  var contact = this;

  // document.getElementById('editor').contentDocument.designMode = 'on';

  //////////////////////////////////////////////////////////////////////////////
  //  public methods
  //////////////////////////////////////////////////////////////////////////////
  
  contact.getEmail = function() {
    RemoteAPIService.checkVerified()
    .then(function(accountInfo) {
      if (accountInfo) {
        if (!accountInfo.email) {
          return;
        } 
        contact.email = accountInfo.data.email || ''; 
        $scope.$apply();
      }  
    })
  }

  contact.send = function() {
    var emailRegExp = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;

		if (contact.email === '') {
			$ionicPopup.alert({
        title: '잠시만요!',
        template: '이메일 주소를 입력해 주세요.'
      });
		} else if (!emailRegExp.test(contact.email)) {
			$ionicPopup.alert({
        title: '잠시만요!',
        template: '유효한 이메일 주소를 입력해 주세요.'
      });
		}else {
			if (!contact.content) {
        $ionicPopup.alert({
          title: '잠시만요!',
          template: '문의하실 내용을 입력해 주세요.'
        });
      } else {
        console.debug('content', contact.content);
        RemoteAPIService.sendInquiry({
          content: contact.content,
          email: contact.email
        })
        .then(function(result) {
          $ionicPopup.alert({
            title: '감사합니다!',
            template: '문의 내용 확인 후 빠르게 회신 드리겠습니다.'
          });
        }, function(err) {
          $ionicPopup.alert({
            title: '죄송합니다!',
            template: '문의 내용을 전송하는 중 오류가 발생하였습니다. 잠시 후 다시 시도해 주시기 바랍니다.'
          });
        })
      }
		}
  };
}]);
