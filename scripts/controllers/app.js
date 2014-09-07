var app = angular.module('harmoni', ['firebase']);

app.service('chatRepo', function($rootScope, $firebase) {
  var _user;
  var _chatRooms;
  var _activeUsers;
  var _userlistener;

  var _chatRef = new Firebase('https://mhacks-iv.firebaseio.com/');
  var _chatRepo = new Firechat(_chatRef);

  var _authClient = new FirebaseSimpleLogin(_chatRef, function(error, user) {
    if (error !== null) {
      // Error logging in
    } else if (user !== null) {
      // Successful user athentication
      setUser(user);
    } else {
      // User not logged in
      _user = user;
    }
    // Make sure the user variable is updated from the access by the dom elements
    $rootScope.$apply();
  });

  var setUser = function(user) {
    if (_userlistener)
      _userlistener(user);
    _user = user;
    _chatRepo.setUser(_user.uid, _user.displayName, function() {

      // Store the user's profile picture url
      var userRef = new Firebase('https://mhacks-iv.firebaseio.com/user-names-online/' + angular.lowercase(_user.displayName) + '/');
      var syncUser = $firebase(userRef).$set('pictureUrl', _user.thirdPartyUserData.picture.data.url);

      // Store the users session id for multiple sessions
      var userSessionRef = new Firebase('https://mhacks-iv.firebaseio.com/users/' + _user.uid + '/sessions/');
      var sync = $firebase(userSessionRef);
      var array = sync.$asArray();
      array.$loaded().then(function(value) {
        if (value.length > 0)
          _user.sessionId = value[value.length - 1].$id;
      });
    });
  }

  this.userListener = function(callback) {
    _userlistener = callback;
  }

  this.facebookLogin = function() {
    _authClient.login('facebook');
  }

  this.logout = function() {
    _authClient.logout();

    var userNameRef = new Firebase('https://mhacks-iv.firebaseio.com/user-names-online/' + angular.lowercase(_user.displayName) + '/');
    var sync = $firebase(userNameRef).$remove(_user.sessionId);
    var userRef = new Firebase('https://mhacks-iv.firebaseio.com/users/' + _user.uid + '/sessions/');
    sync = $firebase(userRef).$remove(_user.sessionId);

    _user = null;
  }

  this.createRoom = function(roomName, isPrivate) {
    if (roomName) {
      var privacy = isPrivate ? 'private' : 'public';
      _chatRepo.createRoom(roomName, privacy, function(roomId) {});
    }
  }

  this.getRoomList = function(callback) {
    var roomRepo = new Firebase('https://mhacks-iv.firebaseio.com/room-metadata/');
    var sync = $firebase(roomRepo);
    var array = sync.$asArray();
    array.$loaded().then(function(value) {
      _chatRooms = value;
      callback(_chatRooms);
    });
  }

  this.joinRoom = function(roomIndex, callback) {
    var loadMessages = function() {
      // Join the room
      _user.room = _chatRooms[roomIndex];
      _chatRepo.enterRoom(_chatRooms[roomIndex].id);

      // Load the messages
      var messageRepo = new Firebase('https://mhacks-iv.firebaseio.com/room-messages/' + _user.room.id);
      var sync = $firebase(messageRepo);
      var array = sync.$asArray();
      array.$loaded().then(function(value) {
        _user.room.messages = value;
        callback(_user.room);
      });
    }
    if (_chatRooms) {
      if (_chatRooms[roomIndex].authorizedUsers == null) {
        return loadMessages();
      } else {
        angular.forEach(_chatRooms[roomIndex].authorizedUsers, function(value, key) {
          if (key === _user.uid)
            return loadMessages();
        });
      }
    } else {
      getRoomListHelper(function(chatRooms) {
        _chatRooms = chatRooms;
        if (_chatRooms[roomIndex].authorizedUsers == null) {
          return loadMessages();
        } else {
          angular.forEach(_chatRooms[roomIndex].authorizedUsers, function(value, key) {
            if (key === _user.uid)
              return loadMessages();
          });
        }
      })
    }
  }

  this.sendMessage = function(message) {
    if (message != '') {
      _chatRepo.sendMessage(_user.room.id, message, 'default', function() {});
    }
  }

  this.leaveRoom = function() {
    chat.leaveRoom(_user.room.id);
    _user.room = null;
  }

  var getRoomListHelper = function(callback) {
    var roomRepo = new Firebase('https://mhacks-iv.firebaseio.com/room-metadata/');
    var sync = $firebase(roomRepo);
    var array = sync.$asArray();
    array.$loaded().then(function(value) {
      _chatRooms = value;
      callback(value);
    });
    array.$watch(function(call) {
      _chatRooms = array;
      callback(array);
    })
  }

  this.getRoomList = function() {
    return _chatRooms;
  }

  var getNumUsersHelper = function(callback) {
    var userRepo = new Firebase('https://mhacks-iv.firebaseio.com/user-names-online/');
    var sync = $firebase(userRepo);
    var array = sync.$asArray();
    array.$loaded().then(function(value) {
      _activeUsers = value;
      callback(value);
    });
    array.$watch(function() {
      _activeUsers = array;
      callback(array);
    });
  }

  this.getNumUsers = function() {
    return _activeUsers;
  }

  var init = function() {
    getRoomListHelper(function() {});
    getNumUsersHelper(function() {});
  }

  init();
}).service('Endynamic', function Endynamic($http) {
    var prefix = "http://localhost:8080/api/";
    
    this.create = function(artist) {
      return $http.get(prefix + "create?artist=" + artist);
    };

    this.skipSong = function(session_id, song_id) {
      return $http.get(prefix + "feedback?api_key=" + api_key + "&session_id=" + session_id + "&skip_song=last");
    };

    this.nextSong = function(session_id) {
      return $http.get(prefix + "nextSong?session_id=" + session_id);
    }

    this.vote = function(vote, session_id) {
      return $http.get(prefix + "vote?session_id=" + session_id + "&vote=" + vote);
    };

    this.peak = function(lookahead, session_id) {
      return $http.get(prefix + "peak?session_id=" + session_id + "&lookahead=" + lookahead);
    };

    this.getInfo = function(session_id) {
      return $http.get(prefix + "info?session_id=" + session_id);
    };

  });;
