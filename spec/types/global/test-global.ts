/// <reference path="../../../build/types/knockout.d.ts" />
/// <reference path="_references.d.ts" />

declare var $: any;

function test_creatingVMs() {
    const myViewModel = {
        personName: ko.observable('Bob'),
        personAge: ko.observable(123)
    };

    ko.applyBindings(myViewModel);
    ko.applyBindings(myViewModel, document.body, (ctx) => { ctx.x = "test"; });
    ko.applyBindings(myViewModel, document.getElementById('someElementId')!);

    myViewModel.personName();
    myViewModel.personName('Mary');
    myViewModel.personAge(50);

    const subscription = myViewModel.personName.subscribe(newValue => {
        alert("The person's new name is " + newValue);
    });

    // arrayChange event works for any observable
    myViewModel.personName.extend({ trackArrayChanges: true });
    myViewModel.personName.subscribe(changes => {
        console.log(changes[0].value.toUpperCase());
    }, myViewModel, "arrayChange");

    ko.when<string>(myViewModel.personName, value => {
        console.log("personName has a value of ", value.toUpperCase());
    });

    ko.when(() => {
        return !myViewModel.personName();
    }).then(x => {
        if (x === true) {
            console.log("personName is clear");
        } else {
            throw Error("Should never happen");
        }
    });

    subscription.dispose();
}

function test_computed() {
    class AppViewModel {
        public firstName = ko.observable("Bob");
        public lastName = ko.observable("Smith");

        public fullName = ko.pureComputed(() => this.firstName() + " " + this.lastName());
    }

    class MyViewModel {
        public firstName = ko.observable("Planet");
        public lastName = ko.observable("Earth");

        public fullName = ko.pureComputed({
            read: () => this.firstName() + " " + this.lastName(),
            write: (value) => {
                const lastSpacePos = value.lastIndexOf(" ");
                if (lastSpacePos > 0) {
                    this.firstName(value.substring(0, lastSpacePos));
                    this.lastName(value.substring(lastSpacePos + 1));
                }
            }
        });
    }

    class MyViewModel1 {
        public price = ko.observable(25.99);

        public formattedPrice = ko.pureComputed({
            read: () => "$" + this.price().toFixed(2),
            write: value => {
                const num = parseFloat(value.replace(/[^\.\d]/g, ""));
                this.price(isNaN(num) ? 0 : num);
            }
        });
    }

    class MyViewModel2 {
        public acceptedNumericValue = ko.observable(123);
        public lastInputWasValid = ko.observable(true);

        public attemptedValue = ko.computed<number, this>({
            read: this.acceptedNumericValue,
            write: function (value) {
                if (isNaN(value))
                    this.lastInputWasValid(false);
                else {
                    this.lastInputWasValid(true);
                    this.acceptedNumericValue(value);
                }
            },
            owner: this
        });
    }

    ko.applyBindings(new MyViewModel());
}

class GetterViewModel {
    private _selectedRange = ko.observable();
    public range = ko.observable();
}

function testGetter() {
    const model = new GetterViewModel();

    model.range.subscribe((range: number) => {
        console.log(range);
    });
}

function test_observableArrays() {
    const myObservableArray = ko.observableArray<string>();
    myObservableArray.push('Some value');

    const anotherObservableArray = ko.observableArray([
        { name: "Bungle", type: "Bear", age: 10 },
        { name: "George", type: "Hippo", age: 20 },
        { name: "Zippy", type: "Unknown", age: 25 }
    ]);

    const multiTypeObservableArray = ko.observableArray<string | number | undefined>();

    anotherObservableArray.subscribe(changes => {
        console.log(changes[0].value.name.toUpperCase());
    }, null, "arrayChange");

    myObservableArray().length;
    myObservableArray()[0];

    myObservableArray.indexOf('Blah');

    myObservableArray.push('Some new value');
    myObservableArray.push('v1', 'v2', 'v3');
    myObservableArray.pop();

    myObservableArray.unshift('Some new value');
    myObservableArray.shift();

    myObservableArray.reverse();
    myObservableArray.sort();
    myObservableArray.sort((left, right) => left == right ? 0 : (left < right ? -1 : 1));

    myObservableArray.splice(1, 3);

    myObservableArray.remove('Blah');
    anotherObservableArray.remove(item => item.age < 18);

    multiTypeObservableArray.removeAll(['Chad', 132, undefined]);
    myObservableArray.removeAll();

    myObservableArray.destroy('Blah');
    anotherObservableArray.destroy(someItem => someItem.age < 18);
    multiTypeObservableArray.destroyAll(['Chad', 132, undefined]);

    myObservableArray.destroyAll();

    ko.utils.arrayForEach(anotherObservableArray(), item => {
        console.log(item.name);
    });
}

// You have to extend knockout for your own handlers
// declare namespace ko {
//     export interface BindingHandlers {
//         yourBindingName: ko.BindingHandler;
//         slideVisible: ko.BindingHandler;
//         allowBindings: ko.BindingHandler;
//         withProperties: ko.BindingHandler;
//         randomOrder: ko.BindingHandler;
//     }
// }

