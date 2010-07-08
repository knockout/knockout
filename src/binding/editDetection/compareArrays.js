/// <reference path="../../utils.js" />

(function () {
    ko.utils.compareArrays = function (oldArray, newArray) {
        // Simple calculation based on Levenshtein distance. Could be optimized for reduced memory, 
        // though very unlikely to be necessary - typically use case is 1-100 elements

        var editScripts = [];
        oldArray = oldArray || [];
        newArray = newArray || [];

        // Top row - transform old array into empty array via deletions
        editScripts[0] = [];
        for (var i = 0, j = oldArray.length; i <= j; i++) {
            if (i == 0) {
                editScripts[0][i] = [];
                editScripts[0][i].distance = 0;
            } else {
                editScripts[0][i] = editScripts[0][i - 1].slice();
                editScripts[0][i].push({ status: "deleted", value: oldArray[i - 1] });
                editScripts[0][i].distance = editScripts[0][i - 1].distance + 1;
            }
        }

        // Left row - transform empty array into new array via additions
        for (var i = 1, j = newArray.length; i <= j; i++) {
            editScripts[i] = editScripts[i] || [];
            editScripts[i][0] = editScripts[i - 1][0].slice();
            editScripts[i][0].push({ status: "added", value: newArray[i - 1] });
            editScripts[i][0].distance = editScripts[i - 1][0].distance + 1;
        }

        // Fill out the body of the array
        for (var oldIndex = 1, oldIndexMax = oldArray.length; oldIndex <= oldIndexMax; oldIndex++) {
            for (var newIndex = 1, newIndexMax = newArray.length; newIndex <= newIndexMax; newIndex++) {
                if (oldArray[oldIndex - 1] === newArray[newIndex - 1]) {
                    editScripts[newIndex][oldIndex] = editScripts[newIndex - 1][oldIndex - 1].slice(0);
                    editScripts[newIndex][oldIndex].push({ status: "retained", value: oldArray[oldIndex - 1] });
                    editScripts[newIndex][oldIndex].distance = editScripts[newIndex - 1][oldIndex - 1].distance;
                } else {
                    var distanceViaAddition = editScripts[newIndex - 1][oldIndex].distance + 1;
                    var distanceViaDeletion = editScripts[newIndex][oldIndex - 1].distance + 1;
                    if (distanceViaAddition < distanceViaDeletion) {
                        editScripts[newIndex][oldIndex] = editScripts[newIndex - 1][oldIndex].slice(0);
                        editScripts[newIndex][oldIndex].push({ status: "added", value: newArray[newIndex - 1] });
                        editScripts[newIndex][oldIndex].distance = editScripts[newIndex - 1][oldIndex].distance + 1;
                    } else {
                        editScripts[newIndex][oldIndex] = editScripts[newIndex][oldIndex - 1].slice(0);
                        editScripts[newIndex][oldIndex].push({ status: "deleted", value: oldArray[oldIndex - 1] });
                        editScripts[newIndex][oldIndex].distance = editScripts[newIndex][oldIndex - 1].distance + 1;
                    }
                }
            }
        }

        return editScripts[newArray.length][oldArray.length];
    };
})();