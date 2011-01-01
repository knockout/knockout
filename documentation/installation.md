---
layout: documentation
title: Installation
mainmenukeyoverride: installation
---

Knockout's core library is pure JavaScript and doesn't depend on any other libraries. So, to add KO to your project, just follow these steps:

1. **Download** the latest version of the Knockout JavaScript file from [the downloads page](http://github.com/SteveSanderson/knockout/downloads). For normal development and production use, use the default, minified version (`knockout-x.x.js`).
   
   *For debugging only, use the larger, non-minified version (`knockout-x.x.debug.js`). This behaves the same as the minified version, but has human-readable source code with full variable names and comments, and does not hide internal APIs.*

1. Reference the file using a `<script>` tag somewhere on your HTML pages

That's all you have to do...

###Enabling templating

...except if you also want to use the templating feature (you probably do because it's very useful), in which case you need two more JavaScript files. KO's default templating engine is `jquery.tmpl.js`, which depends on jQuery. So, download the following script files and place `<script>` tags referencing them **above your reference to KO itself**:
	
* jQuery 1.4.2 or later from [the jQuery site](http://docs.jquery.com/Downloading_jQuery), if you're not already using it
* `jquery-tmpl.js` --- [this version](http://github.com/downloads/SteveSanderson/knockout/jquery.tmpl.js) works nicely, or you can check [jquery.tmpl's project homepage](http://github.com/jquery/jquery-tmpl) to look for a newer version.

In case it's unclear, you'll end up with three script tags like the following, in this order:

    <script type='text/javascript' src='jquery-1.4.2.min.js'></script>
    <script type='text/javascript' src='jquery-tmpl.js'></script>
    <script type='text/javascript' src='knockout-1.1.2.js'></script>
    
(Obviously, update the filenames/paths to match where you put the files.)

Next, learn about [observables](observables.html), read [a tutorial](introduction.html), or see [some examples](../examples/).