function test_bindings() {
    const currentProfit = ko.observable(150000);
    ko.applyBindings({
        people: [
            { firstName: 'Bert', lastName: 'Bertington' },
            { firstName: 'Charles', lastName: 'Charlesforth' },
            { firstName: 'Denise', lastName: 'Dentiste' }
        ]
    });

    const viewModel = { availableCountries: ko.observableArray(['France', 'Germany', 'Spain']) };
    viewModel.availableCountries.push('China');

    ko.bindingHandlers.yourBindingName = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            return { "controlsDescendantBindings": true };
        }
    };

    ko.bindingHandlers.slideVisible = {
        update: function (element, valueAccessor, allBindingsAccessor) {
            const
                value = valueAccessor(), allBindings = allBindingsAccessor(),
                valueUnwrapped = ko.utils.unwrapObservable(value),
                duration = allBindings.slideDuration || 400;

            if (valueUnwrapped == true)
                $(element).slideDown(duration);
            else
                $(element).slideUp(duration);
        },
        init: function (element, valueAccessor) {
            const value = ko.utils.unwrapObservable(valueAccessor());
            $(element).toggle(value);
        }
    };

    ko.bindingHandlers.hasFocus = {
        init: function (element, valueAccessor) {
            $(element)
                .focus(() => {
                    const value = valueAccessor();
                    value(true);
                })
                .blur(() => {
                    const value = valueAccessor();
                    value(false);
                });
        },
        update: function (element, valueAccessor) {
            var value = valueAccessor();
            if (ko.utils.unwrapObservable(value))
                element.focus();
            else
                element.blur();
        }
    };

    ko.bindingHandlers.allowBindings = {
        init: function (elem, valueAccessor) {
            var shouldAllowBindings = ko.utils.unwrapObservable(valueAccessor());
            return { controlsDescendantBindings: !shouldAllowBindings };
        }
    };

    ko.bindingHandlers.withProperties = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            const
                newProperties = valueAccessor(),
                innerBindingContext = bindingContext.extend(newProperties);

            ko.applyBindingsToDescendants(innerBindingContext, element);

            return { controlsDescendantBindings: true };
        }
    };

    ko.bindingHandlers.withProperties = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var newProperties = valueAccessor(),
                childBindingContext = bindingContext.createChildContext(viewModel);

            ko.utils.extend(childBindingContext, newProperties);
            ko.applyBindingsToDescendants(childBindingContext, element);

            return { controlsDescendantBindings: true };
        }
    };

    ko.bindingHandlers.randomOrder = {
        init: function (elem, valueAccessor) {
            var child = ko.virtualElements.firstChild(elem),
                childElems = [];

            while (child) {
                childElems.push(child);
                child = ko.virtualElements.nextSibling(child);
            }

            ko.virtualElements.emptyNode(elem);

            while (childElems.length) {
                var randomIndex = Math.floor(Math.random() * childElems.length),
                    chosenChild = childElems.splice(randomIndex, 1);
                ko.virtualElements.prepend(elem, chosenChild[0]);
            }
        }
    };

    let node: Node = new Node(), containerElem: Element = new Element(),
        nodeToInsert: Node = new Node(), insertAfter: Node = new Node(), nodeToPrepend: Node = new Node(), arrayOfNodes: Node[] = [];

    ko.virtualElements.emptyNode(containerElem);
    ko.virtualElements.firstChild(containerElem);
    ko.virtualElements.insertAfter(containerElem, nodeToInsert, insertAfter);
    ko.virtualElements.nextSibling(node);
    ko.virtualElements.prepend(containerElem, nodeToPrepend);
    ko.virtualElements.setDomNodeChildren(containerElem, arrayOfNodes);
}

function test_more() {
    const viewModel = {
        firstName: ko.observable("Bert"),
        lastName: ko.observable("Smith"),
        pets: ko.observableArray(["Cat", "Dog", "Fish"]),
        type: "Customer",
        hasALotOfPets: <any>null
    };

    viewModel.hasALotOfPets = ko.computed(() => viewModel.pets().length > 2);

    const plainJs = ko.toJS(viewModel);
    var petsInitials = plainJs.pets.map(x => x.charAt(0));

    ko.extenders.logChange = function (target: ko.Subscribable, option: string) {
        target.subscribe((newValue: string) => {
            console.log(option + ": " + newValue);
        });

        return target;
    };

    ko.extenders.numeric = function (target: ko.Subscribable, precision: number) {
        var result = ko.computed<any>({
            read: target,
            write: (newValue) => {
                var current = target(),
                    roundingMultiplier = Math.pow(10, precision),
                    newValueAsNum = isNaN(newValue) ? 0 : parseFloat(newValue),
                    valueToWrite = Math.round(newValueAsNum * roundingMultiplier) / roundingMultiplier;

                if (valueToWrite !== current) {
                    target(valueToWrite);
                } else {
                    if (newValue !== current) {
                        target.notifySubscribers(valueToWrite);
                    }
                }
            }
        });

        result(target());

        return result;
    };

    class AppViewModel {
        myNumberOne: ko.Observable<number>;
        myNumberTwo: ko.Observable<number>;

        constructor(one: number, two: number) {
            this.myNumberOne = ko.observable(one).extend({ numeric: 0 });
            this.myNumberTwo = ko.observable(two).extend({ numeric: 2 });
        }
    }

    ko.applyBindings(new AppViewModel(221.2234, 123.4525));

    ko.extenders.required = function (target: any, overrideMessage: string) {

        target.hasError = ko.observable();
        target.validationMessage = ko.observable();

        function validate(newValue: any) {
            target.hasError(newValue ? false : true);
            target.validationMessage(newValue ? "" : overrideMessage || "This field is required");
        }

        validate(target());

        target.subscribe(validate);

        return target;
    };

    class AppViewModel2 {
        firstName: ko.Observable<string>;
        lastName: ko.Observable<string>;

        constructor(first: string, last: string) {
            this.firstName = ko.observable(first).extend({ required: "Please enter a first name" });
            this.lastName = ko.observable(last).extend({ required: "" });
        }

        test() {
            const first: string = "test";
            this.firstName = ko.observable(first).extend({ required: "Please enter a first name", logChange: "first name", validate: v => !!v.match(/^.+$/) });
        }
    }

    ko.applyBindings(new AppViewModel2("Bob", "Smith"));

    let name = "";
    const upperCaseName = ko.computed(() => name.toUpperCase()).extend({ throttle: 500 });

    class AppViewModel3 {
        // Observable<string | undefined> since there's no initial value
        public instantaneousValue = ko.observable<string>();
        public throttledValue = ko.computed(this.instantaneousValue)
            .extend({ throttle: 400 });

        public loggedValues = ko.observableArray<string>([]);

        public throttledValueLogger = ko.computed(() => {
            const val = this.instantaneousValue();
            if (val && val !== '')
                this.loggedValues.push(val);
        });
    }

    class GridViewModel {
        public pageSize = ko.observable(20);
        public pageIndex = ko.observable(1);
        public currentPageData = ko.observableArray();

        constructor() {

            ko.computed(() => {
                const params = { page: this.pageIndex(), size: this.pageSize() };
                $.getJSON('/Some/Json/Service', params, this.currentPageData);
            });
        }
    }

    function setPageSize(this: GridViewModel, newPageSize: number) {
        this.pageSize(newPageSize);
        this.pageIndex(1);
    };

    var grid = new GridViewModel();
    ko.computed(function (this: GridViewModel) {
        var params = { page: this.pageIndex(), size: this.pageSize() };
        $.getJSON('/Some/Json/Service', params, this.currentPageData);
    }, grid).extend({ throttle: 1 });

    const removeDom = document.querySelector(".remove");
    if (removeDom) {
        removeDom.addEventListener("click", function (this: HTMLElement) {
            viewModel.pets.remove(ko.dataFor(this));
        });

        removeDom.addEventListener("click", function (this: HTMLElement) {
            viewModel.pets.remove(ko.dataFor(this));
        });
    }

    ko.observableArray.fn.filterByProperty = function (propName: string, matchValue: boolean) {
        return ko.pureComputed(() => {
            const allItems = this(), matchingItems = [];
            for (let current of allItems) {
                if (ko.utils.unwrapObservable(current[propName]) === matchValue)
                    matchingItems.push(current);
            }
            return matchingItems;
        });
    }

    class Task {
        public title: ko.Observable<string>;
        public done: ko.Observable<boolean>;

        constructor(title: string, done: boolean) {
            this.title = ko.observable(title);
            this.done = ko.observable(done);
        }
    }

    class AppViewModel4 {
        public tasks = ko.observableArray([
            new Task('Find new desktop background', true),
            new Task('Put shiny stickers on laptop', false),
            new Task('Request more reggae music in the office', true)
        ]);

        public doneTasks = this.tasks.filterByProperty("done", true);

        constructor() {
            this.doneTasks = ko.computed(() => {
                const all = this.tasks(), done = [];
                for (let cur of all)
                    if (cur.done())
                        done.push(cur);
                return done;
            }, this);
        }
    }

    ko.applyBindings(new AppViewModel4());;
}

