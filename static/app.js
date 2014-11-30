var webmessage = angular.module('webmessage', ['ngRoute']);
var noop = function(){};

window.host = 'http://localhost:5677';

webmessage.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/login', {
        templateUrl: 'views/login.html',
        controller: 'LoginCtrl'
    });
    $routeProvider.when('/messages', {
        templateUrl: 'views/messages.html',
        controller: 'MessagesCtrl'
    });
}]);

webmessage.factory('messages', ['$http', function($http) {
    var send = function(message, to) {
        $http.post(window.host + '/send', { to: to, message: message }).success(function() {
            console.log('Message "' + message + '" sent to "' + to + '" successfully.');
        }).catch(noop);
    };

    return {
        send: send
    };
}]);

webmessage.factory('auth', function() {
    var loggedIn = false;
    sessionStorage.password = '';

    var testPassword = function(cb) {
        // TODO: Hit the /auth endpoint

        // loggedIn = success;
        // cb();
    };

    var setPassword = function(pass) {
        sessionStorage.password = pass;
    };

    var getPassword = function() {
        return sessionStorage.password;
    };

    var isLoggedIn = function() {
        return loggedIn;
    };

    return {
        testPassword: testPassword,
        setPassword: setPassword,
        getPassword: getPassword
    };
});

webmessage.factory('httpRequestInterceptor', ['auth', function (auth) {
    return {
        request: function (config) {
            if(auth.isLoggedIn)
                config.headers['Authentication'] = auth.getPassword();
            if(config.method == 'POST')
                config.headers['Content-Type']   = 'application/json';
            return config;
        }
    };
}]);

webmessage.config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push('httpRequestInterceptor');
}]);

webmessage.controller('LoginCtrl', ['$scope', 'auth', function($scope) {

    $scope.login = function(password) {
        auth.setPassword(password);

        // TODO: Show spinner

        auth.testPassword(function() {
            // TODO: Stop spinner

            // if(auth.isLoggedIn())
            //    redirect()
            // else
            //    shake()
        });
    };

}]);

webmessage.controller('MessagesCtrl', ['$scope', function($scope) {

}]);