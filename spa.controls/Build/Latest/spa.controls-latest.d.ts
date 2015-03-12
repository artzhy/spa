declare module spa.controls {
    class Component {
        private _propertySubscriptions;
        constructor(params: any);
        createObservableProperty<T>(propertyName: string, value: T, sourceProperty: any): void;
        createObservableArrayProperty<T>(propertyName: string, value: T[], sourceProperty: any): void;
        compare(value1: any, value2: any): boolean;
        subscribe<T>(property: KnockoutObservable<T>, handler: (newValue: T) => any): void;
        subscribeArrayChange<T>(property: KnockoutObservable<T>, added?: (value: T) => any, removed?: (value: T) => any): void;
        ensureParametersValid(validParameters: string[], params: any, componentName?: string): void;
        dispose(): void;
    }
}
declare module spa.controls {
}
declare module spa.controls {
    class Calendar extends Component {
        static componentName: string;
        private cells;
        private date;
        private headerCells;
        private headerVisible;
        private level;
        private period;
        value: KnockoutObservable<Date>;
        constructor(params: any);
        private bindHandlers();
        private onValueChanged(value);
        private back();
        private up();
        private forward();
        private cellClick(cell);
        private createComputedProperties();
        private getCells();
        private getHeaderCells();
        private getHeaderVisible();
        private getPeriod();
        private getMonthText(month);
        private addDays(date, days);
        private addMonths(date, months);
        private addYears(date, years);
        private isSameDate(date1, date2);
        private isSameMonth(date1, date2);
        private isSameYear(date1, date2);
        private isSameDecade(date1, date2);
        dispose(): void;
    }
}
declare module spa.controls {
    class CheckBox extends Component {
        static componentName: string;
        private disableSubscriptions;
        private hasFocus;
        private hasMouse;
        private hasText;
        private state;
        align: KnockoutObservable<string>;
        autofocus: KnockoutObservable<boolean>;
        checked: KnockoutObservable<boolean>;
        enabled: KnockoutObservable<boolean>;
        text: KnockoutObservable<string>;
        value: KnockoutObservable<any>;
        valueChecked: KnockoutObservable<any>;
        valueUnchecked: KnockoutObservable<any>;
        constructor(params: any);
        private onMouseEnter();
        private onMouseLeave();
        private bindMethods();
        onClick(): void;
        onLabelMouseDown(): boolean;
        onKeyPress(data: any, ev: KeyboardEvent): boolean;
        private createComputed();
        private onCheckedChanged(checked);
        private onValueChanged(value);
        private onValueCheckedChanged(valueChecked);
        private onValueUncheckedChanged(valueUnchecked);
        private onPropertyChanged(propertyName);
        dispose(): void;
    }
}
declare module spa.controls {
}
declare module spa.controls {
    class DateEdit extends Component {
        static componentName: string;
        private focused;
        private popupToggle;
        private popupVisible;
        autofocus: KnockoutObservable<boolean>;
        enabled: KnockoutObservable<boolean>;
        text: KnockoutObservable<string>;
        value: KnockoutObservable<Date>;
        constructor(params: any);
        private bindMethods();
        private createComputedProperties();
        private getPopupVisible();
        private onEnabledChanged(enabled);
        private onFocusedChanged(focused);
        private onTextChanged(text);
        private onValueChanged(value);
        private onButtonClick();
        private onButtonMouseDown();
        private onPopupMouseDown();
        private onKeyDown(data, ev);
        private format(date);
        private daysInMonth(year, month);
        private isSameDate(date1, date2);
        private isValidDate(date);
        private parse(text);
        dispose(): void;
    }
}
declare module spa.controls {
    class GridView extends Component {
        static componentName: string;
        private _columns;
        private _data;
        private _filteredRows;
        private _pageSize;
        private _sort;
        private _templateCells;
        private _textFilter;
        private paramSelectedRow;
        private paramSort;
        private columns;
        private footerText;
        private html;
        private page;
        private pageCount;
        private rows;
        private scrollTop;
        private selectedIndex;
        private template;
        private templateVisible;
        constructor(params?: IGridParams, template?: HTMLTableRowElement);
        private setupCallback(params);
        private createSubscriptions(params);
        private bindHandlers();
        private onDataSourceChanged();
        private getPageRows(page, callback);
        private getPageCount(callback);
        private getFilteredRows(skip, take, callback);
        private getFilteredRowCount(callback);
        private filterRows(rows);
        private compareSortOrder(sort1, sort2);
        private onColumnsChanged(columns);
        private onDataChanged(data);
        private onFooterTextChanged(footerText);
        private onPageSizeChanged(pageSize);
        private onSelectedRowChanged(selectedRow);
        private onSortChanged(sort);
        private onTextFilterChanged(textFilter?);
        private callbackSelectedRow(selectedRow);
        private callbackSort(sort);
        private tableHeaderClick(column, e);
        private tableCellClick(row, e);
        private tableKeyDown(vm, e);
        private previousPageClick();
        private nextPageClick();
        private setPage(page);
        private getHtml(rows);
        private highlightText(html, words, className);
        dispose(): void;
    }
    interface IGridParams {
        columns?: IGridColumn[] | KnockoutObservableArray<IGridColumn>;
        data: Array<any> | KnockoutObservableArray<any> | IDataSource<any> | KnockoutObservable<IDataSource<any>>;
        footerText: string | KnockoutObservable<string>;
        pageSize?: number | KnockoutObservable<number>;
        selectedRow?: any | KnockoutObservable<any>;
        sort?: Array<ISort> | KnockoutObservableArray<ISort>;
        textFilter?: string | KnockoutObservable<string>;
    }
    interface IGridColumn {
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
}
declare module spa.controls {
}
declare module spa.controls {
    class MemoEdit extends Component {
        static componentName: string;
        autofocus: KnockoutObservable<boolean>;
        enabled: KnockoutObservable<boolean>;
        maxLength: KnockoutObservable<number>;
        placeholder: KnockoutObservable<string>;
        readOnly: KnockoutObservable<boolean>;
        text: KnockoutObservable<string>;
        constructor(params: any);
    }
}
declare module spa.controls {
    class NumericEdit extends Component {
        static componentName: string;
        private hasFocus;
        private text;
        autofocus: KnockoutObservable<boolean>;
        decimals: KnockoutObservable<number>;
        enabled: KnockoutObservable<boolean>;
        increment: KnockoutObservable<number>;
        max: KnockoutObservable<number>;
        min: KnockoutObservable<number>;
        placeholder: KnockoutObservable<string>;
        readOnly: KnockoutObservable<boolean>;
        units: KnockoutObservable<string>;
        value: KnockoutObservable<number>;
        constructor(params: any);
        private bindMethods();
        private onButtonMouseDown(ev);
        private onDecimalsChanged(decimals);
        private onFocusChanged(focused);
        private onMinChanged(min);
        private onMaxChanged(max);
        private onTextChanged(text);
        private onUnitsChanged(units);
        private onValueChanged(value);
        private decrease();
        private increase();
        private addIncrement(up);
        private format(value);
        private parse(text);
        private truncate(value);
    }
}
declare module spa.controls {
    class PertViewModel extends Component {
        viewModel: KnockoutObservable<PertDiagram>;
        constructor(params: any);
    }
}
declare module spa.controls {
    class PertElement {
        private _bounds;
        private _boundsUpdated;
        private _creating;
        private _hovered;
        private _canvas;
        private _canvasUpdated;
        private _outline;
        private _outlineUpdated;
        private _selected;
        private _subscriptions;
        private canvas;
        private outline;
        bounds: number[];
        creating: boolean;
        hovered: string;
        selected: boolean;
        style: ElementStyle;
        subscribe(handler: (element: PertElement, propertyName: string) => any): void;
        unsubscribe(handler: (element: PertElement, propertyName: string) => any): void;
        testBounds(rect: number[]): boolean;
        testPath(rect: number[]): boolean;
        testPoint(point: number[]): string;
        draw(ctx: CanvasRenderingContext2D): void;
        drawOutline(ctx: CanvasRenderingContext2D): void;
        onPropertyChanged(propertyName: string): void;
        onStyleChanged(propertyName: string): void;
        onLayout(ctx: CanvasRenderingContext2D): number[];
        onPaint(ctx: CanvasRenderingContext2D): void;
        onPaintOutline(ctx: CanvasRenderingContext2D): void;
        update(): void;
        updateBounds(): void;
        updateCanvas(): void;
        updateOutline(): void;
    }
    class ElementStyle {
        private _element;
        private _outlineColor;
        private _outlineWidth;
        constructor(element: PertElement);
        outlineColor: string;
        outlineWidth: number;
        onPropertyChanged(propertyName: string): void;
    }
}
declare module spa.controls {
    class PertConnector extends PertElement {
        private _anchors;
        private _arrowBounds;
        private _endAnchorBounds;
        private _endNode;
        private _endNodePoint;
        private _endPoint;
        private _imageStartPoint;
        private _imageEndPoint;
        private _locationChanged;
        private _startAnchorBounds;
        private _startNode;
        private _startNodePoint;
        private _startPoint;
        private _style;
        private _text;
        private _textBounds;
        constructor();
        anchors: boolean;
        endNode: PertNode;
        endPoint: number[];
        startNode: PertNode;
        startPoint: number[];
        style: ConnectorStyle;
        text: string;
        onPropertyChanged(propertyName: string): void;
        onStyleChanged(propertyName: string): void;
        onLayout(ctx: CanvasRenderingContext2D): number[];
        onPaint(ctx: CanvasRenderingContext2D): void;
        onPaintOutline(ctx: CanvasRenderingContext2D): void;
        testPath(rect: number[]): boolean;
        testPoint(point: number[]): string;
        draw(ctx: CanvasRenderingContext2D): void;
        drawOutline(ctx: CanvasRenderingContext2D): void;
        private updateLocation();
        private comparePoints(p1, p2);
        private onNodeChanged(node, propertyName);
        private floorPoint(point);
        private updateNodePoints();
        private getArrowBounds(start, end, width, capLength, capWidth);
        private wrapText(text, ctx, font, maxLines, maxWidth);
    }
    class ConnectorStyle extends ElementStyle {
        private _anchorBackgroundColor;
        private _anchorBorderColor;
        private _anchorBorderWidth;
        private _anchorRadius;
        private _color;
        private _font;
        private _lineDash;
        private _lineHeight;
        private _textOffset;
        private _textUnderline;
        private _width;
        constructor(element: PertElement);
        anchorBackgroundColor: string;
        anchorBorderColor: string;
        anchorBorderWidth: number;
        anchorRadius: number;
        color: string;
        font: string;
        lineDash: number[];
        lineHeight: number;
        textOffset: number;
        textUnderline: boolean;
        width: number;
    }
}
declare module spa.controls {
    class PertActivity extends PertConnector {
        private _days;
        private _progress;
        days: number;
        progress: number;
        onLayout(ctx: CanvasRenderingContext2D): number[];
        onPaint(ctx: CanvasRenderingContext2D): void;
        onPropertyChanged(propertyName: string): void;
    }
}
declare module spa.controls {
    class PertDependency extends PertConnector {
        constructor();
    }
}
declare module spa.controls {
    class PertDiagram {
        private _canvas;
        private _context;
        private _elements;
        private _new;
        private _scroll;
        private _selectedElements;
        private _tool;
        private _updatesDisabled;
        private _zoom;
        private _alt;
        private _ctl;
        private _cursor;
        private _lmb;
        private _rmb;
        private _shift;
        private _gridColor;
        private _gridSize;
        private _outlineColor;
        private _outlineWidth;
        constructor(canvas: HTMLCanvasElement);
        dispose(): void;
        canvas: HTMLCanvasElement;
        elements: PertElementCollection;
        scroll: number[];
        selectedElements: PertElement[];
        tool: PertTool;
        zoom: number;
        onelementconnecting: (connector: PertElement, anchor: string, node: PertNode) => boolean;
        onelementcreating: (element: PertElement) => boolean;
        onelementcreated: (element: PertElement) => any;
        onelementpropertychanged: (element: PertElement, propertyName: string) => any;
        onelementdeleting: (element: PertElement[]) => boolean;
        onelementdeleted: (element: PertElement[]) => any;
        onelementdoubleclick: (element: PertElement) => any;
        ongroupexpand: (group: PertGroup) => any;
        onscrollchanged: (scroll?: number[]) => any;
        onselectionchanged: (selectedElements?: PertElement[]) => any;
        ontoolchanged: (newTool?: PertTool) => any;
        onzoomchanged: (newZoom?: number) => any;
        private onElementConnecting(connector, anchor, node);
        private onElementCreating(element);
        private onElementCreated(element);
        private onElementPropertyChanged(element, propertyName);
        private onElementDeleting(element);
        private onElementDeleted(element);
        private onElementDoubleClick(element);
        private onGroupExpand(group);
        private onScrollChanged(scroll);
        private onSelectionChanged(selectedElements);
        private onToolChanged(newTool?);
        private onZoomChanged(newZoom?);
        private addEventListeners();
        private removeEvemtListeners();
        private onDoubleClick(ev);
        private onKeyDown(ev);
        private onKeyUp(ev);
        private onMouseDown(ev);
        private onMouseMove(ev);
        private onMouseOut(ev);
        private onMouseOver(ev);
        private onMouseUp(ev);
        private onMouseWheel(ev);
        private onWindowResize(ev);
        private setImageSmoothing(imageSmoothingEnabled);
        refresh(): void;
        private draw(clientRect?);
        private drawGrid(ctx, clientRect);
        private drawOutlines(ctx, elements);
        private drawElements(ctx, elements);
        private drawElementBounds(ctx, element);
        private drawSelection(ctx, startPoint, endPoint);
        private drawDebugData(ctx);
        private drawPolygon(ctx, polygon);
        private drawRectangle(ctx, rect);
        private getClientRect();
        private elementAdded(element);
        private elementPropertyChanged(element, propertyName);
        private elementRemoved(element);
        private redrawElement(element);
        private resetTool();
        private deleteElement(element);
        private beginUpdate();
        private endUpdate();
        private updateCanvasSize();
        private getCursorPosition(ev);
        private cursorPositionToString(state);
    }
    enum PertTool {
        CreateDependency = 0,
        CreateGroup = 1,
        CreateMilestone = 2,
        CreateWait = 3,
        CreateWork = 4,
        Move = 5,
        Select = 6,
    }
}
declare module spa.controls {
    class PertElementCollection {
        private _elements;
        onelementadded: (element: PertElement) => any;
        onelementpropertychanged: (element: PertElement, propertyName: string) => any;
        onelementremoved: (element: PertElement) => any;
        constructor();
        length: number;
        add(element: PertElement): void;
        clear(): void;
        filter(callbackfn: (element: PertElement, index?: number) => boolean): PertElement[];
        indexOf(element: PertElement): number;
        item(index: number): PertElement;
        map(callbackfn: (element: PertElement, index?: number) => PertElement): PertElement[];
        remove(element: PertElement): void;
        dispose(): void;
        private onElementPropertyChanged(element, propertyName);
    }
}
declare module spa.controls {
    class Geometry {
        static circleContainsPoint(circle: number[], point: number[]): boolean;
        static polygonContainsPoint(polygon: number[][], point: number[]): boolean;
        static rectangleContainsPoint(rectangle: number[], point: number[]): boolean;
        static circleIntersectsLine(circle: number[], line: number[]): boolean;
        static circleIntersectsRectangle(circle: number[], rect: number[]): boolean;
        static lineIntersectsLine(line1: number[], line2: number[]): boolean;
        static polygonIntersectsRectangle(polygon: number[][], rect: number[]): boolean;
        static polygonIntersectsPolygon(polygon1: number[][], polygon2: number[][]): boolean;
        static rectangleIntersectsRectangle(rect1: number[], rect2: number[]): boolean;
        static inflateRectangle(rect: number[], width: number, height: number): number[];
        static movePoint(point: number[], targetPoint: number[], distance: number): number[];
        static rotatePoint(point: number[], origin: number[], angle: number): number[];
        static rotatePolygon(polygon: number[][], origin: number[], angle: number): number[][];
        static rotateRectangle(rectangle: number[], origin: number[], angle: number): number[][];
        static translatePolygon(polygon: number[][], x: number, y: number): number[][];
        static translateRectangle(rect: number[], x: number, y: number): number[];
        static unionRectangle(rect1: number[], rect2: number[]): number[];
        static getPolygonLines(polygon: number[][]): number[][];
        static getRectangleFromPoints(point1: number[], point2: number[]): number[];
        static lineAngle(line: number[]): number;
        static lineLength(line: number[]): number;
        static polygonBoundingRectangle(polygon: number[][]): number[];
    }
}
declare module spa.controls {
    class PertGroup extends PertActivity {
        constructor();
    }
}
declare module spa.controls {
    class PertNode extends PertElement {
        private _location;
        private _nodeBounds;
        private _text;
        constructor();
        location: number[];
        style: NodeStyle;
        text: string;
        onPropertyChanged(propertyName: string): void;
        onStyleChanged(propertyName: string): void;
        onLayout(ctx: CanvasRenderingContext2D): number[];
        onPaint(ctx: CanvasRenderingContext2D): void;
        onPaintOutline(ctx: CanvasRenderingContext2D): void;
        testPath(rect: number[]): boolean;
        testPoint(point: number[]): string;
    }
    class NodeStyle extends ElementStyle {
        private _backgroundColor;
        private _borderWidth;
        private _color;
        private _font;
        private _radius;
        constructor(element: PertElement);
        backgroundColor: string;
        borderWidth: number;
        color: string;
        font: string;
        radius: number;
    }
}
declare module spa.controls {
    class PertMilestone extends PertNode {
        private _date;
        private _dateOffset;
        private _dateLineHeight;
        private _flag;
        private _style;
        date: Date;
        flag: boolean;
        style: MilestoneStyle;
        onPropertyChanged(propertyName: string): void;
        onStyleChanged(propertyName: string): void;
        onLayout(ctx: CanvasRenderingContext2D): number[];
        onPaint(ctx: CanvasRenderingContext2D): void;
        onPaintOutline(ctx: CanvasRenderingContext2D): void;
        testPath(rect: number[]): boolean;
        testPoint(point: number[]): string;
        private getDateText();
    }
    class MilestoneStyle extends NodeStyle {
        private _dateFont;
        private _flagHeight;
        constructor(element: PertElement);
        dateFont: string;
        flagHeight: number;
    }
}
declare module spa.controls {
    class PertWait extends PertActivity {
        constructor();
    }
}
declare module spa.controls {
    class PertWork extends PertActivity {
        constructor();
    }
}
declare module spa.controls {
    class PivotView extends Component {
        static componentName: string;
        items: KnockoutObservableArray<any>;
        selectedItem: KnockoutObservable<any>;
        constructor(params: any);
        private bindMethods();
        private onItemsChanged(items);
        private onItemClick(item);
        private onSelectedItemChanged(item);
        dispose(): void;
    }
}
declare module spa.controls {
    class ProgressBar extends Component {
        static componentName: string;
        private progress;
        value: KnockoutObservable<number>;
        constructor(params: any);
        private createComputedProperties();
        dispose(): void;
    }
}
declare module spa.controls {
    class PushButton extends Component {
        static componentName: string;
        private className;
        private disabled;
        private type;
        busy: KnockoutObservable<boolean>;
        click: KnockoutObservable<Function>;
        enabled: KnockoutObservable<boolean>;
        icon: KnockoutObservable<string>;
        submit: KnockoutObservable<boolean>;
        text: KnockoutObservable<string>;
        title: KnockoutObservable<string>;
        constructor(params: any);
        private bindMethods();
        private createComputedProperties();
        onClick(data: any, ev: MouseEvent): void;
        dispose(): void;
    }
}
declare module spa.controls {
    class RadioButton extends Component {
        static componentName: string;
        private disableSubscriptions;
        private hasFocus;
        private hasMouse;
        private hasText;
        private state;
        align: KnockoutObservable<string>;
        autofocus: KnockoutObservable<boolean>;
        checked: KnockoutObservable<boolean>;
        enabled: KnockoutObservable<boolean>;
        text: KnockoutObservable<string>;
        value: KnockoutObservable<any>;
        valueChecked: KnockoutObservable<any>;
        constructor(params: any);
        private onMouseEnter();
        private onMouseLeave();
        private bindMethods();
        onClick(): void;
        onLabelMouseDown(): boolean;
        onKeyPress(data: any, ev: KeyboardEvent): boolean;
        private createComputed();
        private onCheckedChanged(checked);
        private onValueChanged(value);
        private onValueCheckedChanged(valueChecked);
        private onPropertyChanged(propertyName);
        dispose(): void;
    }
}
declare module spa.controls {
    class TextBox extends Component {
        static componentName: string;
        private type;
        autofocus: KnockoutObservable<boolean>;
        enabled: KnockoutObservable<boolean>;
        maxLength: KnockoutObservable<number>;
        placeholder: KnockoutObservable<string>;
        readOnly: KnockoutObservable<boolean>;
        text: KnockoutObservable<string>;
        usePasswordChar: KnockoutObservable<boolean>;
        constructor(params: any);
        private createComputedProperties();
        dispose(): void;
    }
}
declare module spa.controls {
    class TreeView extends Component {
        static componentName: string;
        treeTemplate: Node[];
        treeNodeTemplate: Node[];
        treeNodeContentTemplate: Node[];
        nodes: KnockoutObservableArray<ITreeNode>;
        selectedNode: KnockoutObservable<ITreeNode>;
        constructor(params: any);
        private bindMethods();
        private nodeClick(node, ev);
        private nodeExpandable(node);
        private nodeExpanded(node);
        private nodeSelected(node);
        private nodeText(node);
        dispose(): void;
    }
    interface ITreeNode {
        expanded?: boolean | KnockoutObservable<boolean>;
        nodes?: ITreeNode[] | KnockoutObservableArray<ITreeNode>;
        text?: string | KnockoutObservable<string>;
    }
}
declare module spa.controls {
    class YandexMap extends Component {
        static componentName: string;
        center: KnockoutObservable<number[]>;
        placemarks: KnockoutObservableArray<IPlacemark>;
        type: KnockoutObservable<YandexMapType>;
        zoom: KnockoutObservable<number>;
        constructor(params: any);
        dispose(): void;
    }
    enum YandexMapType {
        Hybrid = 0,
        HybridPublic = 1,
        Public = 2,
        Roadmap = 3,
        Satellite = 4,
    }
    interface IPlacemark {
        coordinates?: number[] | KnockoutObservable<number[]>;
        draggable?: boolean | KnockoutObservable<boolean>;
    }
}