function test_misc(this: any) {
    // define dummy vars
    let callback: any;
    let target: any;
    let topic: any;
    let vm: any;
    let value: any;

    const postbox = new ko.subscribable();
    postbox.subscribe(callback, target, topic);

    postbox.subscribe(function (this: typeof vm, newValue: string) {
        this.latestTopic(newValue);
    }, vm, "mytopic");

    postbox.notifySubscribers(value, "mytopic");

    ko.subscribable.fn.publishOn = function (topic: string) {
        this.subscribe(function (newValue) {
            postbox.notifySubscribers(newValue, topic);
        });

        return this;
    };

    this.myObservable = ko.observable("myValue").publishOn("myTopic");

    ko.subscribable.fn.subscribeTo = function (this: any, topic: string) {
        postbox.subscribe(this, null, topic);
        return this;
    };

    this.observableFromAnotherVM = ko.observable().subscribeTo("myTopic");

    postbox.subscribe(function (this: ko.Subscribable, newValue: string) {
        this(newValue);
    }, this, topic);

    ko.bindingHandlers.isolatedOptions = {
        init: function (element, valueAccessor) {
            var args = arguments;
            ko.computed({
                read: () => {
                    ko.utils.unwrapObservable(valueAccessor());
                    ko.bindingHandlers.options.update.apply(this, args as any);
                },
                owner: this,
                disposeWhenNodeIsRemoved: element
            });
        }
    };

    ko.subscribable.fn.publishOn = function (topic: string) {
        this.subscribe(function (newValue) {
            postbox.notifySubscribers(newValue, topic);
        });

        return this;
    };

    this.myObservable = ko.observable("myValue").publishOn("myTopic");

    var x = ko.observableArray([1, 2, 3]);

    let element = new HTMLElement();
    ko.utils.domNodeDisposal.addDisposeCallback(element, el => {
        $(el).datepicker("destroy");
    });

    this.observableFactory = function (readonly: boolean = false): ko.Subscribable<number> {
        if (readonly) {
            return ko.computed(() => 3);
        } else {
            return ko.observable(3);
        }
    }

}

function test_customObservable() {
    // See https://github.com/knockout/knockout/issues/2072
    var modelAttributeObservable = (model: any, attribute: any): ko.Observable => {
        // Check the attribute exists
        if (!(attribute in model)) {
            throw new ReferenceError(attribute + ' is not an attribute of the supplied model');
        }

        // Set up the attribute observable cache
        model._koObservables || (model._koObservables = {});

        // If we already have a cached observable then just return it
        if (attribute in model._koObservables) {
            return model._koObservables[attribute];
        }

        // Create our observable getter/setter function
        var observableAttribute = <ko.Observable>(function (this: any): any {
            if (arguments.length > 0) {
                observableAttribute.valueWillMutate();
                model[attribute] = arguments[0];
                return this;
            } else {
                // The caller only needs to be notified of changes if they did a "read" operation
                ko.computedContext.registerDependency(observableAttribute);
                return observableAttribute.peek();
            }
        });

        // Create a function to fetch the attribute value that
        // is in the correct context so it has access to the model.
        observableAttribute.peek = function () {
            return model[attribute];
        }

        // Register to listen to change events on the model attribute
        model.on('change:' + attribute, function () {
            observableAttribute.valueHasMutated();
        });

        // Initialise the observableAttribute as a subscribable
        // Then override the prototype to make it a subclass
        ko.subscribable.fn.init(observableAttribute);
        (<any>observableAttribute).__proto__ = observableAttribute_fn;

        // setup the deferred update extender if needed
        ko.options['deferUpdates'] && ko.extenders['deferred'](observableAttribute, true);

        // Cache the observableAttribute function and return it
        return (model._koObservables[attribute] = observableAttribute);
    };

    // Setup the prototype for the observableAttribute as a subclass of subscribable
    var observableAttribute_fn = {
        __proto__: ko.subscribable['fn'],
        valueHasMutated: function (this: ko.Observable) { this.notifySubscribers(this.peek()); },
        valueWillMutate: function (this: ko.Observable) { this.notifySubscribers(this.peek(), 'beforeChange'); },

        // Make KO treat the observableAttribute function as an observable
        __ko_proto__: ko.observable
    };
}

function test_allBindingsAccessor() {
    ko.bindingHandlers.allBindingsAccessorTest = {
        init: (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) => {
            var allBindings = allBindingsAccessor();
            var hasBinding = allBindingsAccessor.has("myBindingName");
            var myBinding = allBindingsAccessor.get("myBindingName");
            var fnAccessorBinding = allBindingsAccessor().myBindingName;
        },
        update: (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) => {
            var allBindings = allBindingsAccessor();
            var hasBinding = allBindingsAccessor.has("myBindingName");
            var myBinding = allBindingsAccessor.get("myBindingName");
            var fnAccessorBinding = allBindingsAccessor().myBindingName;
        }
    };
}


function test_Components() {

    // test all possible ko.components.register() overloads
    function test_Register() {
        // reused parameters
        const nodeArray = [new Node, new Node];
        const singleNode = new Node;
        const viewModelFn = function (params: any) { return <any>null; }
        class ViewModelClass { }

        // ------- viewmodel overloads:
        // viewModel as inline function (commonly used in examples)
        ko.components.register("name", { template: "string-template", viewModel: viewModelFn });

        // viewModel as a Class
        ko.components.register("name", { template: "string-template", viewModel: ViewModelClass });

        // viewModel from shared instance
        ko.components.register("name", { template: "string-template", viewModel: { instance: null } });

        // viewModel from createViewModel factory method
        ko.components.register("name", { template: "string-template", viewModel: { createViewModel: function (params: any, componentInfo: ko.components.ComponentInfo) { return null; } } });

        // viewModel from an AMD module
        ko.components.register("name", { template: "string-template", viewModel: { require: "module" } });

        // ------- template overloads
        // template from named element
        ko.components.register("name", { template: { element: "elementID" }, viewModel: viewModelFn });

        // template using single Node
        ko.components.register("name", { template: { element: singleNode }, viewModel: viewModelFn });

        // template using Node array
        ko.components.register("name", { template: nodeArray, viewModel: viewModelFn });

        // template using an AMD module
        ko.components.register("name", { template: { require: "text!module" }, viewModel: viewModelFn });

        // Empty config for registering custom elements that are handled by name convention
        ko.components.register('name', { /* No config needed */ });
    }

    function test_DefaultLoader() {
        ko.components.defaultLoader.getConfig("name", (config: ko.components.Config) => { config.synchronous = true; });
    }
}


