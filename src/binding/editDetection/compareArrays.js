/// <reference path="../../utils.js" />

// Simple calculation based on Levenshtein distance.
(function () {

    function calculateEditDistanceMatrix(oldArray, newArray) {
        var distances = [];

        // Top row - transform old array into empty array via deletions
        distances[0] = [];
        for (var i = 0, j = oldArray.length; i <= j; i++)
            distances[0][i] = i;

        // Left row - transform empty array into new array via additions
        for (var i = 1, j = newArray.length; i <= j; i++) {
            distances[i] = [];
            distances[i][0] = i;
        }

        // Fill out the body of the array
        var oldIndex, oldIndexMax = oldArray.length, newIndex, newIndexMax = newArray.length;
        var distanceViaAddition, distanceViaDeletion;
        for (oldIndex = 1; oldIndex <= oldIndexMax; oldIndex++) {
            for (newIndex = 1; newIndex <= newIndexMax; newIndex++) {
                if (oldArray[oldIndex - 1] === newArray[newIndex - 1])
                    distances[newIndex][oldIndex] = distances[newIndex - 1][oldIndex - 1];
                else
                    distances[newIndex][oldIndex] = Math.min(distances[newIndex - 1][oldIndex] + 1, distances[newIndex][oldIndex - 1] + 1);
            }
        }

        return distances;
    }

    function findEditScriptFromEditDistanceMatrix(editDistanceMatrix, oldArray, newArray) {
        var oldIndex = oldArray.length;
        var newIndex = newArray.length;
        var editScript = [];
        var maxDistance = editDistanceMatrix[newIndex][oldIndex];
        while ((oldIndex > 0) || (newIndex > 0)) {
            var me = editDistanceMatrix[newIndex][oldIndex];
            var distanceViaAdd = (newIndex > 0) ? editDistanceMatrix[newIndex - 1][oldIndex] : maxDistance + 1;
            var distanceViaDelete = (oldIndex > 0) ? editDistanceMatrix[newIndex][oldIndex - 1] : maxDistance + 1;
            var distanceViaRetain = (newIndex > 0) && (oldIndex > 0) ? editDistanceMatrix[newIndex - 1][oldIndex - 1] : maxDistance + 1;
            if (distanceViaAdd < me - 1) distanceViaAdd = maxDistance + 1;
            if (distanceViaDelete < me - 1) distanceViaDelete = maxDistance + 1;
            if (distanceViaRetain < me - 1) distanceViaRetain = maxDistance + 1;

            if ((distanceViaAdd <= distanceViaDelete) && (distanceViaAdd < distanceViaRetain)) {
                editScript.push({ status: "added", value: newArray[newIndex - 1] });
                newIndex--;
            } else if ((distanceViaDelete < distanceViaAdd) && (distanceViaDelete < distanceViaRetain)) {
                editScript.push({ status: "deleted", value: oldArray[oldIndex - 1] });
                oldIndex--;
            } else {
                editScript.push({ status: "retained", value: oldArray[oldIndex - 1] });
                newIndex--;
                oldIndex--;
            }
        }
        return editScript.reverse();
    }

    ko.utils.compareArrays = function (oldArray, newArray) {
        oldArray = oldArray || [];
        newArray = newArray || [];
        var editDistanceMatrix = calculateEditDistanceMatrix(oldArray, newArray);
        return findEditScriptFromEditDistanceMatrix(editDistanceMatrix, oldArray, newArray);
    };
})();