'use strict';

angular.module('phopl.ctrls')
.controller('albumsCtrl', ['$scope', '$state', '$q', '$ionicLoading', '$ionicPopover', 'DOMHelper', 'RemoteAPIService', 'PKLocalStorage', 'PKSessionStorage', function($scope, $state, $q, $ionicLoading, $ionicPopover, DOMHelper, RemoteAPIService, PKLocalStorage, PKSessionStorage) {
  var albums = this;
  albums.completedFirstLoading = false;
  albums.orderingTypeName = ['-modified', 'placename', 'distance_from_origin'];
	albums.orderingType = 0;
  albums.images = [
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
  albums.calculatedHeight = DOMHelper.getImageHeight('view-container', 4, 5);

  //////////////////////////////////////////////////////////////////////////////
  //  Private Methods
  //////////////////////////////////////////////////////////////////////////////
  function loadSavedPlace(position) {
		console.log('loadSavedPlace : ' + position);
		var deferred = $q.defer();
		position = position || 'top';
    // var curPos = PKLocalStorage.get('curPos') || { latitude: 37.5666103, longitude: 126.9783882 };
    var curPos = {};
		var lon = curPos.longitude || null;
    var lat = curPos.latitude || null;
    var radius = 0;
    var limit = 0;

		if (albums.completedFirstLoading === false) {
			$ionicLoading.show({
				template: '<ion-spinner icon="lines">로딩 중..</ion-spinner>'
			});
		}
		// console.log('getPostsOfMine', position, albums.orderingTypeName[albums.orderingType], lon, lat, radius);
		RemoteAPIService.getPostsOfMine(position, albums.orderingTypeName[albums.orderingType], lon, lat, radius, limit)
		.then(function(result) {
			albums.posts = result.total;
			deferred.resolve();
			// console.dir(albums.posts);
		}, function(err) {
			console.error('loadSavedPlace', err);
			deferred.reject(err);
		})
		.finally(function() {
			if (albums.completedFirstLoading === false) {
				$ionicLoading.hide();
				albums.completedFirstLoading = true;
			}
		});

    RemoteAPIService.getUplaces('top', 'total');

		return deferred.promise;
	};

  //////////////////////////////////////////////////////////////////////////////
  //  Event Handler
  //////////////////////////////////////////////////////////////////////////////
  $scope.$on('$ionicView.loaded', function() {
    loadSavedPlace('top');
  });

  //////////////////////////////////////////////////////////////////////////////
  //  Public Methods
  //////////////////////////////////////////////////////////////////////////////
  albums.showAlbum = function(index) {
    PKSessionStorage.set('albumToShow', albums.posts[index]);
    $state.go('tab.album', {uplace_uuid: albums.posts[index].uplace_uuid});
  }

  albums.isEndOfList = function() {
		return RemoteAPIService.isEndOfList('uplaces');
	};

  albums.doRefresh = function(direction) {
		console.log('doRefersh : ' + direction);
		if (albums.completedFirstLoading){
			if (direction === 'top') {
				loadSavedPlace('top')
				.finally(function(){
					$scope.$broadcast('scroll.refreshComplete');
				});
			} else if (direction === 'bottom') {
				loadSavedPlace('bottom')
				.finally(function(){
					$scope.$broadcast('scroll.infiniteScrollComplete');
				});
			}
		} else {
			if (direction === 'top') {
				$scope.$broadcast('scroll.refreshComplete');
			} else if (direction === 'bottom') {
				$scope.$broadcast('scroll.infiniteScrollComplete');
			}
		}
	};

  albums.popOverOrdering = function(event) {
		$ionicPopover.fromTemplateUrl('list/popover.ordering.html', {
			scope: $scope,
		})
		.then(function(popover){
			albums.popOver = popover;
			albums.popOver.show(event);
		});
	};

	albums.isActiveMenu = function(orderingType) {
		return albums.orderingType === orderingType;
	};

	albums.changeOrderingType = function(type) {
		albums.popOver.hide();
		if (albums.orderingType !== type) {
			albums.orderingType = type;
			loadSavedPlace('top')
			.then(function() {
				$ionicScrollDelegate.scrollTop();
			});
		}
	};
}]);