function testUnwrapUnion(this: any) {
    let possibleObs: ko.Observable<number> | number = this.getValue();
    const num = ko.unwrap(possibleObs);
}


function testToJS() {
    const obj: {
        foo: string
        bar: string
    } = ko.toJS({ foo: ko.observable(''), bar: '' })

    const arr: {
        foo: string
        bar: string
    }[] = ko.toJS([{ foo: ko.observable(''), bar: '' }])

    const observableArr: {
        foo: string
        bar: string
    }[] = ko.toJS(ko.observableArray([ ko.observable({ foo: ko.observable(''), bar: '' }) ]))

    const nestedObj: {
        foo: {
            bar: string
        }
    } = ko.toJS(
        ko.observable({
            foo: ko.observable({ bar: '' })
        })
    )

    const builtins: {
        date: Date
        regexp: RegExp
        func: (v: string) => string
    } = ko.toJS({
        date: new Date(),
        regexp: /foo/,
        func: (v: string) => ''
    })
}


// *****************************
// Template and Databinding Tests
// *****************************

class DummyTemplateSource {
    constructor(private engine: DummyTemplateEngine, public id: string) { }

    text(): string;
    text(val: string): void;
    text(val?: string) {
        if (arguments.length > 0) {
            this.engine.inMemoryTemplates[this.id] = val;
        }
        else {
            return this.engine.inMemoryTemplates[this.id];
        }
    }

    data(): any;
    data(val: any): void;
    data(val?: any) {
        if (arguments.length > 0) {
            this.engine.inMemoryTemplateData[this.id] = val;
        }
        else {
            return this.engine.inMemoryTemplateData[this.id];
        }
    }
}

class DummyTemplateEngine extends ko.templateEngine {
    public inMemoryTemplates: { [key: string]: any } = {};
    public inMemoryTemplateData: { [key: string]: any } = {};

    constructor(templates?: { [key: string]: any }) {
        super();
        this.inMemoryTemplateData = templates || {};
    }

    public makeTemplateSource(template: string | Node, templateDocument?: Document): ko.TemplateSource {
        if (typeof template === "string") {
            return new DummyTemplateSource(this, template); // Named template comes from the in-memory collection
        }
        else if ((template.nodeType == 1) || (template.nodeType == 8)) {
            return new ko.templateSources.anonymousTemplate(template); // Anonymous
        }
        else {
            throw new Error("Unrecognized template source");
        }
    }

    public renderTemplateSource(templateSource: ko.TemplateSource, bindingContext: ko.BindingContext<any>, options?: ko.TemplateOptions<any>, templateDocument?: Document): Node[] {
        const data = bindingContext['$data'];
        options = options || {};
        let templateText = templateSource.text() as string | Function;
        if (typeof templateText == "function")
            templateText = templateText(data, options) as string;

        templateText = options.showParams ? templateText + ", data=" + data + ", options=" + options : templateText;
        var templateOptions = options.templateOptions; // Have templateOptions in scope to support [js:templateOptions.foo] syntax
        var result;
        //with (bindingContext)
        {
            //with (data || {})
            {
                //with (options.templateRenderingVariablesInScope || {})
                {
                    // Dummy [renderTemplate:...] syntax
                    result = templateText.replace(/\[renderTemplate\:(.*?)\]/g, function (match, templateName) {
                        return ko.renderTemplate(templateName, data, options || {});
                    });


                    var evalHandler = function (match: string, script: any) {
                        try {
                            var evalResult = eval(script);
                            return (evalResult === null) || (evalResult === undefined) ? "" : evalResult.toString();
                        } catch (ex) {
                            throw new Error("Error evaluating script: [js: " + script + "]\n\nException: " + ex.toString());
                        }
                    }

                    // Dummy [[js:...]] syntax (in case you need to use square brackets inside the expression)
                    result = result.replace(/\[\[js\:([\s\S]*?)\]\]/g, evalHandler);

                    // Dummy [js:...] syntax
                    result = result.replace(/\[js\:([\s\S]*?)\]/g, evalHandler);
                }
            }
        }

        // Use same HTML parsing code as real template engine so as to trigger same combination of IE weirdnesses
        // Also ensure resulting nodelist is an array to mimic what the default templating engine does, so we see the effects of not being able to remove dead memo comment nodes.
        return ko.utils.arrayPushAll([], ko.utils.parseHtmlFragment(result));
    }

    public rewriteTemplate(template: string | Node, rewriterCallback: (val: string) => any) {
        // Only rewrite if the template isn't a function (can't rewrite those)
        var templateSource = new ko.templateSources.anonymousTemplate(template as any); //this.makeTemplateSource(template);
        if (typeof templateSource.text() != "function")
            return ko.templateEngine.prototype.rewriteTemplate.call(this, template, rewriterCallback);
    }

    public createJavaScriptEvaluatorBlock(script: string): string {
        return "[js:" + script + "]";
    };

}

let testNode: any;

ko.setTemplateEngine(new ko.nativeTemplateEngine());

ko.setTemplateEngine(new DummyTemplateEngine({ x: [document.createElement("div"), document.createElement("span")] }));
ko.renderTemplate("x", null);

var threw = false;
ko.setTemplateEngine(undefined);
try { ko.renderTemplate("someTemplate", {}) }
catch (ex) { threw = true }

ko.setTemplateEngine(new DummyTemplateEngine({ someTemplate: "ABC" }));
ko.renderTemplate("someTemplate", null, null, testNode);

ko.setTemplateEngine(new DummyTemplateEngine({ emptyTemplate: "" }));
ko.renderTemplate("emptyTemplate", null, null, testNode);

var passedElement, passedDataItem;
var myCallback = function (elementsArray: Node[], dataItem: any) {
    passedElement = elementsArray[0];
    passedDataItem = dataItem;
}

var myModel = {};
ko.setTemplateEngine(new DummyTemplateEngine({ someTemplate: "ABC" }));
ko.renderTemplate("someTemplate", myModel, { afterRender: myCallback }, testNode);

var dependency = ko.observable("A");
ko.setTemplateEngine(new DummyTemplateEngine({ someTemplate: () => "Value = " + dependency() }));

