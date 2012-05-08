---
layout: documentation
title: Installation
mainmenukeyoverride: installation
---

Knockout's core library is pure JavaScript and doesn't depend on any other libraries. So, to add KO to your project, just follow these steps:

1. **Download** the latest version of the Knockout JavaScript file from [the downloads page](http://github.com/SteveSanderson/knockout/downloads). For normal development and production use, use the default, minified version (`knockout-x.y.z.js`).
   
   *For debugging only, use the larger, non-minified version (`knockout-x.y.z.debug.js`). This behaves the same as the minified version, but has human-readable source code with full variable names and comments, and does not hide internal APIs.*

1. Reference the file using a `<script>` tag somewhere on your HTML pages.

For example,

    <script type='text/javascript' src='knockout-2.1.0.js'></script>

... and now you're ready to use it. (Obviously, update the `src` attribute to match the location where you put the downloaded file.)

If you're new to Knockout, get started with [interactive tutorials](http://learn.knockoutjs.com), see some [live examples](../examples/), or dig into documentation about [observables](observables.html).

