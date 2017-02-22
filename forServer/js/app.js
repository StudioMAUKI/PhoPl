angular.module('phopl', ['ionic'])
      .run(function($ionicPlatform, $window, $state, $ionicHistory, $rootScope) {
        console.log("run()");
      })

      .factory('DOMHelper', [function() {
        function getImageHeight(elem, cols, padding) {
          cols = cols || 3;
          padding = (padding === null) ? 5 : padding;

          if (!elem) {
            return 0;
          }

          var elems = document.getElementsByClassName(elem);
          console.log('elems[' + elem + '].length : ' + elems.length);
          for (var i = 0; i < elems.length; i++) {
            console.log('elems[' + elem + '].clientWidth : ' + elems[i].clientWidth);
            if (elems[i].clientWidth) {
              return parseInt((elems[i].clientWidth - (cols + 1) * padding) / cols);
            }
          }
          return 0;
        }

        return {
          getImageHeight: getImageHeight
        }
      }])

      .controller('albumCtrl', function($scope, $q, $ionicPlatform, $ionicPopup, $ionicModal, $ionicSlideBoxDelegate, $ionicScrollDelegate, $ionicPopover, $ionicHistory, DOMHelper) {
        console.log("albumCtrl()");

        //서버에서 넣어주시면 됩니다. 

        //공유하기 URL 주소
        $scope.shareData = {
            url : 'http://itbox.kr',
            desc : '공유설명',
            image : 'http://itbox.kr/images/portfolio/homedeco_logo.png'
        };
        
        //프로필 정보 
        $scope.uplace_uuid = '121212'; //UUID 
        $scope.uplace_name = "장소이름";
        $scope.profileImg = 'http://image.chosun.com/sitedata/image/201312/13/2013121302159_0.jpg';
        $scope.nickname = '홍길동'; 
        
        //post.datetime과 장소정보를 합쳐서 텍스트로 표시함 
        $scope.description = '님이 2017년 2월 12일에 공유한 사진과 장소입니다.'; //장소없을시 장소정보 빼야함 
        

        //노트 
        $scope.notes = [
          { content:'노트 내용은 여기에 노트 내용은 여기에 노트 내용은 여기에 길어도 날짜와 안겹치게 ', datetime:'3일전'},
          { content:'노트 내용2는 여기에 노트 내용은 여기에 노트 내용은 여기에 노트 내용은 여기에 길어도 날짜와 안겹치게노트 내용은 여기에 노트 내용은 여기에 노트 내용은 여기에 길어도 날짜와 안겹치게노트 내용은 여기에 노트 내용은 여기에 노트 내용은 여기에 길어도 날짜와 안겹치게', datetime:'7일전'},
        ]

          
        //포스트 정보 
        $scope.post = {
           //datetime:'1일전',  //사용안함 
           name:'포스트이름',
           lonLat:{lat:37.56987,lon:127.000233}, //좌표 
           addrs:['주소값1', '주소값2', '주소값3'],
           userPost:{
             tags:[
               { content:'태그내용' },
               { content:'태그내용' },
               { content:'태그내용' },
               { content:'태그내용' }
               ]
           }
        }

        //이미지 
        $scope.attachedImages = [
          {summary: 'http://image.chosun.com/sitedata/image/201312/13/2013121302159_0.jpg',
           content: 'http://image.chosun.com/sitedata/image/201312/13/2013121302159_0.jpg'},
          {summary: 'http://cfile227.uf.daum.net/image/192ABF3350BC88EB224FF9',
          content: 'http://cfile227.uf.daum.net/image/192ABF3350BC88EB224FF9'},
          {summary:'http://pds25.egloos.com/pds/201207/23/96/e0063996_500c1d8f0a41d.jpg',
          content: 'http://pds25.egloos.com/pds/201207/23/96/e0063996_500c1d8f0a41d.jpg'},
          {summary: 'http://cfile28.uf.tistory.com/image/240FD148543CB20803D582',
          content: 'http://cfile28.uf.tistory.com/image/240FD148543CB20803D582' },
          {summary: 'http://cfile2.uf.tistory.com/image/2551564D54CC3B5128C971',
          content: 'http://cfile2.uf.tistory.com/image/2551564D54CC3B5128C971'}, 
          {summary: 'http://image.chosun.com/sitedata/image/201312/13/2013121302159_0.jpg',
           content: 'http://image.chosun.com/sitedata/image/201312/13/2013121302159_0.jpg'},
          {summary: 'http://cfile227.uf.daum.net/image/192ABF3350BC88EB224FF9',
          content: 'http://cfile227.uf.daum.net/image/192ABF3350BC88EB224FF9'},
          {summary:'http://pds25.egloos.com/pds/201207/23/96/e0063996_500c1d8f0a41d.jpg',
          content: 'http://pds25.egloos.com/pds/201207/23/96/e0063996_500c1d8f0a41d.jpg'},
          {summary: 'http://cfile28.uf.tistory.com/image/240FD148543CB20803D582',
          content: 'http://cfile28.uf.tistory.com/image/240FD148543CB20803D582' },
          {summary: 'http://cfile2.uf.tistory.com/image/2551564D54CC3B5128C971',
          content: 'http://cfile2.uf.tistory.com/image/2551564D54CC3B5128C971'}, 
          {summary: 'http://image.chosun.com/sitedata/image/201312/13/2013121302159_0.jpg',
           content: 'http://image.chosun.com/sitedata/image/201312/13/2013121302159_0.jpg'},
          {summary: 'http://cfile227.uf.daum.net/image/192ABF3350BC88EB224FF9',
          content: 'http://cfile227.uf.daum.net/image/192ABF3350BC88EB224FF9'},
          {summary:'http://pds25.egloos.com/pds/201207/23/96/e0063996_500c1d8f0a41d.jpg',
          content: 'http://pds25.egloos.com/pds/201207/23/96/e0063996_500c1d8f0a41d.jpg'},
          {summary: 'http://cfile28.uf.tistory.com/image/240FD148543CB20803D582',
          content: 'http://cfile28.uf.tistory.com/image/240FD148543CB20803D582' },
          {summary: 'http://cfile2.uf.tistory.com/image/2551564D54CC3B5128C971',
          content: 'http://cfile2.uf.tistory.com/image/2551564D54CC3B5128C971'}, 
        ];

        //관련정보
        $scope.searchResults = [
          {title:'치킨엔맥쥬', author:'치맥', description:'치킨은진리', link:'http://naver.com'},
          {title:'한방통닭', author:'통닭', description:'통닭은반반', link:'http://www.daum.net'}
        ]
        //서버에서 넣어주시면 됩니다. @
  
       var result = this; 
      
      $scope.showAll = false;
      $scope.zoomMin = 1;
      $scope.calculatedHeight = DOMHelper.getImageHeight('view-container', 3, 5);
 
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
        getDaumResult();
        if (RemoteAPIService.isTakenPlace($scope.post.uplace_uuid)) {
          $scope.canTakeToMyList = false;
        } else {
          $scope.canTakeToMyList = true;
        }
      });



      //////////////////////////////////////////////////////////////////////////////
  //  Private Methods
  //////////////////////////////////////////////////////////////////////////////
   
   function save(uplace_uuid, nickname) { 
        var openAt = new Date;
        var uagentLow = navigator.userAgent.toLocaleLowerCase();
        console.info('userAgent: ' + uagentLow);
        var chrome25;
        var kitkatWebview;

        $('body').append('<iframe id="____phopllink____"></iframe>');
        $('#____phopllink____').hide();

        setTimeout(function() {
          if (new Date - openAt < 4000) {
            if (window.confirm('PHOPL 앱이 설치되어 있지 않습니다.\n설치 페이지로 이동하시겠습니까?')) {
              if (uagentLow.search('android') > -1) {
                console.info('in timer : android');
                $('#____phopllink____').attr('src','market://details?id=com.mauki.phopl&hl=ko');
              } else if (uagentLow.search('iphone') > -1) {
                console.info('in timer : ios');
                location.replace('https://itunes.apple.com/kr/app/solibada-myujig-mujehan-eum/id346528006?mt=8'); //마우키 앱 경로로 변경필요 
              } else {
                console.info('in timer : not ios, not android');
              }
            }
          }
        }, 2000);

        if(uagentLow.search('android') > -1){
          console.info('android');
          chrome25 = uagentLow.search('chrome') > -1 && navigator.appVersion.match(/Chrome\/\d+.\d+/)[0].split("/")[1] > 25;
          kitkatWebview = uagentLow.indexOf('naver') != -1 || uagentLow.indexOf('daum') != -1;

          if (chrome25 && !kitkatWebview){
            // userAgent: mozilla/5.0 (linux; android 6.0.1; nexus 5 build/mob31e) applewebkit/537.36 (khtml, like gecko) chrome/53.0.2785.124 mobile safari/537.36
            console.info('chrome25 && !kitkatWebView');
            // document.location.href = 'intent://album?uplace_uuid=' + uplace_uuid + '&nickname=' + nickname + '#Intent;scheme=soribada30;package=com.soribada.android;end';
            location.href = 'phopl://album?uplace_uuid=' + uplace_uuid + '&nickname=' + nickname;
          } else {
            console.info('can use applink');
            $('#____phopllink____').attr('src', 'phopl://album?uplace_uuid=' + uplace_uuid + '&nickname=' + nickname);
          }
        } else if (uagentLow.search('iphone') > -1){
          console.info('ios');
          var strVer = /version\/[0-9]+\.[0-9]+\s/.exec('userAgent: mozilla/5.0 (iphone; cpu iphone os 10_0 like mac os x) applewebkit/602.1.50 (khtml, like gecko) version/10.0 mobile/14a345 safari/602.1');
          var numVer = Number(strVer[0].split('/')[1]);
          if (numVer >= 9.0) {
            location.href = 'phopl://album?uplace_uuid=' + uplace_uuid + '&nickname=' + nickname;
          } else {
            $('#____phopllink____').attr('src', 'phopl://album?uplace_uuid=' + uplace_uuid + '&nickname=' + nickname);
          }
        } else {
          console.info('not ios, not android.');
        }
      }




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
          $scope.searchResults[i].title = $scope.searchResults[i].title.replace(/<b>/g, '').replace(/&lt;b&gt;/g, '').replace(/&lt;\/b&gt;/g, '').replace(/&quot;/g, '"');
          $scope.searchResults[i].description = $scope.searchResults[i].description.replace(/<b>/g, '').replace(/&lt;b&gt;/g, '').replace(/&lt;\/b&gt;/g, '').replace(/&quot;/g, '"');
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
      //  Public Methods
      //////////////////////////////////////////////////////////////////////////////
      $scope.showMap = function() {
        $ionicModal.fromTemplateUrl('modal.map.html', {
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
        window.open(url, '_system'); //외부 browser 
      };
      
      $scope.showAllImages = function() {
        $scope.showAll = true;
        $ionicScrollDelegate.resize();
        // $scope.$apply();
      }

     
      $scope.showImagesWithFullScreen = function(index) {
   

        $scope.activeSlide = index;
        $ionicModal.fromTemplateUrl('modal.images.html', {
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

      //앱런칭, 이미지저장 
       $scope.saveImage = function(uplace_uuid, nickname) {
          save(uplace_uuid, nickname);
      }

     

    //공유하기
    $scope.openShareModal = function(animation) {
      $ionicModal.fromTemplateUrl('modal.share.html', {
        scope: $scope,
        animation: animation
      }).then(function(modal) {
        $scope.modal = modal;
        $scope.modal.show();
      });
    };
    $scope.closeShareModal = function() {
      $scope.modal.hide();
    };
    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
      $scope.modal.remove();
    }); 

    $scope.shareLink = function( sns ){ 
        try{ 
            //Parse share object
            var url = $scope.shareData.url;
            var txt = $scope.shareData.desc;
            var img = $scope.shareData.image;
            
            sendSns(sns, url, txt, img); 
        }
        catch(e){ 
            alert(e);
            alert("공유할 데이터에 오류가 있습니다.")
        }
 
    }



   });





   