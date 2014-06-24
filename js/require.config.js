require.config({
    paths: {
        'knockout': '/downloads/knockout-latest',
        'text':     '/js/require.text'
    }
});

// To keep the network tab clear when the visitor is running live examples,
// preload the following.
require(['text', 'knockout'], function() {});
