/**
 * JSSpec
 *
 * Copyright 2007 Alan Kang
 *  - mailto:jania902@gmail.com
 *  - http://jania.pe.kr
 *
 * http://jania.pe.kr/aw/moin.cgi/JSSpec
 *
 * Dependencies:
 *  - diff_match_patch.js ( http://code.google.com/p/google-diff-match-patch )
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc, 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA
 */

/**
 * Namespace
 */

var JSSpec = {
	specs: [],
	
	EMPTY_FUNCTION: function() {},
	
	Browser: {
		// By Rendering Engines
		Trident: navigator.appName === "Microsoft Internet Explorer",
		Webkit: navigator.userAgent.indexOf('AppleWebKit/') > -1,
		Gecko: navigator.userAgent.indexOf('Gecko') > -1 && navigator.userAgent.indexOf('KHTML') === -1,
		KHTML: navigator.userAgent.indexOf('KHTML') !== -1,
		Presto: navigator.appName === "Opera",
		
		// By Platforms
		Mac: navigator.userAgent.indexOf("Macintosh") !== -1,
		Ubuntu: navigator.userAgent.indexOf('Ubuntu') !== -1,
		Win: navigator.userAgent.indexOf('Windows') !== -1,
		
		// By Browsers
		IE: navigator.appName === "Microsoft Internet Explorer",
		IE6: navigator.userAgent.indexOf('MSIE 6') !== -1,
		IE7: navigator.userAgent.indexOf('MSIE 7') !== -1,
		IE8: navigator.userAgent.indexOf('MSIE 8') !== -1,
		
		FF: navigator.userAgent.indexOf('Firefox') !== -1,
		FF2: navigator.userAgent.indexOf('Firefox/2') !== -1,
		FF3: navigator.userAgent.indexOf('Firefox/3') !== -1,
		Safari: navigator.userAgent.indexOf('Safari') !== -1
	}
};



/**
 * Executor
 */
JSSpec.Executor = function(target, onSuccess, onException) {
	this.target = target;
	this.onSuccess = typeof onSuccess == 'function' ? onSuccess : JSSpec.EMPTY_FUNCTION;
	this.onException = typeof onException == 'function' ? onException : JSSpec.EMPTY_FUNCTION;
	
	if(JSSpec.Browser.Trident) {
		// Exception handler for Trident. It helps to collect exact line number where exception occured.
		window.onerror = function(message, fileName, lineNumber) {
			var self = window._curExecutor;
			var ex = {message:message, fileName:fileName, lineNumber:lineNumber};

			if(JSSpec._secondPass)  {
				ex = self.mergeExceptions(JSSpec._assertionFailure, ex);
				delete JSSpec._secondPass;
				delete JSSpec._assertionFailure;
				
				ex.type = "failure";
				self.onException(self, ex);
			} else if(JSSpec._assertionFailure) {
				JSSpec._secondPass = true;
				self.run();
			} else {
				self.onException(self, ex);
			}
			
			return true;
		};
	}
};
JSSpec.Executor.prototype.mergeExceptions = function(assertionFailure, normalException) {
	var merged = {
		message:assertionFailure.message,
		fileName:normalException.fileName,
		lineNumber:normalException.lineNumber
	};
	
	return merged;
};

JSSpec.Executor.prototype.run = function() {
	var self = this;
	var target = this.target;
	var onSuccess = this.onSuccess;
	var onException = this.onException;
	
	window.setTimeout(
		function() {
			var result;
			if(JSSpec.Browser.Trident) {
				window._curExecutor = self;
				
				result = self.target();
				self.onSuccess(self, result);
			} else {
				try {
					result = self.target();
					self.onSuccess(self, result);
				} catch(ex) {
					if(JSSpec.Browser.Webkit) ex = {message:ex.message, fileName:ex.sourceURL, lineNumber:ex.line};
					
					if(JSSpec._secondPass)  {
						ex = self.mergeExceptions(JSSpec._assertionFailure, ex);
						delete JSSpec._secondPass;
						delete JSSpec._assertionFailure;
						
						ex.type = "failure";
						self.onException(self, ex);
					} else if(JSSpec._assertionFailure) {
						JSSpec._secondPass = true;
						self.run();
					} else {
						self.onException(self, ex);
					}
				}
			}
		},
		0
	);
};



/**
 * CompositeExecutor composites one or more executors and execute them sequencially.
 */
JSSpec.CompositeExecutor = function(onSuccess, onException, continueOnException) {
	this.queue = [];
	this.onSuccess = typeof onSuccess == 'function' ? onSuccess : JSSpec.EMPTY_FUNCTION;
	this.onException = typeof onException == 'function' ? onException : JSSpec.EMPTY_FUNCTION;
	this.continueOnException = !!continueOnException;
};

JSSpec.CompositeExecutor.prototype.addFunction = function(func) {
	this.addExecutor(new JSSpec.Executor(func));
};

JSSpec.CompositeExecutor.prototype.addExecutor = function(executor) {
	var last = this.queue.length == 0 ? null : this.queue[this.queue.length - 1];
	if(last) {
		last.next = executor;
	}
	
	executor.parent = this;
	executor.onSuccessBackup = executor.onSuccess;
	executor.onSuccess = function(result) {
		this.onSuccessBackup(result);
		if(this.next) {
			this.next.run();
		} else {
			this.parent.onSuccess();
		}
	};
	executor.onExceptionBackup = executor.onException;
	executor.onException = function(executor, ex) {
		this.onExceptionBackup(executor, ex);

		if(this.parent.continueOnException) {
			if(this.next) {
				this.next.run();
			} else {
				this.parent.onSuccess();
			}
		} else {
			this.parent.onException(executor, ex);
		}
	};

	this.queue.push(executor);
};

JSSpec.CompositeExecutor.prototype.run = function() {
	if(this.queue.length > 0) {
		this.queue[0].run();
	}
};

/**
 * Spec is a set of Examples in a specific context
 */
JSSpec.Spec = function(context, entries) {
	this.id = JSSpec.Spec.id++;
	this.context = context;
	this.url = location.href;
	
	this.filterEntriesByEmbeddedExpressions(entries);
	this.extractOutSpecialEntries(entries);
	this.examples = this.makeExamplesFromEntries(entries);
	this.examplesMap = this.makeMapFromExamples(this.examples);
};

JSSpec.Spec.id = 0;
JSSpec.Spec.prototype.getExamples = function() {
	return this.examples;
};

JSSpec.Spec.prototype.hasException = function() {
	return this.getTotalFailures() > 0 || this.getTotalErrors() > 0;
};

JSSpec.Spec.prototype.getTotalFailures = function() {
	var examples = this.examples;
	var failures = 0;
	for(var i = 0; i < examples.length; i++) {
		if(examples[i].isFailure()) failures++;
	}
	return failures;
};

