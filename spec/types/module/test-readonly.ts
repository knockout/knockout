import { ReadonlyObservable, Observable} from "knockout";
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
