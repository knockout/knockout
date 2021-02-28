import * as ko from "knockout";

function testReadonlyObservable() {
    const write = ko.observable("foo");
    write("bar");
    const read: ko.ReadonlyObservable<string> = write;

    read(); // $ExpectType string
    read.subscribe(() => { });  // Can still subscribe
    // @ts-expect-error - But can't write to it
    read("foo");

    const writeAgain = read as ko.Observable<string>;
    writeAgain("bar");
};

function testReadonlyObservableArray() {
    // Normal observable array behavior
    const write = ko.observableArray(["foo"]);
    write(["bar"]);
    write.push("foo");

    // Readonly observable array
    const read: ko.ReadonlyObservableArray<string> = write;
    read(); //$ExpectType ReadonlyArray<string>
    read.slice(0, 1); //$ExpectType string[]

    // @ts-expect-error
    read(["foo"]);
    // @ts-expect-error
    read.push("bar");

    // Can cast back to a writeable
    const writeAgain = read as ko.ObservableArray<string>;
    writeAgain(["foo"]);
}

function testReadonlyComputed() {
    const write: ko.WritableComputed<string> = ko.computed({
        read: () => "bar",
        write: (x) => { },
    });

    write("foo");

    // Can cast a computed as readonly
    const read: ko.Computed<string> = write;
    read();
    // @ts-expect-error
    read("bar");

    const normal1 = ko.computed({ read: () => "bar" });
    // @ts-expect-error
    normal1("foo");

    const normal2 = ko.computed(() => "bar");
    // @ts-expect-error
    normal2("foo");

    const pure1 = ko.pureComputed({ read: () => "bar" });
    // @ts-expect-error
    pure1("foo");

    const pure2 = ko.pureComputed(() => "bar");
    // @ts-expect-error
    pure2("foo");
}
