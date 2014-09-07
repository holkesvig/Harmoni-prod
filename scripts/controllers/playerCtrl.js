'use strict';
angular.module('harmoni')
.controller('PlayerCtrl', function($scope, $location, $anchorScroll, $timeout, $document, chatRepo, Endynamic) {
  var session_id = null;
  var audio = null;
  var currSong = "";
  
  $scope.create = function(artist) {
    Endynamic.create(artist).success(function(data) {
      session_id = data.session_id;
      console.log(session_id);

      SC.initialize({
        client_id: '31b5cc06e7a908964f5f7f4e2c8486a8'
      });

      currSong = data.song;
      var q = currSong.artist_name + " - " + currSong.title;
      console.log(q);
      // find all sounds of buskers licensed under 'creative commons share alike'
      SC.get('/tracks', { q: q, limit: 1}, function(tracks) {
        // stream track id 293
        SC.oEmbed(tracks[0].uri, { auto_play: true }, function(oEmbed) {
          $('#player').html(oEmbed.html);
        });
        // SC.stream("/tracks/" + tracks[0].id, function(sound){
        //  audio = sound;
        //  audio.play();
        // });
      });
    });
  };

  $scope.upVote = function() {
    Endynamic.vote(true, session_id).success(function(data) {
      $scope.peak();
    });
  };

  $scope.downVote = function() {
    Endynamic.vote(false, session_id).success(function(data) {
      $scope.peak();
    });
  };

  $scope.peak = function() {
    Endynamic.peak(5, session_id).success(function(data) {
      $scope.lookahead = data.lookahead;
    });
  };

  $scope.nextSong = function() {

    Endynamic.nextSong(session_id).success(function(data) {

      currSong = data.songs[0];
      var q = currSong.artist_name + " - " + currSong.title;
      console.log(q);
      SC.get('/tracks', { q: q, limit: 1}, function(tracks) {
      // stream track id 293
      SC.oEmbed(tracks[0].uri, { auto_play: true }, function(oEmbed) {
        $('#player').html(oEmbed.html);
      });
    });
    });

  };


  $scope.createRoom = function() {
    if ($scope.roomName) {
      var privacy = $scope.isPrivate ? 'private' : 'public';

      chatRepo.createRoom($scope.roomName, privacy);

      $scope.isPrivate = false;
      $scope.roomName = '';
    }
  }

  $scope.joinRoom = function(roomIndex) {
    chatRepo.joinRoom(roomIndex, function(room) {
      $scope.user.chatRoom = room;
    });
  }

  $scope.sendMessage = function(event) {
    if (event.keyCode == 13) {
      chatRepo.sendMessage($scope.user.message);
      $scope.user.message = '';
        // $scope.followChat();
      }
    }

    $scope.leaveRoom = function() {
      $scope.user.chatRoom = null;
      chatRepo.leaveRoom();
    }

    chatRepo.getRoomList(function(roomList) {
      $scope.user.chatRooms;
    });

    chatRepo.getNumUsers(function(activeUsers) {
      $scope.activeUsers = activeUsers;
    })

    $scope.followChat = function() {
      $timeout(function() {
        $location.hash('chatbottom');
        $anchorScroll();
      });
    };

    $scope.init = function() {
      $scope.user = {};
      $scope.joinRoom(0);
    }

    chatRepo.userListener(function(user) {
      $scope.user = user;
    });

    $scope.init();
  });
// angular.module('harmoni', ['firebase'])
//   .controller('PlayerCtrl', function($scope, $location, $firebase, $anchorScroll, $timeout, $document) {
//     var chatRef = new Firebase('https://mhacks-iv.firebaseio.com');
//     var chat = new Firechat(chatRef);
//     var authClient = new FirebaseSimpleLogin(chatRef, function(error, user) {
//       if (error !== null) {
//         // Error logging in
//       } else if (user !== null) {
//         // Successful user athentication
//         $scope.user = user;
//         chat.setUser($scope.user.uid, $scope.user.displayName, function() {
//           var userRef = new Firebase('https://mhacks-iv.firebaseio.com/user-names-online/' + angular.lowercase($scope.user.displayName) + '/');
//           var syncUser = $firebase(userRef).$set('pictureUrl', $scope.user.thirdPartyUserData.picture.data.url);
//           var userSessionRef = new Firebase('https://mhacks-iv.firebaseio.com/users/' + $scope.user.uid + '/sessions/');
//           var sync = $firebase(userSessionRef);
//           var array = sync.$asArray();
//           array.$loaded().then(function(value) {
//             $scope.user.sessionId = value[value.length - 1].$id;
//           });
//         });
//       } else {
//         // User not logged in
//         $scope.user = user;
//       }
//       // Make sure the user variable is updated from the access by the dom elements
//       $scope.$apply();
//     });