JSSpec.Spec.prototype.getTotalErrors = function() {
	var examples = this.examples;
	var errors = 0;
	for(var i = 0; i < examples.length; i++) {
		if(examples[i].isError()) errors++;
	}
	return errors;
};

JSSpec.Spec.prototype.filterEntriesByEmbeddedExpressions = function(entries) {
	var isTrue;
	for(name in entries) if(entries.hasOwnProperty(name)) {
		var m = name.match(/\[\[(.+)\]\]/);
		if(m && m[1]) {
			eval("isTrue = (" + m[1] + ")");
			if(!isTrue) delete entries[name];
		}
	}
};

JSSpec.Spec.prototype.extractOutSpecialEntries = function(entries) {
	this.beforeEach = JSSpec.EMPTY_FUNCTION;
	this.beforeAll = JSSpec.EMPTY_FUNCTION;
	this.afterEach = JSSpec.EMPTY_FUNCTION;
	this.afterAll = JSSpec.EMPTY_FUNCTION;
	
	for(name in entries) if(entries.hasOwnProperty(name)) {
		if(name == 'before' || name == 'before each' || name == 'before_each') {
			this.beforeEach = entries[name];
		} else if(name == 'before all' || name == 'before_all') {
			this.beforeAll = entries[name];
		} else if(name == 'after' || name == 'after each' || name == 'after_each') {
			this.afterEach = entries[name];
		} else if(name == 'after all' || name == 'after_all') {
			this.afterAll = entries[name];
		}
	}
	
	delete entries['before'];
	delete entries['before each'];
	delete entries['before_each'];
	delete entries['before all'];
	delete entries['before_all'];
	delete entries['after'];
	delete entries['after each'];
	delete entries['after_each'];
	delete entries['after all'];
	delete entries['after_all'];
};

JSSpec.Spec.prototype.makeExamplesFromEntries = function(entries) {
	var examples = [];
	for(name in entries) if(entries.hasOwnProperty(name)) {
		examples.push(new JSSpec.Example(name, entries[name], this.beforeEach, this.afterEach));
	}
	return examples;
};

JSSpec.Spec.prototype.makeMapFromExamples = function(examples) {
	var map = {};
	for(var i = 0; i < examples.length; i++) {
		var example = examples[i];
		map[example.id] = examples[i];
	}
	return map;
};

JSSpec.Spec.prototype.getExampleById = function(id) {
	return this.examplesMap[id];
};

JSSpec.Spec.prototype.getExecutor = function() {
	var self = this;
	var onException = function(executor, ex) {
		self.exception = ex;
	};
	
	var composite = new JSSpec.CompositeExecutor();
	composite.addFunction(function() {JSSpec.log.onSpecStart(self);});
	composite.addExecutor(new JSSpec.Executor(this.beforeAll, null, function(exec, ex) {
		self.exception = ex;
		JSSpec.log.onSpecEnd(self);
	}));
	
	var exampleAndAfter = new JSSpec.CompositeExecutor(null,null,true);
	for(var i = 0; i < this.examples.length; i++) {
		exampleAndAfter.addExecutor(this.examples[i].getExecutor());
	}
	exampleAndAfter.addExecutor(new JSSpec.Executor(this.afterAll, null, onException));
	exampleAndAfter.addFunction(function() {JSSpec.log.onSpecEnd(self);});
	composite.addExecutor(exampleAndAfter);
	
	return composite;
};

/**
 * Example
 */
JSSpec.Example = function(name, target, before, after) {
	this.id = JSSpec.Example.id++;
	this.name = name;
	this.target = target;
	this.before = before;
	this.after = after;
};

JSSpec.Example.id = 0;
JSSpec.Example.prototype.isFailure = function() {
	return this.exception && this.exception.type == "failure";
};

JSSpec.Example.prototype.isError = function() {
	return this.exception && !this.exception.type;
};

JSSpec.Example.prototype.getExecutor = function() {
	var self = this;
	var onException = function(executor, ex) {
		self.exception = ex;
	};
	
	var composite = new JSSpec.CompositeExecutor();
	composite.addFunction(function() {JSSpec.log.onExampleStart(self);});
	composite.addExecutor(new JSSpec.Executor(this.before, null, function(exec, ex) {
		self.exception = ex;
		JSSpec.log.onExampleEnd(self);
	}));
	
	var targetAndAfter = new JSSpec.CompositeExecutor(null,null,true);
	
	targetAndAfter.addExecutor(new JSSpec.Executor(this.target, null, onException));
	targetAndAfter.addExecutor(new JSSpec.Executor(this.after, null, onException));
	targetAndAfter.addFunction(function() {JSSpec.log.onExampleEnd(self);});
	
	composite.addExecutor(targetAndAfter);
	
	return composite;
};

/**
 * Runner
 */
JSSpec.Runner = function(specs, logger) {
	JSSpec.log = logger;
	
	this.totalExamples = 0;
	this.specs = [];
	this.specsMap = {};
	this.addAllSpecs(specs);
};

JSSpec.Runner.prototype.addAllSpecs = function(specs) {
	for(var i = 0; i < specs.length; i++) {
		this.addSpec(specs[i]);
	}
};

JSSpec.Runner.prototype.addSpec = function(spec) {
	this.specs.push(spec);
	this.specsMap[spec.id] = spec;
	this.totalExamples += spec.getExamples().length;
};

JSSpec.Runner.prototype.getSpecById = function(id) {
	return this.specsMap[id];
};

JSSpec.Runner.prototype.getSpecByContext = function(context) {
	for(var i = 0; i < this.specs.length; i++) {
		if(this.specs[i].context == context) return this.specs[i];
	}
	return null;
};

JSSpec.Runner.prototype.getSpecs = function() {
	return this.specs;
};

JSSpec.Runner.prototype.hasException = function() {
	return this.getTotalFailures() > 0 || this.getTotalErrors() > 0;
};

JSSpec.Runner.prototype.getTotalFailures = function() {
	var specs = this.specs;
	var failures = 0;
	for(var i = 0; i < specs.length; i++) {
		failures += specs[i].getTotalFailures();
	}
	return failures;
};

JSSpec.Runner.prototype.getTotalErrors = function() {
	var specs = this.specs;
	var errors = 0;
	for(var i = 0; i < specs.length; i++) {
		errors += specs[i].getTotalErrors();
	}
	return errors;
};


JSSpec.Runner.prototype.run = function() {
	JSSpec.log.onRunnerStart();
	var executor = new JSSpec.CompositeExecutor(function() {JSSpec.log.onRunnerEnd()},null,true);
	for(var i = 0; i < this.specs.length; i++) {
		executor.addExecutor(this.specs[i].getExecutor());
	}
	executor.run();
};


JSSpec.Runner.prototype.rerun = function(context) {
	JSSpec.runner = new JSSpec.Runner([this.getSpecByContext(context)], JSSpec.log);
	JSSpec.runner.run();
};

