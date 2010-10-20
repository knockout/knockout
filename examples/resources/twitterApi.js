var twitterApi = (function () {
    var throttleFunction = function (fn, throttleMilliseconds) {
        var invocationTimeout;

        return function () {
            var args = arguments;
            if (invocationTimeout)
                clearTimeout(invocationTimeout);

            invocationTimeout = setTimeout(function () {
                invocationTimeout = null;
                fn.apply(window, args);
            }, throttleMilliseconds);
        };
    };

    var getTweetsForUsersThrottled = throttleFunction(function (userNames, callback) {
        if (userNames.length == 0)
            callback([]);
        else {
            var url = "http://search.twitter.com/search.json?callback=?&rpp=100&q=";
            for (var i = 0; i < userNames.length; i++)
                url += "from:" + userNames[i] + (i < userNames.length - 1 ? " OR " : "");
            $.ajax({
                url: url,
                dataType: "jsonp",
                success: function (data) { callback($.grep(data.results || [], function (tweet) { return tweet.to_user_id === null; })); }
            });
        }
    }, 50);

    return {
        getTweetsForUsers: function (userNames, callback) {
            getTweetsForUsersThrottled(userNames, callback);
        }
    };
})();
