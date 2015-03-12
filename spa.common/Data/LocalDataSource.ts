module spa {
    export class LocalDataSource<TRow> implements IDataSource<TRow> {
        private _rows: TRow[];
        private _needResort = false;
        private _sort: ISort[];
        private _sortedRows: TRow[];

        constructor(rows?: TRow[]) {
            if (rows != null) {
                this.rows = rows;
            }
        }

        public onchanged = new spa.Notification();

        public get rows(): TRow[] {
            return this._rows;
        }

        public set rows(rows: TRow[]) {
            if (this._rows != rows) {
                this._rows = rows;
                this._needResort = true;

                this.onChanged();
            }
        }

        public get sort(): ISort[]{
            return this._sort;
        }

        public set sort(sort: ISort[]) {
            if (this._sort != sort) {
                this._sort = sort;
                this._needResort = true;

                this.onChanged();
            }
        }

        public getRows(skip: number, take: number, callback: (rows: any[]) => any) {
            if (this._sort != null && this._sort.length > 0) {
                if (this._needResort) {
                    this._sortedRows = this.sortRows(this._rows);
                }

                callback(this._sortedRows.slice(skip, skip + take));
            }
            else {
                callback(this._rows.slice(skip, skip + take));
            }
        }

        public getRowCount(callback: (count: number) => any) {
            callback(this._rows.length);
        }

        protected onChanged() {
            this.onchanged.notify();
        }

        protected onSort(row1: TRow, row2: TRow, columnName: string): number {
            var a = row1[columnName];
            var b = row2[columnName];

            if (a == null && b == null) {
                return 0;
            }

            if (a == null) {
                return -1;
            }

            if (b == null) {
                return 1;
            }

            if (typeof a == "string") {
                a = a.toLowerCase();
            }

            if (typeof b == "string") {
                b = b.toLowerCase();
            }

            if (a < b) {
                return -1;
            }

            if (a > b) {
                return 1;
            }

            return 0;
        }

        private sortRows(rows: TRow[]): TRow[] {
            var result = rows.slice(0);

            if (this._sort == null || this._sort.length == 0) {
                return result;
            }

            result.sort((r1, r2) => {
                for (var i = 0; i < this._sort.length; i++) {
                    var sortResult = this.onSort(r1, r2, this._sort[i].columnName);

                    if (sortResult != 0) {
                        if (this._sort[i].ascending) {
                            return sortResult;
                        }
                        else {
                            return -sortResult;
                        }
                    }
                }

                return 0;
            });

            return result;
        }
    }
} 