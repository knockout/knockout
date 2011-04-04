---
layout: documentation
title: The "html" binding
---

### Purpose
The `html` binding inserts raw HTML from a string into the associated DOM element without escaping the content. 

Typically this is useful when values in your view model are actually strings of HTML markup that you want to render.

### Example
    <div data-bind="html: details"></div>
    
    <script type="text/javascript">
	    var viewModel = {
			details: ko.observable() // Initially blank
	    };
	    viewModel.details("<em>For further details, view the report <a href='report.html'>here</a>.</em>"); // HTML content appears 
    </script>

### Parameters

 * Main parameter
   
   KO sets the element's `innerHTML` property to your parameter value. Any previous content will be overwritten.
   
   If this parameter is an observable value, the binding will update the element's content whenever the value changes. If the parameter isn't observable, it will only set the element's content once and will not update it again later.   
   
   If you supply something other than a number or a string (e.g., you pass an object or an array), the `innerHTML` will be equivalent to `yourParameter.toString()`
   
 * Additional parameters 

   * None

### Note: About HTML encoding

Since this binding sets your element's content using `innerHTML`, it leaves you potentially vulnerable to HTML or script injection attacks.  If you cannot guarantee that the content is safe to display (perhaps it is based on user input), then you can use [the text binding](text-binding.html), which will set the element's text value using `innerText` or `textContent`. 
   
### Dependencies

None, other than the core Knockout library.