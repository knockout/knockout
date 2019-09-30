
declare module "knockout" {

    // Have to define your own extenders
    export interface ObservableArrayFunctions<T> {
        filterByProperty(propName: string, matchValue: boolean): ko.Computed<any>;
    }

    export interface ExtendersOptions {
        numeric: number;
        required: string;
        logChange: string;
    }

    export interface ExtendersOptions<T> {
        validate(v: T): boolean;
    }

    // Define your own functions
    export interface SubscribableFunctions<T> {
        publishOn(topic: string): this;
        subscribeTo(topic: string): this;
    }

    export interface BindingHandlers {
        isolatedOptions: ko.BindingHandler;
    }

    // Define your own bindingHandler
    export interface BindingHandlers {
        allBindingsAccessorTest: ko.BindingHandler;
    }

    // Define your template engine optinos
    export interface TemplateOptions<T> {
        showParams?: boolean;
        templateOptions?: any;
        templateRenderingVariablesInScope?: any;
    }
}

export { };