/**
 * Logger
 */
JSSpec.Logger = function() {
	this.finishedExamples = 0;
	this.startedAt = null;
};

JSSpec.Logger.prototype.onRunnerStart = function() {
	this._title = document.title;

	this.startedAt = new Date();
	var container = document.getElementById('jsspec_container');
	if(container) {
		container.innerHTML = "";
	} else {
		container = document.createElement("DIV");
		container.id = "jsspec_container";
		document.body.appendChild(container);
	}
	
	var title = document.createElement("DIV");
	title.id = "title";
	title.innerHTML = [
		'<h1>JSSpec</h1>',
		'<ul>',
		JSSpec.options.rerun ? '<li>[<a href="?" title="rerun all specs">X</a>] ' + JSSpec.util.escapeTags(decodeURIComponent(JSSpec.options.rerun)) + '</li>' : '',
		'	<li><span id="total_examples">' + JSSpec.runner.totalExamples + '</span> examples</li>',
		'	<li><span id="total_failures">0</span> failures</li>',
		'	<li><span id="total_errors">0</span> errors</li>',
		'	<li><span id="progress">0</span>% done</li>',
		'	<li><span id="total_elapsed">0</span> secs</li>',
		'</ul>',
		'<p><a href="http://jania.pe.kr/aw/moin.cgi/JSSpec">JSSpec homepage</a></p>',
	].join("");
	container.appendChild(title);

	var list = document.createElement("DIV");
	list.id = "list";
	list.innerHTML = [
		'<h2>List</h2>',
		'<ul class="specs">',
		function() {
			var specs = JSSpec.runner.getSpecs();
			var sb = [];
			for(var i = 0; i < specs.length; i++) {
				var spec = specs[i];
				sb.push('<li id="spec_' + specs[i].id + '_list"><h3><a href="#spec_' + specs[i].id + '">' + JSSpec.util.escapeTags(specs[i].context) + '</a> [<a href="?rerun=' + encodeURIComponent(specs[i].context) + '">rerun</a>]</h3> </li>');
			}
			return sb.join("");
		}(),
		'</ul>'
	].join("");
	container.appendChild(list);
	
	var log = document.createElement("DIV");
	log.id = "log";
	log.innerHTML = [
		'<h2>Log</h2>',
		'<ul class="specs">',
		function() {
			var specs = JSSpec.runner.getSpecs();
			var sb = [];
			for(var i = 0; i < specs.length; i++) {
				var spec = specs[i];
				sb.push('	<li id="spec_' + specs[i].id + '">');
				sb.push('		<h3>' + JSSpec.util.escapeTags(specs[i].context) + ' [<a href="?rerun=' + encodeURIComponent(specs[i].context) + '">rerun</a>]</h3>');
				sb.push('		<ul id="spec_' + specs[i].id + '_examples" class="examples">');
				for(var j = 0; j < spec.examples.length; j++) {
					var example = spec.examples[j];
					sb.push('			<li id="example_' + example.id + '">');
					sb.push('				<h4>' + JSSpec.util.escapeTags(example.name) + '</h4>');
					sb.push('				<pre class="examples-code"><code>'+JSSpec.util.escapeTags(example.target.toString())+'</code></pre>');
					sb.push('			</li>');
				}
				sb.push('		</ul>');
				sb.push('	</li>');
			}
			return sb.join("");
		}(),
		'</ul>'
	].join("");
	
	container.appendChild(log);
	
	// add event handler for toggling
	var specs = JSSpec.runner.getSpecs();
	var sb = [];
	for(var i = 0; i < specs.length; i++) {
		var spec = document.getElementById("spec_" + specs[i].id);
		var title = spec.getElementsByTagName("H3")[0];
		title.onclick = function(e) {
			var target = document.getElementById(this.parentNode.id + "_examples");
			target.style.display = target.style.display == "none" ? "block" : "none";
			return true;
		}
	}
};

JSSpec.Logger.prototype.onRunnerEnd = function() {
	if(JSSpec.runner.hasException()) {
		var times = 4;
		var title1 = "*" + this._title;
		var title2 = "*F" + JSSpec.runner.getTotalFailures() + " E" + JSSpec.runner.getTotalErrors() + "* " + this._title;
	} else {
		var times = 2;
		var title1 = this._title;
		var title2 = "Success";
	}
	this.blinkTitle(times,title1,title2);
};

JSSpec.Logger.prototype.blinkTitle = function(times, title1, title2) {
	var times = times * 2;
	var mode = true;
	
	var f = function() {
		if(times > 0) {
			document.title = mode ? title1 : title2;
			mode = !mode;
			times--;
			window.setTimeout(f, 500);
		} else {
			document.title = title1;
		}
	};
	
	f();
};

JSSpec.Logger.prototype.onSpecStart = function(spec) {
	var spec_list = document.getElementById("spec_" + spec.id + "_list");
	var spec_log = document.getElementById("spec_" + spec.id);
	
	spec_list.className = "ongoing";
	spec_log.className = "ongoing";
};

JSSpec.Logger.prototype.onSpecEnd = function(spec) {
	var spec_list = document.getElementById("spec_" + spec.id + "_list");
	var spec_log = document.getElementById("spec_" + spec.id);
	var examples = document.getElementById("spec_" + spec.id + "_examples");
	var className = spec.hasException() ? "exception" : "success";

	spec_list.className = className;
	spec_log.className = className;

	if(JSSpec.options.autocollapse && !spec.hasException()) examples.style.display = "none";
	
	if(spec.exception) {
		spec_log.appendChild(document.createTextNode(" - " + spec.exception.message));
	}
};

JSSpec.Logger.prototype.onExampleStart = function(example) {
	var li = document.getElementById("example_" + example.id);
	li.className = "ongoing";
};

JSSpec.Logger.prototype.onExampleEnd = function(example) {
	var li = document.getElementById("example_" + example.id);
	li.className = example.exception ? "exception" : "success";
	
	if(example.exception) {
		var div = document.createElement("DIV");
		div.innerHTML = example.exception.message + "<p><br />" + " at " + example.exception.fileName + ", line " + example.exception.lineNumber + "</p>";
		li.appendChild(div);
	}
	
	var title = document.getElementById("title");
	var runner = JSSpec.runner;
	
	title.className = runner.hasException() ? "exception" : "success";
	
	this.finishedExamples++;
	document.getElementById("total_failures").innerHTML = runner.getTotalFailures();
	document.getElementById("total_errors").innerHTML = runner.getTotalErrors();
	var progress = parseInt(this.finishedExamples / runner.totalExamples * 100);
	document.getElementById("progress").innerHTML = progress;
	document.getElementById("total_elapsed").innerHTML = (new Date().getTime() - this.startedAt.getTime()) / 1000;
	
	document.title = progress + "%: " + this._title;
};

