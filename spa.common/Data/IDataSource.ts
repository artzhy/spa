module spa {
    export interface IDataSource<T> {
        getRows(skip: number, take: number, callback: (rows: T[]) => any);
        getRowCount(callback: (count: number) => any);
        sort: ISort[];

        onchanged: spa.Notification<any>;
    }
}