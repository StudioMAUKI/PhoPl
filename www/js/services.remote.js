'use strict';

angular.module('phopl.services')
.directive('fileModel', ['$parse', function ($parse) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var model = $parse(attrs.fileModel);
      var modelSetter = model.assign;

      element.bind('change', function(){
        scope.$apply(function(){
          modelSetter(scope, element[0].files[0]);
        });
      });
    }
  };
}])
.factory('RESTServer', ['PKLocalStorage', function(PKLocalStorage) {
  return {
    getURL: function() {
      var devmode = PKLocalStorage.get('devmode') === "true" ? true : false;

      if (ionic.Platform.isIOS() || ionic.Platform.isAndroid()) {
        if (devmode) {
          return 'http://192.168.1.3:8000';
        } else {
          //return 'http://maukitest.cloudapp.net';
          return 'http://neapk-test01.japaneast.cloudapp.azure.com';
        }
      } else {
        if (devmode) {
          return '/mauki_dev';
        } else {
          return '/mauki';
        }
      }
    }
  }
}])
.factory('remotePKLocalStorage', ['$http', 'RESTServer', function($http, RESTServer) {
  var getServerURL = RESTServer.getURL;

  function downloadData(key) {
    return $http({
      method: 'GET',
      url: getServerURL() + '/storages/' + key + '/'
    });
  }

  function uploadData(key, data) {
    return $http({
      method: 'PATCH',
      url: getServerURL() + '/storages/' + key + '/',
      data: { value: JSON.stringify(data) }
    });
  }

  return {
    downloadData: downloadData,
    uploadData: uploadData
  };
}])
.factory('RemoteAPIService', ['$http', '$cordovaFileTransfer', '$q', 'RESTServer', 'PKLocalStorage', 'PostHelper', 'PKFileStorage', function($http, $cordovaFileTransfer, $q, RESTServer, PKLocalStorage, PostHelper, PKFileStorage){
  var getServerURL = RESTServer.getURL;
  var cachedUPAssigned = [];
  var cachedUPWaiting = [];
  var cacheKeys = ['all', 'uplaces', 'places', 'iplaces'];
  var cacheMngr = {
    uplaces: createCacheItem(),
    places: createCacheItem(),
    iplaces: createCacheItem()
  };
  var totalList = [];
  var totalSharedList = [];
  var totalSavedList = [];
  var returnedTotalList = [];
  var returnedSharedList = [];
  var returnedSavedList = [];
  var currentTail = 0;
  var currentSharedTail = 0;
  var currentSavedTail = 0;
  var currentOrderingType = '-modified';


  function createCacheItem() {
    return {
      items: [],
      endOfList: false,
      lastUpdated: 0,
      needToUpdate: true,
      totalCount: 0
    };
  }

  function resetCacheItem(item) {
    item.items = [];
    item.endOfList = false;
    item.lastUpdated = 0;
    item.needToUpdate = true;
    item.totalCount = 0;
  }

  function registerUser(force) {
    var deferred = $q.defer();
    var auth_user_token = '';

    PKFileStorage.init()
    .then(function() {
      auth_user_token = PKFileStorage.get('auth_user_token');
      if (auth_user_token && !force) {
        console.log('User Registration already successed: ' + auth_user_token);
        deferred.resolve(auth_user_token);
      } else {
        // 이경우에는 auth_vd_token도 새로 발급받아야 하므로, 혹시 남아있을 auth_vd_token 찌꺼기를 지워줘야 한다.
        PKFileStorage.remove('auth_vd_token');

        $http({
          method: 'POST',
          url: getServerURL() + '/users/register/'
        })
        .then(function(result) {
          console.log('User Registration successed: ' + result.data.auth_user_token);
          PKFileStorage.set('auth_user_token', result.data.auth_user_token);
          deferred.resolve(result.data.auth_user_token);
        }, function(err) {
          deferred.reject(err);
        });
      }
    }, function() {
      console.error('인증 데이터 로딩 중 문제가 발생하여, 더이상 앱을 이용할 수 없음');
      deferred.reject('Error in registerUser');
    });

    return deferred.promise;
  }

  function loginUser(token) {
    var deferred = $q.defer();
    $http({
      method: 'POST',
      url: getServerURL() + '/users/login/',
      data: JSON.stringify({ auth_user_token: token })
    })
    .then(function(result) {
      deferred.resolve(result.data.result);
    }, function(err) {
      deferred.reject(err);
    });
    return deferred.promise;
  }

  function logoutUser(step) {
    console.log('Login Step: ' + step);
    step = step || 0;
    if (step <= 2){
      PKFileStorage.remove('auth_user_token');
    }

    if (step <= 4) {
      PKFileStorage.remove('accountID');
      PKFileStorage.remove('auth_vd_token');
    }
  }

  function registerVD(accountID, force) {
    var deferred = $q.defer();
    var auth_vd_token = PKFileStorage.get('auth_vd_token');
    var email = accountID || PKFileStorage.get('accountID');
    console.info('registerVD email :' + email);

    if (auth_vd_token && !force) {
      console.log('VD Registration already successed: ' + auth_vd_token);
      deferred.resolve(auth_vd_token);
    } else {
      if (email === null || email === '') {
        deferred.reject('accountID info is Empty');
      } else {
        $http({
          method: 'POST',
          url: getServerURL() + '/vds/register/',
          data: JSON.stringify({ email: email, country:PKLocalStorage.get('country'), language:PKLocalStorage.get('lang'), timezone:'' })
        })
        .then(function(result) {
          console.log('VD Registration successed: ' + result.data.auth_vd_token);
          PKFileStorage.set('auth_vd_token', result.data.auth_vd_token);
          deferred.resolve(result.data.auth_vd_token);
        }, function(err) {
          deferred.reject(err);
        });
      }
    }
    return deferred.promise;
  }

  function loginVD(token) {
    var deferred = $q.defer();
    $http({
      method: 'POST',
      url: getServerURL() + '/vds/login/',
      data: JSON.stringify({ auth_vd_token: token })
    })
    .then(function(result) {
      console.log('VD Login successed: ' + result.data.auth_vd_token);
      PKFileStorage.set('auth_vd_token', result.data.auth_vd_token);
      deferred.resolve(result.data.auth_vd_token);
    }, function(err) {
      deferred.reject(err);
    });
    return deferred.promise;
  }

  function hasAccountID() {
    var accountID = PKFileStorage.get('accountID');
    return (accountID !== null);
  }

  function checkVerified() {
    var deferred = $q.defer();

    $http({
      method: 'GET',
      url: getServerURL() + '/rus/myself/'
    })
    .then(function(result) {
      console.log('RemoteAPIService.checkVerified', result);
      deferred.resolve(result.data);
    }, function(err) {
      console.error('RemoteAPIService.checkVerified', err);
      if (err.status === 404) {
        deferred.resolve(null);
      } else {
        deferred.reject(err);
      }
    });

    return deferred.promise;
  }

  function updateUserInfo(info) {
    var deferred = $q.defer();

    $http({
      method: 'PATCH',
      url: getServerURL() + '/rus/myself/',
      data: JSON.stringify(info)
    })
    .then(function(result) {
      console.log('updateUserInfo', result);
      deferred.resolve();
    }, function(err) {
      console.error('updateUserInfo', err);
      deferred.reject(err);
    });

    return deferred.promise;
  }

  function sendUserPost(sendObj){
    var deferred = $q.defer();
    $http({
      method: 'POST',
      url: getServerURL() + '/uplaces/',
      data: JSON.stringify({ add: JSON.stringify(sendObj) })
    })
    .then(function(result) {
      setAllNeedToUpdate();
      deferred.resolve(result);
    }, function(err) {
      console.error(err);
      deferred.reject(err);
    });
    return deferred.promise;
  }

  function deleteUserPostInCachedList(uplace_uuid) {
    for (var i = 0; i < totalList.length; i++) {
      if (totalList[i].uplace_uuid === uplace_uuid) {
        totalList.splice(i, 1);
      }
    }
    for (var i = 0; i < returnedTotalList.length; i++) {
      if (returnedTotalList[i].uplace_uuid === uplace_uuid) {
        returnedTotalList.splice(i, 1);
        currentTail--;
      }
    }
    for (var i = 0; i < totalSharedList.length; i++) {
      if (totalSharedList[i].uplace_uuid === uplace_uuid) {
        totalSharedList.splice(i, 1);
      }
    }
    for (var i = 0; i < returnedSharedList.length; i++) {
      if (returnedSharedList[i].uplace_uuid === uplace_uuid) {
        returnedSharedList.splice(i, 1);
        currentSharedTail--;
      }
    }
    for (var i = 0; i < totalSavedList.length; i++) {
      if (totalSavedList[i].uplace_uuid === uplace_uuid) {
        totalSavedList.splice(i, 1);
      }
    }
    for (var i = 0; i < returnedSavedList.length; i++) {
      if (returnedSavedList[i].uplace_uuid === uplace_uuid) {
        returnedSavedList.splice(i, 1);
        currentSavedTail--;
      }
    }
  }

  function deleteUserPost(uplace_uuid) {
    var deferred = $q.defer();
    var ret_uplace_uuid = uplace_uuid.split('.')[0];
    $http({
      method: 'DELETE',
      url: getServerURL() + '/uplaces/' + ret_uplace_uuid + '/'
    })
    .then(function(result) {
      var idOrganized = -1, idUnorganized = -1;
      for (var i = 0; i < cacheMngr.uplaces.items.length; i++) {
        if (PostHelper.isOrganized(cacheMngr.uplaces.items[i])) {
          idOrganized++;
        } else {
          idUnorganized++;
        }
        if (uplace_uuid === cacheMngr.uplaces.items[i].uplace_uuid) {
          if (PostHelper.isOrganized(cacheMngr.uplaces.items[i])) {
            cachedUPAssigned.splice(idOrganized, 1);
          } else {
            cachedUPWaiting.splice(idUnorganized, 1);
          }
          cacheMngr.uplaces.items.splice(i, 1);
        }
      }
      setAllNeedToUpdate();
      deleteUserPostInCachedList(uplace_uuid);
      deferred.resolve(result);
    }, function(err) {
      console.error(err);
      deferred.reject(err);
    });
    return deferred.promise;
  }

  function deleteContentInUserPost(delObj) {
    var deferred = $q.defer();
    $http({
      method: 'POST',
      url: getServerURL() + '/uplaces/',
      data: JSON.stringify({ remove: JSON.stringify(delObj) })
    })
    .then(function(result) {
      setAllNeedToUpdate();
      deferred.resolve(result);
    }, function(err) {
      console.dir(err);
      deferred.reject(err);
    });
    return deferred.promise;
  }

  function uploadImage(fileURI) {
    var deferred = $q.defer();

    // browser에서 개발하는 거 때문에 할수 없이 분기해서 처리..
    if (ionic.Platform.isIOS() || ionic.Platform.isAndroid()) {
      var options = {
        fileKey: 'file',
        httpMethod: 'POST'
      };
      $cordovaFileTransfer.upload(getServerURL() + '/rfs/', fileURI, options)
      .then(function(result) {
        // console.dir(result.response);
        var res;
        try {
          res = JSON.parse(result.response);
          deferred.resolve(res);
        } catch (e) {
          console.error(e.message);
          deferred.reject(e);
        }
      }, function(err) {
        console.error(err);
        deferred.reject(err);
      });
    } else {
      var fd = new FormData();
      fd.append('file', fileURI);
      $http.post(getServerURL() + '/rfs/', fd, {
        transformRequest: angular.identity,
        headers: { 'Content-Type': undefined }
      })
      .then(function(result) {
        //console.dir(result);
        deferred.resolve(result.data);
      }, function(err) {
        console.error(err);
        deferred.reject(err);
      })
      //deferred.resolve({uuid: '0DC200ED17A056ED448EF8E1C3952B94.img'});
    }
    return deferred.promise;
  }

  function resetCachedPosts(type) {
    type = type || 'all';

    if (cacheKeys.indexOf(type) === -1) {
      console.warn('resetCachedPosts : unknown cache key[' + type + ']');
      return;
    }

    if (type === 'all') {
      resetCacheItem(cacheMngr.uplaces);
      resetCacheItem(cacheMngr.iplaces);
      resetCacheItem(cacheMngr.places);
      cachedUPAssigned = [];
      cachedUPWaiting = [];
    } else if (type === 'uplaces') {
      cachedUPAssigned = [];
      cachedUPWaiting = [];
      resetCacheItem(cacheMngr.uplaces);
    } else if (type === 'places') {
      resetCacheItem(cacheMngr.places);
    } else if (type === 'iplaces'){
      resetCacheItem(cacheMngr.iplaces);
    }
  }

  function isEndOfList(filteringType) {
    if (filteringType === 'total') {
      return totalList.length === returnedTotalList.length;
    } else if (filteringType === 'shared') {
      return totalSharedList.length === returnedSharedList.length;
    } else if (filteringType === 'saved') {
      return totalSavedList.length === returnedSavedList.length;
    } else {
      return true;
    }
  }

  // function isEndOfList(key) {
  //   return cacheMngr[key].endOfList;
  // }

  function setAllNeedToUpdate() {
    for (var item in cacheMngr) {
      cacheMngr[item].needToUpdate = true;
    }
  }

  //  캐싱 로직은 세가지 요소 검사
  //  1. 현재 캐싱된 리스트가 비어 있는가?
  //  2. 마지막으로 업데이트 한 시간에서 1분이 지났는가?
  //  3. 업데이트 태그가 설정되어 있는가?
  function checkNeedToRefresh(key) {
    //  잠시 캐시 기능을 꺼보기로 함
    return true;

    if (cacheKeys.indexOf(key) === -1) {
      console.warn('등록되지 않은 키(' + key + ')로 업데이트 여부를 체크했음')
      return true;
    }
    if (cacheMngr[key].items.length === 0) {
      console.log(key + ' 업데이트 필요 : 리스트가 비어 있음');
      return true;
    }

    var timeNow = new Date().getTime();
    if (timeNow - cacheMngr[key].lastUpdated >= 60000) {
      console.log('업데이트 필요 : 너무 오래 업데이트를 안 했음');
      return true;
    }
    if (cacheMngr[key].needToUpdate) {
      console.log('업데이트 필요 : 업데이트 필요 태그가 세팅 됨');
      return true;
    }
    console.log('업데이트 필요 없음');
    // console.log('key : ' + key);
    // console.log('timeNow : ' + timeNow);
    // console.log('lastUpdated : ' + cacheMngr[key].lastUpdated);
    // console.log('needToUpdate : ' + cacheMngr[key].needToUpdate);
    return false;
  }

  function setRefreshCompleted(key) {
    cacheMngr[key].needToUpdate = false;
    cacheMngr[key].lastUpdated = new Date().getTime();
  }

  function updateCurPos(curPos) {
    if (cachedUPAssigned.length > 0) {
      PostHelper.updateDistance(cachedUPAssigned, curPos);
    }
    for (var item in cacheMngr) {
      if (cacheMngr[item].items.length > 0) {
        PostHelper.updateDistance(cacheMngr[item].items, curPos);
      }
    }
  }

  function getRegionsOfMine() {
    var deferred = $q.defer();

    $http({
      method: 'GET',
      url: getServerURL() + '/uplaces/regions/'
    })
    .then(function(response) {
      PostHelper.decorateRegions(response.data);
      deferred.resolve(response.data);
    }, function(err) {
      console.error(err);
      deferred.reject(err);
    })

    return deferred.promise;
  }

  function divideListByType() {
    var nickname = PKLocalStorage.get('nickname');

    totalSharedList = [];
    totalSavedList = [];
    //  저장한것, 공유한것 분별하기
    for (var i = 0; i < totalList.length; i++) {
      if (totalList[i].userPost && totalList[i].userPost.ru && totalList[i].userPost.ru.nickname) {
        if (totalList[i].userPost.ru.nickname === nickname) {
          totalSharedList.push(totalList[i]);
        } else {
          totalSavedList.push(totalList[i]);
        }
      }
    }
  }

  function appendUplacesToReturnedList(filteringType, reset) {
    var newTail;
    filteringType = filteringType || 'all';
    reset = reset || false;

    if (reset) {
      returnedTotalList = [];
      returnedSharedList = [];
      returnedSavedList = [];
      currentTail = 0;
      currentSharedTail = 0;
      currentSavedTail = 0;
    }

    if (filteringType === 'total' || filteringType === 'all') {
      newTail = Math.min(currentTail + 20, totalList.length);
      returnedTotalList = returnedTotalList.concat(totalList.slice(currentTail, newTail));
      currentTail = newTail;
    }
    if (filteringType === 'shared' || filteringType === 'all') {
      newTail = Math.min(currentSharedTail + 20, totalSharedList.length);
      returnedSharedList = returnedSharedList.concat(totalSharedList.slice(currentSharedTail, newTail));
      currentSharedTail = newTail;
    }
    if (filteringType === 'saved' || filteringType === 'all') {
      newTail = Math.min(currentSavedTail + 20, totalSavedList.length);
      returnedSavedList = returnedSavedList.concat(totalSavedList.slice(currentSavedTail, newTail));
      currentSavedTail = newTail;
    }
  }

  function getFullListOfUplaces() {
    var deferred = $q.defer();

    $http({
      method: 'GET',
      url: getServerURL() + '/uplaces/',
      params: {
        ru: 'myself',
        limit: 26,  //  설마 10만을 넘지는 않겠지..?
        offset: 0,
        order_by: '-modified'
      }
    })
    .then(function(response) {
      // console.dir(response.data.results);
      PostHelper.decoratePosts(response.data.results);
      totalList = response.data.results;

      //  저장한것, 공유한것 분별하기
      if (currentOrderingType === '-modified') {
        divideListByType();
        appendUplacesToReturnedList('all', true);
      } else {
        changeOrderingTypeOfUplaces({type:currentOrderingType});
      }

      console.log('uplaces', {total: totalList, shared : totalSharedList, saved: totalSavedList, totalCount: totalList.length});
      deferred.resolve();
    }, function(err) {
      deferred.reject(err);
    });

    return deferred.promise;
  }

  function getUplaces(position, filteringType) {
    console.info('getUplaces : ' + position);
    var deferred = $q.defer();
    var nickname = PKLocalStorage.get('nickname');
    position = position || 'top';

    //  아직 uplace 리스트를 얻어오지 않았다면 일단 얻고 시작
    if (totalList.length === 0 || position === 'top') {
      getFullListOfUplaces()
      .then(function() {
        deferred.resolve({total: returnedTotalList, shared : returnedSharedList, saved: returnedSavedList, totalCount: totalList.length});
      }, function(err) {
        console.error('getUplaces', err);
        deferred.reject(err);
      });
    } else {
      if (position === 'bottom') {
        var newTail = 0;
        if (filteringType === 'total') {
          if (currentTail === totalList.length) {
            deferred.reject('endOfList(total)');
          } else {
            appendUplacesToReturnedList(filteringType);
          }
        } else if (filteringType === 'shared') {
          if (currentSharedTail === totalSharedList.length) {
            deferred.reject('endOfList(shared)');
          } else {
            appendUplacesToReturnedList(filteringType);
          }
        } else if (filteringType === 'saved') {
          if (currentSavedTail === totalSavedList.length) {
            deferred.reject('endOfList(saved)');
          } else {
            appendUplacesToReturnedList(filteringType);
          }
        } else {
          deferred.reject('Wrong parameter(type)');
        }
        deferred.resolve({total: returnedTotalList, shared : returnedSharedList, saved: returnedSavedList, totalCount: totalList.length});
      } else {
        deferred.reject('Wrong parameter(position)');
      }
    }
    return deferred.promise;
  }

  function changeOrderingTypeOfUplaces(orderingOption) {
    console.debug('orderingOption', orderingOption);
    if (totalList.length === 0) {
      console.warn('리스트를 얻어오지 못한 상태에서 정렬 메소드가 호출되었음');
      return null;
    }

    if (orderingOption.type === '-modified') {
      currentOrderingType = orderingOption.type;
      totalList.sort(function(a, b) {
        return b.modified - a.modified;
      });
    } else if (orderingOption.type === 'placename') {
      currentOrderingType = orderingOption.type;
      totalList.sort(function(a, b) {
        if (a.name === '') {
          if (b.name === '') {
            return 0;
          } else {
            return 1;
          }
        } else {
          if (a.name === b.name) {
            return 0;
          } else if (a.name > b.name){
            return 1;
          } else {
            return -1;
          }
        }
      });
    } else if (orderingOption.type === 'distance_from_origin') {
      currentOrderingType = orderingOption.type;
      PostHelper.updateDistance(totalList, {longitude:orderingOption.lon, latitude:orderingOption.lat});
      totalList.sort(function(a, b) {
        return a.distance_from_origin - b.distance_from_origin;
      });
    } else {
      console.error('지원되지 않는 방식의 정렬을 시도했음');
      return null;
    }

    divideListByType();
    appendUplacesToReturnedList('all', true);
    return {total: returnedTotalList, shared : returnedSharedList, saved: returnedSavedList, totalCount: totalList.length};
  }

  function getPostsOfMine(position, orderBy, lon, lat, radius, maxLimit) {
    console.info('getPostsOfMine : ' + position);
    var deferred = $q.defer();
    var offset, limit;
    position = position || 'top';
    orderBy = orderBy || '-modified';
    // if (orderBy === '-modified' || orderBy === 'modified') {
    //   lon = null;
    //   lat = null;
    //   radius = 0;
    // } else {
      lon = lon || null;
      lat = lat || null;
      radius = radius || 0;
      maxLimit = maxLimit || 0;
    // }

    if (position === 'top') {
      offset = 0;
      limit = 20;
      resetCachedPosts('uplaces');
    } else if (position === 'bottom') {
      offset = cacheMngr.uplaces.items.length;
      limit = 20;

      if (cacheMngr.uplaces.endOfList) {
        console.log('리스트의 끝에 다달았기 때문에 바로 리턴.');
        deferred.reject('endOfList');
        return deferred.promise;
      } else {
        cacheMngr.uplaces.needToUpdate = true;  // 아래쪽에서 리스트를 추가하는 것은 항상 갱신을 시도해야 한다
      }
    } else {
      deferred.reject('Wrong parameter.');
      return deferred.promise;
    }

    if (checkNeedToRefresh('uplaces')) {
      console.debug('limit, offset, order_by, lon, lat, r', limit, offset, orderBy, lon, lat, radius);
      $http({
        method: 'GET',
        url: getServerURL() + '/uplaces/',
        params: {
          ru: 'myself',
          limit: limit,
          offset: offset,
          order_by: orderBy,
          lon: lon,
          lat: lat,
          r: radius
        }
      })
      .then(function(response) {
        console.dir(response.data.results);
        cacheMngr.uplaces.totalCount = response.data.count;
        PostHelper.decoratePosts(response.data.results);
        if (position === 'top') {
          var newElements = [];
          var found = false;
          for (var i = 0; i < response.data.results.length; i++) {
            found = false;
            for (var j = 0; j < cacheMngr.uplaces.items.length; j++) {
              // console.log(j);
              if (response.data.results[i].uplace_uuid === cacheMngr.uplaces.items[j].uplace_uuid) {
                found = true;
                break;
              }
            }
            if (!found) {
              newElements.push(response.data.results[i]);
            }
          }
          cacheMngr.uplaces.items = newElements.concat(cacheMngr.uplaces.items);
        } else {  //  position === 'bottom'
          if (response.data.results.length === 0) {
            cacheMngr.uplaces.endOfList = true;
          } else {
            cacheMngr.uplaces.items = cacheMngr.uplaces.items.concat(response.data.results);
          }
        }

        cachedUPAssigned = [];
        cachedUPWaiting = [];
        // PostHelper.decoratePosts(cacheMngr.uplaces.items);
        for (var i = 0; i < cacheMngr.uplaces.items.length; i++) {
          if (PostHelper.isOrganized(cacheMngr.uplaces.items[i])) {
            cachedUPAssigned.push(cacheMngr.uplaces.items[i]);
          } else {
            cachedUPWaiting.push(cacheMngr.uplaces.items[i]);
          }
        }
        deferred.resolve({total: cacheMngr.uplaces.items, assigned : cachedUPAssigned, waiting: cachedUPWaiting, totalCount: cacheMngr.uplaces.totalCount});
      }, function(err) {
        console.error(err);
        deferred.reject(err);
      })
      .finally(function() {
        setRefreshCompleted('uplaces');
      });
    } else {
      deferred.resolve({assigned : cachedUPAssigned, waiting: cachedUPWaiting, totalCount: cacheMngr.uplaces.totalCount});
    }

    return deferred.promise;
  }

  function getPostsWithPlace(lat, lon, radius) {
    console.log('lat: ' + lat + ', lon: ' + lon + ', radius: ' + radius);
    var deferred = $q.defer();

    //  위치에 따라 리스트를 불러오는 로직에 캐시를 적용하는게 좋을지는 좀 더 고민해봐야겠어서 일단 주석처리
    // if (checkNeedToRefresh('places')) {
      $http({
        method: 'GET',
        url: getServerURL() + '/uplaces/',
        params: {
          lon: lon,
          lat: lat,
          r: radius
        }
      })
      .then(function(response) {
        // console.dir(response);
        cacheMngr.places.items = [];
        cacheMngr.places.totalCount = response.data.count;
        for (var i = 0; i < response.data.results.length; i++){
          if (response.data.results[i].lonLat) {
            cacheMngr.places.items.push(response.data.results[i]);
          }
        }
        PostHelper.decoratePosts(cacheMngr.places.items);
        // console.dir(cacheMngr.places.items);
        deferred.resolve(cacheMngr.places.items);
      }, function(err) {
        console.error(err);
        deferred.reject(err);
      })
      .finally(function() {
        setRefreshCompleted('places');
      });
    // } else {
    //   deferred.resolve(cacheMngr.places.items);
    // }

    return deferred.promise;
  }

  function importUser(userEmail) {
    var deferred = $q.defer();
    $http({
      method: 'POST',
      url: getServerURL() + '/importers/',
      data: JSON.stringify({ guide: JSON.stringify({ type: 'user', email: userEmail })})
    })
    .then(function(result) {
      // console.dir(result);
      deferred.resolve(result);
    }, function(err) {
      console.error(err);
      deferred.reject(err);
    });
    return deferred.promise;
  }

  function importImage() {
    var deferred = $q.defer();
    $http({
      method: 'POST',
      url: getServerURL() + '/importers/',
      data: JSON.stringify({ guide: JSON.stringify({ type: 'images', vd: 'myself' })})
    })
    .then(function(result) {
      // console.dir(result);
      deferred.resolve(result);
    }, function(err) {
      console.error(err);
      deferred.reject(err);
    });
    return deferred.promise;
  }

  function getIplaces(position, lat, lon) {
    var deferred = $q.defer();
    var offset, limit;
    position = position || 'top';

    if (position === 'top') {
      offset = 0;
      limit = 20;
      resetCachedPosts('iplaces');
    } else if (position === 'bottom') {
      offset = cacheMngr.iplaces.items.length;
      limit = 20;

      if (cacheMngr.iplaces.endOfList) {
        console.log('리스트의 끝에 다달았기 때문에 바로 리턴.');
        deferred.reject('endOfList');
        return deferred.promise;
      } else {
        cacheMngr.iplaces.needToUpdate = true;  // 아래쪽에서 리스트를 추가하는 것은 항상 갱신을 시도해야 한다
      }
    } else {
      deferred.reject('Wrong parameter.');
      return deferred.promise;
    }

    if (checkNeedToRefresh('iplaces')) {
      $http({
        method: 'GET',
        url: getServerURL() + '/iplaces/',
        params: {
          ru: 'myself',
          limit: limit,
          offset: offset,
          lat: lat,
          lon: lon,
          r: 0
        }
      })
      .then(function(response) {
        // console.dir(response);
        cacheMngr.iplaces.totalCount = response.data.count;
        PostHelper.decoratePosts(response.data.results);
        if (position === 'top') {
          var newElements = [];
          var found = false;
          for (var i = 0; i < response.data.results.length; i++) {
            found = false;
            for (var j = 0; j < cacheMngr.iplaces.items.length; j++) {
              // console.log(j);
              if (response.data.results[i].iplace_uuid === cacheMngr.iplaces.items[j].iplace_uuid) {
                found = true;
                break;
              }
            }
            if (!found) {
              newElements.push(response.data.results[i]);
            }
          }
          cacheMngr.iplaces.items = newElements.concat(cacheMngr.iplaces.items);
        } else {  //  position === 'bottom'
          if (response.data.results.length === 0) {
            cacheMngr.iplaces.endOfList = true;
          } else {
            cacheMngr.iplaces.items = cacheMngr.iplaces.items.concat(response.data.results);
          }
        }

        deferred.resolve({ iplaces: cacheMngr.iplaces.items, totalCount: cacheMngr.iplaces.totalCount });
      }, function(err) {
        console.error(err);
        deferred.reject(err);
      })
      .finally(function() {
        setRefreshCompleted('iplaces');
      });
    } else {
      deferred.resolve({iplaces : cacheMngr.iplaces.items, totalCount: cacheMngr.iplaces.totalCount });
    }

    return deferred.promise;
  }

  function takeIplace(iplace_uuid) {
    var deferred = $q.defer();
    var ret_uplace_uuid = iplace_uuid.split('.')[0];
    console.log('ret_uplace_uuid : ' + ret_uplace_uuid);
    $http({
      method: 'POST',
      url: getServerURL() + '/iplaces/' + ret_uplace_uuid + '/take/'
    })
    .then(function(response) {
      // console.dir(response);
      for (var i = 0; i < cacheMngr.iplaces.items.length; i++) {
        if (cacheMngr.iplaces.items[i].iplace_uuid === iplace_uuid) {
          cacheMngr.iplaces.items.splice(i, 1);
          cacheMngr.iplaces.totalCount--;
        }
      }
      deferred.resolve({ iplaces: cacheMngr.iplaces.items, totalCount: cacheMngr.iplaces.totalCount });
    }, function(err) {
      console.error(err);
      deferred.reject(err);
    });

    return deferred.promise;
  }

  function dropIplace(iplace_uuid) {
    var deferred = $q.defer();
    var ret_uplace_uuid = iplace_uuid.split('.')[0];
    console.log('ret_uplace_uuid : ' + ret_uplace_uuid);
    $http({
      method: 'POST',
      url: getServerURL() + '/iplaces/' + ret_uplace_uuid + '/drop/'
    })
    .then(function(response) {
      // console.dir(response);
      for (var i = 0; i < cacheMngr.iplaces.items.length; i++) {
        if (cacheMngr.iplaces.items[i].iplace_uuid === iplace_uuid) {
          cacheMngr.iplaces.items.splice(i, 1);
          cacheMngr.iplaces.totalCount--;
        }
      }
      deferred.resolve({ iplaces: cacheMngr.iplaces.items, totalCount: cacheMngr.iplaces.totalCount });
    }, function(err) {
      console.error(err);
      deferred.reject(err);
    });

    return deferred.promise;
  }

  function getPost(uplace_uuid) {
    var deferred = $q.defer();
    var foundPost = null;
    var ret_uplace_uuid = uplace_uuid.split('.')[0];

    // 직접 질의
    $http({
      method: 'GET',
      url: getServerURL() + '/uplaces/' + ret_uplace_uuid + '/'
    })
    .then(function(response) {
      // console.dir(response.data);
      PostHelper.decoratePost(response.data);
      deferred.resolve(response.data);
    }, function(err) {
      console.error(err);
      deferred.reject(err);
    });

    return deferred.promise;
  }

  function getShortenURL(uplace_uuid) {
    //  http://neapk-test01.japaneast.cloudapp.azure.com/uplaces/00000154DCF3D3CE00000000008AFAE5/shorten_url/

    var deferred = $q.defer();

    console.log('GET request to ' + getServerURL() + '/uplaces/' + uplace_uuid + '/shorten_url/');
    uplace_uuid = uplace_uuid.replace('.uplace', '');
    $http({
      method: 'GET',
      url: getServerURL() + '/uplaces/' + uplace_uuid + '/shorten_url/'
    })
    .then(function(response) {
      // console.dir(response);
      deferred.resolve(response.data.shorten_url);
    }, function(err) {
      console.error(err);
      deferred.reject(err);
    });

    return deferred.promise;
  }

  return {
    registerUser: registerUser,
    loginUser: loginUser,
    logoutUser: logoutUser,
    registerVD: registerVD,
    loginVD: loginVD,
    hasAccountID: hasAccountID,
    checkVerified: checkVerified,
    updateUserInfo: updateUserInfo,
    sendUserPost: sendUserPost,
    deleteUserPost: deleteUserPost,
    deleteContentInUserPost: deleteContentInUserPost,
    uploadImage: uploadImage,
    getRegionsOfMine: getRegionsOfMine,
    getPostsOfMine: getPostsOfMine,
    getPostsWithPlace: getPostsWithPlace,
    getPost: getPost,
    updateCurPos: updateCurPos,
    resetCachedPosts: resetCachedPosts,
    isEndOfList: isEndOfList,
    importUser: importUser,
    importImage: importImage,
    getIplaces: getIplaces,
    takeIplace: takeIplace,
    dropIplace: dropIplace,
    getShortenURL: getShortenURL,
    getUplaces: getUplaces,
    changeOrderingTypeOfUplaces: changeOrderingTypeOfUplaces
  }
}])
.factory('PostHelper', ['RESTServer', 'PKLocalStorage', 'MapService', function(RESTServer, PKLocalStorage, MapService) {
  function getTags(post) {
    if (!post.userPost || !post.userPost.notes || post.userPost.notes.length === 0) {
      return [];
    }

    return getTagsWithContent(post.userPost.notes);
  }

  function getTagsWithContent(notes) {
    var words = [];
    var output = [];
    var subTags = [];
    for (var i = 0; i < notes.length; i++) {
      if (notes[i].content.indexOf('[NOTE_TAGS]') === -1) {
        words = notes[i].content.split(/\s+/);
        for (var j = 0; j < words.length; j++) {
          //  !!! 이거 열라 중요함! iOS 9.0 이상을 제외한 현재의 모바일 브라우저는 string.prototype.startsWith를 지원안함!
          //  덕분에 안드로이드에서는 태그가 작동안하던 버그가 있었음.
          if (words[j].charAt(0) === '#') {
            output.push(words[j].substring(1));
          }
        }
      } else {
        try{
          console.log(notes[i].content);
          subTags = JSON.parse(notes[i].content.split('#')[1]);
          output = output.concat(subTags);
        } catch (e) {
          console.error(e.message);
        }
      }
    }
    return output;
  }

  function getDescFromUserNote(post) {
    if (!post.userPost || !post.userPost.notes || post.userPost.notes.length == 0 || post.userPost.notes[0].content === '') {
      return '';
    }

    return getUserNoteByContent(post.userPost.notes);
  }

  function getUserNoteByContent(notes) {
    for (var i = 0; i < notes.length; i++) {
      if (notes[i].content.indexOf('[NOTE_TAGS]') === -1) {
        if (notes[i].content !== '') {
          return notes[i].content;
        }
      }
    }

    return '';
  }

  function getThumbnailURLByFirstImage(post) {
    if (!post.userPost || !post.userPost.images || post.userPost.images.length == 0) {
      if (!post.placePost || !post.placePost.images || post.placePost.images.length == 0) {
        return 'img/icon/404.png';
      } else {
        return getImageURL(post.placePost.images[0].summary);
      }
    } else {
      return getImageURL(post.userPost.images[0].summary);
    }
  }

  function getImageURL(content) {
    if (content === undefined || !content || content === '') {
      return 'img/icon/404.png';
    }

    if (content.indexOf('http://') !== 0) {
      return RESTServer.getURL() + '/' + content;
    }

    return content;
  }

  function getPlaceName(post) {
    // 장소의 이름은 공식 포스트의 이.content름을 우선한다.
    if (post.placePost && post.placePost.name && post.placePost.name.content !== '') {
      return post.placePost.name.content;
    } else if (post.userPost && post.userPost.name && post.userPost.name.content !== ''){
      return post.userPost.name.content;
    } else {
      return '';
    }
  }

  function getAddress(post) {
    // 주소는 공식 포스트의 주소를 우선한다.
    var addr = '';
    if (post.placePost) {
      if (post.placePost.addr1 && post.placePost.addr1.content !== '') {
        addr = post.placePost.addr1.content;
      }
      if (post.placePost.addr2 && post.placePost.addr2.content !== '') {
        if (addr.length === 0) {
          addr = post.placePost.addr2.content;
        } else {
          addr += ', ' + post.placePost.addr2.content;
        }
      }
      if (post.placePost.addr3 && post.placePost.addr3.content !== '') {
        if (addr.length === 0) {
          addr = post.placePost.addr3.content;
        } else {
          addr += ', ' + post.placePost.addr3.content;
        }
      }
    } else if (post.userPost) {
      if (post.userPost.addr1 && post.userPost.addr1.content !== '') {
        addr = post.userPost.addr1.content;
      }
      if (post.userPost.addr2 && post.userPost.addr2.content !== '') {
        if (addr.length === 0) {
          addr = post.userPost.addr2.content;
        } else {
          addr += ', ' + post.userPost.addr2.content;
        }
      }
      if (post.userPost.addr3 && post.userPost.addr3.content !== '') {
        if (addr.length === 0) {
          addr = post.userPost.addr3.content;
        } else {
          addr += ', ' + post.userPost.addr3.content;
        }
      }
    }

    return addr;
  }

  function getAddresses(post) {
    // 주소는 공식 포스트의 주소를 우선한다.
    var addrs = [];
    if (post.placePost) {
      if (post.placePost.addr1 && post.placePost.addr1.content !== '') {
        addrs.push(post.placePost.addr1.content);
      }
      if (post.placePost.addr2 && post.placePost.addr2.content !== '') {
        addrs.push(post.placePost.addr2.content);
      }
      if (post.placePost.addr3 && post.placePost.addr3.content !== '') {
        addrs.push(post.placePost.addr3.content);
      }
    } else if (post.userPost) {
      if (post.userPost.addr1 && post.userPost.addr1.content !== '') {
        addrs.push(post.userPost.addr1.content);
      }
      if (post.userPost.addr2 && post.userPost.addr2.content !== '') {
        addrs.push(post.userPost.addr2.content);
      }
      if (post.userPost.addr3 && post.userPost.addr3.content !== '') {
        addrs.push(post.userPost.addr3.content);
      }
    }

    return addrs;
  }

  function getShortenAddress(addr) {
    var a = addr.split(' ');
    var city = '';
    var startIndex = 0;
    if (a[0].indexOf('경기') !== -1 || a[0].indexOf('강원') !== -1 || a[0].indexOf('충북') !== -1 || a[0].indexOf('충남') !== -1 || a[0].indexOf('전북') !== -1 || a[0].indexOf('전남') !== -1 || a[0].indexOf('경북') !== -1 || a[0].indexOf('경남') !== -1) {
      city = a[1];
      startIndex = 1;
    } else {
      city = a[0].replace('특별시', '').replace('광역시', '');
      startIndex = 0;
    }
    // console.log(a[startIndex + 2], a[startIndex]);
    return a[startIndex + 2] + '.' + city;
  }

  function getPhoneNo(post) {
    // 전화번호는 공식 포스트의 전화번호를 우선한다.
    if (post.placePost && post.placePost.phone && post.placePost.phone.content !== '') {
      return post.placePost.phone.content;
    } else if (post.userPost && post.userPost.phone && post.userPost.phone.content !== '') {
      return post.userPost.phone.content;
    } else {
      return '';
    }
  }

  function isOrganized(post) {
    //  placePost가 NULL이 아니면 장소화 된 것으로 간주할 수있음
    return (post.place_id !== null);
  }

  function getTimeString(timestamp) {
    var timegap = (Date.now() - timestamp) / 1000;
    //console.info('timegap : ' + timegap);
    if (timegap < 3600) {
      var min = parseInt(timegap / 60);
      if (min === 0) {
        return '방금';
      } else {
        return parseInt(timegap / 60) + '분전';
      }
    } else if (timegap < 24 * 3600) {
      return parseInt(timegap / 3600) + '시간전';
    } else if (timegap < 7 * 24 * 3600){
      return parseInt(timegap / 86400) + '일전';
    } else {
      return new Date(timestamp).toLocaleDateString();
    }
    // return new Date(timestamp).toLocaleDateString();
  }

  function calcDistance(lat1, lon1, lat2, lon2)
	{
    function deg2rad(deg) {
  	  return (deg * Math.PI / 180);
  	}
  	function rad2deg(rad) {
  	  return (rad * 180 / Math.PI);
  	}

	  var theta = lon1 - lon2;
	  var dist = Math.sin(deg2rad(lat1)) * Math.sin(deg2rad(lat2)) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.cos(deg2rad(theta));
	  dist = Math.acos(dist);
	  dist = rad2deg(dist);
	  dist = dist * 60 * 1.1515;
	  dist = dist * 1.609344;
	  // var result = Number(dist*1000).toFixed(0);
    // if (result < 1000) {
    //   return result + 'm';
    // } else {
    //   return Number(result/1000.0).toFixed(1) + 'km';
    // }
    return Number(dist*1000).toFixed(0);
	}

  function getDistance(post, curPos) {
    if (post.lonLat && curPos) {
      return calcDistance(curPos.latitude, curPos.longitude, post.lonLat.lat, post.lonLat.lon);
    } else {
      return null;
    }
  }

  function makeFullUrlImg(post) {
    if (post.placePost && post.placePost.images) {
      for (var i = 0; i < post.placePost.images.length; i++){
        if (post.placePost.images[i].content.indexOf('http') !== 0) {
          post.placePost.images[i].content = 'http://placekoob.com' + post.placePost.images[i].content;
        }
        if (post.placePost.images[i].summary.indexOf('http') !== 0) {
          post.placePost.images[i].summary = 'http://placekoob.com' + post.placePost.images[i].summary;
        }
      }
    }

    if (post.userPost && post.userPost.images) {
      for (var i = 0; i < post.userPost.images.length; i++){
        if (post.userPost.images[i].content.indexOf('http') !== 0) {
          post.userPost.images[i].content = 'http://placekoob.com' + post.userPost.images[i].content;
        }
        if (post.userPost.images[i].summary.indexOf('http') !== 0) {
          post.userPost.images[i].summary = 'http://placekoob.com' + post.userPost.images[i].summary;
        }
      }
    }
  }

  //  ng-repeat안에서 함수가 호출되는 것을 최대한 방지하기 위해, 로딩된 포스트의 썸네일 URL, 전화번호, 주소, 태그 등을
  //  계산해서 속성으로 담아둔다.
  function decoratePost(post) {
    var curPos = PKLocalStorage.get('curPos');
    post.name = getPlaceName(post);
    post.thumbnailURL = getThumbnailURLByFirstImage(post);
    post.datetime = getTimeString(post.modified);
    // post.address = getAddress(post);
    post.addrs = getAddresses(post);
    post.address = post.addrs.length > 0 ? getShortenAddress(post.addrs[0]) : '위치 정보 없음';
    post.desc = getDescFromUserNote(post);
    post.phoneNo = getPhoneNo(post);
    if (post.userPost && !post.userPost.tags) {
      post.userPost.tags = [];
    }
    post.visited = (post.userPost && post.userPost.visit)? post.userPost.visit.content : false;
    if (post.visited === false) {
      if (post.userPost.rating && parseInt(post.userPost.rating.content) > 0) {
        post.visited = true;
      }
    }
    //  서버로부터 받은 distance_from_origin은 질의때 보낸 좌표를 기준으로 한 거리이기 때문에
    //  현재 위치를 기준으로 다시 계산해야 한다.
    //post.distance_from_origin = getDistance(post, curPos);
    makeFullUrlImg(post);
  }

  function decoratePosts(posts) {
    for (var i = 0; i < posts.length; i++) {
      decoratePost(posts[i]);
    }
  }

  function convertRadiusToString(r) {
    if (r < 1000) {
      return '주변';
    } else {
      return '주변 ' + ((r + (1000 - r % 1000)) / 1000) + 'km';
    }
  }

  function convertRegionToString(region) {
    MapService.getCurrentAddress(region.lonLat.lat, region.lonLat.lon, false)
    .then(function(addr) {
      // region.name
      // console.dir(addr);
      var a = addr.region.split(' ');
      var city = '';
      if (a[0].indexOf('경기') !== -1 || a[0].indexOf('강원') !== -1 || a[0].indexOf('충북') !== -1 || a[0].indexOf('충남') !== -1 || a[0].indexOf('전북') !== -1 || a[0].indexOf('전남') !== -1 || a[0].indexOf('경북') !== -1 || a[0].indexOf('경남') !== -1) {
        city = a[1];
      } else {
        city = a[0];
      }
      region.name = a[a.length - 1] + '(' + city + ')';
    }, function(err) {
      console.error(JSON.stringify(err));
    });
  }

  function decorateRegion(region) {
    region.radiusName = convertRadiusToString(region.radius);
    convertRegionToString(region);
  }

  function decorateRegions(regions) {
    for (var i = 0; i < regions.length; i++) {
      decorateRegion(regions[i]);
    }
  }

  function updateDistance(posts, curPos) {
    for (var i = 0; i < posts.length; i++) {
      posts[i].distance_from_origin = getDistance(posts[i], curPos);
    }
  }

  function getReadablePhoneNo(phoneNo) {
    if (typeof phoneNo === 'string') {
      phoneNo = '0' + phoneNo.replace('+82', '');
      return phoneNo.replace(/(^02.{0}|^01.{1}|[0-9]{3})([0-9]+)([0-9]{4})/,"$1-$2-$3");
    } else {
      return null;
    }
  }

  return {
    getTagsWithContent: getTagsWithContent,
    getImageURL: getImageURL,
    isOrganized: isOrganized,
    getTimeString: getTimeString,
    decoratePost: decoratePost,
    decoratePosts: decoratePosts,
    decorateRegion: decorateRegion,
    decorateRegions: decorateRegions,
    updateDistance: updateDistance,
    calcDistance: calcDistance,
    getReadablePhoneNo: getReadablePhoneNo
  }
}])
.factory('ogParserService', ['$http', '$q', function($http, $q) {

  function getHead(doc) {
    var headStart = '<head';
    var headEnd = '</head>';
    var start = doc.indexOf(headStart);
    var end = doc.indexOf(headEnd);

    if (start === -1) {
      console.error('cannot find <head> in document.');
      return '';
    } else {
      // start += 6;
      // console.log('start point : ' + start);
    }
    if (end === -1) {
      console.error('cannot find </head> in document.');
      return '';
    } else {
      end += headEnd.length;
      // console.log('end point : ' + end);
    }
    return doc.slice(start, end);
  }

  function getOGContent(head, property) {
    var start = head.indexOf(property);
    var content = 'content=';
    var end = 0;
    if (start === -1) {
      console.warn('cannot find ' + property + '.');
      return '';
    } else {
      // console.log('start index of ' + property + ' : ' + start);
      start = head.indexOf(content, start);
      if (start === -1) {
        console.warn('cannot find content in ' + property);
        return '';
      } else {
        start += content.length + 1;
        // console.log('This web-doc uses ' + head.charAt(start));
        if (head.charAt(start - 1) === '"') {
          end = head.indexOf('"', start);
        } else {
          end = head.indexOf('\'', start);
        }

        if (end === -1) {
          console.warn('cannot find another "(or \') in content in ' + property);
          return '';
        } else {
          // console.log('end index of ' + property + ' : ' + end);
          return head.slice(start, end);
        }
      }
    }
  }

  function convertToSaveURL(url) {
    if (ionic.Platform.isIOS() || ionic.Platform.isAndroid()) {
      //  http://blog.naver.com/PostView.nhn?blogId=hyeyooncheon&logNo=220534224926&redirect=Dlog&widgetTypeCall=true
      //  http://m.blog.naver.com/PostView.nhn?blogId=hyeyooncheon&logNo=220534224926

      //  네이버 블로그의 경우 모바일에서 접근할 때 리다이렉션을 위한 자바스크립트만 내려주고, 다시 이동시키기 때문에
      //  아예 이동될 페이지의 URL로 고쳐서 직접 접근하도록 한다.
      if (url.indexOf('http://blog.naver.com') !== -1) {
        return url.replace('&redirect=Dlog', '').replace('&widgetTypeCall=true', '').replace('blog.naver.com', 'm.blog.naver.com');
      } else {
        return url;
      }
    } else {
      if (url.indexOf('place.kakao.com') !== -1) {
        return url.replace('https://place.kakao.com', '/kplaces');
      } else if (url.indexOf('http://blog.naver.com') !== -1) {
        if (url.indexOf('PostView.nhn') !== -1) {
          return url.replace('http://blog.naver.com', '/nblog');
        } else if (/http:\/\/blog.naver.com\/[a-z]+\/[1-9][0-9]+/.exec(url).length === 1){
          var params = url.replace('http://blog.naver.com/', '').split('/');
          return '/nblog/PostView.nhn?blogId=' + params[0] + '&logNo=' + params[1];
        } else {
          return '';
        }
      } else if (url.indexOf('http://m.blog.naver.com') !== -1) {
        return url.replace('http://m.blog.naver.com', '/nmblog');
      } else if (url.indexOf('http://www.mangoplate.com') !== -1) {
        return url.replace('https://www.mangoplate.com', '/mplate');
      } else if (url.indexOf('http://map.naver.com') !== -1) {
        return url.replace('http://map.naver.com', '/nmap');
      } else {
        return '';
      }
    }
  }

  function getOGInfo(url) {
    var deferred = $q.defer();
    var ogInfo = {};
    var convertedURL = '';

    convertedURL = convertToSaveURL(url);
    console.log('Original URL : ' + url);
    console.log('Converted URL : ' + convertedURL);
    if (convertedURL === '') {
      console.warn('not supported URL pattern.');
      ogInfo.title = '브라우저에서 지원하지 않는 URL';
      ogInfo.image = '/img/icon/404.png';
      ogInfo.siteName = 'Placekoop Error';
      ogInfo.url = '';
      ogInfo.desc = '폰에서도 이러면 진짜 에러임';

      // console.dir(ogInfo);

      deferred.resolve(ogInfo);
    } else {
      $http({
        method: 'GET',
        url: convertedURL
      })
      .then(function(response) {
        // console.dir(response);
        var head = getHead(response.data);
        // console.log(head);
        if (head === '') {
          console.error('does not exist <head>...</head>');
          deferred.reject('does not exist <head>...</head>');
          return;
        } else {
          ogInfo.title = getOGContent(head, 'og:title');
          ogInfo.image = getOGContent(head, 'og:image');
          ogInfo.siteName = getOGContent(head, 'og:site_name');
          ogInfo.url = getOGContent(head, 'og:url') || url;
          ogInfo.desc = getOGContent(head, 'og:description');

          console.dir(ogInfo);

          deferred.resolve(ogInfo);
        }
      }, function(err) {
        console.error(err);
        deferred.reject(err);
      });
    }

    return deferred.promise;
  }

  return {
    getOGInfo: getOGInfo
  }
}])
.factory('daumSearchService', ['$q', '$http', function($q, $http) {
  function convertToSaveURL(url) {
    if (ionic.Platform.isIOS() || ionic.Platform.isAndroid()) {
      return url;
    } else {
      return url.replace('https://apis.daum.net', '/daum');
    }
  }

  function search(keyword) {
    var deferred = $q.defer();

    $http({
      method: 'GET',
      url: convertToSaveURL('https://apis.daum.net/search/blog?apikey=f4e2c3f6c532baf54ec80e81f08fc1a1&q=' + keyword + '&output=json')
    })
    .then(function(response) {
      // console.dir(response.data);
      deferred.resolve(response.data.channel.item);
    }, function(err) {
      console.error(err);
      deferred.reject(err);
    });

    return deferred.promise;
  }

  return {
    search: search
  };
}])
.factory('oauthKakao', ['$q', '$http', '$cordovaOauthUtility', function($q, $http, $cordovaOauthUtility) {
  return {
    signin : function(clientId, appScope, options) {
      var deferred = $q.defer();
      if(window.cordova) {
        if($cordovaOauthUtility.isInAppBrowserInstalled()) {
          var redirect_uri = 'http://localhost/callback';
          if(options !== undefined) {
            if(options.hasOwnProperty('redirect_uri')) {
              redirect_uri = options.redirect_uri;
            }
          }
          var browserRef = window.cordova.InAppBrowser.open('https://kauth.kakao.com/oauth/authorize?client_id=' + clientId + '&redirect_uri=' + redirect_uri + '&response_type=code', '_blank', 'location=no,clearsessioncache=yes,clearcache=yes');
          browserRef.addEventListener('loadstart', function(event) {
            if((event.url).indexOf(redirect_uri) === 0) {
              console.log('oauthKakao loadstart', event);
              browserRef.removeEventListener('exit',function(event){});
              //browserRef.close();
              var responseParameters = (event.url).split('?')[1].split('&');
              var parameterMap = [];
              for(var i = 0; i < responseParameters.length; i++) {
                parameterMap[responseParameters[i].split('=')[0]] = responseParameters[i].split('=')[1];
              }
              if(parameterMap.code !== undefined && parameterMap.code !== null) {
                $http({
                  method: 'POST',
                  url: 'https://kauth.kakao.com/oauth/token',
                  params: {
                    grant_type: 'authorization_code',
                    client_id: clientId,
                    redirect_uri: redirect_uri,
                    code: parameterMap.code
                  }
                })
                .then(function(response) {
                  console.log('oauthKakao token response', response);
                  deferred.resolve({ access_token: response.data.access_token, token_type: response.data.token_type, expires_in: response.data.expires_in, refresh_token: response.data.refresh_token });
                }, function(err) {
                  console.error('oauthKakao token error', err);
                  deferred.reject('Problem in getting token.');
                })
                .finally(function() {
                  browserRef.close();
                });
              } else {
                deferred.reject('Problem authenticating');
              }
            }
          });
          browserRef.addEventListener('exit', function(event) {
            deferred.reject('The sign in flow was canceled');
          });
        } else {
          deferred.reject('Could not find InAppBrowser plugin');
        }
      } else {
        deferred.reject('Cannot authenticate via a web browser');
      }
      return deferred.promise;
    }
  }
}]);
