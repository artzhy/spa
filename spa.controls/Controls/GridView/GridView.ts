module spa.controls {
    export class GridView extends Component {
        public static componentName = "grid-view";

        private _columns: { [columnName: string]: IGridColumn } = {};
        private _data: IDataSource<any>;
        private _filteredRows = null;
        private _pageSize: number;
        private _sort: ISort[];
        private _templateCells: { [columnName: string]: HTMLTableCellElement } = {};
        private _textFilter: string;

        // обратная связь;
        private paramSelectedRow: KnockoutObservable<any>;
        private paramSort: KnockoutObservableArray<ISort>;

        // параметры модели представления;
        private columns = ko.observableArray<IGridColumnViewModel>();
        private footerText = ko.observable<string>();
        private html = ko.observable<string>(); 
        private page = ko.observable<number>(1);
        private pageCount = ko.observable<number>(1);
        private rows = ko.observableArray<any>();
        private scrollTop = ko.observable<number>();
        private selectedIndex = ko.observable<number>();
        private template: HTMLTableRowElement[];
        private templateVisible = ko.observable(false);

        constructor(params?: IGridParams, template?: HTMLTableRowElement) {
            super(params);

            if (params == null || params.columns == null) {
                throw new Exception("Требуется обязательный параметр 'columns' для компонента grid.");
            }

            if (params == null || params.data == null) {
                throw new Exception("Требуется обязательный параметр 'data' для компонента grid.");
            }
            
            this.bindHandlers();
            this.setupCallback(params);

            // columns;
            ko.unwrap(params.columns).forEach((column) => {
                this._columns[column.name] = column;
            });

            // data;
            var data = ko.unwrap(<any>params.data);

            if (data instanceof Array) {
                this._data = new LocalDataSource(data);
            } else {
                this._data = data;
            }

            this._data.onchanged.subscribe(this.onDataSourceChanged);

            // pageSize;
            if (params.pageSize != null) {
                var pageSize = ko.unwrap(params.pageSize);

                if (pageSize != null && pageSize > 0) {
                    this._pageSize = pageSize;
                }
            }

            // textFilter;
            if (params.textFilter != null) {
                this._textFilter = ko.unwrap(params.textFilter);
            }

            // sort;
            if (params.sort != null) {
                this._sort = ko.unwrap(params.sort);
            }

            // viewmodel columns;
            var columns: IGridColumnViewModel[] = ko.unwrap(params.columns).map(x => {
                var sort = this._sort == null ? [] : this._sort.filter(y => y.columnName == x.name);

                return {
                    className: ko.observable(x.headerClassName),
                    headerHtml: ko.observable(x.headerText),
                    hint: ko.observable(x.hint || x.headerText),
                    name: x.name,
                    sortable: ko.observable(x.sortable),
                    sort: ko.observable(sort.length > 0),
                    sortAscending: ko.observable(sort.length > 0 && sort[0].ascending),
                    width: ko.observable(typeof x.width == "number" ? x.width.toString() + "px" : x.width)
                }
            });

            this.columns(columns);

            // viewmodel footerText;
            if (params.footerText != null) {
                this.footerText(ko.unwrap(params.footerText));
            }

            // viewmodel template;
            if (template != null) {
                for (var i = 0; i < template.childNodes.length; i++) {
                    if (template.childNodes[i].nodeType == 1) {
                        var tableCell = <HTMLTableCellElement>template.childNodes[i];

                        if (tableCell.hasAttribute("columnName")) {
                            this._templateCells[tableCell.getAttribute("columnName")] = tableCell;
                        }
                        else {
                            throw new Exception("Требуется атрибут columnName в шаблоне компонента grid.");
                        }
                    }
                }

                while (template.firstChild) {
                    template.removeChild(template.firstChild);
                }

                for (var columnName in this._columns) {
                    if (columnName in this._templateCells) {
                        if (this._columns[columnName].className != null) {
                            this._templateCells[columnName].classList.add(this._columns[columnName].className);
                        }
                    } else {
                        var cellTemplate = document.createElement("td");
                        cellTemplate.setAttribute("data-bind", "text: $data");
                        this._templateCells[columnName] = cellTemplate;
                    }

                    template.appendChild(this._templateCells[columnName]);
                }

                this.template = [template];
            }

            // viewmodel data;
            this.getPageCount((pageCount) => {
                // page;
                this.page(1);

                // pageCount;
                this.pageCount(pageCount);

                this.getPageRows(1,(rows) => {
                    // rows;
                    this.rows(rows);

                    if (params.selectedRow != null) {
                        var index = rows.indexOf(ko.unwrap(params.selectedRow));

                        if (index == -1) {
                            this.callbackSelectedRow(null);
                        }
                        else {
                            // selectedIndex;
                            this.selectedIndex(index);
                        }
                    }

                    if (this.template == null) {
                        // html;
                        this.html(this.getHtml(rows));
                    }
                    else {
                        // useTemplate;
                        this.templateVisible(true);
                    }

                    this.createSubscriptions(params);
                });
            });
        }

        private setupCallback(params: IGridParams) {
            if (params.selectedRow != null) {
                if (ko.isWriteableObservable(params.selectedRow)) {
                    this.paramSelectedRow = params.selectedRow;
                }
            }

            if (params.sort != null) {
                if (ko.isWriteableObservable(params.sort)) {
                    this.paramSort = <any>params.sort;
                }
            }
        }

        private createSubscriptions(params: IGridParams) {
            if (params.columns != null && ko.isObservable(params.columns)) {
                this.subscribe(<KnockoutObservableArray<IGridColumn>>params.columns, this.onColumnsChanged);
            }

            if (params.data != null && ko.isObservable(params.data)) {
                this.subscribe(<KnockoutObservable<any>>params.data, this.onDataChanged);
            }

            if (params.footerText != null && ko.isObservable(params.footerText)) {
                this.subscribe(<KnockoutObservable<string>>params.footerText, this.onFooterTextChanged);
            }

            if (params.pageSize != null && ko.isObservable(params.pageSize)) {
                this.subscribe(<KnockoutObservable<number>>params.pageSize, this.onPageSizeChanged);
            }

            if (params.selectedRow != null && ko.isObservable(params.selectedRow)) {
                this.subscribe(<KnockoutObservable<number>>params.selectedRow, this.onSelectedRowChanged);
            }

            if (params.sort != null && ko.isObservable(params.sort)) {
                this.subscribe(<KnockoutObservableArray<ISort>>params.sort, this.onSortChanged);
            }

            if (params.textFilter != null && ko.isObservable(params.textFilter)) {
                this.subscribe(<KnockoutObservable<string>>params.textFilter, this.onTextFilterChanged);
            }
        }

        private bindHandlers() {
            this.onDataSourceChanged = this.onDataSourceChanged.bind(this);

            this.onColumnsChanged = this.onColumnsChanged.bind(this);
            this.onDataChanged = this.onDataChanged.bind(this);
            this.onFooterTextChanged = this.onFooterTextChanged.bind(this);
            this.onPageSizeChanged = this.onPageSizeChanged.bind(this);
            this.onSelectedRowChanged = this.onSelectedRowChanged.bind(this);
            this.onSortChanged = this.onSortChanged.bind(this);
            this.onTextFilterChanged = this.onTextFilterChanged.bind(this);

            this.tableHeaderClick = this.tableHeaderClick.bind(this);
            this.tableCellClick = this.tableCellClick.bind(this);
            this.tableKeyDown = this.tableKeyDown.bind(this);
            this.previousPageClick = this.previousPageClick.bind(this);
            this.nextPageClick = this.nextPageClick.bind(this);
        }

        // #region DataSource events, row retrieval and filtering.

        private onDataSourceChanged() {
            this._filteredRows = null;

            if (!this.compareSortOrder(this._sort, this._data.sort)) {
                this._sort = this._data.sort;

                var viewColumns = this.columns();

                if (viewColumns != null && viewColumns.length > 0) {
                    viewColumns.forEach((viewColumn) => {
                        var sort = this._sort.filter(x => x.columnName == viewColumn.name)[0];

                        viewColumn.sort(sort != null);
                        viewColumn.sortAscending(sort != null && sort.ascending);
                    });
                }

                this.callbackSort(this._sort);
            }

            this.getPageCount((pageCount) => {
                this.pageCount(pageCount);

                if (this.page() > pageCount) {
                    this.page(pageCount);
                }

                this.getPageRows(this.page(),(rows) => {
                    this.rows(rows);

                    if (this.selectedIndex() != null && rows.indexOf(this.selectedIndex()) == -1) {
                        this.selectedIndex(-1);
                        this.callbackSelectedRow(null);
                    }

                    if (this.template == null) {
                        this.html(this.getHtml(rows));
                    }

                    this.scrollTop(0);
                });
            });         
        }

        private getPageRows(page: number, callback: (rows: any[]) => any) {
            if (this._data == null) {
                callback([]);
            }
            else {
                if (this._pageSize == null) {
                    this.getFilteredRowCount((count) => {
                        this.getFilteredRows(0, count, callback);
                    });
                }
                else {
                    this.getFilteredRows((page - 1) * this._pageSize, this._pageSize, callback);
                }
            }
        }

        private getPageCount(callback: (count: number) => any) {
            if (this._data == null) {
                callback(1);
            }
            else {
                if (this._pageSize == null) {
                    callback(1);
                }
                else {
                    this.getFilteredRowCount((count) => {
                        if (count == 0) {
                            callback(1);
                        } else {
                            callback(Math.ceil(count / this._pageSize));
                        }
                    });
                }
            }
        }

        private getFilteredRows(skip: number, take: number, callback: (rows: any[]) => any) {
            if (this._data == null) {
                callback([]);
            } else {
                if (this._textFilter == null || this._textFilter.trim().length == 0) {
                    this._data.getRows(skip, take, callback);
                }
                else {
                    if (this._filteredRows != null) {
                        callback(this._filteredRows.slice(skip, skip + take));
                    }
                    else {
                        this._data.getRowCount((count) => {
                            this._data.getRows(0, count,(rows) => {
                                this._filteredRows = this.filterRows(rows);
                                callback(this._filteredRows.slice(skip, skip + take));
                            });
                        });
                    }
                }
            }
        }

        private getFilteredRowCount(callback: (count: number) => any) {
            if (this._data == null) {
                callback(0);
            }
            else {
                if (this._textFilter == null || this._textFilter.trim().length == 0) {
                    this._data.getRowCount(callback);
                }
                else {
                    if (this._filteredRows != null) {
                        callback(this._filteredRows.length);
                    } else {
                        this._data.getRowCount((count) => {
                            this._data.getRows(0, count,(rows) => {
                                this._filteredRows = this.filterRows(rows);
                                callback(this._filteredRows.length);
                            });
                        });
                    }
                }
            }
        }

        private filterRows(rows: any[]): any[]{
            if (this._textFilter == null || this._textFilter.trim().length == 0) {
                return rows;
            }

            var columns: IGridColumn[] = [];

            for (var columnName in this._columns) {
                columns.push(this._columns[columnName]);
            }

            if (this._columns == null) {
                return rows;
            }

            var words = this._textFilter.toLowerCase().split(" ").filter(x => x != null && x.trim().length > 0);
            var filteredRows = [];

            rows.forEach((row) => {
                columns.forEach((column) => {
                    var text: string = column.customFilterText != null ? column.customFilterText(row) : row[column.name];

                    if (text != null) {
                        if (typeof text != "string") {
                            text = text.toString();
                        }

                        text = text.toLowerCase();

                        if (words.every(x => text.contains(x))) {
                            filteredRows.push(row);
                        }
                    }
                });
            });

            return filteredRows;
        }

        private compareSortOrder(sort1: ISort[], sort2: ISort[]): boolean {
            if (sort1 == null && sort2 == null) {
                return true;
            }

            if (sort1 == null || sort2 == null) {
                return false;
            }

            for (var i = 0; i < sort1.length; i++) {
                if (sort1[i].ascending != sort2[i].ascending) {
                    return false;
                }

                if (sort1[i].columnName != sort2[i].columnName) {
                    return false;
                }
            }

            return true;
        }

        // #endregion

        // #region Parameter change event handlers.

        private onColumnsChanged(columns: IGridColumn[]| KnockoutObservableArray<IGridColumn>) {
            var unwrappedColumns = ko.unwrap(columns);

            this._columns = {};

            if (unwrappedColumns != null) {
                unwrappedColumns.forEach((column) => {
                    this._columns[column.name] = column;
                });
            }

            if (this.template != null) {
                var row = this.template[0];

                while (row.firstChild) {
                    row.removeChild(row.firstChild);
                }

                unwrappedColumns.forEach((column) => {
                    var templateCell = this._templateCells[column.name];

                    if (column.className != null && templateCell.classList.contains(column.className)) {
                        templateCell.classList.add(column.className);
                    }

                    row.appendChild(templateCell);
                });
            }

            var tableColumns: IGridColumnViewModel[] = unwrappedColumns.map(x => {
                var sort = this._sort.filter(y => y.columnName == x.name);

                return {
                    className: ko.observable(x.headerClassName),
                    headerHtml: ko.observable(x.headerText),
                    hint: ko.observable(x.hint || x.headerText),
                    name: x.name,
                    sortable: ko.observable(x.sortable),
                    sort: ko.observable(sort.length > 0),
                    sortAscending: ko.observable(sort.length > 0 && sort[0].ascending),
                    width: ko.observable(typeof x.width == "number" ? x.width.toString() + "px" : x.width)
                }
            });

            if (this.template == null) {
                this.html("");
                this.columns(tableColumns);
                this.html(this.getHtml(this.rows()));
            }
            else {
                this.templateVisible(false);
                this.templateVisible(true);
            }
        }

        private onDataChanged(data: Array<any> | KnockoutObservableArray<any> | IDataSource<any> | KnockoutObservable<IDataSource<any>>) {
            if (this._data != null) {
                this._data.onchanged.unsubscribe(this.onDataSourceChanged);
            }

            var unwrapperData = ko.unwrap(<any>data);

            if (data instanceof Array) {
                this._data = new LocalDataSource(unwrapperData);
            } else {
                this._data = unwrapperData;
            }

            if (this._data != null) {
                this._data.onchanged.subscribe(this.onDataSourceChanged);
            }

            this.onDataSourceChanged();
        }

        private onFooterTextChanged(footerText: string | KnockoutObservable<string>) {
            this.footerText(ko.unwrap(footerText));
        }

        private onPageSizeChanged(pageSize: number | KnockoutObservable<number>) {
            var value = ko.unwrap(pageSize);

            if (value != null && value < 1) {
                value = null;
            }

            if (this._pageSize != value) {
                this._pageSize = value;
                this.onDataSourceChanged();
            }
        }

        private onSelectedRowChanged(selectedRow: any | KnockoutObservable<any>) {
            var unwrappedRow = ko.unwrap(selectedRow);
            var index = unwrappedRow == null ? -1 : this.rows().indexOf(unwrappedRow);

            if (index == -1 && unwrappedRow != null) {
                this.callbackSelectedRow(null);
            }

            this.selectedIndex(index);
        }

        private onSortChanged(sort: Array<ISort> | KnockoutObservableArray<ISort>) {
            var unwrappedSort = ko.unwrap(sort);

            if (!this.compareSortOrder(this._sort, unwrappedSort)) {
                this._data.sort = unwrappedSort;
            }
        }

        private onTextFilterChanged(textFilter?: string | KnockoutObservable<string>) {
            var unwrappedTextFilter = ko.unwrap(textFilter);

            if (this._textFilter == unwrappedTextFilter) {
                return;
            }

            this._filteredRows = null;
            this._textFilter = unwrappedTextFilter;

            this.onDataSourceChanged();
        }

        // #endregion

        // #region Parameter callback.

        private callbackSelectedRow(selectedRow: any) {
            if (this.paramSelectedRow != null) {
                setTimeout(() => {
                    this.paramSelectedRow(selectedRow);
                }, 0);
            }
        }

        private callbackSort(sort: ISort[]) {
            if (this.paramSort != null) {
                setTimeout(() => {
                    this.paramSort(sort);
                }, 0);
            }
        }

        // #endregion

        // #region View events and update.

        private tableHeaderClick(column: IGridColumn, e: any) {
            var columnName: string = null;

            if (e.target.nodeType == 1 && e.target.tagName == "TH") {
                columnName = e.target.getAttribute("columnName");
            } else {
                var parentNode = e.target.parentNode;

                while (parentNode != null) {
                    if (parentNode.nodeType == 1 && parentNode.tagName == "TH") {
                        columnName = e.target.getAttribute("columnName");
                        break;
                    }

                    parentNode = parentNode.parentNode;
                }
            }

            if (columnName != null) {
                var column = this._columns[columnName];

                if (column.sortable == true) {
                    if (this._sort == null) {
                        this._sort = [];
                    }

                    var columnSort = this._sort.filter(x => x.columnName == columnName)[0];

                    if (columnSort == null) {
                        columnSort = { ascending: true, columnName: columnName };
                    } else {
                        columnSort.ascending = !columnSort.ascending;
                    }

                    if (e.ctrlKey) {
                        this._sort = this._sort.slice();

                        if (this._sort.indexOf(columnSort) == -1) {
                            this._sort.push(columnSort);
                        }
                    }
                    else {
                        this._sort = [columnSort];
                    }

                    this._data.sort = this._sort;

                    this.callbackSort(this._sort);
                }
            }

            e.stopPropagation();
        }

        private tableCellClick(row: any, e: any) {
            var rowElement: HTMLTableRowElement = null;

            if (e.target.nodeType == 1 && e.target.tagName == "TR") {
                rowElement = e.target;
            } else {
                var parentNode = e.target.parentNode;

                while (parentNode != null) {
                    if (parentNode.nodeType == 1 && parentNode.tagName == "TR") {
                        rowElement = parentNode;
                        break;
                    }

                    parentNode = parentNode.parentNode;
                }
            }

            if (rowElement != null) {
                var index = 0;
                var rowIndex = -1;
                var rows = rowElement.parentElement.childNodes;

                for (var i = 0; i < rows.length; i++) {
                    if (rows[i].nodeType == 1 && (<HTMLElement>rows[i]).tagName == "TR") {
                        if (rows[i] == rowElement) {
                            rowIndex = index;
                            break;
                        }

                        index++;
                    }
                }

                this.selectedIndex(rowIndex);
                this.callbackSelectedRow(rowIndex == -1 ? null : this.rows()[rowIndex]);
            }

            return true;
            // e.stopPropagation();
        }

        private tableKeyDown(vm, e: KeyboardEvent) {
            if (e.keyCode == 38 || e.keyCode == 40) {
                var rows = this.rows();

                if (rows.length == 0) {
                    return;
                }

                var rowIndex = this.selectedIndex();

                if (rowIndex == -1) {
                    rowIndex = 0;
                }
                else {
                    if (e.keyCode == 38) {
                        if (rowIndex > 0) {
                            rowIndex--;
                        }
                    } else {
                        if (rowIndex < rows.length - 1) {
                            rowIndex++;
                        }
                    }
                }

                if (rowIndex != this.selectedIndex()) {
                    this.selectedIndex(rowIndex);
                    this.callbackSelectedRow(rowIndex == -1 ? null : this.rows()[rowIndex]);
                }
            }

            e.stopPropagation();
        }

        private previousPageClick() {
            if (this.page() > 1) {
                this.setPage(this.page() - 1);
            }
        }

        private nextPageClick() {
            if (this.page() < this.pageCount()) {
                this.setPage(this.page() + 1);
            }
        }

        private setPage(page: number) {
            this.page(page);

            this.getPageRows(page,(rows) => {
                this.rows(rows);

                if (this.template == null) {
                    this.html(this.getHtml(rows));
                }

                if (this.selectedIndex() != -1) {
                    this.selectedIndex(-1);
                    this.callbackSelectedRow(null);
                }

                this.scrollTop(1);
                this.scrollTop(0);
            });
        }

        private getHtml(rows: any[]): string {
            var columns: IGridColumn[] = [];
            var filtered = this._textFilter != null && this._textFilter.trim().length > 0;
            var html = "";
            var words: string[] = filtered ? this._textFilter.trim().split(" ").filter(x => x.trim().length > 0) : [];

            for (var columnName in this._columns) {
                columns.push(this._columns[columnName]);
            }

            rows.forEach((row, rowIndex) => {
                html += "<tr>";

                columns.forEach((column) => {
                    var innerHtml: string = null;

                    if (column.customDisplayText != null) {
                        innerHtml = column.customDisplayText(row);
                    }
                    else {
                        var value = row[column.name];

                        if (column.displayFormat != null) {
                            innerHtml = column.displayFormat.format(value);
                        } else {
                            if (value == null) {
                                innerHtml = "";
                            }
                            else {
                                innerHtml = typeof value == "string" ? value : value.toString();
                            }
                        }
                    }

                    if (filtered) {
                        innerHtml = this.highlightText(innerHtml, words, "grid-highlight");
                    }

                    var classList = [];

                    if (column.className != null) {
                        classList.push(column.className);
                    }

                    html += "<td" + (classList.length == 0 ? "" : classList.join(" ")) + ">" + innerHtml + "</td>";
                });

                html += "</tr>";
            });

            return html;
        }

        private highlightText(html: string, words: string[], className: string): string {
            if (html == null || html.trim().length == 0) {
                return html;
            }

            var tag = false;
            var quote: string = null;
            var sentences: { start: number; length: number }[] = [];
            var start = -1;

            // извлекаем текст;
            for (var i = 0; i < html.length; i++) {
                if (tag) {
                    if (html[i] == "'") {
                        quote == null ? "'" : null;
                        continue;
                    }

                    if (html[i] == '"') {
                        quote == null ? '"' : null;
                        continue;
                    }

                    if (html[i] == ">" && quote == null) {
                        tag = false;
                        continue;
                    }
                }
                else {
                    if (html[i] == "<") {
                        tag = true;

                        if (start != -1) {
                            sentences.push({ start: start, length: i - start });
                            start = -1;
                        }
                    }
                }
            }

            if (start != -1) {
                sentences.push({ start: start, length: html.length - start });
            }

            sentences.reverse();

            var result = html;

            // заменяем слова на <span class='@className'></span>
            sentences.forEach((sentence) => {
                var s = html.substr(sentence.start, sentence.length);

                words.forEach((word) => {
                    var wordIndex = s.toLowerCase().indexOf(word.toLowerCase());

                    if (wordIndex != -1) {
                        s = s.substr(0, wordIndex) + '<span class="' + className + '">' + s.substr(wordIndex, word.length) + "</span>" + s.substr(wordIndex + word.length);
                    }
                });

                result = result.substr(0, sentence.start) + s + result.substr(sentence.start, sentence.start + sentence.length);
            });

            return html;
        }

        // #endregion

        public dispose() {
            this._columns = null;
            
            if (this._data != null) {
                this._data.onchanged.unsubscribe(this.onDataSourceChanged);
            }

            this._data = null;
            this._filteredRows = null;
            this._templateCells = null;

            this.paramSelectedRow = null;
            this.paramSort = null;

            this.template = null;

            super.dispose();
        }
    }

    export interface IGridParams {
        /* Столбцы таблицы. */
        columns?: IGridColumn[] | KnockoutObservableArray<IGridColumn>;

        /* Данные. */
        data: Array<any> | KnockoutObservableArray<any> | IDataSource<any> | KnockoutObservable<IDataSource<any>>;

        /* Текст в нижней части таблицы. */
        footerText: string | KnockoutObservable<string>;

        /* Размер страницы. */
        pageSize?: number | KnockoutObservable<number>;

        /* Выбранная строка. */
        selectedRow?: any | KnockoutObservable<any>;

        /* Параметры сортировки. */
        sort?: Array<ISort> | KnockoutObservableArray<ISort>;

        /* Текстовый фильтр. */
        textFilter?: string | KnockoutObservable<string>;
    }

    export interface IGridColumn {
        /** Класс ячеек. */
        className?: string;

        /** Определяет HTML ячейки для отображения (игнорируется при использовании шаблона). */
        customDisplayText?: (row: any) => string;

        /** Определяет текст ячейки для фильтрации. */
        customFilterText?: (row: any) => string;

        /** Произвольный формат ячейки (игнорируется при использовании шаблона). */
        displayFormat?: string;

        /** Стиль заголовка столбца. */
        headerClassName?: string;

        /** Текст заголовка столбца. */
        headerText?: string;

        /** Всплывающая подсказка. */
        hint?: string;

        /** Название столбца. */
        name: string;

        /** Разрешена сортировка. */
        sortable?: boolean;

        /** Ширина столбца (если указано число, то в пикселях). */
        width?: string | number;
    }

    interface IGridColumnViewModel {
        className: KnockoutObservable<string>;
        headerHtml: KnockoutObservable<string>;
        hint: KnockoutObservable<string>;
        name: string;
        sortable: KnockoutObservable<boolean>;
        sort: KnockoutObservable<boolean>;
        sortAscending: KnockoutObservable<boolean>;
 //       visible: KnockoutObservable<boolean>;
        width: KnockoutObservable<any>;
    }

    ko.components.register(GridView.componentName, {
        viewModel: {
            createViewModel: function (params, componentInfo) {
                var row = componentInfo.templateNodes == null ? null : findRow(componentInfo.templateNodes);
                return new spa.controls.GridView(params, row);
            }
        },
        template: "GridView.html"
    });

    function findRow(nodes: any[]): HTMLTableRowElement {
        if (nodes != null && nodes.length > 0) {
            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].nodeType == 1 && nodes[i].tagName == "TR") {
                    return nodes[i];
                }

                var childResult = findRow(nodes[i].childNodes);

                if (childResult != null) {
                    return childResult;
                }
            }
        }

        return null;
    }
}