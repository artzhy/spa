/** Indicates whether a specified string is null, empty, or consists only of white-space characters. */
function isNullOrWhiteSpace(value: string): boolean {
    return value == null || value.trim().length == 0;
}

/** Indicates whether the specified string is null or an empty string. */
function isNullOrEmpty(value: string): boolean {
    return value == null || value.length == 0;
}

function newGuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}