/**
 * IncludeMatcher
 */
JSSpec.IncludeMatcher = function(actual, expected, condition) {
	this.actual = actual;
	this.expected = expected;
	this.condition = condition;
	this.match = false;
	this.explaination = this.makeExplain();
};

JSSpec.IncludeMatcher.createInstance = function(actual, expected, condition) {
	return new JSSpec.IncludeMatcher(actual, expected, condition);
};

JSSpec.IncludeMatcher.prototype.matches = function() {
	return this.match;
};

JSSpec.IncludeMatcher.prototype.explain = function() {
	return this.explaination;
};

JSSpec.IncludeMatcher.prototype.makeExplain = function() {
	if(typeof this.actual.length == 'undefined') {
		return this.makeExplainForNotArray();
	} else {
		return this.makeExplainForArray();
	}
};

JSSpec.IncludeMatcher.prototype.makeExplainForNotArray = function() {
	if(this.condition) {
		this.match = !!this.actual[this.expected];
	} else {
		this.match = !this.actual[this.expected];
	}
	
	var sb = [];
	sb.push('<p>actual value:</p>');
	sb.push('<p style="margin-left:2em;">' + JSSpec.util.inspect(this.actual, false, this.expected) + '</p>');
	sb.push('<p>should ' + (this.condition ? '' : 'not') + ' include:</p>');
	sb.push('<p style="margin-left:2em;">' + JSSpec.util.inspect(this.expected) + '</p>');
	return sb.join("");
};

JSSpec.IncludeMatcher.prototype.makeExplainForArray = function() {
	var matches;
	if(this.condition) {
		for(var i = 0; i < this.actual.length; i++) {
			matches = JSSpec.EqualityMatcher.createInstance(this.expected, this.actual[i]).matches();
			if(matches) {
				this.match = true;
				break;
			}
		}
	} else {
		for(var i = 0; i < this.actual.length; i++) {
			matches = JSSpec.EqualityMatcher.createInstance(this.expected, this.actual[i]).matches();
			if(matches) {
				this.match = false;
				break;
			}
		}
	}
	
	if(this.match) return "";
	
	var sb = [];
	sb.push('<p>actual value:</p>');
	sb.push('<p style="margin-left:2em;">' + JSSpec.util.inspect(this.actual, false, this.condition ? null : i) + '</p>');
	sb.push('<p>should ' + (this.condition ? '' : 'not') + ' include:</p>');
	sb.push('<p style="margin-left:2em;">' + JSSpec.util.inspect(this.expected) + '</p>');
	return sb.join("");
};

/**
 * PropertyLengthMatcher
 */
JSSpec.PropertyLengthMatcher = function(num, property, o, condition) {
	this.num = num;
	this.o = o;
	this.property = property;
	if((property == 'characters' || property == 'items') && typeof o.length != 'undefined') {
		this.property = 'length';
	}
	
	this.condition = condition;
	this.conditionMet = function(x) {
		if(condition == 'exactly') return x.length == num;
		if(condition == 'at least') return x.length >= num;
		if(condition == 'at most') return x.length <= num;

		throw "Unknown condition '" + condition + "'";
	};
	this.match = false;
	this.explaination = this.makeExplain();
};

JSSpec.PropertyLengthMatcher.prototype.makeExplain = function() {
	if(this.o._type == 'String' && this.property == 'length') {
		this.match = this.conditionMet(this.o);
		return this.match ? '' : this.makeExplainForString();
	} else if(typeof this.o.length != 'undefined' && this.property == "length") {
		this.match = this.conditionMet(this.o);
		return this.match ? '' : this.makeExplainForArray();
	} else if(typeof this.o[this.property] != 'undefined' && this.o[this.property] != null) {
		this.match = this.conditionMet(this.o[this.property]);
		return this.match ? '' : this.makeExplainForObject();
	} else if(typeof this.o[this.property] == 'undefined' || this.o[this.property] == null) {
		this.match = false;
		return this.makeExplainForNoProperty();
	}

	this.match = true;
};

JSSpec.PropertyLengthMatcher.prototype.makeExplainForString = function() {
	var sb = [];
	
	var exp = this.num == 0 ?
		'be an <strong>empty string</strong>' :
		'have <strong>' + this.condition + ' ' + this.num + ' characters</strong>';
	
	sb.push('<p>actual value has <strong>' + this.o.length + ' characters</strong>:</p>');
	sb.push('<p style="margin-left:2em;">' + JSSpec.util.inspect(this.o) + '</p>');
	sb.push('<p>but it should ' + exp + '.</p>');
	
	return sb.join("");
};

JSSpec.PropertyLengthMatcher.prototype.makeExplainForArray = function() {
	var sb = [];
	
	var exp = this.num == 0 ?
		'be an <strong>empty array</strong>' :
		'have <strong>' + this.condition + ' ' + this.num + ' items</strong>';

	sb.push('<p>actual value has <strong>' + this.o.length + ' items</strong>:</p>');
	sb.push('<p style="margin-left:2em;">' + JSSpec.util.inspect(this.o) + '</p>');
	sb.push('<p>but it should ' + exp + '.</p>');
	
	return sb.join("");
};

JSSpec.PropertyLengthMatcher.prototype.makeExplainForObject = function() {
	var sb = [];

	var exp = this.num == 0 ?
		'be <strong>empty</strong>' :
		'have <strong>' + this.condition + ' ' + this.num + ' ' + this.property + '.</strong>';

	sb.push('<p>actual value has <strong>' + this.o[this.property].length + ' ' + this.property + '</strong>:</p>');
	sb.push('<p style="margin-left:2em;">' + JSSpec.util.inspect(this.o, false, this.property) + '</p>');
	sb.push('<p>but it should ' + exp + '.</p>');
	
	return sb.join("");
};

JSSpec.PropertyLengthMatcher.prototype.makeExplainForNoProperty = function() {
	var sb = [];
	
	sb.push('<p>actual value:</p>');
	sb.push('<p style="margin-left:2em;">' + JSSpec.util.inspect(this.o) + '</p>');
	sb.push('<p>should have <strong>' + this.condition + ' ' + this.num + ' ' + this.property + '</strong> but there\'s no such property.</p>');
	
	return sb.join("");
};

JSSpec.PropertyLengthMatcher.prototype.matches = function() {
	return this.match;
};

JSSpec.PropertyLengthMatcher.prototype.explain = function() {
	return this.explaination;
};

JSSpec.PropertyLengthMatcher.createInstance = function(num, property, o, condition) {
	return new JSSpec.PropertyLengthMatcher(num, property, o, condition);
};

/**
 * EqualityMatcher
 */
JSSpec.EqualityMatcher = {};

