angular.module('harmoni')
  .controller('MainCtrl', function($scope, chatRepo) {

    $scope.facebookLogin = function() {
      chatRepo.facebookLogin();
    }

    $scope.logout = function() {
      chatRepo.logout();
    }

    $scope.chatRooms = chatRepo.getRoomList();
    $scope.activeUsers = chatRepo.getNumUsers();

  });