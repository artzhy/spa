module spa {
    export class Task<T> {
        private _action: (fulfill: (result: T) => any, reject: (error: Exception) => any, progress: (percentsComplete: number) => any) => any;
        private _error: Exception;
        private _fulfillHandlers: { (result: T): any }[] = [];
        private _percentsComplete = 0;
        private _progressHandlers: { (percentsComplete: number): any }[] = [];
        private _rejectHandlers: { (error: Exception): any }[] = [];
        private _result: T;
        private _status = TaskStatus.Pending;

        constructor(action: (fulfill: (result: T) => any, reject: (error: Exception) => any, progress: (percentsComplete: number) => any) => any) {
            this._action = action;
        }

        public get error(): Exception {
            return this._error;
        }

        public get percentsComplete(): number {
            return this._percentsComplete;
        }

        public get result(): T {
            return this._result;
        }

        public get status(): TaskStatus {
            return this._status;
        }

        public cancel(): void {
            if (this._status == TaskStatus.Pending) {
                this._status = TaskStatus.Rejected;

                if (this._rejectHandlers.length > 0) {
                    this._rejectHandlers.forEach((h) => {
                        h(this._error);
                    });

                    this._progressHandlers = [];
                    this._rejectHandlers = [];
                }
            }
        }

        public continueWith(continuation: Task<T>): Task<T> {

            return new Task<T>((fulfill, reject, progress) => {
                this.then(
                    (thisResult) => {
                        continuation.start();
                        continuation.then(
                            (cf) => {
                                fulfill(cf);
                            },
                            (cr) => {
                                reject(cr);
                            },
                            (cp) => {
                                progress(cp);
                            });
                    },

                    (thisError) => {
                        reject(this.error);
                    },

                    (thisProgress) => {
                        progress(thisProgress);
                    });
            });
        }

        public then(onFulfill?: (result: T) => any, onReject?: (error: Exception) => any, onProgress?: (percentsComplete: number) => any): Task<T> {
            if (onFulfill != null) {
                if (this._status == TaskStatus.Pending) {
                    this._fulfillHandlers.push(onFulfill);
                }
                else {
                    if (this._status == TaskStatus.Fulfilled) {
                        onFulfill(this._result);
                    }
                }
            }

            if (onReject != null) {
                if (this._status == TaskStatus.Pending) {
                    this._rejectHandlers.push(onReject);
                }
                else {
                    if (this._status == TaskStatus.Rejected) {
                        onReject(this._error);
                    }
                }
            }

            if (onProgress != null) {
                if (this._status == TaskStatus.Pending) {
                    this._progressHandlers.push(onProgress);
                }
            }

            return this;
        }

        private progress(percentsComplete: number): void {
            this._percentsComplete = percentsComplete;

            if (this._progressHandlers.length > 0) {
                this._progressHandlers.forEach((h) => {
                    h(percentsComplete);
                });
            }
        }

        private reject(error: Exception): void {
            if (this._status == TaskStatus.Pending) {
                this._error = error;
                this._status = TaskStatus.Rejected;

                if (this._rejectHandlers.length > 0) {
                    this._rejectHandlers.forEach((h) => {
                        h(this._error);
                    });

                    this._progressHandlers = [];
                    this._rejectHandlers = [];
                }
            }
        }

        private fulfill(result: T): void {
            if (this._status == TaskStatus.Pending) {
                this._result = result;
                this._status = TaskStatus.Fulfilled;

                if (this._fulfillHandlers.length > 0) {
                    this._fulfillHandlers.forEach((h) => {
                        h(this._result);
                    });

                    this._progressHandlers = [];
                    this._fulfillHandlers = [];
                }
            }
        }

        public start(): void {
            setTimeout(() => {
                this._action(
                    (result: T) => {
                        this.fulfill(result);
                    },
                    (error: Exception) => {
                        this.reject(error);
                    },
                    (percentsComplete: number) => {
                        this.progress(percentsComplete);
                    });
            }, 1);
        }

        public static run<T>(action: (fullfill: (result?: T) => any, reject?: (error?: Exception) => any, progress?: (percentsComplete?: number) => any) => any): Task<T> {
            var task = new Task<T>(action);
            task.start();

            return task;
        }

        public static when<T1>(task1: Task<T1>, ready: (result1: T1, error: Exception) => any)
        public static when<T1, T2>(task1: Task<T1>, task2: Task<T2>, ready: (result1: T1, result2: T2, error: Exception) => any)
        public static when<T1, T2, T3>(task1: Task<T1>, task2: Task<T2>, task3: Task<T3>, ready: (result1: T1, result2: T2, result3: T3, error: Exception) => any)
        public static when<T1, T2, T3, T4>(task1: Task<T1>, task2: Task<T2>, task3: Task<T3>, task4: Task<T4>, ready: (result1: T1, result2: T2, result3: T3, result4: T4, error: Exception) => any)
        public static when<T1, T2, T3, T4>(p1?, p2?, p3?, p4?, p5?): void {
            var callback = null;
            var params = [p1, p2, p3, p4, p5];
            var tasks: Task<any>[] = [];

            params.forEach((p) => {
                if (p != null) {
                    if (p instanceof Task) {
                        tasks.push(p);
                    } else {
                        if (typeof p == "function") {
                            callback = p;
                        }
                    }
                }
            });

            var calledBack = false;

            if (tasks.length > 0) {
                tasks.forEach((task) => {
                    task.then(
                        () => {
                            if (tasks.every(x => x.status == TaskStatus.Fulfilled) && callback != null) {
                                switch (tasks.length) {
                                    case 1: callback(tasks[0].result); break;
                                    case 2: callback(tasks[0].result, tasks[1].result); break;
                                    case 3: callback(tasks[0].result, tasks[1].result, tasks[2].result); break;
                                    case 4: callback(tasks[0].result, tasks[1].result, tasks[2].result, tasks[3].result); break;
                                    case 5: callback(tasks[0].result, tasks[1].result, tasks[2].result, tasks[3].result, tasks[4].result); break;
                                    case 6: callback(tasks[0].result, tasks[1].result, tasks[2].result, tasks[3].result, tasks[4].result, tasks[5].result); break;
                                    case 7: callback(tasks[0].result, tasks[1].result, tasks[2].result, tasks[3].result, tasks[4].result, tasks[5].result, tasks[6].result); break;
                                    case 8: callback(tasks[0].result, tasks[1].result, tasks[2].result, tasks[3].result, tasks[4].result, tasks[5].result, tasks[6].result, tasks[7].result); break;
                                    case 9: callback(tasks[0].result, tasks[1].result, tasks[2].result, tasks[3].result, tasks[4].result, tasks[5].result, tasks[6].result, tasks[7].result, tasks[8].result); break;
                                    case 10: callback(tasks[0].result, tasks[1].result, tasks[2].result, tasks[3].result, tasks[4].result, tasks[5].result, tasks[6].result, tasks[7].result, tasks[8].result, tasks[9].result); break;
                                    default: callback();
                                }
                            }
                        },
                        (error) => {
                            if (!calledBack) {
                                if (callback != null) {
                                    calledBack = true;
                                    callback();
                                }
                            }
                        });
                });
            }
            else {
                if (callback != null) {
                    callback();
                }
            }
        }

        public static whenAll<T>(...params: Task<T>[]): Task<T[]> {
            if (params == null) {
                throw "Invalid argument";
            }

            var summaryTask = new Task<T[]>((fullfill, reject, progress) => {
                var pendingTasks = params.slice(0);

                pendingTasks.forEach((t) => {
                    t.then(
                        (result) => {
                            if (summaryTask.status == TaskStatus.Pending) {
                                if (pendingTasks.every(x => x.status == TaskStatus.Fulfilled)) {
                                    fullfill(pendingTasks.map(x => x.result));
                                }
                            }
                        },
                        (taskError) => {
                            if (summaryTask.status == TaskStatus.Pending) {
                                reject(taskError);
                            }
                        },
                        (taskPercentsComplete) => {
                            if (summaryTask.status == TaskStatus.Pending) {
                                progress(pendingTasks.min(x => x.percentsComplete));
                            }
                        });
                });
            });

            return summaryTask;
        }

        public static fromResult<T>(result: T): Task<T> {
            var task = new Task<T>((resolve) => {
                resolve(result);
            });

            task.start();

            return task;
        }
    }

    export enum TaskStatus {
        Fulfilled = 0,
        Rejected = 1,
        Pending = 2
    }

    export function async<T>(work: (done: (result?: T) => void, error?: (exception: any) => void) => any): Task<T> {
        return Task.run<T>(work);
    }

    export function await<T1>(task: Task<T1>, done: (result1?: T1) => any)
    export function await<T1, T2>(task1: Task<T1>, task2: Task<T2>, done: (result1: T1, result2: T2) => any)
    export function await<T1, T2, T3>(task1: Task<T1>, task2: Task<T2>, task3: Task<T3>, done: (result1: T1, result2: T2, result3: T3) => any)
    export function await<T1, T2, T3, T4>(task1: Task<T1>, task2: Task<T2>, task3: Task<T3>, task4: Task<T4>, done: (result1: T1, result2: T2, result3: T3, result4: T4) => any)
    export function await<T1, T2, T3, T4>(p1?, p2?, p3?, p4?, p5?): void {
        if (p4 instanceof Task) {
            Task.when(p1, p2, p3, p4,(res1, res2, res3, res4, error) => {
                if (error == null) {
                    p5(res1, res2, res3, res4);
                }
                else {
                    throw error;
                }
            });
        }
        else {
            if (p3 instanceof Task) {
                Task.when(p1, p2, p3,(res1, res2, res3, error) => {
                    if (error == null) {
                        p4(res1, res2, res3);
                    }
                    else {
                        throw error;
                    }
                });
            }
            else {
                if (p2 instanceof Task) {
                    Task.when(p1, p2,(res1, res2, error) => {
                        if (error == null) {
                            p3(res1, res2);
                        } else {
                            throw error;
                        }
                    });
                }
                else {
                    p1.then(
                        (result) => {
                            p2(result);
                        },
                        (error) => {
                            throw error;
                        });
                }
            }
        }
    }
}