ko.renderTemplate("someTemplate", null, null, testNode);

dependency("B");

var observable = ko.observable("A"), count = 0;
var myCallback = function (elementsArray: Node[], dataItem: any) {
    observable();   // access observable in callback
};
var myTemplate = function () {
    return "Value = " + (++count);
};
ko.setTemplateEngine(new DummyTemplateEngine({ someTemplate: myTemplate }));
ko.renderTemplate("someTemplate", {}, { afterRender: myCallback }, testNode);

observable("B");

var observable = ko.observable("A");
ko.setTemplateEngine(new DummyTemplateEngine({
    someTemplate: function (data: string) {
        return "Value = " + data;
    }
}));
ko.renderTemplate("someTemplate", observable, null, testNode);

observable("B");

var dependency = ko.observable("A");
var template = { someTemplate: () => "Value = " + dependency() };
ko.setTemplateEngine(new DummyTemplateEngine(template));

ko.renderTemplate("someTemplate", null, null, testNode);

testNode.parentNode.removeChild(testNode);
dependency("B");

ko.setTemplateEngine(new DummyTemplateEngine({ someTemplate: "template output" }));
testNode.innerHTML = "<div data-bind='template:\"someTemplate\"'></div>";
ko.applyBindings(null, testNode);

ko.setTemplateEngine(new DummyTemplateEngine({ someTemplate: "result = [js: childProp]" }));
testNode.innerHTML = "<div data-bind='template: { name: \"someTemplate\", data: someProp }'></div>";
ko.applyBindings({ someProp: { childProp: 123 } }, testNode);

ko.setTemplateEngine(new DummyTemplateEngine({ someTemplate: "result = [js: childProp]" }));
testNode.innerHTML = "<div data-bind='template: { name: \"someTemplate\", data: someProp }'></div>";

var myData = ko.observable({ childProp: 123 });
ko.applyBindings({ someProp: myData }, testNode);

// Now mutate and notify
myData().childProp = 456;
myData.valueHasMutated();

var innerObservable = ko.observable("some value");
ko.setTemplateEngine(new DummyTemplateEngine({ someTemplate: "result = [js: childProp()]" }));
testNode.innerHTML = "<div data-bind='template: { name: \"someTemplate\", data: someProp }'></div>";
ko.applyBindings({ someProp: { childProp: innerObservable } }, testNode);

ko.removeNode(testNode.childNodes[0]);

ko.setTemplateEngine(new DummyTemplateEngine({
    firstTemplate: "First template output",
    secondTemplate: "Second template output"
}));

var chosenTemplate = ko.observable("firstTemplate");
testNode.innerHTML = "<div data-bind='template: chosenTemplate'></div>";
ko.applyBindings({ chosenTemplate: chosenTemplate }, testNode);

chosenTemplate("secondTemplate");

interface MyTemplate {
    myTemplate: string;
}

var templatePicker = function (dataItem: MyTemplate, bindingContext: ko.BindingContext) {
    // Having the entire binding context available means you can read sibling or parent level properties
    return dataItem.myTemplate;
};
ko.setTemplateEngine(new DummyTemplateEngine({ someTemplate: "result = [js: childProp]" }));
testNode.innerHTML = "<div data-bind='template: { name: templateSelectorFunction, data: someProp }'></div>";
ko.applyBindings({ someProp: { childProp: 123, myTemplate: "someTemplate" }, templateSelectorFunction: templatePicker, anotherProperty: 456 }, testNode);

ko.setTemplateEngine(new DummyTemplateEngine({
    outerTemplate: "outer template output, [renderTemplate:innerTemplate]", // [renderTemplate:...] is special syntax supported by dummy template engine
    innerTemplate: "inner template output <span data-bind='text: 123'></span>"
}));
testNode.innerHTML = "<div data-bind='template:\"outerTemplate\"'></div>";
ko.applyBindings(null, testNode);

var observable = ko.observable("ABC");
var timesRenderedOuter = 0, timesRenderedInner = 0;
ko.setTemplateEngine(new DummyTemplateEngine({
    outerTemplate: function () { timesRenderedOuter++; return "outer template output, [renderTemplate:innerTemplate]" }, // [renderTemplate:...] is special syntax supported by dummy template engine
    innerTemplate: function () { timesRenderedInner++; return observable() }
}));
testNode.innerHTML = "<div data-bind='template:\"outerTemplate\"'></div>";
ko.applyBindings(null, testNode);

observable("DEF");

var innerObservable = ko.observable("some value");
ko.setTemplateEngine(new DummyTemplateEngine({
    outerTemplate: "outer template output, <span id='innerTemplateOutput'>[renderTemplate:innerTemplate]</span>",
    innerTemplate: "result = [js: childProp()]"
}));
testNode.innerHTML = "<div data-bind='template: { name: \"outerTemplate\", data: someProp }'></div>";
ko.applyBindings({ someProp: { childProp: innerObservable } }, testNode);

const node = document.getElementById('innerTemplateOutput');
node && ko.removeNode(node);

ko.setTemplateEngine(new DummyTemplateEngine({ someTemplate: "<INPUT Data-Bind='value:\"Hi\"' />" }));
ko.renderTemplate("someTemplate", null, null, testNode);

ko.setTemplateEngine(new DummyTemplateEngine({ someTemplate: "<input data-bind='value:\n\"Hi\"' />" }));
ko.renderTemplate("someTemplate", null, null, testNode);

ko.setTemplateEngine(new DummyTemplateEngine({ someTemplate: "<input data-bind='value:message' />" }));
ko.renderTemplate("someTemplate", null, { templateRenderingVariablesInScope: { message: "hello" } }, testNode);

ko.setTemplateEngine(new DummyTemplateEngine({ someTemplate: "<div data-bind='text: $element.tagName'></div>" }));
ko.renderTemplate("someTemplate", null, null, testNode);

ko.setTemplateEngine(new DummyTemplateEngine({ someTemplate: "<div data-bind='text: $context.$data === $data'></div>" }));
ko.renderTemplate("someTemplate", {}, null, testNode);

ko.setTemplateEngine(new DummyTemplateEngine({
    someTemplate: "<input data-bind='value:message' />[js: message = 'goodbye'; undefined; ]"
}));
ko.renderTemplate("someTemplate", null, { templateRenderingVariablesInScope: { message: "hello" } }, testNode);

ko.setTemplateEngine(new DummyTemplateEngine({
    someTemplate: "<button data-bind='click: someFunctionOnModel'>click me</button>"
}));
var viewModel = {
    didCallMyFunction: false,
    someFunctionOnModel: function () { this.didCallMyFunction = true }
};
ko.renderTemplate("someTemplate", viewModel, null, testNode);
var buttonNode = testNode.childNodes[0];
buttonNode.click();