JSSpec.EqualityMatcher.createInstance = function(expected, actual) {
	if(expected == null || actual == null) {
		return new JSSpec.NullEqualityMatcher(expected, actual);
	} else if(expected._type && expected._type == actual._type) {
		if(expected._type == "String") {
			return new JSSpec.StringEqualityMatcher(expected, actual);
		} else if(expected._type == "Date") {
			return new JSSpec.DateEqualityMatcher(expected, actual);
		} else if(expected._type == "Number") {
			return new JSSpec.NumberEqualityMatcher(expected, actual);
		} else if(expected._type == "Array") {
			return new JSSpec.ArrayEqualityMatcher(expected, actual);
		} else if(expected._type == "Boolean") {
			return new JSSpec.BooleanEqualityMatcher(expected, actual);
		}
	}
	
	return new JSSpec.ObjectEqualityMatcher(expected, actual);
};

JSSpec.EqualityMatcher.basicExplain = function(expected, actual, expectedDesc, actualDesc) {
	var sb = [];
	
	sb.push(actualDesc || '<p>actual value:</p>');
	sb.push('<p style="margin-left:2em;">' + JSSpec.util.inspect(actual) + '</p>');
	sb.push(expectedDesc || '<p>should be:</p>');
	sb.push('<p style="margin-left:2em;">' + JSSpec.util.inspect(expected) + '</p>');
	
	return sb.join("");
};

JSSpec.EqualityMatcher.diffExplain = function(expected, actual) {
	var sb = [];

	sb.push('<p>diff:</p>');
	sb.push('<p style="margin-left:2em;">');
	
	var dmp = new diff_match_patch();
	var diff = dmp.diff_main(expected, actual);
	dmp.diff_cleanupEfficiency(diff);
	
	sb.push(JSSpec.util.inspect(dmp.diff_prettyHtml(diff), true));
	
	sb.push('</p>');
	
	return sb.join("");
};

/**
 * BooleanEqualityMatcher
 */
JSSpec.BooleanEqualityMatcher = function(expected, actual) {
	this.expected = expected;
	this.actual = actual;
};

JSSpec.BooleanEqualityMatcher.prototype.explain = function() {
	var sb = [];
	
	sb.push('<p>actual value:</p>');
	sb.push('<p style="margin-left:2em;">' + JSSpec.util.inspect(this.actual) + '</p>');
	sb.push('<p>should be:</p>');
	sb.push('<p style="margin-left:2em;">' + JSSpec.util.inspect(this.expected) + '</p>');
	
	return sb.join("");
};

JSSpec.BooleanEqualityMatcher.prototype.matches = function() {
	return this.expected == this.actual;
};

/**
 * NullEqualityMatcher
 */
JSSpec.NullEqualityMatcher = function(expected, actual) {
	this.expected = expected;
	this.actual = actual;
};

JSSpec.NullEqualityMatcher.prototype.matches = function() {
	return this.expected == this.actual && typeof this.expected == typeof this.actual;
};

JSSpec.NullEqualityMatcher.prototype.explain = function() {
	return JSSpec.EqualityMatcher.basicExplain(this.expected, this.actual);
};

JSSpec.DateEqualityMatcher = function(expected, actual) {
	this.expected = expected;
	this.actual = actual;
};

JSSpec.DateEqualityMatcher.prototype.matches = function() {
	return this.expected.getTime() == this.actual.getTime();
};

JSSpec.DateEqualityMatcher.prototype.explain = function() {
	var sb = [];
	
	sb.push(JSSpec.EqualityMatcher.basicExplain(this.expected, this.actual));
	sb.push(JSSpec.EqualityMatcher.diffExplain(this.expected.toString(), this.actual.toString()));

	return sb.join("");
};

/**
 * ObjectEqualityMatcher
 */
JSSpec.ObjectEqualityMatcher = function(expected, actual) {
	this.expected = expected;
	this.actual = actual;
	this.match = this.expected == this.actual;
	this.explaination = this.makeExplain();
};

JSSpec.ObjectEqualityMatcher.prototype.matches = function() {return this.match};

JSSpec.ObjectEqualityMatcher.prototype.explain = function() {return this.explaination};

JSSpec.ObjectEqualityMatcher.prototype.makeExplain = function() {
	if(this.expected == this.actual) {
		this.match = true;
		return "";
	}
	
	if(JSSpec.util.isDomNode(this.expected)) {
		return this.makeExplainForDomNode();
	}
	
	var key, expectedHasItem, actualHasItem;

	for(key in this.expected) {
		expectedHasItem = this.expected[key] != null && typeof this.expected[key] != 'undefined';
		actualHasItem = this.actual[key] != null && typeof this.actual[key] != 'undefined';
		if(expectedHasItem && !actualHasItem) return this.makeExplainForMissingItem(key);
	}
	for(key in this.actual) {
		expectedHasItem = this.expected[key] != null && typeof this.expected[key] != 'undefined';
		actualHasItem = this.actual[key] != null && typeof this.actual[key] != 'undefined';
		if(actualHasItem && !expectedHasItem) return this.makeExplainForUnknownItem(key);
	}
	
	for(key in this.expected) {
		var matcher = JSSpec.EqualityMatcher.createInstance(this.expected[key], this.actual[key]);
		if(!matcher.matches()) return this.makeExplainForItemMismatch(key);
	}
		
	this.match = true;
};

JSSpec.ObjectEqualityMatcher.prototype.makeExplainForDomNode = function(key) {
	var sb = [];
	
	sb.push(JSSpec.EqualityMatcher.basicExplain(this.expected, this.actual));
	
	return sb.join("");
};

JSSpec.ObjectEqualityMatcher.prototype.makeExplainForMissingItem = function(key) {
	var sb = [];

	sb.push('<p>actual value has no item named <strong>' + JSSpec.util.inspect(key) + '</strong></p>');
	sb.push('<p style="margin-left:2em;">' + JSSpec.util.inspect(this.actual, false, key) + '</p>');
	sb.push('<p>but it should have the item whose value is <strong>' + JSSpec.util.inspect(this.expected[key]) + '</strong></p>');
	sb.push('<p style="margin-left:2em;">' + JSSpec.util.inspect(this.expected, false, key) + '</p>');
	
	return sb.join("");
};

JSSpec.ObjectEqualityMatcher.prototype.makeExplainForUnknownItem = function(key) {
	var sb = [];

	sb.push('<p>actual value has item named <strong>' + JSSpec.util.inspect(key) + '</strong></p>');
	sb.push('<p style="margin-left:2em;">' + JSSpec.util.inspect(this.actual, false, key) + '</p>');
	sb.push('<p>but there should be no such item</p>');
	sb.push('<p style="margin-left:2em;">' + JSSpec.util.inspect(this.expected, false, key) + '</p>');
	
	return sb.join("");
};