//     $scope.login = function() {
//       authClient.login('facebook');
//     }

//     $scope.logout = function() {
//       authClient.logout();

//       var userNameRef = new Firebase('https://mhacks-iv.firebaseio.com/user-names-online/' + angular.lowercase($scope.user.displayName) + '/');
//       var sync = $firebase(userNameRef).$remove($scope.user.sessionId);
//       var userRef = new Firebase('https://mhacks-iv.firebaseio.com/users/' + $scope.user.uid + '/sessions/');
//       sync = $firebase(userRef).$remove($scope.user.sessionId);
//     }

//     $scope.createRoom = function() {
//       if ($scope.roomName) {
//         var privacy = $scope.isPrivate ? 'private' : 'public';
//         chat.createRoom($scope.roomName, privacy, function(roomId) {
//           // callback 
//           $scope.getRoomList();
//         });
//         $scope.isPrivate = false;
//         $scope.roomName = '';
//       }
//     }

//     $scope.joinRoom = function(roomIndex) {
//       var joinRoomHelp = function() {
//         $scope.client.room = $scope.rooms[roomIndex];
//         $scope.client.roomName = $scope.rooms[roomIndex].name

//         chat.enterRoom($scope.rooms[roomIndex].id);
//         var messageRepo = new Firebase('https://mhacks-iv.firebaseio.com/room-messages/' + $scope.client.room.id);
//         var sync = $firebase(messageRepo);
//         var array = sync.$asArray();
//         array.$loaded().then(function(value) {
//           $scope.client.messages = value;
//         });
//         return;
//       }

//       if ($scope.rooms[roomIndex].authorizedUsers == null) {
//         return joinRoomHelp();
//       } else {
//         angular.forEach($scope.rooms[roomIndex].authorizedUsers, function(value, key) {
//           if (key === $scope.user.uid) {
//             return joinRoomHelp();
//           }
//         });
//       }
//     }

//     $scope.sendMessage = function(event) {
//       if (event.keyCode == 13 && $scope.client.message != '') {
//         chat.sendMessage($scope.client.room.id, $scope.client.message, 'default', function() {});
//         $scope.client.message = '';
//         $scope.followChat();
//       }
//     }

//     $scope.backToLobby = function() {
//       $scope.client.roomName = '';
//       chat.leaveRoom($scope.client.room.id);
//     }


//     $scope.getRoomList = function(callback) {
//       var roomRepo = new Firebase('https://mhacks-iv.firebaseio.com/room-metadata/');
//       var sync = $firebase(roomRepo);
//       var array = sync.$asArray();
//       array.$loaded().then(function(value) {
//         $scope.rooms = value;
//         callback(0);
//       });
//     }

//     $scope.getNumUsers = function() {
//       var userRepo = new Firebase('https://mhacks-iv.firebaseio.com/user-names-online/');
//       var sync = $firebase(userRepo);
//       var array = sync.$asArray();
//       // array.$loaded().then(function(value) {
//       //   $scope.activeUsers = value;
//       // });
//       array.$watch(function() {
//         $scope.activeUsers = array;
//       });
//     }

//     $scope.followChat = function() {
//       // $timeout(function() {
//       //   $location.hash('chatbottom');
//       //   $anchorScroll();
//       // });
//       // $document.scrollToElement('chatbottom');
//     };

//     $scope.init = function() {
//       $scope.client = {};
//       $scope.getRoomList($scope.joinRoom);
//       $scope.getNumUsers();
//     }

//     $scope.init();
//   });