// Will verify that bindings are applied only once for both inline (rewritten) bindings,
// and external (non-rewritten) ones
var originalBindingProvider = ko.bindingProvider.instance;
ko.bindingProvider.instance = {
    nodeHasBindings: (node: Element) => (node.tagName == 'EM') || originalBindingProvider.nodeHasBindings(node),
    getBindings: (node, bindingContext) => {
        if ((<Element>node).tagName == 'EM')
            return { text: ++model.numBindings } as Object;

        return originalBindingProvider.getBindings ? originalBindingProvider.getBindings(node, bindingContext) : {};
    },
    getBindingAccessors: (node, bindingContext) => {
        if ((<Element>node).tagName == 'EM')
            return { text: () => ++model.numBindings };

        return originalBindingProvider.getBindingAccessors(node, bindingContext);
    }
};

ko.setTemplateEngine(new DummyTemplateEngine({
    outerTemplate: "Outer <div data-bind='template: { name: \"innerTemplate\", bypassDomNodeWrap: true }'></div>",
    innerTemplate: "Inner via inline binding: <span data-bind='text: ++numBindings'></span>"
        + "Inner via external binding: <em></em>"
}));
var model = { numBindings: 0 };
testNode.innerHTML = "<div data-bind='template: { name: \"outerTemplate\", bypassDomNodeWrap: true }'></div>";
ko.applyBindings(model, testNode);

ko.bindingProvider.instance = originalBindingProvider;

var myArray = ko.observableArray([{ personName: "Bob" }, { personName: "Frank" }]);
ko.setTemplateEngine(new DummyTemplateEngine({ itemTemplate: "<div>The item is [js: personName]</div>" }));
testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

ko.applyBindings({ myCollection: myArray }, testNode);
var originalBobNode = testNode.childNodes[0].childNodes[0];
var originalFrankNode = testNode.childNodes[0].childNodes[1];

myArray.push({ personName: "Steve" });

var myArray = ko.observableArray([{ personName: "Bob" }, { personName: "Frank" }]);
ko.setTemplateEngine(new DummyTemplateEngine({ itemTemplate: "The item is <span data-bind='text: personName'></span>" }));
testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

ko.applyBindings({ myCollection: myArray }, testNode);

var initCalls = 0;
(<any>ko.bindingHandlers).countInits = { init: function () { initCalls++ } };
ko.setTemplateEngine(new DummyTemplateEngine({ itemTemplate: "<span data-bind='countInits: true'></span>" }));
testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

ko.applyBindings({ myCollection: [1, 2, 3] }, testNode);

// Represents https://github.com/SteveSanderson/knockout/pull/440
// Previously, the rewriting (which introduces a comment node before the bound node) was interfering
// with the array-to-DOM-node mapping state tracking
ko.setTemplateEngine(new DummyTemplateEngine({ mytemplate: "<div data-bind='text: $data'></div>" }));
testNode.innerHTML = "<div data-bind=\"template: { name: 'mytemplate', foreach: items }\"></div>";

// Bind against initial array containing one entry. UI just shows "original"
var myArray2 = ko.observableArray(["original"]);
ko.applyBindings({ items: myArray2 }, testNode);

// Now replace the entire array contents with one different entry.
// UI just shows "new" (previously with bug, showed "original" AND "new")
myArray2(["new"]);

// See https://github.com/SteveSanderson/knockout/pull/440 and https://github.com/SteveSanderson/knockout/pull/144
ko.setTemplateEngine(new DummyTemplateEngine({
    outerTemplate: "<div data-bind='text: $data'></div>[renderTemplate:innerTemplate]x", // [renderTemplate:...] is special syntax supported by dummy template engine
    innerTemplate: "inner <span data-bind='text: 123'></span>"
}));
testNode.innerHTML = "<div data-bind=\"template: { name: 'outerTemplate', foreach: items }\"></div>";

// Bind against initial array containing one entry.
var myArray3 = ko.observableArray(["original"]);
ko.applyBindings({ items: myArray3 }, testNode);

// Now replace the entire array contents with one different entry.
myArray3(["new"]);

// Represents https://github.com/SteveSanderson/knockout/issues/739
// Previously, the rewriting (which introduces a comment node before the bound node) was interfering
// with the array-to-DOM-node mapping state tracking
ko.setTemplateEngine(new DummyTemplateEngine({ mytemplate: "<div data-bind='attr: {}'>[js:name()]</div>" }));
testNode.innerHTML = "<div data-bind=\"template: { name: 'mytemplate', foreach: items }\"></div>";

// Bind against array, referencing an observable property
var myItem = { name: ko.observable("a") };
ko.applyBindings({ items: [myItem] }, testNode);

// Modify the observable property and check that UI is updated
// Previously with the bug, it wasn't updated because the removal of the memo comment caused the array-to-DOM-node computed to be disposed
myItem.name("b");

var myArray = ko.observableArray([{ personName: "Bob" }, { personName: "Frank" }]);
ko.setTemplateEngine(new DummyTemplateEngine({ itemTemplate: "The item # is <span data-bind='text: $index'></span>" }));
testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

ko.applyBindings({ myCollection: myArray }, testNode);

var myArray = ko.observableArray([{ personName: "Bob" }, { personName: "Frank" }]);
ko.setTemplateEngine(new DummyTemplateEngine({ itemTemplate: "The item <span data-bind='text: personName'></span>is <span data-bind='text: $index'></span>" }));
testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

ko.applyBindings({ myCollection: myArray }, testNode);

var frank = myArray.pop(); // remove frank
myArray.unshift(frank); // put frank in the front
var myArray4 = ko.observableArray([undefined, null]);
ko.setTemplateEngine(new DummyTemplateEngine({ itemTemplate: "The item is <span data-bind='text: String($data)'></span>" }));
testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

ko.applyBindings({ myCollection: myArray4 }, testNode);

var myObservable = ko.observable("Steve");
var myArray5 = ko.observableArray([{ personName: "Bob" }, { personName: myObservable }, { personName: "Another" }]);
ko.setTemplateEngine(new DummyTemplateEngine({ itemTemplate: "<div>The item is [js: ko.utils.unwrapObservable(personName)]</div>" }));
testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

ko.applyBindings({ myCollection: myArray5 }, testNode);
var originalBobNode = testNode.childNodes[0].childNodes[0];

myObservable("Steve2");

// Ensure we can still remove the corresponding nodes (even though they've changed), and that doing so causes the subscription to be disposed
myArray5.splice(1, 1);
myObservable("Something else"); // Re-evaluating the observable causes the orphaned subscriptions to be disposed
var myArray6 = ko.observableArray(["A", "B"]);
ko.setTemplateEngine(new DummyTemplateEngine({ itemTemplate: "hello" }));
testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

