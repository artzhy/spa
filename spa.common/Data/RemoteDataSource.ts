module spa {
    export class RemoteDataSource<TRow> implements IDataSource<TRow> {
        private _cache = new RemoteDataSourceCache();
        private _cachedCount: { [filter: string]: number } = {};
        private _filter: IFilter;
        private _sort: ISort[];

        public onchanged = new spa.Notification();

        public get filter(): IFilter{
            return this._filter;
        }

        public set filter(filter: IFilter) {
            if (!this.isIdenticalObjects(this._filter, filter)) {
                this._filter = filter;
                this.onChanged();
            }
        }

        public get cacheSize(): number {
            return this._cache.size;
        }

        public set cacheSize(cacheSize: number) {
            this._cache.size = cacheSize;
        }

        public get sort(): ISort[]{
            return this._sort;
        }

        public set sort(sort: ISort[]) {
            if (!this.isIdenticalObjects(this.sort, sort)) {
                this._sort = sort;
                this.onChanged();
            }
        }

        public getRows(skip: number, take: number, callback: (rows: TRow[]) => any) {
            var cachedRows = this._cache.getRows(this.filter, this.sort, skip, skip + take - 1);

            if (cachedRows != null) {
                callback(cachedRows);
            } else {
                this.query(skip, take,(rows) => {
                    this._cache.cacheRows(this.filter, this.sort, skip, skip + take, rows);

                    if ((skip == null || skip == 0) && take == null) {
                        this._cachedCount[this.filter == null ? "null" : JSON.stringify(this.filter)] = rows.length;
                    }

                    callback(rows);
                });
            }
        }

        public getRowCount(callback: (count: number) => any) {
            var filterText = this.filter == null ? "null" : JSON.stringify(this.filter);

            if (filterText in this._cachedCount) {
                callback(this._cachedCount[filterText]);
            }

            this.queryCount((count) => {
                this._cachedCount[filterText] = count;
                callback(count);
            });
        }

        public clearCache() {
            this._cache.clear();
            this._cachedCount = {};
        }

        public dataSourceChanged() {
            this.clearCache();
            this.onChanged();
        }

        protected query(skip: number, take: number, callback: (rows: TRow[]) => any) {
            throw "Method 'query' is not implemented.";
        }

        protected queryCount(callback: (count: number) => any) {
            throw "Method 'queryCount' is not implemented.";
        }

        protected onChanged() {
            this.onchanged.notify();
        }

        private isIdenticalObjects(obj1: any, obj2: any): boolean {
            if (obj1 == null && obj2 == null) {
                return true;
            }

            if (obj1 == null || obj2 == null) {
                return false;
            }

            return JSON.stringify(obj1) == JSON.stringify(obj2);
        }
    }

    class RemoteDataSourceCache {
        private _data: ICachedRows[] = [];
        private _maxSize: number = null;
        private _size = 0;

        /** Indicates the number of rows that are cached locally in memory. */
        public get maxSize(): number {
            return this._maxSize;
        }

        public set maxSize(maxSize: number) {
            this._maxSize = maxSize;

            if (this._maxSize != null && this._size > this._maxSize) {
                this.clear(this._maxSize);                
            }
        }

        /** Indicates the current cache size. */
        public get size(): number {
            return this.size;
        }

        /** Adds rows to cache. */
        public cacheRows(filter: IFilter, sort: ISort[], fromIndex: number, toIndex: number, rows: any[]) {
            var cacheRecord: ICachedRows = {
                filter: filter == null ? null : JSON.stringify(filter),
                sort: sort == null ? null : JSON.stringify(sort),
                fromIndex: fromIndex,
                toIndex: toIndex,
                rows: rows,
                lastUsed: new Date().getTime()
            };

            this.putRowsInCache(cacheRecord);

            if (this._maxSize != null && this._size > this._maxSize) {
                this.clear(this._maxSize);
            }
        }

        /** Clears the cache or sets it current size to specified value. */
        public clear(targetSize?: number) {
            if (targetSize == null) {
                this._data.length = 0;
                this._size = 0;
            }

            this._data.sort((a, b) => {
                if (a == b) {
                    return 0;
                }
                else {
                    return a > b ? 1 : -1;
                }
            });

            while (this._size > targetSize && this._size != 0) {
                this._size -= this._data.shift().rows.length;
            }
        }

        /** Returns rows from cache starting from 'fromIndex' to 'toIndex' inclusive. */
        public getRows(filter: IFilter, sort: ISort[], fromIndex: number, toIndex: number): any[] {
            if (this._data.length == null) {
                return null;
            }

            var filterText = filter == null ? null : JSON.stringify(filter);
            var sortText = sort == null ? null : JSON.stringify(sort);

            for (var i = 0; i < this._data.length; i++) {
                var cacheRecord = this._data[i];
                var count = toIndex - fromIndex + 1;

                if (cacheRecord.filter == filterText && cacheRecord.sort == sortText) {
                    if (cacheRecord.fromIndex <= fromIndex && cacheRecord.toIndex >= toIndex) {
                        cacheRecord.lastUsed = new Date().getTime();
                        return cacheRecord.rows.slice(fromIndex - cacheRecord.fromIndex, fromIndex - cacheRecord.fromIndex + count);
                    }
                }
            }

            return null;
        }

        private putRowsInCache(rows: ICachedRows) {
            for (var i = 0; i < this._data.length; i++) {
                if (this._data[i].filter == rows.filter && this._data[i].sort == rows.sort) {
                    if (this.checkIntersection(rows, this._data[i])) {
                        var cacheRecord = this._data.splice(i, 1)[0];
                        cacheRecord = this.union(cacheRecord, rows);
                        this.putRowsInCache(cacheRecord);
                        return;
                    }
                }
            }

            this._data.push(rows);
        }

        private union(a: ICachedRows, b: ICachedRows): ICachedRows {
            // a contains b;
            if (b.fromIndex >= a.fromIndex && b.toIndex <= a.toIndex) {
                return a;
            }

            // b contains a;
            if (a.fromIndex >= b.fromIndex && a.toIndex <= b.toIndex) {
                return b;
            }

            // a before b;
            if (a.fromIndex < b.fromIndex) {
                return {
                    fromIndex: a.fromIndex,
                    toIndex: b.toIndex,
                    rows: a.rows.slice(0).concat(b.rows.slice(a.toIndex - b.fromIndex + 1)),
                    filter: a.filter,
                    sort: a.sort,
                    lastUsed: Math.max(a.lastUsed, b.lastUsed)
                }
            } else {
                // b before a;
                return {
                    fromIndex: b.fromIndex,
                    toIndex: a.toIndex,
                    rows: b.rows.slice(0).concat(a.rows.slice(b.toIndex - a.fromIndex + 1)),
                    filter: a.filter,
                    sort: a.sort,
                    lastUsed: Math.max(a.lastUsed, b.lastUsed)
                }
            }
        }

        private checkIntersection(range1: ICachedRows, range2: ICachedRows) {
            return range1.fromIndex < range2.toIndex && range2.fromIndex < range1.toIndex;
        }
    }

    interface ICachedRows {
        filter: string;
        sort: string;
        fromIndex: number;
        toIndex: number;
        rows: any[];
        lastUsed: number;
    }
} 