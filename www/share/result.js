'use strict';

angular.module('phopl.ctrls')
.controller('resultCtrl', ['$scope', '$ionicHistory', '$q', 'DOMHelper', 'PKSessionStorage', 'PostHelper', 'RemoteAPIService', 'PKLocalStorage', function($scope, $ionicHistory, $q, DOMHelper, PKSessionStorage, PostHelper, RemoteAPIService, PKLocalStorage) {
  var result = this;
  $scope.post = null;
  $scope.clipboardMsg = '단축 URL 얻기 전';
  $scope.profileImg = PKLocalStorage.get('profileImg');
  $scope.nickname = PKLocalStorage.get('nickname');

  $scope.attatchedImages = [
    'http://image.chosun.com/sitedata/image/201312/13/2013121302159_0.jpg',
    'http://cfile227.uf.daum.net/image/192ABF3350BC88EB224FF9',
    'http://pds25.egloos.com/pds/201207/23/96/e0063996_500c1d8f0a41d.jpg',
    'http://cfile28.uf.tistory.com/image/240FD148543CB20803D582',
    'http://cfile2.uf.tistory.com/image/2551564D54CC3B5128C971',
    'http://cfile22.uf.tistory.com/image/2643CC4451C8657E237976',
    'http://xguru.net/wp-content/uploads/2013/08/b0012399_10054380.jpg',
    'http://pds18.egloos.com/pds/201010/19/66/b0008466_4cbd1a5e1db64.jpg',
    'http://cfile8.uf.tistory.com/image/112CC25A4D9DA7E81EB86E',
    'http://pds27.egloos.com/pds/201305/21/76/b0119476_519b41b6ae395.jpg',
    'http://thumbnail.egloos.net/850x0/http://pds25.egloos.com/pds/201412/09/76/b0119476_5485cf925668e.jpg'
  ];
  $scope.calculatedHeight = DOMHelper.getImageHeight('view-container', 3, 5);

  //////////////////////////////////////////////////////////////////////////////
  //  Private Methods
  //////////////////////////////////////////////////////////////////////////////
  function copyURLToClipboard(url) {
    var deferred = $q.defer();

    if (ionic.Platform.isIOS() || ionic.Platform.isAndroid()) {
      $cordovaClipboard.copy(url)
      .then(function(result) {
        console.log('Copying URL was successed.', url);
        $scope.clipboardMsg = '클립보드에 링크가 복사 되었습니다!';
        deferred.resolve();
      }, function(err) {
        console.error('Copying URL was failed.', error);
        $scope.clipboardMsg = '오류가 발생하여 클립보드 복사에 실패했습니다.';
        deferred.reject(err);
      });
    } else {
      deferred.resolve();
    }

    return deferred.promise;
  }

  function getShortenURLAndCopyToClipboard() {
    if ($scope.post.shorten_url === null || $scope.post.shorten_url === '') {
      // shoten url을 얻어서 복사
      RemoteAPIService.getShortenURL($scope.post.uplace_uuid)
      .then(function(url) {
        $scope.shortenUrl = url;
        $scope.post.shorten_url = url;
        copyURLToClipboard($scope.shortenUrl);
      }, function(err) {
        seveSecond.clipboardMsg = '단축 URL을 얻어오지 못했습니다.';
        $scope.shortenUrl = '';
      })
    } else {
      $scope.shortenUrl = $scope.post.shorten_url;
      copyURLToClipboard($scope.shortenUrl);
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  //  Event Handler
  //////////////////////////////////////////////////////////////////////////////
  $scope.$on('$ionicView.afterEnter', function() {
    $scope.post = PKSessionStorage.get('lastSavedPost');
    PostHelper.decoratePost($scope.post);
    console.debug('The last saved place', $scope.post);

    getShortenURLAndCopyToClipboard();
  });

  //////////////////////////////////////////////////////////////////////////////
  //  Public Methods
  //////////////////////////////////////////////////////////////////////////////
  $scope.goHome = function() {
    $ionicHistory.goBack(-2);
  }
}]);
