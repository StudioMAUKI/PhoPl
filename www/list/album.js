'use strict';

angular.module('phopl.ctrls')
.controller('albumCtrl', ['$scope',  '$state', '$q', '$ionicPlatform', '$ionicPopup', '$ionicModal', '$cordovaClipboard', '$ionicSlideBoxDelegate', '$ionicScrollDelegate', '$ionicPopover', '$ionicHistory', 'DOMHelper', 'PKLocalStorage', 'PKSessionStorage', 'RemoteAPIService', 'daumSearchService', 'PostHelper', function($scope,$state, $q, $ionicPlatform, $ionicPopup, $ionicModal, $cordovaClipboard, $ionicSlideBoxDelegate, $ionicScrollDelegate, $ionicPopover, $ionicHistory, DOMHelper, PKLocalStorage, PKSessionStorage, RemoteAPIService, daumSearchService, PostHelper) {
  var result = this;
  // $scope.uplace_uuid = $stateParams.uplace_uuid;
  // $scope.profileImg = PKLocalStorage.get('profileImg');
  // $scope.nickname = PKLocalStorage.get('nickname');
  $scope.searchResults = [];
  $scope.attatchedImages = [
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
  $scope.showAll = false;
  $scope.zoomMin = 1;
  $scope.calculatedHeight = DOMHelper.getImageHeight('view-container', 3, 5);

  //////////////////////////////////////////////////////////////////////////////
  //  Private Methods
  //////////////////////////////////////////////////////////////////////////////
  function shareURLToNativeSocialMedia(url){
    var deferred = $q.defer();
    try{
      var options = {
        url:url
      }
      window.plugins.socialsharing.shareWithOptions(options, deferred.resolve(), deferred.reject());
    }catch(e){
      copyURLToClipboard();
    }
    return deferred.promise;
  }
  function copyURLToClipboard(url) {
    var deferred = $q.defer();

    if (ionic.Platform.isIOS() || ionic.Platform.isAndroid()) {
      $cordovaClipboard.copy(url)
      .then(function(result) {
        $ionicPopup.alert({
          title: '성공',
          template: '클립보드에 링크가 복사되었습니다.'
        });
      }, function(err) {
        console.error('Copying URL was failed.', err);
        $ionicPopup.alert({
          title: '오류',
          template: '오류가 발생하여 클립보드 복사에 실패했습니다.'
        });
      });
    } else {
      $ionicPopup.alert({
        title: '경고',
        template: '웹브라우저에서는 지원하지 않는 기능입니다.'
      });
    }

    return deferred.promise;
  }

  function getShortenURLAndCopyToClipboard() {
    if ($scope.post.shorten_url === null || $scope.post.shorten_url === '') {
      // shoten url을 얻어서 복사
      RemoteAPIService.getShortenURL($scope.post.uplace_uuid)
      .then(function(url) {
        $scope.post.shorten_url = url;
        return shareURLToNativeSocialMedia(url);
      }, function(err) {
        console.error('getShortenURL', err);
        $ionicPopup.alert({
          title: '오류',
          template: err
        });
      })
    } else {
      return shareURLToNativeSocialMedia($scope.post.shorten_url);
    }
  }

  function fitMapToScreen() {
    console.log('call fitMapToScreen');
    var documentHeight = $(document).height();
    // var contentHeight = document.getElementsByTagName('ion-content')[0].clientHeight;
    console.info('documentHeight: ' + documentHeight);
    var barHeight = document.getElementsByTagName('ion-header-bar')[0].clientHeight || 44;
    $('#map-album').css({
      height: documentHeight - barHeight
    });
    //  이거 꼭 해줘야 지도가 제대로 그려짐. (안그러면 걍 회색으로 나옴)
    // google.maps.event.trigger($scope.map, 'resize');
  }

  function initMap(pos) {
    pos = pos || {
      lat: 37.5666103,
      lng: 126.9783882
    };

    $scope.map = new google.maps.Map(document.getElementById('map-album'), {
      center: pos,
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      zoomControl: false,
      mapTypeControl: false,
      streetViewControl: false
    });
    $scope.curMarker = new google.maps.Marker({
      map: $scope.map,
      position: pos,
      draggable: false,
      zIndex: 9999
    });
  }

  function makeKeyword() {
    var keyword = '';
    if ($scope.post.placePost) {
      var region = $scope.post.placePost.addr2 || $scope.post.placePost.addr1 || $scope.post.placePost.addr3 || null;
      if (region) {
        var region_items = region.content.split(' ');
        var loopCount = region_items.length >= 4 ? 4 : region_items.length;
        for (var i = 1; i < loopCount; i++) {
          keyword += region_items[i] + '+';
        }
      }

      keyword += ($scope.post.placePost.name.content || $scope.post.userPost.name.content);
      console.log('Calculated keyword : ', keyword);
      keyword = encodeURI(keyword);
      console.log('URL encoded keyword : ', keyword);
    }
    return keyword;
  }

  function getDaumResult() {
    var keyword = makeKeyword();
    if (keyword !== '') {
      daumSearchService.search(keyword)
      .then(function(items) {
        $scope.searchResults = items;
        for (var i = 0; i < $scope.searchResults.length; i++) {
          $scope.searchResults[i].title = $scope.searchResults[i].title.replace(/<b>/g, '').replace(/<\/b>/g, '').replace(/&lt;b&gt;/g, '').replace(/&lt;\/b&gt;/g, '').replace(/&quot;/g, '"');
          $scope.searchResults[i].description = $scope.searchResults[i].description.replace(/<b>/g, '').replace(/<\/b>/g, '').replace(/&lt;b&gt;/g, '').replace(/&lt;\/b&gt;/g, '').replace(/&quot;/g, '"');
        }
        // console.dir($scope.searchResults);

      }, function(err) {
        $scope.searchResults = [];
        $scope.searchResults.push({
          author: 'MAUKI studio',
          comment: '',
          description: JSON.stringify(err),
          link: '',
          title: '검색 결과를 얻어 오는데 실패했습니다'
        })
      });
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  //  Event Handler
  //////////////////////////////////////////////////////////////////////////////
  $scope.$on('$ionicView.afterEnter', function() {
		$scope.post = PKSessionStorage.get('albumToShow');
    if ($scope.post.userPost.notes) {
      for (var i = 0; i < $scope.post.userPost.notes.length; i++) {
        $scope.post.userPost.notes[i].datetime = PostHelper.getTimeString($scope.post.userPost.notes[i].timestamp);
      }
    }

    console.debug('post', $scope.post);
    if ($scope.post.userPost.ru.data) {
      $scope.profileImg = $scope.post.userPost.ru.data.profileImg || 'img/blank-profile.png';
    } else {
      $scope.profileImg = 'img/blank-profile.png';
    }
    $scope.nickname = $scope.post.userPost.ru.nickname;
    getDaumResult();
    if (RemoteAPIService.isTakenPlace($scope.post.uplace_uuid)) {
      $scope.canTakeToMyList = false;
    } else {
      $scope.canTakeToMyList = true;
    }
	});

  //////////////////////////////////////////////////////////////////////////////
  //  Public Methods
  //////////////////////////////////////////////////////////////////////////////
  $scope.showMap = function() {
    $ionicModal.fromTemplateUrl('list/modal.map.html', {
      scope: $scope
    })
    .then(function(modal) {
      $scope.modalMap = modal;
      $scope.modalMap.show();
      fitMapToScreen();
      initMap({
        lat: $scope.post.lonLat.lat,
        lng: $scope.post.lonLat.lon
      });
    });
  }
  $scope.closeMap = function() {
    $scope.modalMap.hide();
    $scope.modalMap.remove();
    $scope.map = null;
  }

  $scope.share = function() {
    getShortenURLAndCopyToClipboard();
  }

  $scope.openLink = function(url) {
    console.info('url: ' + url);
    //window.open(url, '_system'); //외부 browser
    if( $ionicPlatform.is('ios') ){
      window.open(url, '_blank', 'location=no,toolbarposition=top,closebuttoncaption=닫기'); // 앱내 browser for ios
    }else{
      window.open(url, '_blank'); // 앱내 browser for android
    }
  };

  $scope.showAllImages = function() {
    $scope.showAll = true;
    $ionicScrollDelegate.resize();
    // $scope.$apply();
  }

  $scope.showImagesWithFullScreen = function(index) {
    $scope.activeSlide = index;
    $ionicModal.fromTemplateUrl('list/modal.images.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.modalImages = modal;
      $scope.modalImages.show();
    });
  }

  $scope.closeImages = function() {
    $scope.modalImages.hide();
    $scope.modalImages.remove();
  };

  $scope.updateSlideStatus = function(slide) {
    var zoomFactor = $ionicScrollDelegate.$getByHandle('scrollHandle' + slide).getScrollPosition().zoom;
    if (zoomFactor == $scope.zoomMin) {
      $ionicSlideBoxDelegate.enableSlide(true);
    } else {
      $ionicSlideBoxDelegate.enableSlide(false);
    }
  };

  $scope.popOverMore = function(event) {
    console.info('popOverMore() called');
		$ionicPopover.fromTemplateUrl('list/popover.edit.html', {
			scope: $scope
		})
		.then(function(popover){
			$scope.popOver = popover;
			$scope.popOver.show(event);
      console.info('popOverShow()');
		});
	};

  $scope.edit = function() {
    console.info('edit() called');
    $scope.popOver.hide();
    $scope.popOver.remove();

    PKLocalStorage.set('updatePost', $scope.post);
    setTimeout(function(){
      $state.go('tab.edit');
    },100)
  };

  $scope.delete = function() {
    console.info('delete() called');
    $scope.popOver.hide();
    $scope.popOver.remove();
    $ionicPopup.confirm({
			title: '삭제',
			template: '앨범을 삭제 하시겠습니까?'
		})
		.then(function(res){
			if (res) {
        RemoteAPIService.deleteUserPost($scope.post.uplace_uuid)
        .then(function() {
          $ionicPopup.alert({
            title: '성공',
            template: '삭제되었습니다'
          })
          .then(function() {
            $ionicHistory.goBack();
          });
        }, function(err) {
          console.error(err);
        });
      }
    });
  };

  $scope.take = function() {
    RemoteAPIService.takeIplace($scope.post.uplace_uuid)
    .then(function(result) {
      console.log('album.take()', result);
    }, function(err) {
      console.error(err);
    });
  }
}]);
