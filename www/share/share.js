'use strict';

angular.module('phopl.ctrls')
.controller('shareCtrl', ['$scope', '$ionicModal', '$state', '$ionicPopup', '$q', '$ionicLoading', 'DOMHelper', 'PKLocalStorage', 'PKSessionStorage', 'RemoteAPIService', function($scope, $ionicModal, $state, $ionicPopup, $q, $ionicLoading, DOMHelper, PKLocalStorage, PKSessionStorage, RemoteAPIService) {
  var share = this;
  share.attatchedImages = [
    // 'http://image.chosun.com/sitedata/image/201312/13/2013121302159_0.jpg',
    // 'http://cfile227.uf.daum.net/image/192ABF3350BC88EB224FF9',
    // 'http://pds25.egloos.com/pds/201207/23/96/e0063996_500c1d8f0a41d.jpg',
    // 'http://cfile28.uf.tistory.com/image/240FD148543CB20803D582',
    // 'http://cfile2.uf.tistory.com/image/2551564D54CC3B5128C971',
    // 'http://cfile22.uf.tistory.com/image/2643CC4451C8657E237976',
    // 'http://xguru.net/wp-content/uploads/2013/08/b0012399_10054380.jpg',
    // 'http://pds18.egloos.com/pds/201010/19/66/b0008466_4cbd1a5e1db64.jpg',
    // 'http://cfile8.uf.tistory.com/image/112CC25A4D9DA7E81EB86E',
    // 'http://pds27.egloos.com/pds/201305/21/76/b0119476_519b41b6ae395.jpg',
    // 'http://thumbnail.egloos.net/850x0/http://pds25.egloos.com/pds/201412/09/76/b0119476_5485cf925668e.jpg'
  ];
  share.note = '메모를 남기세요.';
  share.placeNameForSave = '';
  share.placeholderTitle = '어디인가요?';
  share.placeholderSubTitle = '장소 이름을 입력하세요';
  share.location = {};

  share.calculatedHeight = DOMHelper.getImageHeight('view-container', 3, 5);
  console.info('share.calculatedHeight = ' + share.calculatedHeight);

  //////////////////////////////////////////////////////////////////////////////
  //  Private Methods
  //////////////////////////////////////////////////////////////////////////////
  function showAlert(title, msg) {
		return $ionicPopup.alert({ title: title, template: msg });
	}

  function postPlace() {
    var deferred = $q.defer();
    var pos = null;
    var addrs = [null, null, null];

    if (!share.location.geometry) {
      pos = null;
    } else {
      console.debug('location', share.location);
      pos = {
        lon : share.location.geometry.location.lng(),
        lat : share.location.geometry.location.lat()
      };

      if (share.location.type === 'mauki') {
        console.warn('커스텀 장소 정보로 넘어 왔기 때문에 채워 넣어야 함.');
        addrs[0] = PKLocalStorage.get('addr1');
        addrs[1] = PKLocalStorage.get('addr2');
        addrs[2] = PKLocalStorage.get('addr3');
      } else if (share.location.type === 'google'){
        addrs[0] = share.location.formatted_address;
      } else {
        console.warn('Not supported.');
        deferred.reject('Not supported.');
        return deferred.promise;
      }
    }

    if (share.attatchedImages.length > 0) {
      $ionicLoading.show({
  			template: '<ion-spinner icon="lines">저장 중..</ion-spinner>',
  			duration: 30000
  		});

      var tasksOfUploadingImages = [];
      for (var i = 0; i < share.attatchedImages.length; i++) {
        tasksOfUploadingImages.push(RemoteAPIService.uploadImage(share.attatchedImages[i]));
      }
      $q.all(tasksOfUploadingImages)
      .then(function(results) {
        var uploadedImages = [];
        for (var i = 0; i < results.length; i++) {
          uploadedImages.push({content: results[i].url});
        }

        RemoteAPIService.sendUserPost({
          lonLat: pos,
  				notes: [{
  					content: (share.note === '메모를 남기세요.') ? null : share.note
  				}],
  				images: uploadedImages,
  				addr1: { content: addrs[0] || null },
  				addr2: { content: addrs[1] || null },
  				addr3: { content: addrs[2] || null },
          lps: (share.location !== {} && share.location.lps !== null) ? [{ content: share.location.lps }] : null,
          name: { content: (share.location !== {} && share.location.name !== null) ? share.location.name : null }
  			})
  			.then(function(result) {
          console.debug(result);
  				$ionicLoading.hide();
          deferred.resolve(result.data);
  			}, function(err) {
          console.error('장소 저장 실패', err);
  				$ionicLoading.hide();
          deferred.reject(err);
  			});
      }, function(err) {
        console.error('이미지 업로드 실패', err);
        $ionicLoading.hide();
        deferred.reject(err);
      });
    } else {
      deferred.reject('저장할 이미지가 없습니다.');
    }

    return deferred.promise;
	}

  //////////////////////////////////////////////////////////////////////////////
  //  Event Handler
  //////////////////////////////////////////////////////////////////////////////
  $scope.$on('$ionicView.afterEnter', function() {
    share.attatchedImages = PKLocalStorage.get('savedImgs');
  });

  //////////////////////////////////////////////////////////////////////////////
  //  Public Methods
  //////////////////////////////////////////////////////////////////////////////

  // share.promptNoteModal = function() {
  //   $ionicModal.fromTemplateUrl('share/modal.note.html', {
  //     scope: $scope,
  //     focusFirstInput: true
  //   }).then(function(modal) {
  //     share.modal = modal;
  //     share.modal.show();
  //     var iframeDocument = document.getElementById('editor').contentDocument;
  //     iframeDocument.designMode = 'on';
  //     $(iframeDocument).find('body').append(share.note);
  //   });
  // }
  //
  // share.closeModal = function() {
  //   share.note = $('#editor').contents().find('body').html();
  //   $('#note-result').html(share.note);
  //   share.modal.hide();
  //   share.modal.remove();
  // }

  share.upload = function() {
    if (share.attatchedImages.length === 0) {
      $ionicPopup.alert({
        title: '잠시만요!',
        template: '먼저, 저장할 사진들을 골라 주세요.'
      })
      .then(function() {
        $state.go('tab.choose');
      });
    } else {
      postPlace()
      .then(function(result) {
        PKSessionStorage.set('lastSavedPost', result);
        $state.go('tab.shareResult');
      }, function(err) {
        showAlert('앨범 저장 실패', err);
      });
    }
    // console.info('upload images..');
    // $state.go('tab.shareResult');
  };

  $scope.$watch('share.note', function(newValue) {
    $('#note-result').html(share.note);
  });

}]);