ko.applyBindings({ myCollection: myArray6 }, testNode);

// Now set the observable to null and check it's treated like an empty array
// (because how else should null be interpreted?)
myArray6(null);

// Note: There are more detailed specs (e.g., covering nesting) associated with the "foreach" binding which
// uses this templating functionality internally.
var myArray7 = ko.observableArray(["A", "B"]);
ko.setTemplateEngine(new DummyTemplateEngine({ itemTemplate: "[js:myAliasedItem]" }));
testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection, as: \"myAliasedItem\" }'></div>";

ko.applyBindings({ myCollection: myArray7 }, testNode);

var innerObservable = ko.observable("some value");
var myArray8 = ko.observableArray([{ obsVal: innerObservable }, { obsVal: innerObservable }]);
ko.setTemplateEngine(new DummyTemplateEngine({ itemTemplate: "The item is [js: ko.utils.unwrapObservable(obsVal)]" }));
testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

ko.applyBindings({ myCollection: myArray8 }, testNode);

ko.removeNode(testNode.childNodes[0]);

var innerObservable = ko.observable("some value");
var myArray9 = ko.observableArray([{ obsVal: innerObservable }, { obsVal: innerObservable }]);
ko.setTemplateEngine(new DummyTemplateEngine({ itemTemplate: "The item is [js: ko.utils.unwrapObservable(obsVal)]" }));
testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

ko.applyBindings({ myCollection: myArray9 }, testNode);

myArray9.splice(1, 1);
myArray9([]);

var myArray10 = ko.observableArray([{ someProp: 1 }, { someProp: 2, _destroy: 'evals to true' }, { someProp: 3 }, { someProp: 4, _destroy: ko.observable(false) }]);
ko.setTemplateEngine(new DummyTemplateEngine({ itemTemplate: "<div>someProp=[js: someProp]</div>" }));
testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

ko.applyBindings({ myCollection: myArray10 }, testNode);

var myArray11 = ko.observableArray([{ someProp: 1 }, { someProp: 2, _destroy: 'evals to true' }, { someProp: 3 }]);
ko.setTemplateEngine(new DummyTemplateEngine({ itemTemplate: "<div>someProp=[js: someProp]</div>" }));
testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection, includeDestroyed: true }'></div>";

ko.applyBindings({ myCollection: myArray11 }, testNode);

ko.setTemplateEngine(new DummyTemplateEngine({ myTemplate: "Value: [js: myProp().childProp]" }));
testNode.innerHTML = "<div data-bind='template: { name: \"myTemplate\", \"if\": myProp }'></div>";

interface ChildProp { childProp: string; }
var viewModel2 = { myProp: ko.observable<ChildProp | null>({ childProp: 'abc' }) };
ko.applyBindings(viewModel2, testNode);

// Causing the condition to become false causes the output to be removed
viewModel2.myProp(null);

// Causing the condition to become true causes the output to reappear
viewModel2.myProp({ childProp: 'def' });

ko.setTemplateEngine(new DummyTemplateEngine({ myTemplate: "Hello" }));
testNode.innerHTML = "<div data-bind='template: { name: \"myTemplate\", ifnot: shouldHide }'></div>";

var viewModel3 = { shouldHide: ko.observable(true) };
ko.applyBindings(viewModel3, testNode);

// Causing the condition to become false causes the output to be displayed
viewModel3.shouldHide(false);

// Causing the condition to become true causes the output to disappear
viewModel3.shouldHide(true);

ko.setTemplateEngine(new DummyTemplateEngine({ myTemplate: "Value: [js: myProp().childProp]" }));
testNode.innerHTML = "<div data-bind='template: { name: \"myTemplate\", \"if\": myProp, foreach: [$data, $data, $data] }'></div>";

var viewModel4 = { myProp: ko.observable<ChildProp | null>({ childProp: 'abc' }) };
ko.applyBindings(viewModel4, testNode);

// Causing the condition to become false causes the output to be removed
viewModel4.myProp(null);

// Causing the condition to become true causes the output to reappear
viewModel4.myProp({ childProp: 'def' });

ko.setTemplateEngine(new DummyTemplateEngine({ someTemplate: "<input type='checkbox' data-bind='checked:isChecked' />" }));
ko.renderTemplate("someTemplate", null, { templateRenderingVariablesInScope: { isChecked: true } }, testNode);

ko.setTemplateEngine(new DummyTemplateEngine({ someTemplate: "<input type='radio' name='somename' value='abc' data-bind='checked:someValue' />" }));
ko.renderTemplate("someTemplate", null, { templateRenderingVariablesInScope: { someValue: 'abc' } }, testNode);

var myArray12 = ko.observableArray([
    { preferredTemplate: 1, someProperty: 'firstItemValue' },
    { preferredTemplate: 2, someProperty: 'secondItemValue' }
]);
ko.setTemplateEngine(new DummyTemplateEngine({
    firstTemplate: "<div>Template1Output, [js:someProperty]</div>",
    secondTemplate: "<div>Template2Output, [js:someProperty]</div>"
}));
testNode.innerHTML = "<div data-bind='template: {name: getTemplateModelProperty, foreach: myCollection}'></div>";

var getTemplate = function (dataItem: any, bindingContext: ko.BindingContext) {
    return dataItem.preferredTemplate == 1 ? 'firstTemplate' : 'secondTemplate';
};
ko.applyBindings({ myCollection: myArray12, getTemplateModelProperty: getTemplate, anotherProperty: 123 }, testNode);

var myModel2 = {
    someAdditionalData: { myAdditionalProp: "someAdditionalValue" },
    people: ko.observableArray([
        { name: "Alpha" },
        { name: "Beta" }
    ])
};
ko.setTemplateEngine(new DummyTemplateEngine({ myTemplate: "<div>Person [js:name] has additional property [js:templateOptions.myAdditionalProp]</div>" }));
testNode.innerHTML = "<div data-bind='template: {name: \"myTemplate\", foreach: people, templateOptions: someAdditionalData }'></div>";

ko.applyBindings(myModel2, testNode);

var myObservable = ko.observable("some value"),
    myModel3 = {
        subModel: ko.observable({ myObservable: myObservable })
    };

ko.setTemplateEngine(new DummyTemplateEngine({ myTemplate: "<span>The value is [js:myObservable()]</span>" }));
testNode.innerHTML = "<div data-bind='template: {name: \"myTemplate\", data: subModel}'></div>";
ko.applyBindings(myModel3, testNode);

// Right now the template references myObservable, so there should be exactly one subscription on it
var renderedNode1 = testNode.childNodes[0].childNodes[0];

