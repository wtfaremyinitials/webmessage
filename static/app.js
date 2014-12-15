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
        return $http.post('/send', { to: to, message: message });
    };

    return {
        send: send
    };
}]);

webmessage.factory('auth', [function() {
    var loggedIn = false;
    sessionStorage.password = '';

    var check = function(response) {
        if(response.status == 200) {
            loggedIn = true;
            return true;
        }
        return false;
    };

    // hack to get around circular dependency
    var $http;

    var testPassword = function(cb) {
        if(!$http)
            $http = angular.element(document.body).injector().get('$http');
        return $http.get('/auth').then(check).catch(check);
    };

    var setPassword = function(pass) {
        sessionStorage.password = pass;
    };

    var getPassword = function() {
        return sessionStorage.password;
    };

    var isLoggedIn = function() {
        return !!sessionStorage.password;
    };

    return {
        testPassword: testPassword,
        setPassword: setPassword,
        getPassword: getPassword,
        isLoggedIn: isLoggedIn
    };
}]);

webmessage.factory('datetime', [function() {

    Date.prototype.getHours12 = function() {
        var hours = this.getHours();
        if(hours > 12)
            hours -= 12;
        return hours;
    };

    Date.prototype.getMeridiem = function() {
        var hours = this.getHours();
        return (hours<=12)? 'AM' : 'PM'
    };

    var pad = function(num, size) {
        var s = num+"";
        while (s.length < size) s = "0" + s;
        return s;
    }

    var wasToday = function(then) {
        var now = new Date();
        return now.getDay()   == then.getDay() && now.getMonth() == then.getMonth() && now.getFullYear() == then.getFullYear();
    };

    var wasYesterday = function(then) {
        var now = new Date();
        return now.getDay()-1 == then.getDay() && now.getMonth() == then.getMonth() && now.getFullYear() == then.getFullYear();
    };

    var formatTime = function(timestamp) {
        var date = new Date(timestamp);

        if(wasToday(date))
            return pad(date.getHours12(), 2) + ':' + pad(date.getMinutes(), 2) + ' ' + date.getMeridiem();
        if(wasYesterday(date))
            return 'Yesterday';
        return date.getMonth() + '/' +  date.getDate() + '/' + (date.getFullYear() + '').substr(2, 4);
    };

    return {
        formatTime: formatTime
    };
}]);

// Modified version of http://kylecordes.com/2014/angularjs-q-promise-delayer
webmessage.factory('delay', ['$timeout', function($timeout) {
    return function(ms) {
        return function(value) {
            return $timeout(function() {
                return value;
            }, ms);
        };
    };
}]);

webmessage.factory('httpRequestInterceptor', ['auth', function (auth) {
    return {
        request: function (config) {
            if(auth.isLoggedIn())
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

webmessage.controller('LoginCtrl', ['$scope', '$location', 'auth', function($scope, $location, auth) {

    $scope.loading = false;
    $scope.password = '';

    $scope.login = function() {
        auth.setPassword($scope.password);
        $scope.loading = true;

        auth.testPassword().then(function(success) {
            $scope.loading = false;
            if(success) {
                $location.path('/messages').replace();
            } else {
                alert('Incorrect password');
            }
        });
    };

}]);

webmessage.controller('MessagesCtrl', ['$scope', 'messages', 'datetime', 'delay', function($scope, messages, datetime, delay) {
    $scope.conversations = JSON.parse(localStorage['conversations']);
    $scope.selectedConversation = $scope.conversations[0];
    for(var i=0; i<$scope.conversations.length; i++)
        if($scope.conversations[i].name == sessionStorage['active'])
            $scope.selectedConversation = $scope.conversations[i];
    $scope.compose = '';

    $scope.add = function() {
        $scope.conversations.push({
            name: prompt('Enter contact name:'),
            time: Date.now(),
            messages: []
        });
    };

    $scope.done = false;
    $scope.sending = false;

    $scope.send = function() {
        $scope.sending = true;
        messages.send($scope.compose, $scope.selectedConversation.name).then(function() {
            $scope.sending = false;
            $scope.done  = true;
        }).then(delay(500)).then(function() {
            $scope.done = false;
        });
        var time = Date.now();
        $scope.selectedConversation.messages.push({
            text: $scope.compose,
            time: time,
            side: 'you'
        });
        $scope.selectedConversation.time = time;
        $scope.compose = '';
    };

    $scope.select = function() {
        sessionStorage['active'] = this.conversation.name;
        $scope.selectedConversation = this.conversation;
    };

    $scope.delete = function() {
        if(confirm('Are you sure you would like to delete your conversation with ' + this.conversation.name + '?'))
            $scope.conversations.splice($scope.conversations.indexOf(this.conversation), 1);
    };

    $scope.formatTime = datetime.formatTime;

    $scope.$watch('conversations', function(value) {
        localStorage['conversations'] = angular.toJson(value);
    }, true);

    var messageEvents = new EventSource('/receive');

    messageEvents.onmessage = function(msgEvent) {
        var data = JSON.parse(msgEvent.data);
        $scope.conversations.forEach(function(conversation) {
            if(conversation.name == data.from.name) {
                conversation.messages.push({
                    text: data.text,
                    time: data.time,
                    side: 'them'
                });
                conversation.time = data.time;
                $scope.$apply();
            }
        });
    };
}]);
