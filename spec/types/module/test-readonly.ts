import { ReadonlyObservable, Observable, ReadonlyComputed} from "knockout";
import * as ko from "knockout";

function testReadonlyObservable() {
    const write = ko.observable("foo");
    write("bar");
    const read = write as ReadonlyObservable<string>;

    read(); // $ExpectType string
    read.subscribe(() => {});  // Can still subscribe
    // But can't write to it
    // read("foo") // $ExpectError // Don't currently have a good mechanism for testing this outside of DT repo

    const writeAgain = read as Observable<string>
    writeAgain("bar");
};

function testReadonlyObservableArray() {
    // Normal observable array behavior
    const write = ko.observableArray(["foo"]);
    write(["bar"]);
    write.push("foo");

    // Readonly observable array
    const read = write as ko.ReadonlyObservableArray<string>;
    read(); //$ExpectType ReadonlyArray<string>
    read.slice(0, 1); //$ExpectType string[]

    // read(["foo"]); // $ExpectError // no way to test this, currently
    const _hasPushMethod: typeof read extends { push: any } ? true : false = false;

    // Can cast back to a writeable
    const writeAgain = read as ko.ObservableArray<string>
    writeAgain(["foo"]);
}

function testReadonlyComputed() {
    const write = ko.computed({
        read: () => {},
        write: () => {},
    });

    // Can cast a computed as readonly
    const read: ReadonlyComputed<any> = write;
    read();
    // read("foo"); // $ExpectError // no way to test this currently
}