JSSpec.ObjectEqualityMatcher.prototype.makeExplainForItemMismatch = function(key) {
	var sb = [];

	sb.push('<p>actual value has an item named <strong>' + JSSpec.util.inspect(key) + '</strong> whose value is <strong>' + JSSpec.util.inspect(this.actual[key]) + '</strong></p>');
	sb.push('<p style="margin-left:2em;">' + JSSpec.util.inspect(this.actual, false, key) + '</p>');
	sb.push('<p>but it\'s value should be <strong>' + JSSpec.util.inspect(this.expected[key]) + '</strong></p>');
	sb.push('<p style="margin-left:2em;">' + JSSpec.util.inspect(this.expected, false, key) + '</p>');
	
	return sb.join("");
};




/**
 * ArrayEqualityMatcher
 */
JSSpec.ArrayEqualityMatcher = function(expected, actual) {
	this.expected = expected;
	this.actual = actual;
	this.match = this.expected == this.actual;
	this.explaination = this.makeExplain();
};

JSSpec.ArrayEqualityMatcher.prototype.matches = function() {return this.match};

JSSpec.ArrayEqualityMatcher.prototype.explain = function() {return this.explaination};

JSSpec.ArrayEqualityMatcher.prototype.makeExplain = function() {
	if(this.expected.length != this.actual.length) return this.makeExplainForLengthMismatch();
	
	for(var i = 0; i < this.expected.length; i++) {
		var matcher = JSSpec.EqualityMatcher.createInstance(this.expected[i], this.actual[i]);
		if(!matcher.matches()) return this.makeExplainForItemMismatch(i);
	}
		
	this.match = true;
};

JSSpec.ArrayEqualityMatcher.prototype.makeExplainForLengthMismatch = function() {
	return JSSpec.EqualityMatcher.basicExplain(
		this.expected,
		this.actual,
		'<p>but it should be <strong>' + this.expected.length + '</strong></p>',
		'<p>actual value has <strong>' + this.actual.length + '</strong> items</p>'
	);
};

JSSpec.ArrayEqualityMatcher.prototype.makeExplainForItemMismatch = function(index) {
	var postfix = ["th", "st", "nd", "rd", "th"][Math.min((index + 1) % 10,4)];
	
	var sb = [];

	sb.push('<p>' + (index + 1) + postfix + ' item (index ' + index + ') of actual value is <strong>' + JSSpec.util.inspect(this.actual[index]) + '</strong>:</p>');
	sb.push('<p style="margin-left:2em;">' + JSSpec.util.inspect(this.actual, false, index) + '</p>');
	sb.push('<p>but it should be <strong>' + JSSpec.util.inspect(this.expected[index]) + '</strong>:</p>');
	sb.push('<p style="margin-left:2em;">' + JSSpec.util.inspect(this.expected, false, index) + '</p>');
	
	return sb.join("");
};

/**
 * NumberEqualityMatcher
 */
JSSpec.NumberEqualityMatcher = function(expected, actual) {
	this.expected = expected;
	this.actual = actual;
};

JSSpec.NumberEqualityMatcher.prototype.matches = function() {
	if(this.expected == this.actual) return true;
};

JSSpec.NumberEqualityMatcher.prototype.explain = function() {
	return JSSpec.EqualityMatcher.basicExplain(this.expected, this.actual);
};

/**
 * StringEqualityMatcher
 */
JSSpec.StringEqualityMatcher = function(expected, actual) {
	this.expected = expected;
	this.actual = actual;
};

JSSpec.StringEqualityMatcher.prototype.matches = function() {
	return this.expected == this.actual;
};

JSSpec.StringEqualityMatcher.prototype.explain = function() {
	var sb = [];

	sb.push(JSSpec.EqualityMatcher.basicExplain(this.expected, this.actual));
	sb.push(JSSpec.EqualityMatcher.diffExplain(this.expected, this.actual));	
	return sb.join("");
};

/**
 * PatternMatcher
 */
JSSpec.PatternMatcher = function(actual, pattern, condition) {
	this.actual = actual;
	this.pattern = pattern;
	this.condition = condition;
	this.match = false;
	this.explaination = this.makeExplain();
};

JSSpec.PatternMatcher.createInstance = function(actual, pattern, condition) {
	return new JSSpec.PatternMatcher(actual, pattern, condition);
};

JSSpec.PatternMatcher.prototype.makeExplain = function() {
	var sb;
	if(this.actual == null || this.actual._type != 'String') {
		sb = [];
		sb.push('<p>actual value:</p>');
		sb.push('<p style="margin-left:2em;">' + JSSpec.util.inspect(this.actual) + '</p>');
		sb.push('<p>should ' + (this.condition ? '' : 'not') + ' match with pattern:</p>');
		sb.push('<p style="margin-left:2em;">' + JSSpec.util.inspect(this.pattern) + '</p>');
		sb.push('<p>but pattern matching cannot be performed.</p>');
		return sb.join("");
	} else {
		this.match = this.condition == !!this.actual.match(this.pattern);
		if(this.match) return "";
		
		sb = [];
		sb.push('<p>actual value:</p>');
		sb.push('<p style="margin-left:2em;">' + JSSpec.util.inspect(this.actual) + '</p>');
		sb.push('<p>should ' + (this.condition ? '' : 'not') + ' match with pattern:</p>');
		sb.push('<p style="margin-left:2em;">' + JSSpec.util.inspect(this.pattern) + '</p>');
		return sb.join("");
	}
};

JSSpec.PatternMatcher.prototype.matches = function() {
	return this.match;
};

JSSpec.PatternMatcher.prototype.explain = function() {
	return this.explaination;
};

/**
 * Domain Specific Languages
 */
JSSpec.DSL = {};

JSSpec.DSL.forString = {
	normalizeHtml: function() {
		var html = this;
		
		// Uniformize quotation, turn tag names and attribute names into lower case
		html = html.replace(/<(\/?)(\w+)([^>]*?)>/img, function(str, closingMark, tagName, attrs) {
			var sortedAttrs = JSSpec.util.sortHtmlAttrs(JSSpec.util.correctHtmlAttrQuotation(attrs).toLowerCase())
			return "<" + closingMark + tagName.toLowerCase() + sortedAttrs + ">"
		});
		
		// validation self-closing tags
		html = html.replace(/<(br|hr|img)([^>]*?)>/mg, function(str, tag, attrs) {
			return "<" + tag + attrs + " />";
		});
		
		// append semi-colon at the end of style value
		html = html.replace(/style="(.*?)"/mg, function(str, styleStr) {
			styleStr = JSSpec.util.sortStyleEntries(styleStr.strip()); // for Safari
			if(styleStr.charAt(styleStr.length - 1) != ';') styleStr += ";"
			
			return 'style="' + styleStr + '"'
		});
		
		// sort style entries
		
		// remove empty style attributes
		html = html.replace(/ style=";"/mg, "");
		
		// remove new-lines
		html = html.replace(/\r/mg, '');
		html = html.replace(/\n/mg, '');
			
		return html;
	}
};


