'use strict';

angular.module('phopl.ctrls')
.controller('albumCtrl', ['$scope', '$q', '$ionicPopup', '$ionicModal', 'DOMHelper', function($scope, $q, $ionicPopup, $ionicModal, DOMHelper) {
  var result = this;
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
  function copyLinkToClipboard() {
    var deferred = $q.defer();
    deferred.resolve();
    return deferred.promise;
  };
  function fitMapToScreen() {
    console.log('call fitMapToScreen');
    var documentHeight = $(document).height();
    // var contentHeight = document.getElementsByTagName('ion-content')[0].clientHeight;
    console.info('documentHeight: ' + documentHeight);
    var barHeight = document.getElementsByTagName('ion-header-bar')[0].clientHeight || 44;
    $('#map').css({
      height: documentHeight - barHeight
    });
    //  이거 꼭 해줘야 지도가 제대로 그려짐. (안그러면 걍 회색으로 나옴)
    // google.maps.event.trigger($scope.map, 'resize');
  }
  function initMap(pos) {
    pos = pos || {
      latitude: 37.5666103,
      longitude: 126.9783882
    };
    if ($scope.map) {
      $scope.map.setCenter({
        lat: pos.latitude,
        lng: pos.longitude
      });
      return;
    }
    $scope.map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: pos.latitude, lng: pos.longitude},
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      zoomControl: false,
      mapTypeControl: false,
      streetViewControl: false
    });
    $scope.curMarker = new google.maps.Marker({
      map: $scope.map,
      position: { lat: pos.latitude, lng: pos.longitude },
      draggable: true,
      zIndex: 9999
    });
  }

  //////////////////////////////////////////////////////////////////////////////
  //  Event Handler
  //////////////////////////////////////////////////////////////////////////////

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
      initMap();
    });
  }
  $scope.closeMap = function() {
    $scope.modalMap.hide();
    $scope.modalMap.remove();
  }

  $scope.share = function() {
    copyLinkToClipboard()
    .then(function() {
      $ionicPopup.alert({
        title: '성공!',
        template: '링크를 클립보드에 복사했습니다. 원하시는 곳에 붙여넣기 하세요.'
      })
      .then(function() {
        checkProfileInfo(); //  !!!
      });
    }, function(err) {
      console.error(err);
    });
  }
}]);
