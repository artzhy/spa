function clone<T>(obj: T) {
    return JSON.parse(JSON.stringify(obj));
} 