JSSpec.DSL.describe = function(context, entries, base) {
	if(base) {
		for(var i = 0; i < JSSpec.specs.length; i++) {
			if(JSSpec.specs[i].context === base) {
				base = JSSpec.specs[i];
				break;
			}
		}
		
		for(var i = 0; i < base.examples.length; i++) {
			var example = base.examples[i];
			
			if(!entries[example.name]) entries[example.name] = example.target;
		}
	}
	
	JSSpec.specs.push(new JSSpec.Spec(context, entries));
};

JSSpec.DSL.value_of = function(target) {
	if(JSSpec._secondPass) return {};
	
	var subject = new JSSpec.DSL.Subject(target);
	return subject;
};

JSSpec.DSL.Subject = function(target) {
	this.target = target;
};

JSSpec.DSL.Subject.prototype._type = 'Subject';

JSSpec.DSL.Subject.prototype.should_fail = function(message) {
	JSSpec._assertionFailure = {message:message};
	throw JSSpec._assertionFailure;
};

JSSpec.DSL.Subject.prototype.should_be = function(expected) {
	var matcher = JSSpec.EqualityMatcher.createInstance(expected, this.target);
	if(!matcher.matches()) {
		JSSpec._assertionFailure = {message:matcher.explain()};
		throw JSSpec._assertionFailure;
	}
};

JSSpec.DSL.Subject.prototype.should_not_be = function(expected) {
	// TODO JSSpec.EqualityMatcher should support 'condition'
	var matcher = JSSpec.EqualityMatcher.createInstance(expected, this.target);
	if(matcher.matches()) {
		JSSpec._assertionFailure = {message:"'" + this.target + "' should not be '" + expected + "'"};
		throw JSSpec._assertionFailure;
	}
};

JSSpec.DSL.Subject.prototype.should_be_empty = function() {
	this.should_have(0, this.getType() == 'String' ? 'characters' : 'items');
};

JSSpec.DSL.Subject.prototype.should_not_be_empty = function() {
	this.should_have_at_least(1, this.getType() == 'String' ? 'characters' : 'items');
};

JSSpec.DSL.Subject.prototype.should_be_true = function() {
	this.should_be(true);
};

JSSpec.DSL.Subject.prototype.should_be_false = function() {
	this.should_be(false);
};

JSSpec.DSL.Subject.prototype.should_be_null = function() {
	this.should_be(null);
};

JSSpec.DSL.Subject.prototype.should_be_undefined = function() {
	this.should_be(undefined);
};

JSSpec.DSL.Subject.prototype.should_not_be_null = function() {
	this.should_not_be(null);
};

JSSpec.DSL.Subject.prototype.should_not_be_undefined = function() {
	this.should_not_be(undefined);
};

JSSpec.DSL.Subject.prototype._should_have = function(num, property, condition) {
	var matcher = JSSpec.PropertyLengthMatcher.createInstance(num, property, this.target, condition);
	if(!matcher.matches()) {
		JSSpec._assertionFailure = {message:matcher.explain()};
		throw JSSpec._assertionFailure;
	}
};

JSSpec.DSL.Subject.prototype.should_have = function(num, property) {
	this._should_have(num, property, "exactly");
};

JSSpec.DSL.Subject.prototype.should_have_exactly = function(num, property) {
	this._should_have(num, property, "exactly");
};

JSSpec.DSL.Subject.prototype.should_have_at_least = function(num, property) {
	this._should_have(num, property, "at least");
};

JSSpec.DSL.Subject.prototype.should_have_at_most = function(num, property) {
	this._should_have(num, property, "at most");
};

JSSpec.DSL.Subject.prototype.should_include = function(expected) {
	var matcher = JSSpec.IncludeMatcher.createInstance(this.target, expected, true);
	if(!matcher.matches()) {
		JSSpec._assertionFailure = {message:matcher.explain()};
		throw JSSpec._assertionFailure;
	}
};

JSSpec.DSL.Subject.prototype.should_not_include = function(expected) {
	var matcher = JSSpec.IncludeMatcher.createInstance(this.target, expected, false);
	if(!matcher.matches()) {
		JSSpec._assertionFailure = {message:matcher.explain()};
		throw JSSpec._assertionFailure;
	}
};

JSSpec.DSL.Subject.prototype.should_match = function(pattern) {
	var matcher = JSSpec.PatternMatcher.createInstance(this.target, pattern, true);
	if(!matcher.matches()) {
		JSSpec._assertionFailure = {message:matcher.explain()};
		throw JSSpec._assertionFailure;
	}
}
JSSpec.DSL.Subject.prototype.should_not_match = function(pattern) {
	var matcher = JSSpec.PatternMatcher.createInstance(this.target, pattern, false);
	if(!matcher.matches()) {
		JSSpec._assertionFailure = {message:matcher.explain()};
		throw JSSpec._assertionFailure;
	}
};

JSSpec.DSL.Subject.prototype.getType = function() {
	if(typeof this.target == 'undefined') {
		return 'undefined';
	} else if(this.target == null) {
		return 'null';
	} else if(this.target._type) {
		return this.target._type;
	} else if(JSSpec.util.isDomNode(this.target)) {
		return 'DomNode';
	} else {
		return 'object';
	}
};

/**
 * Utilities
 */
