**Knockout** is a JavaScript [MVVM](http://en.wikipedia.org/wiki/Model_View_ViewModel) (a modern variant of MVC) library that makes it easier to create rich, desktop-like user interfaces with JavaScript and HTML. It uses *observers* to make your UI automatically stay in sync with an underlying data model, along with a powerful and extensible set of *declarative bindings* to enable productive development.

##Getting started

**Totally new to Knockout?** The most fun place to start is the [online interactive tutorials](http://learn.knockoutjs.com/).

For more details, see

 * Documentation on [the project's website](http://knockoutjs.com/documentation/introduction.html)
 * Online examples at [http://knockoutjs.com/examples/](http://knockoutjs.com/examples/)

##Downloading or building Knockout

You can [download released versions of Knockout](http://knockoutjs.com/downloads/) from the project's website.

Or, if you prefer to build the source yourself, clone the repo from Github, and then run `./build/build.sh`.

If you're running Windows, you must execute `./build/build.sh` from inside Git Bash, *not* the built-in Windows command prompt. If you have [Git for Windows](http://git-scm.com/downloads) installed, then you already have Git Bash installed.

For Node.js developers, Knockout is also available from [npm](https://npmjs.org/): `npm install knockout`.

## Running the tests

If you have [phantomjs](http://phantomjs.org/download.html) installed, then the `build.sh` script will automatically run the specification suite and report its results.

Or, if you want to run the specs in a browser (e.g., for debugging), simply open `spec/runner.html` in your browser.

##License

MIT license - [http://www.opensource.org/licenses/mit-license.php](http://www.opensource.org/licenses/mit-license.php)
