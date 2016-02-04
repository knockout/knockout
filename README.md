
## What is Knockout

**Knockout** is a minimalist JavaScript library that is based on the [MVVM][1]
or *Model – View – View Model* application design architecture, a modern variant
of [MVC][2].

![The MVVM
Pattern](https://upload.wikimedia.org/wikipedia/commons/8/87/MVVMPattern.png)

[1]: http://en.wikipedia.org/wiki/Model_View_ViewModel
[2]: https://en.wikipedia.org/wiki/Model–view–controller

## What to Use Knockout for

**Knockout** makes it easier to create rich and responsive user interfaces for
both displaying and editing data - for example shopping carts - with a clean
underlying data model.

## When to Use It

Any time you have sections of UI that update dynamically (e.g., changing
depending on the user’s actions or when an external data source changes),
**Knockout** can help you implement it in a simpler and more maintainable way.

Key features:

+ **Elegant dependency tracking** - automatically updates the necessary parts of
  your UI whenever your data model changes.
+ **Declarative bindings** - a simple and obvious way to connect parts of your
  UI to your data model. You can construct complex dynamic UIs easily using
  arbitrarily nested binding contexts.
+ **Easily extensible** - implement custom behaviors as new declarative bindings
  for easy reuse in just a few lines of code.

Additional benefits:

+ **Pure JavaScript library** - works with any server or client-side technology
+ **Can be added on top of your existing web application** without requiring
  major architectural changes
+ **Compact** - around 13kb after gzipping
+ **Works on any mainstream browser** (IE 6+, Firefox 2+, Chrome, Safari, Edge,
  others)
+ **Comprehensive suite of specifications** (developed BDD-style) means its
  correct functioning can easily be verified on new browsers and platforms

## Getting started

[![Join the chat at https://gitter.im/knockout/knockout](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/knockout/knockout?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

**Totally new to Knockout?** The most fun place to start is the [online
interactive tutorials](http://learn.knockoutjs.com/).

For more details, see

+ Documentation on [the project's
  website](http://knockoutjs.com/documentation/introduction.html)
+ Online examples at
  [http://knockoutjs.com/examples/](http://knockoutjs.com/examples/)

## Downloading Knockout

You can [download released versions of
Knockout](http://knockoutjs.com/downloads/) from the project's website.

For Node.js developers, Knockout is also available from
[npm](https://npmjs.org/) - just run `npm install knockout`.

## Building Knockout from sources

If you prefer to build the library yourself:

1. **Clone the repo from GitHub**

        git clone https://github.com/knockout/knockout.git
        cd knockout

2. **Acquire build dependencies.** Make sure you have
   [Node.js](http://nodejs.org/) installed on your workstation. This is only
   needed to _build_ Knockout from sources. Knockout itself has no dependency on
   Node.js once it is built (it works with any server technology or none). Now
   run:

        npm install -g grunt-cli
        npm install

   The first `npm` command sets up the popular [Grunt](http://gruntjs.com/)
   build tool. You might need to run this command with `sudo` if you're on Linux
   or Mac OS X, or in an Administrator command prompt on Windows. The second
   `npm` command fetches the remaining build dependencies.

3. **Run the build tool**

        grunt

   Now you'll find the built files in `build/output/`.

## Running the tests

If you have [phantomjs](http://phantomjs.org/download.html) installed, then the
`grunt` script will automatically run the specification suite and report its
results.

Or, if you want to run the specs in a browser (e.g., for debugging), simply open
`spec/runner.html` in your browser.

## License

MIT license - [http://www.opensource.org/licenses/mit-license.php](http://www.opensource.org/licenses/mit-license.php)
