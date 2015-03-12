module spa.controls {
    export class PertDiagram {
        // #region Fields

        // canvas;
        private _canvas: HTMLCanvasElement;
        private _context: CanvasRenderingContext2D;
        private _elements: PertElementCollection;
        private _new: PertElement;
        private _scroll: number[] = [0, 0];
        private _selectedElements: PertElement[] = [];
        private _tool: PertTool = PertTool.Select;
        private _updatesDisabled = 0;
        private _zoom = 1;

        // input state;
        private _alt = false;
        private _ctl = false;
        private _cursor: ICursorPosition;
        private _lmb: ICursorPosition;
        private _rmb: ICursorPosition;
        private _shift = false;

        // look & feel;
        private _gridColor = "#eee";
        private _gridSize = 40;
        private _outlineColor = "#ffc526";
        private _outlineWidth = 4;

        // #endregion

        constructor(canvas: HTMLCanvasElement) {
            this._canvas = canvas;
            this._canvas.oncontextmenu = function (ev) { return false; };
            this._context = canvas.getContext("2d");

            this._elements = new PertElementCollection();
            this._elements.onelementadded = this.elementAdded.bind(this);
            this._elements.onelementpropertychanged = this.elementPropertyChanged.bind(this);
            this._elements.onelementremoved = this.elementRemoved.bind(this);

            this.addEventListeners();
            this.updateCanvasSize();
            this.setImageSmoothing(false);
            this.refresh();
        }

        public dispose(): void {
            this._elements.dispose();
            this._elements = null;
        }

        // #region Properties

        public get canvas(): HTMLCanvasElement {
            return this._canvas;
        }

        public get elements(): PertElementCollection {
            return this._elements;
        }

        public get scroll(): number[] {
            return this._scroll;
        }

        public set scroll(scroll: number[]) {
            if (scroll == null) {
                scroll = [0, 0];
            }

            if (scroll[0] != this._scroll[0] || scroll[1] != this._scroll[1]) {
                this._scroll = scroll;
                this.onScrollChanged(this._scroll);
                this.refresh();
            }
        }

        public get selectedElements(): PertElement[] {
            return this._selectedElements;
        }

        public set selectedElements(selectedElements: PertElement[]) {
            this.beginUpdate();

            var deselectedElements = this._selectedElements.slice(0);

            for (var i = 0; i < deselectedElements.length; i++) {
                deselectedElements[i].selected = false;
            }

            for (var i = 0; i < selectedElements.length; i++) {
                selectedElements[i].selected = true;
            }

            this.endUpdate();
        }

        public get tool(): PertTool {
            return this._tool;
        }

        public set tool(tool: PertTool) {
            this._tool = tool;

            if (this._selectedElements.length == 1 && this._selectedElements[0] instanceof PertConnector) {
                (<PertConnector>this._selectedElements[0]).anchors = this._tool == PertTool.Move;
            }

            if (this._selectedElements.length > 1) {
                this.selectedElements = [this._selectedElements[0]];
            }

            this.resetTool();
            this.onToolChanged();
            this.refresh();
        }

        public get zoom(): number {
            return this._zoom;
        }

        public set zoom(zoom: number) {
            if (this._zoom != zoom) {
                this._zoom = zoom;

                if (this._zoom == null) {
                    this._zoom = 1;
                }

                this.setImageSmoothing(this._zoom != 1);

                this.onZoomChanged(this._zoom);
                this.refresh();
            }
        }

        // #endregion

        // #region Handlers

        public onelementconnecting: (connector: PertElement, anchor: string, node: PertNode) => boolean;
        public onelementcreating: (element: PertElement) => boolean;
        public onelementcreated: (element: PertElement) => any;
        public onelementpropertychanged: (element: PertElement, propertyName: string) => any;
        public onelementdeleting: (element: PertElement[]) => boolean;
        public onelementdeleted: (element: PertElement[]) => any;
        public onelementdoubleclick: (element: PertElement) => any;
        public ongroupexpand: (group: PertGroup) => any;
        public onscrollchanged: (scroll?: number[]) => any;
        public onselectionchanged: (selectedElements?: PertElement[]) => any;
        public ontoolchanged: (newTool?: PertTool) => any;
        public onzoomchanged: (newZoom?: number) => any;

        private onElementConnecting(connector: PertElement, anchor: string, node: PertNode): boolean {
            if (this.onelementconnecting != null) {
                return this.onelementconnecting(connector, anchor, node);
            }

            return true;
        }

        private onElementCreating(element: PertElement): boolean {
            if (this.onelementcreating != null) {
                return this.onelementcreating(element);
            }

            return true;
        }

        private onElementCreated(element: PertElement): void {
            if (this.onelementcreated != null) {
                this.onelementcreated(element);
            }
        }

        private onElementPropertyChanged(element: PertElement, propertyName: string): void {
            if (this.onelementpropertychanged != null) {
                this.onelementpropertychanged(element, propertyName);
            }
        }

        private onElementDeleting(element: PertElement[]): boolean {
            if (this.onelementdeleting != null) {
                return this.onelementdeleting(element);
            }

            return true;
        }

        private onElementDeleted(element: PertElement[]): void {
            if (this.onelementdeleted != null) {
                this.onelementdeleted(element);
            }
        }

        private onElementDoubleClick(element: PertElement): void {
            if (this.onelementdoubleclick != null) {
                this.onelementdoubleclick(element);
            }
        }

        private onGroupExpand(group: PertGroup): void {
            if (this.ongroupexpand != null) {
                this.ongroupexpand(group);
            }
        }

        private onScrollChanged(scroll: number[]): void {
            if (this.onscrollchanged != null) {
                this.onscrollchanged(scroll);
            }
        }

        private onSelectionChanged(selectedElements: PertElement[]): void {
            if (this._tool == PertTool.Move) {
                var focused: PertElement = null;

                if (selectedElements.length == 1 && selectedElements[0] instanceof PertConnector) {
                    focused = selectedElements[0];
                }

                for (var i = 0; i < this._elements.length; i++) {
                    if (this._elements.item(i) instanceof PertConnector) {
                        (<PertConnector>this._elements.item(i)).anchors = focused == this._elements.item(i);
                    }
                }
            }

            if (this.onselectionchanged != null) {
                this.onselectionchanged(selectedElements);
            }
        }

        private onToolChanged(newTool?: PertTool): void {
            if (this.ontoolchanged != null) {
                this.ontoolchanged(newTool);
            }
        }

        private onZoomChanged(newZoom?: number): void {
            if (this.onzoomchanged != null) {
                this.onzoomchanged(newZoom);
            }
        }

        // #endregion

        // #region Canvas events

        private addEventListeners(): void {
            this.onDoubleClick = this.onDoubleClick.bind(this);
            this.onKeyDown = this.onKeyDown.bind(this);
            this.onKeyUp = this.onKeyUp.bind(this);
            this.onMouseDown = this.onMouseDown.bind(this);
            this.onMouseMove = this.onMouseMove.bind(this);
            this.onMouseOut = this.onMouseOut.bind(this);
            this.onMouseOver = this.onMouseOver.bind(this);
            this.onMouseUp = this.onMouseUp.bind(this);
            this.onMouseWheel = this.onMouseWheel.bind(this);
            this.onWindowResize = this.onWindowResize.bind(this);

            this.canvas.addEventListener("dblclick ", this.onDoubleClick);
            this.canvas.addEventListener("keydown", this.onKeyDown);
            this.canvas.addEventListener("keyup", this.onKeyUp);
            this.canvas.addEventListener("mousedown", this.onMouseDown);
            this.canvas.addEventListener("mousemove", this.onMouseMove);
            this.canvas.addEventListener("mouseout", this.onMouseOut);
            this.canvas.addEventListener("mouseover", this.onMouseOver);
            this.canvas.addEventListener("mouseup", this.onMouseUp);

            this.canvas.addEventListener("mousewheel", this.onMouseWheel);
            this.canvas.addEventListener("DOMMouseScroll", this.onMouseWheel);

            window.addEventListener("resize", this.onWindowResize);
        }

        private removeEvemtListeners(): void {
            this.canvas.removeEventListener("dblclick ", this.onDoubleClick);
            this.canvas.removeEventListener("keydown", this.onKeyDown);
            this.canvas.removeEventListener("keyup", this.onKeyUp);
            this.canvas.removeEventListener("mousedown", this.onMouseDown);
            this.canvas.removeEventListener("mousemove", this.onMouseMove);
            this.canvas.removeEventListener("mouseout", this.onMouseOut);
            this.canvas.removeEventListener("mouseover", this.onMouseOver);
            this.canvas.removeEventListener("mouseup", this.onMouseUp);

            this.canvas.removeEventListener("mousewheel", this.onMouseWheel);
            this.canvas.removeEventListener("DOMMouseScroll", this.onMouseWheel);

            window.removeEventListener("resize", this.onWindowResize);
        }

        private onDoubleClick(ev: MouseEvent): void {
            if (this._cursor != null && this._cursor.element != null) {
                this.onElementDoubleClick(this._cursor.element);
            }
        }

        private onKeyDown(ev: KeyboardEvent): void {
            if (ev.keyCode == 49) {
                this.tool = PertTool.Select;
            }

            if (ev.keyCode == 50) {
                this.tool = PertTool.Move;
            }

            if (ev.keyCode == 51) {
                this.tool = PertTool.CreateDependency;
            }

            if (ev.keyCode == 52) {
                this.tool = PertTool.CreateGroup;
            }

            if (ev.keyCode == 53) {
                this.tool = PertTool.CreateMilestone;
            }

            if (ev.keyCode == 54) {
                this.tool = PertTool.CreateWait;
            }

            if (ev.keyCode == 55) {
                this.tool = PertTool.CreateWork;
            }

            this.refresh();
        }

        private onKeyUp(ev: KeyboardEvent): void {
            if (ev.keyCode == 46) { // DELETE;
                if (this._selectedElements.length > 0) {
                    var canDelete = this.onElementDeleting(this._selectedElements);

                    if (canDelete) {
                        this.beginUpdate();

                        var deletedElements = this._selectedElements.slice(0);

                        for (var i = 0; i < deletedElements.length; i++) {
                            this.deleteElement(deletedElements[i]);
                        }

                        this.endUpdate();

                        this.onElementDeleted(deletedElements);
                    }
                }
            }
        }

        private onMouseDown(ev: MouseEvent): boolean {
            var cursor = this.getCursorPosition(ev);

            if (this._cursor == null) {
                this._cursor = cursor;
            }

            if (ev.button == 0 && this._lmb == null) {
                this._lmb = this.getCursorPosition(ev);
            }

            if (ev.button == 2 && this._rmb == null) {
                this._rmb = this.getCursorPosition(ev);
            }

            // clear selection;
            if (this._lmb != null && this._lmb.element == null) {
                this.selectedElements = [];
            }

            // select element;
            if (this._lmb != null && this._lmb.element != null) {
                if (this._tool == PertTool.Move || this._tool == PertTool.Select) {
                    if (this._lmb.element.selected == false) {
                        this.selectedElements = [this._lmb.element];
                    }
                }
            }

            // new connector;
            if (this._tool == PertTool.CreateDependency || this._tool == PertTool.CreateGroup || this._tool == PertTool.CreateWait || this._tool == PertTool.CreateWork) {
                var connector = <PertConnector>this._new;
                var node: PertNode = null;

                if (cursor.element instanceof PertNode && cursor.anchor == "NODE") {
                    var attach = this.onElementConnecting(<PertConnector>this._new, this._lmb == null ? "START" : "END", <PertNode>cursor.element);

                    if (attach) {
                        cursor.element.hovered = cursor.anchor;
                        node = <PertNode>cursor.element;
                    }
                }

                connector.startNode = node;
                connector.startPoint = [cursor.translatedX, cursor.translatedY];
            }


            this.refresh();

            return false;
        }

        private onMouseMove(ev: MouseEvent): void {
            var cursor = this.getCursorPosition(ev);

            if (this._cursor == null) {
                this._cursor = cursor;
            }

            if (this._cursor.element != null && this._cursor.element != cursor.element) {
                this._cursor.element.hovered = null;
            }

            var deltaX = Math.floor((cursor.x - this._cursor.x) / this._zoom);
            var deltaY = Math.floor((cursor.y - this._cursor.y) / this._zoom);

            // group expand;
            if (cursor.element instanceof PertGroup && cursor.anchor == "TEXT") {
                this.onGroupExpand(<PertGroup>cursor.element);
            }

            // scroll;
            if ((this._tool == PertTool.Select && this._lmb != null) || (this._rmb != null)) {
                this._scroll[0] += deltaX;
                this._scroll[1] += deltaY;
            }

            // selecting;
            if (this._tool == PertTool.Move && this._lmb != null && this._lmb.element == null) {
                var selectionRect = Geometry.getRectangleFromPoints([this._lmb.translatedX, this._lmb.translatedY], [this._cursor.translatedX, this._cursor.translatedY]);

                for (var i = 0; i < this._elements.length; i++) {
                    if (Geometry.rectangleIntersectsRectangle(selectionRect, this._elements.item(i).bounds)) {
                        this._elements.item(i).selected = this._elements.item(i).testPath(selectionRect);
                    } else {
                        this._elements.item(i).selected = false;
                    }
                }
            }

            // dragging;
            if (this._tool == PertTool.Move && this._lmb != null && this._lmb.element != null) {
                this.beginUpdate();

                if (this._selectedElements.length == 1 && this._selectedElements[0] instanceof PertConnector) {
                    var connector = <PertConnector>this._selectedElements[0];

                    if (this._lmb.anchor == "START") {
                        connector.startPoint = [cursor.translatedX, cursor.translatedY];

                        if (cursor.element != null && cursor.element instanceof PertNode) {
                            connector.startNode = <PertNode>cursor.element;
                        } else {
                            connector.startNode = null;
                        }
                    } else {
                        if (this._lmb.anchor == "END") {
                            connector.endPoint = [cursor.translatedX, cursor.translatedY];

                            if (cursor.element != null && cursor.element instanceof PertNode) {
                                connector.endNode = <PertNode>cursor.element;
                            } else {
                                connector.endNode = null;
                            }
                        }
                    }
                } else {
                    var offsetX = this._lmb.translatedX % this._gridSize;
                    var offsetY = this._lmb.translatedY % this._gridSize;

                    var deltaGridX = cursor.gridX - this._cursor.gridX;
                    var deltaGridY = cursor.gridY - this._cursor.gridY;

                    for (var i = 0; i < this._selectedElements.length; i++) {
                        if (this._selectedElements[i] instanceof PertNode) {
                            var node = (<PertNode>this._selectedElements[i]);
                            node.location = [node.location[0] + deltaGridX, node.location[1] + deltaGridY];
                        }
                    }
                }

                this.endUpdate();
            }

            // new connector;
            if (this._tool == PertTool.CreateDependency || this._tool == PertTool.CreateGroup || this._tool == PertTool.CreateWait || this._tool == PertTool.CreateWork) {
                var connector = <PertConnector>this._new;
                var node: PertNode = null;

                if (cursor.element instanceof PertNode && cursor.anchor == "NODE") {
                    var attach = this.onElementConnecting(<PertConnector>this._new, this._lmb == null ? "START" : "END", <PertNode>cursor.element);

                    if (attach) {
                        cursor.element.hovered = cursor.anchor;
                        node = <PertNode>cursor.element;
                    }
                }

                connector.endNode = node;
                connector.endPoint = [cursor.translatedX, cursor.translatedY];
                if (this._lmb == null) {
                    connector.startNode = node;
                    connector.startPoint = [cursor.translatedX, cursor.translatedY];
                }
                else {
                }
            }

            // new node;
            if (this._tool == PertTool.CreateMilestone) {
                var node = <PertNode>this._new;
                node.location = [cursor.gridX, cursor.gridY];
            }

            // cursor;
            this._cursor = cursor;

            if (this._tool == PertTool.Move && (this._cursor.anchor == "NODE" || this._cursor.anchor == "START" || this._cursor.anchor == "END")) {
                this._canvas.style.cursor = "move";
            } else {
                if (this._cursor.element != null && this._cursor.element instanceof PertGroup && this._cursor.anchor == "TEXT") {
                    this._canvas.style.cursor = "pointer";
                } else {
                    this._canvas.style.cursor = "default";
                }
            }

            this.refresh();
        }

        private onMouseOut(ev: MouseEvent): void {
            this._cursor = null;
            this._lmb = null;
            this._rmb = null;
        }

        private onMouseOver(ev: MouseEvent): void {
            this.resetTool();
        }

        private onMouseUp(ev: MouseEvent): void {
            if (ev.button == 0 && this._lmb != null) {
                if (this._lmb == null) {
                    return;
                }

                this._lmb = null;
            }

            if (ev.button == 2 && this._rmb != null) {
                if (this._rmb == null) {
                    return;
                }

                this._rmb = null;
            }

            var createElement = false;

            // create connector;
            if (this._tool == PertTool.CreateDependency || this._tool == PertTool.CreateGroup || this._tool == PertTool.CreateWait || this._tool == PertTool.CreateWork) {
                createElement = true;
            }

            // create node;
            if (this._tool == PertTool.CreateMilestone && this._cursor.element == null) {
                createElement = true;
            }

            if (createElement) {
                createElement = this.onElementCreating(this._new);

                if (createElement) {
                    var newElement = this._new;
                    newElement.creating = false;
                    this._elements.add(newElement);
                    this.onElementCreated(newElement);
                }
            }

            this.resetTool();
            this.refresh();
        }

        private onMouseWheel(ev: MouseWheelEvent): boolean {
            var zoomIn = Math.max(-1, Math.min(1, (ev.wheelDelta || -ev.detail))) > 0;

            var zoom = (this.zoom * 100 + (zoomIn ? 10 : -10)) / 100;

            if (zoom < 0.3) {
                zoom = 0.3;
            }

            if (zoom > 1) {
                zoom = 1;
            }

            var cursor = this.getCursorPosition(ev);
            
            var scrollX = Math.floor(cursor.x / zoom + this.scroll[0] - cursor.x / this.zoom);
            var scrollY = Math.floor(cursor.y / zoom + this.scroll[1] - cursor.y / this.zoom);
            
            if (this.zoom != zoom) {
                this.scroll = [scrollX, scrollY];
                this.zoom = zoom;

                this.refresh();
            }

            return false;
        }

        private onWindowResize(ev: Event): void {
            this.updateCanvasSize();
            this.setImageSmoothing(this._zoom != 1);
            this.refresh();
        }

        // #endregion

        // #region Drawing 

        private setImageSmoothing(imageSmoothingEnabled: boolean): void {
            (<any>this._context).msImageSmoothingEnabled = imageSmoothingEnabled;
            (<any>this._context).mozImageSmoothingEnabled = imageSmoothingEnabled;
            (<any>this._context).webkitImageSmoothingEnabled = imageSmoothingEnabled;
        }

        public refresh(): void {
            if (this._updatesDisabled == 0) {
                this.draw();
            }
        }

        private draw(clientRect?: number[]): void {
            this._context.save();
            this.updateCanvasSize();
            this.setImageSmoothing(this._zoom != 1);

            if (clientRect == null) {
                clientRect = this.getClientRect();
            }

            // transformin matrix;
            this._context.translate(0.5, 0.5);

            if (this._zoom != 1) {
                this._context.scale(this._zoom, this._zoom);
            }

            if (this._scroll[0] != 0 || this._scroll[1] != 0) {
                this._context.translate(this._scroll[0], this._scroll[1]);
            }

            // clearing;
            this._context.clearRect(clientRect[0], clientRect[1], clientRect[2], clientRect[3]);

            // draw grid;
            if (this.zoom > 0.5) {
                this.drawGrid(this._context, clientRect);
            }

            // draw outlines;
            this.drawOutlines(this._context, this._selectedElements);

            // draw elements;
            for (var i = 0; i < this._elements.length; i++) {
                if (this._elements.item(i).selected == false) {
                    this._elements.item(i).draw(this._context);
                }
            }

            for (var i = 0; i < this._elements.length; i++) {
                if (this._elements.item(i).selected) {
                    this._elements.item(i).draw(this._context);
                }
            }

            if (this._tool == PertTool.CreateDependency || this._tool == PertTool.CreateGroup || this._tool == PertTool.CreateWait || this._tool == PertTool.CreateWork) {
                this._new.draw(this._context);
            }

            if (this._tool == PertTool.CreateMilestone && this._cursor != null) {
                this._new.draw(this._context);
            }

            // draw element bounds;
       //   for (var i = 0; i < this._elements.length; i++) {
       //         this.drawElementBounds(this._context, this._elements.item(i));
       //   }

            // draw new elements;

            // draw selection;
            if (this._tool == PertTool.Move && this._lmb != null && this._lmb.element == null) {
                this.drawSelection(this._context, [this._lmb.translatedX, this._lmb.translatedY], [this._cursor.translatedX, this._cursor.translatedY]);
            }

            // resetting transformations;
            this._context.restore();

            // draw debug data;
            //this.drawDebugData(this._context);
        }

        private drawGrid(ctx: CanvasRenderingContext2D, clientRect: number[]): void {
            ctx.beginPath();

            var x = Math.floor(clientRect[0] / this._gridSize) * this._gridSize;
            var y = Math.floor(clientRect[1] / this._gridSize) * this._gridSize;

            while (x < clientRect[0] + clientRect[2]) {
                ctx.moveTo(x, clientRect[1]);
                ctx.lineTo(x, clientRect[1] + clientRect[3]);
                x += this._gridSize;
            }

            while (y < clientRect[1] + clientRect[3]) {
                ctx.moveTo(clientRect[0], y);
                ctx.lineTo(clientRect[0] + clientRect[2], y);
                y += this._gridSize;
            }

            ctx.lineWidth = 1;
            ctx.strokeStyle = this._gridColor;
            ctx.stroke();
        }

        private drawOutlines(ctx: CanvasRenderingContext2D, elements: PertElement[]): void {
            for (var i = 0; i < elements.length; i++) {
                elements[i].drawOutline(ctx);
            }
        }

        private drawElements(ctx: CanvasRenderingContext2D, elements: PertElement[]): void {
            for (var i = 0; i < elements.length; i++) {
                elements[i].draw(ctx);
            }
        }

        private drawElementBounds(ctx: CanvasRenderingContext2D, element: PertElement): void {
            this.drawRectangle(ctx, element.bounds);
        }

        private drawSelection(ctx: CanvasRenderingContext2D, startPoint: number[], endPoint: number[]): void {
            ctx.beginPath();
            
            ctx.moveTo(startPoint[0], startPoint[1]);

            ctx.lineTo(endPoint[0], startPoint[1]);
            ctx.lineTo(endPoint[0], endPoint[1]);
            ctx.lineTo(startPoint[0], endPoint[1]);
            ctx.lineTo(startPoint[0], startPoint[1]);

            ctx.closePath();

            ctx.fillStyle = "rgba(255, 197, 38, 0.2)";
            ctx.fill();

            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgb(255, 197, 38)";
            ctx.stroke();
        }

        private drawDebugData(ctx: CanvasRenderingContext2D): void {
            ctx.beginPath();
            ctx.moveTo(16, 16);
            ctx.lineTo(256, 16);
            ctx.lineTo(256, 164);
            ctx.lineTo(16, 164);
            ctx.lineTo(16, 16);
            ctx.fillStyle = "rgba(128, 128, 128, 0.1)";
            ctx.fill();

            ctx.font = "10px Consolas";
            ctx.fillStyle = "#000";
            ctx.fillText("CURSOR: " + this.cursorPositionToString(this._cursor), 32, 32);
            ctx.fillText("LMB: " + this.cursorPositionToString(this._lmb), 32, 48);
            ctx.fillText("RMB: " + this.cursorPositionToString(this._rmb), 32, 64);
            ctx.fillText("SCROLL: " + this.scroll[0] + ";" + this.scroll[1], 32, 80);
            ctx.fillText("ZOOM: " + this.zoom.toString(), 32, 96);
            ctx.fillText("TOOL: " + PertTool[this._tool], 32, 112);
        }

        private drawPolygon(ctx: CanvasRenderingContext2D, polygon: number[][]): void {
            ctx.beginPath();
            ctx.moveTo(polygon[0][0], polygon[0][1]);

            for (var i = 0; i < polygon.length; i++) {
                ctx.lineTo(polygon[i][0], polygon[i][1]);
            }

            ctx.lineTo(polygon[0][0], polygon[0][1]);

            ctx.strokeStyle = "#ddd";
            ctx.stroke();
        }

        private drawRectangle(ctx: CanvasRenderingContext2D, rect: number[]): void {
            ctx.beginPath();
            ctx.moveTo(rect[0], rect[1]);
            ctx.lineTo(rect[0] + rect[2], rect[1]);
            ctx.lineTo(rect[0] + rect[2], rect[1] + rect[3]);
            ctx.lineTo(rect[0], rect[1] + rect[3]);
            ctx.lineTo(rect[0], rect[1]);

            ctx.strokeStyle = "#ddd";
            ctx.stroke();
        }

        private getClientRect(): number[] {
            var clientRect = [0, 0, this.canvas.width, this.canvas.height];

            if (this.zoom != 1) {
                clientRect[2] = clientRect[2] / this.zoom;
                clientRect[3] = clientRect[3] / this.zoom;
            }

            clientRect[0] -= this.scroll[0];
            clientRect[1] -= this.scroll[1];

            return clientRect;
        }

        // #endregion

        // #region Element collection

        private elementAdded(element: PertElement): void {
            if (element instanceof PertNode) {
                var node = <PertNode>element;
                node.location = [Math.round(node.location[0] / this._gridSize) * this._gridSize, Math.round(node.location[1] / this._gridSize) * this._gridSize];
            }

            if (element.selected) {
                this._selectedElements.push(element);
                this.onSelectionChanged(this._selectedElements);
            }
        }

        private elementPropertyChanged(element: PertElement, propertyName: string): void {
            if (propertyName == "selected") {
                if (element.selected) {
                    this._selectedElements.push(element);
                }
                else {
                    this._selectedElements.splice(this._selectedElements.indexOf(element), 1);
                }

                this.onSelectionChanged(this._selectedElements);
            }

            this.onElementPropertyChanged(element, propertyName);
        }

        private elementRemoved(element: PertElement): void {
            if (element.selected) {
                this._selectedElements.splice(this._selectedElements.indexOf(element), 1);
                this.onSelectionChanged(this._selectedElements);
            }
        }

        private redrawElement(element: PertElement): void {
            var bounds = element.bounds;

            var canvasBounds: number[] = element["$canvasBounds"];

            if (canvasBounds != null) {
                bounds = Geometry.unionRectangle(bounds, canvasBounds);
            }

            this.draw(element.bounds);

            element["$canvasBounds"] = element.bounds;
        }

        private resetTool(): void {
            this._new = null;

            switch (this._tool) {
                case PertTool.CreateDependency:
                    this._new = new PertDependency();
                    break;

                case PertTool.CreateGroup:
                    this._new = new PertGroup();
                    break;

                case PertTool.CreateMilestone:
                    this._new = new PertMilestone();

                    if (this._cursor != null) {
                        (<PertNode>this._new).location = [Math.round(this._cursor.translatedX / this._gridSize) * this._gridSize, Math.round(this._cursor.translatedY / this._gridSize) * this._gridSize];
                    }
                    break;

                case PertTool.CreateWait:
                    this._new = new PertWait();
                    break;

                case PertTool.CreateWork:
                    this._new = new PertWork();
                    break;

                default:
                    break;
            }

            if (this._new != null) {
                this._new.creating = true;
            }

            return null;
        }

        // #endregion

        private deleteElement(element: PertElement): void {
            if (element instanceof PertNode) {
                for (var i = 0; i < this._elements.length; i++) {
                    if (this._elements.item(i) instanceof PertConnector) {
                        var connector = <PertConnector>this._elements.item(i);

                        if (connector.startNode == element) {
                            connector.startNode = null;
                        }

                        if (connector.endNode == element) {
                            connector.endNode = null;
                        }
                    }
                }
            }

            this._elements.remove(element);
        }

        private beginUpdate(): void {
            this._updatesDisabled++;
        }

        private endUpdate(): void {
            this._updatesDisabled--;

            if (this._updatesDisabled == 0) {
                this.refresh();
            }
        }

        private updateCanvasSize(): void {
            this.canvas.height = this.canvas.offsetHeight;
            this.canvas.width = this.canvas.offsetWidth;
        }

        private getCursorPosition(ev: MouseEvent): ICursorPosition {
            var totalOffsetX = 0;
            var totalOffsetY = 0;
            var currentElement: any = this.canvas;

            do {
                totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
                totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
            }
            while (currentElement = currentElement.offsetParent);

            var result: ICursorPosition = {
                x: ev.pageX - totalOffsetX,
                y: ev.pageY - totalOffsetY
            };

            result.translatedX = result.x;
            result.translatedY = result.y;

            if (this.zoom != null) {
                result.translatedX = Math.floor(result.translatedX / this.zoom);
                result.translatedY = Math.floor(result.translatedY / this.zoom);
            }

            if (this.scroll != null) {
                result.translatedX -= this.scroll[0];
                result.translatedY -= this.scroll[1];
            }

            result.gridX = Math.round(result.translatedX / this._gridSize) * this._gridSize;
            result.gridY = Math.round(result.translatedY / this._gridSize) * this._gridSize;

            var dragElement: PertElement = null;

            if (this._tool == PertTool.Move && this._lmb != null && this._lmb.element != null && (this._lmb.anchor == "NODE" || this._lmb.anchor == "START" || this._lmb.anchor == "END")) {
                dragElement = this._lmb.element;
            }

            for (var i = 0; i < this._elements.length; i++) {
                if (this._elements.item(i) != dragElement) {
                    if (Geometry.rectangleContainsPoint(this._elements.item(i).bounds, [result.translatedX, result.translatedY])) {
                        var anchor = this._elements.item(i).testPoint([result.translatedX, result.translatedY]);

                        if (anchor != null) {
                            result.anchor = anchor;
                            result.element = this._elements.item(i);
                        }
                    }
                }
            }

            return result;
        }

        private cursorPositionToString(state: ICursorPosition): string {
            if (state == null) {
                return "null";
            }

            var text = state.x + ";" + state.y + ", " + state.translatedX + ";" + state.translatedY;

            if (state.element != null) {
                text += " (" + state.element.toString();

                if (state.anchor != null) {
                    text += ", " + state.anchor;
                }

                text += ")";
            }

            return text;
        }
    }

    export enum PertTool {
        CreateDependency,
        CreateGroup,
        CreateMilestone,
        CreateWait,
        CreateWork,
        Move,
        Select
    }

    interface ICursorPosition {
        x?: number;
        y?: number;
        gridX?: number;
        gridY?: number;
        translatedX?: number;
        translatedY?: number;
        element?: PertElement;
        anchor?: string;
    }
}