// By changing the object for subModel, we force the data-bind value to be re-evaluated and the template to be re-rendered,
// setting up a new template subscription, so there have now existed two subscriptions on myObservable...
myModel3.subModel({ myObservable: myObservable });

ko.setTemplateEngine(new DummyTemplateEngine({ theTemplate: "Default output" })); // Not going to use this one
var alternativeTemplateEngine = new DummyTemplateEngine({ theTemplate: "Alternative output" });

testNode.innerHTML = "<div data-bind='template: { name: \"theTemplate\", templateEngine: chosenEngine }'></div>";
ko.applyBindings({ chosenEngine: alternativeTemplateEngine }, testNode);

ko.setTemplateEngine(new DummyTemplateEngine({
    myTemplate: "ValueLiteral: [js:item.prop], ValueBound: <span data-bind='text: item.prop'></span>"
}));
testNode.innerHTML = "<div data-bind='template: { name: \"myTemplate\", data: someItem, as: \"item\" }'></div>";
ko.applyBindings({ someItem: { prop: 'Hello' } }, testNode);

ko.setTemplateEngine(new DummyTemplateEngine({
    myTemplate: "ValueLiteral: [js:$parent.parentProp], ValueBound: <span data-bind='text: $parent.parentProp'></span>"
}));
testNode.innerHTML = "<div data-bind='template: { name: \"myTemplate\", data: someItem }'></div>";
ko.applyBindings({ someItem: {}, parentProp: 'Hello' }, testNode);

ko.setTemplateEngine(new DummyTemplateEngine({
    outerTemplate: "<div data-bind='template: { name:\"middleTemplate\", data: middleItem }'></div>",
    middleTemplate: "<div data-bind='template: { name: \"innerTemplate\", data: innerItem }'></div>",
    innerTemplate: "(Data:[js:$data.val], Parent:[[js:$parents[0].val]], Grandparent:[[js:$parents[1].val]], Root:[js:$root.val], Depth:[js:$parents.length])"
}));
testNode.innerHTML = "<div data-bind='template: { name: \"outerTemplate\", data: outerItem }'></div>";

ko.applyBindings({
    val: "ROOT",
    outerItem: {
        val: "OUTER",
        middleItem: {
            val: "MIDDLE",
            innerItem: { val: "INNER" }
        }
    }
}, testNode);

// The reason is that your template engine's native control flow and variable evaluation logic is going to run first, independently
// of any KO-native control flow, so variables would get evaluated in the wrong context. Example:
//
// <div data-bind="foreach: someArray">
//     ${ somePropertyOfEachArrayItem }   <-- This gets evaluated *before* the foreach binds, so it can't reference array entries
// </div>
//
// It should be perfectly OK to fix this just by preventing anonymous templates within rewritten templates, because
// (1) The developer can always use their template engine's native control flow syntax instead of the KO-native ones - that will work
// (2) The developer can use KO's native templating instead, if they are keen on KO-native control flow or anonymous templates
ko.setTemplateEngine(new DummyTemplateEngine({
    myTemplate: "<div data-bind='template: { data: someData }'>Childprop: [js: childProp]</div>"
}));
testNode.innerHTML = "<div data-bind='template: { name: \"myTemplate\" }'></div>";

var didThrow = false;
try {
    ko.applyBindings({ someData: { childProp: 'abc' } }, testNode);
} catch (ex) {
    didThrow = true;
}

// Same reason as above
ko.utils.arrayForEach(['if', 'ifnot', 'with', 'foreach'], function (bindingName) {
    ko.setTemplateEngine(new DummyTemplateEngine({ myTemplate: "<div data-bind='" + bindingName + ": \"SomeValue\"'>Hello</div>" }));
    testNode.innerHTML = "<div data-bind='template: { name: \"myTemplate\" }'></div>";

    var didThrow = false;
    ko.utils.domData.clear(testNode);
    try { ko.applyBindings({ someData: { childProp: 'abc' } }, testNode) }
    catch (ex) {
        didThrow = true;
    }
    if (!didThrow)
        throw new Error("Did not prevent use of " + bindingName);
});

ko.setTemplateEngine(new DummyTemplateEngine({
    outerTemplate: "Outer <!-- ko template: \n" +
        "{ name: \"innerTemplate\" } \n" +
        "--><!-- /ko -->",
    innerTemplate: "Inner via inline binding: <span data-bind='text: \"someText\"'></span>"
}));
var model2 = {};
testNode.innerHTML = "<div data-bind='template: { name: \"outerTemplate\" }'></div>";
ko.applyBindings(model2, testNode);

ko.setTemplateEngine(new DummyTemplateEngine());
testNode.innerHTML = "Start <!-- ko template: { data: someData } -->Childprop: [js: childProp]<!-- /ko --> End";
ko.applyBindings({ someData: { childProp: 'abc' } }, testNode);

// This represents issue https://github.com/SteveSanderson/knockout/issues/188
// (IE < 9 strips out leading comment nodes when you use .innerHTML)
ko.setTemplateEngine(new DummyTemplateEngine({}));
testNode.innerHTML = "start <div data-bind='foreach: [1,2]'><span><!-- leading comment -->hello</span></div>";
ko.applyBindings(null, testNode);

delete (<any>ko.bindingHandlers).nonexistentHandler;
var initCalls = 0;
(<any>ko.bindingHandlers).countInits = { init: function () { initCalls++ } };
testNode.innerHTML = "<div data-bind='template: {}'><!-- ko nonexistentHandler: true --><span data-bind='countInits: true'></span><!-- /ko --></div>";
ko.applyBindings(null, testNode);

// Represents https://github.com/SteveSanderson/knockout/issues/660
// A <span> can't go directly into a <tr>, so modern browsers will silently strip it. We need to verify this doesn't
// throw errors during unmemoization (when unmemoizing, it will try to apply the text to the following text node
// instead of the node you intended to bind to).
// Note that IE < 9 won't strip the <tr>; instead it has much stranger behaviors regarding unexpected DOM structures.
// It just happens not to give an error in this particular case, though it would throw errors in many other cases
// of malformed template DOM.
ko.setTemplateEngine(new DummyTemplateEngine({
    myTemplate: "<tr><span data-bind=\"text: 'Some text'\"></span> </tr>" // The whitespace after the closing span is what triggers the strange HTML parsing
}));
testNode.innerHTML = "<div data-bind='template: \"myTemplate\"'></div>";
ko.applyBindings(null, testNode);
// Since the actual template markup was invalid, we don't really care what the
// resulting DOM looks like. We are only verifying there were no exceptions.

function testIgnoreDependencies() {
    const five = ko.ignoreDependencies(() => 5);

    const target = {foo: "foo"};

    const foobar = ko.ignoreDependencies(function (bar) {
        return this.foo + bar;
    }, target, ["bar"])

    foobar.toUpperCase();
}
