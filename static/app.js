var webmessage = angular.module('webmessage', ['ngRoute']);
var noop = function(){};

webmessage.directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.ngEnter);
                });

                event.preventDefault();
            }
        });
    };
});

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
        $http.post('/send', { to: to, message: message }).success(function() {
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

webmessage.controller('MessagesCtrl', ['$scope', 'messages', function($scope, messages) {

    $scope.contacts = [
        {
            name: 'Brady Africk',
            time: '4:43 PM',
            last: 'lol'
        },
        {
            name: 'Sarah Tompsidis',
            time: '3:30 PM',
            last: 'Hahaha'
        },
        {
            name: 'Marko Tupanjac',
            time: '12:11 AM',
            last: 'Hey is host done?'
        }
    ];
    $scope.selectedContact = '';

    $scope.compose = '';

    $scope.send = function() {
        messages.send($scope.compose, $scope.selectedContact);
        $scope.compose = '';
    };

    $scope.select = function() {
        $scope.selectedContact = this.contact.name;
    };

}]);
