
### Knockout

[![Build Status](https://travis-ci.org/brianmhunt/knockout.svg?branch=1039-build-for-bower)](https://travis-ci.org/brianmhunt/knockout)

[![Sauce Test Status](https://saucelabs.com/browser-matrix/brianmhunt.svg)](https://saucelabs.com/u/brianmhunt)

**Knockout** is a JavaScript [MVVM](http://en.wikipedia.org/wiki/Model_View_ViewModel) (a modern variant of MVC) library that makes it easier to create rich, desktop-like user interfaces with JavaScript and HTML. It uses *observers* to make your UI automatically stay in sync with an underlying data model, along with a powerful and extensible set of *declarative bindings* to enable productive development.

## Getting started

**Totally new to Knockout?** The most fun place to start is the
[online interactive tutorials](http://learn.knockoutjs.com/).

For more details, see

 * Documentation on [the project's website](http://knockoutjs.com/documentation/introduction.html)
 * Online examples at [http://knockoutjs.com/examples/](http://knockoutjs.com/examples/)

## Downloading Knockout

You can [download released versions of Knockout](http://knockoutjs.com/downloads/) from the project's website.

For Node.js developers, Knockout is also available from [npm](https://npmjs.org/) - just run `npm install knockout`.

## Building Knockout from sources

If you prefer to build the library yourself:

 1. **Clone the repo from GitHub**

        $ git clone https://github.com/knockout/knockout.git
        $ cd knockout

 2. **Acquire build dependencies.** Make sure you have [Node.js](http://nodejs.org/) installed on your workstation. This is only needed to _build_ Knockout from sources. Knockout itself has no dependency on Node.js once it is built (it works with any server technology or none). Now run:

        $ npm install -g gulp
        $ npm install

    The first `npm` command sets up the popular [gulp](http://gulpjs.com/) build tool. You might need to run this command with `sudo` if you're on Linux or Mac OS X, or in an Administrator command prompt on Windows. The second `npm` command fetches the remaining build dependencies.

 3. **Run the build tool**

        $ gulp build

    Now you'll find the built files in `build/output/`.

    The default minifier is `uglify`. You can change it to the closure compiler by either
    setting the environment variable `MINIFIER=closure` or changing the `minifier` option
    in `config.yaml`.

## Running the tests

### Manual testing

You can generate the test runner HTML with:

    $ gulp runner

You can run the tests locally by opening `runner.html` in a webbrowser. You can enable live-reloading of the tests
by running in the background:

    $ gulp watch

### Automated tests

There are three automated tests: Node, PhantomJS and Sauce Labs.

#### Node

You can run the node tests with

    gulp test:node

#### PhantomJS

To run the PhantomJS tests, you must install and start [PhantomJS](http://phantomjs.org). Run PhantomJS with

    phantomjs --webdriver=4446

You can then run the PhantomJS tests with:

    gulp test:phantom

#### SauceLabs

To run the tests with Sauce Labs you will need an Sauce Labs account. Once you have an account, you can run the tests with:

    $ export SAUCE_USERNAME=<<username>>
    $ export SAUCE_ACCESS_KEY=<<access key>>
    $ gulp test:saucelabs


## License

MIT license - [http://www.opensource.org/licenses/mit-license.php](http://www.opensource.org/licenses/mit-license.php)
