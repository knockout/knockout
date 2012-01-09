---
layout: documentation
title: AMD (Asynchronous Module Definition) With RequireJs
---

### Overview of AMD
> When we say an application is modular, we generally mean it's composed of a set of highly decoupled, distinct pieces of functionality stored in modules. As you probably know, loose coupling facilitates easier maintainability of apps by removing dependencies where possible. When this is implemented efficiently, its quite easy to see how changes to one part of a system may affect another.
>
> Unlike some more traditional programming languages however, the current iteration of JavaScript (ECMA-262) doesn't provide developers with the means to import such modules of code in a clean, organized manner. It's one of the concerns with specifications that haven't required great thought until more recent years where the need for more organized JavaScript applications became apparent.
>
> Instead, developers at present are left to fall back on variations of the module or object literal patterns. With many of these, module scripts are strung together in the DOM with namespaces being described by a single global object where it's still possible to incur naming collisions in your architecture. There's also no clean way to handle dependency management without some manual effort or third party tools.
>
> Whilst native solutions to these problems will be arriving in ES Harmony, the good news is that writing modular JavaScript has never been easier and you can start doing it today.

Excerpt From "[Writing Modular JavaScript With AMD, CommonJs & ES Harmony](http://addyosmani.com/writing-modular-js/)"

### Usage With RequireJs
HTML

    <html>
      <head>
        <script type="text/javascript" data-main="main.js" src="require.js"></script>
      </head>
      <body>
        <p>First name: <strong data-bind="text: firstName"></strong></p>
        <p>Last name: <strong data-bind="text: lastName"></strong></p>

        <p>First name: <input data-bind="value: firstName" /></p>
        <p>Last name: <input data-bind="value: lastName" /></p>

        <p>Full name: <strong data-bind="text: fullName"></strong></p>

        <button data-bind="click: capitalizeLastName">Go caps</button>
      </body>
    </html>

main.js

    require(['knockout-x.y.z'], function(ko){
      function AppViewModel() {
          this.firstName = ko.observable("Bert");
          this.lastName = ko.observable("Bertington");

          this.fullName = ko.computed(function() {
              return this.firstName() + " " + this.lastName();
          }, this);

          this.capitalizeLastName = function() {
              var currentVal = this.lastName();        // Read the current value
              this.lastName(currentVal.toUpperCase()); // Write back a modified value
          };
      }

      // Activates knockout.js
      ko.applyBindings(new AppViewModel());
    });

RequireJs can be downloaded from: [http://requirejs.org/docs/download.html](http://requirejs.org/docs/download.html)