JSSpec.util = {
	escapeTags: function(string) {
		return string.replace(/</img, '&lt;').replace(/>/img, '&gt;');
	},
	escapeMetastring: function(string) {
		return string.replace(/\r/img, '\\r').replace(/\n/img, '\\n').replace(/\&para\;\<BR\>/img, '\\n').replace(/\t/img, '\\t');
	},
	parseOptions: function(defaults) {
		var options = defaults;
		
		var url = location.href;
		var queryIndex = url.indexOf('?');
		if(queryIndex == -1) return options;
		
		var query = url.substring(queryIndex + 1).split('#')[0];
		var pairs = query.split('&');
		for(var i = 0; i < pairs.length; i++) {
			var tokens = pairs[i].split('=');
			options[tokens[0]] = tokens[1];
		}
		
		return options;
	},
	correctHtmlAttrQuotation: function(html) {
		html = html.replace(/(\w+)=['"]([^'"]+)['"]/mg,function (str, name, value) {return name + '=' + '"' + value + '"';});
		html = html.replace(/(\w+)=([^ '"]+)/mg,function (str, name, value) {return name + '=' + '"' + value + '"';});
		html = html.replace(/'/mg, '"');
		
		return html;
	},
	sortHtmlAttrs: function(html) {
		var attrs = [];
		html.replace(/((\w+)="[^"]+")/mg, function(str, matched) {
			attrs.push(matched);
		});
		return attrs.length == 0 ? "" : " " + attrs.sort().join(" ");
	},
	sortStyleEntries: function(styleText) {
		var entries = styleText.split(/; /);
		return entries.sort().join("; ");
	},
	escapeHtml: function(str) {
		if(!this._div) {
			this._div = document.createElement("DIV");
			this._text = document.createTextNode('');
			this._div.appendChild(this._text);
		}
		this._text.data = str;
		return this._div.innerHTML;
	},
	isDomNode: function(o) {
		// TODO: make it more stricter
		return (typeof o.nodeName == 'string') && (typeof o.nodeType == 'number');
	},
	inspectDomPath: function(o) {
		var sb = [];
		while(o && o.nodeName != '#document' && o.parent) {
			var siblings = o.parentNode.childNodes;
			for(var i = 0; i < siblings.length; i++) {
				if(siblings[i] == o) {
					sb.push(o.nodeName + (i == 0 ? '' : '[' + i + ']'));
					break;
				}
			}
			o = o.parentNode;
		}
		return sb.join(" &gt; ");
	},
	inspectDomNode: function(o) {
		if(o.nodeType == 1) {
			var nodeName = o.nodeName.toLowerCase();
			var sb = [];
			sb.push('<span class="dom_value">');
			sb.push("&lt;");
			sb.push(nodeName);
			
			var attrs = o.attributes;
			for(var i = 0; i < attrs.length; i++) {
				if(
					attrs[i].nodeValue &&
					attrs[i].nodeName != 'contentEditable' &&
					attrs[i].nodeName != 'style' &&
					typeof attrs[i].nodeValue != 'function'
				) sb.push(' <span class="dom_attr_name">' + attrs[i].nodeName.toLowerCase() + '</span>=<span class="dom_attr_value">"' + attrs[i].nodeValue + '"</span>');
			}
			if(o.style && o.style.cssText) {
				sb.push(' <span class="dom_attr_name">style</span>=<span class="dom_attr_value">"' + o.style.cssText + '"</span>');
			}
			sb.push('&gt;');
			sb.push(JSSpec.util.escapeHtml(o.innerHTML));
			sb.push('&lt;/' + nodeName + '&gt;');
			sb.push(' <span class="dom_path">(' + JSSpec.util.inspectDomPath(o) + ')</span>' );
			sb.push('</span>');
			return sb.join("");
		} else if(o.nodeType == 3) {
			return '<span class="dom_value">#text ' + o.nodeValue + '</span>';
		} else {
			return '<span class="dom_value">UnknownDomNode</span>';
		}
	},
	inspect: function(o, dontEscape, emphasisKey) {
		var sb, inspected;

		if(typeof o == 'undefined') return '<span class="undefined_value">undefined</span>';
		if(o == null) return '<span class="null_value">null</span>';
		if(o._type == 'String') return '<span class="string_value">"' + (dontEscape ? JSSpec.util.escapeMetastring(o) : JSSpec.util.escapeHtml(JSSpec.util.escapeMetastring(o))) + '"</span>';

		if(o._type == 'Date') {
			return '<span class="date_value">"' + o.toString() + '"</span>';
		}
		
		if(o._type == 'Number') return '<span class="number_value">' + (dontEscape ? o : JSSpec.util.escapeHtml(o)) + '</span>';
		
		if(o._type == 'Boolean') return '<span class="boolean_value">' + o + '</span>';

		if(o._type == 'RegExp') return '<span class="regexp_value">' + JSSpec.util.escapeHtml(o.toString()) + '</span>';

		if(JSSpec.util.isDomNode(o)) return JSSpec.util.inspectDomNode(o);

		if(o._type == 'Array' || typeof o.length != 'undefined') {
			sb = [];
			for(var i = 0; i < o.length; i++) {
				inspected = JSSpec.util.inspect(o[i]);
				sb.push(i == emphasisKey ? ('<strong>' + inspected + '</strong>') : inspected);
			}
			return '<span class="array_value">[' + sb.join(', ') + ']</span>';
		}
		
		// object
		sb = [];
		for(var key in o) {
			if(key == 'should') continue;
			
			inspected = JSSpec.util.inspect(key) + ":" + JSSpec.util.inspect(o[key]);
			sb.push(key == emphasisKey ? ('<strong>' + inspected + '</strong>') : inspected);
		}
		return '<span class="object_value">{' + sb.join(', ') + '}</span>';
	}
};

describe = JSSpec.DSL.describe;
behavior_of = JSSpec.DSL.describe;
value_of = JSSpec.DSL.value_of;
expect = JSSpec.DSL.value_of; // @deprecated

String.prototype._type = "String";
Number.prototype._type = "Number";
Date.prototype._type = "Date";
Array.prototype._type = "Array";
Boolean.prototype._type = "Boolean";
RegExp.prototype._type = "RegExp";

var targets = [Array.prototype, Date.prototype, Number.prototype, String.prototype, Boolean.prototype, RegExp.prototype];

String.prototype.normalizeHtml = JSSpec.DSL.forString.normalizeHtml;
String.prototype.asHtml = String.prototype.normalizeHtml; //@deprecated
String.prototype.strip = function() {return this.replace(/^\s+/, '').replace(/\s+$/, '');}


/**
 * Main
 */
JSSpec.defaultOptions = {
	autorun: 1,
	specIdBeginsWith: 0,
	exampleIdBeginsWith: 0,
	autocollapse: 1
};
JSSpec.options = JSSpec.util.parseOptions(JSSpec.defaultOptions);

JSSpec.Spec.id = JSSpec.options.specIdBeginsWith;
JSSpec.Example.id = JSSpec.options.exampleIdBeginsWith;



window.onload = function() {
	if(JSSpec.specs.length > 0) {
		if(!JSSpec.options.inSuite) {
			JSSpec.runner = new JSSpec.Runner(JSSpec.specs, new JSSpec.Logger());
			if(JSSpec.options.rerun) {
				JSSpec.runner.rerun(decodeURIComponent(JSSpec.options.rerun));
			} else {
				JSSpec.runner.run();
			}
		} else {
			// in suite, send all specs to parent
			var parentWindow = window.frames.parent.window;
			for(var i = 0; i < JSSpec.specs.length; i++) {
				parentWindow.JSSpec.specs.push(JSSpec.specs[i]);
			}
		}
	} else {
		var links = document.getElementById('list').getElementsByTagName('A');
		var frameContainer = document.createElement('DIV');
		frameContainer.style.display = 'none';
		document.body.appendChild(frameContainer);
		
		for(var i = 0; i < links.length; i++) {
			var frame = document.createElement('IFRAME');
			frame.src = links[i].href + '?inSuite=0&specIdBeginsWith=' + (i * 10000) + '&exampleIdBeginsWith=' + (i * 10000);
			frameContainer.appendChild(frame);
		}
	}
}