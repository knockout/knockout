
declare module "knockout" {

    // Have to define your own extenders
    export interface ObservableArrayFunctions<T> {
        filterByProperty(propName: string, matchValue: boolean): ko.Computed<any>;
    }

    export interface Extenders {
        logChange(target: ko.Subscribable, option: string): typeof target;
        numeric(target: ko.Subscribable, precision: number): typeof target;
        required(target: ko.Subscribable, overrideMessage: string): typeof target;
    }

    export interface ObservableExtenderOptions {
        numeric?: number;
        required?: string;
        logChange?: string;
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
