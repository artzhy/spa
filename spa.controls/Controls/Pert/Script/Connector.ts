/// <reference path="element.ts" />

module spa.controls {
    export class PertConnector extends PertElement {
        private _anchors = false;
        private _arrowBounds: number[][];
        private _endAnchorBounds: number[];
        private _endNode: PertNode;
        private _endNodePoint: number[];
        private _endPoint: number[];
        private _imageStartPoint: number[];
        private _imageEndPoint: number[];
        private _locationChanged = false;
        private _startAnchorBounds: number[];
        private _startNode: PertNode;
        private _startNodePoint: number[];
        private _startPoint: number[];
        private _style: ConnectorStyle;
        private _text: string;
        private _textBounds: number[][][];

        constructor() {
            super();

            this.onNodeChanged = this.onNodeChanged.bind(this);
        }

        public get anchors(): boolean {
            return this._anchors;
        }

        public set anchors(anchors: boolean) {
            if (this._anchors != anchors) {
                this._anchors = anchors;
                this.onPropertyChanged("anchors");
            }
        }

        public get endNode(): PertNode {
            return this._endNode;
        }

        public set endNode(endNode: PertNode) {
            if (this._endNode != endNode) {
                if (this._endNode != null) {
                    this._endNode.unsubscribe(this.onNodeChanged);
                    this._endPoint = this._endNodePoint;
                }

                this._endNode = endNode;

                if (this._endNode != null) {
                    this._endNode.subscribe(this.onNodeChanged);
                }

                this.onPropertyChanged("endNode");
                this.onPropertyChanged("endPoint");
            }
        }

        public get endPoint(): number[]{
            return this._endNode == null ? this._endPoint : this._endNodePoint;
        }

        public set endPoint(endPoint: number[]) {
            if (!this.comparePoints(this._endPoint, endPoint)) {
                this._endPoint = endPoint;

                if (this._endNode == null) {
                    this.onPropertyChanged("endPoint");
                }
            }
        }

        public get startNode(): PertNode {
            return this._startNode;
        }

        public set startNode(startNode: PertNode) {
            if (this._startNode != startNode) {
                if (this._startNode != null) {
                    this._startNode.unsubscribe(this.onNodeChanged);
                    this._startPoint = this._startNodePoint;;
                }

                this._startNode = startNode;

                if (this._startNode != null) {
                    this._startNode.subscribe(this.onNodeChanged);
                }

                this.onPropertyChanged("startNode");
                this.onPropertyChanged("startPoint");
            }
        }

        public get startPoint(): number[] {
            return this._startNode == null ? this._startPoint : this._startNodePoint;
        }

        public set startPoint(startPoint: number[]) {
            if (!this.comparePoints(this._startPoint, startPoint)) {
                this._startPoint = startPoint;

                if (this._startNode == null) {
                    this.onPropertyChanged("startPoint");
                }
            }
        }

        public get style(): ConnectorStyle {
            if (this._style == null) {
                this._style = new ConnectorStyle(this);
            }

            return this._style;
        }

        public get text(): string {
            return this._text;
        }

        public set text(text: string) {
            if (this._text != text) {
                this._text = text;
                this.onPropertyChanged("text");
            }
        }

        public onPropertyChanged(propertyName: string): void {
            if (["anchors", "text"].indexOf(propertyName) != -1) {
                this.updateBounds();
                this.updateCanvas();
                this.updateOutline();
            }

            if (["endPoint", "startPoint"].indexOf(propertyName) != -1) {
                this.updateNodePoints();
                this.updateBounds();
                this._locationChanged = true;
            }

            super.onPropertyChanged(propertyName);
        }

        public onStyleChanged(propertyName: string): void {
            this.updateCanvas();

            if (this.anchors) {
                if (["anchorBorderWidth", "anchorRadius"].indexOf(propertyName)) {
                    this.updateBounds();
                    this.updateOutline();
                }
            }

            if (["font", "lineHeight", "textOffset", "textUnderline", "width"].indexOf(propertyName)) {
                this.updateBounds();
                this.updateOutline();
            }

            super.onStyleChanged(propertyName);
        }

        public onLayout(ctx: CanvasRenderingContext2D): number[]{
            var start = this.startPoint;
            var end = this.endPoint;

            if (start == null || end == null) {
                return [0, 0, 1, 1];
            }

            var ltr = end[0] >= start[0];
            var length = Geometry.lineLength([start[0], start[1], end[0], end[1]]);
            var capLength = Math.max(this.style.width * 5, 5 * 5);
            var capWidth = Math.max(this.style.width * 3, 3 * 5);
            var lineLength = length - capLength;
            var width = Math.max(this.style.width, 5);

            if (lineLength < 0) {
                lineLength = length;
                capLength = 0;
                capWidth = 0;
            }

            this._arrowBounds = this.getArrowBounds(start, end, width, capLength, capWidth);

            var bounds = Geometry.polygonBoundingRectangle(this._arrowBounds);

            if (this.anchors) {
                var anchorRadius = this.style.anchorRadius + this.style.anchorBorderWidth / 2;

                this._startAnchorBounds = [start[0], start[1], anchorRadius];
                this._endAnchorBounds = [end[0], end[1], anchorRadius];

                bounds = Geometry.inflateRectangle(bounds, anchorRadius, anchorRadius);
            }

            ctx.font = this.style.font;

            this._textBounds = [];

            if (this.text != null && this.text.trim().length > 0) {
                var lines = this.wrapText(this.text, ctx, this.style.font, 3, lineLength - 16);
                var bottom = -this.style.textOffset;
                var origin = ltr ? start : end;
                var angle = ltr ? Geometry.lineAngle([start[0], start[1], end[0], end[1]]) : Geometry.lineAngle([end[0], end[1], start[0], start[1]]);

                for (var i = lines.length - 1; i >= 0; i--) {
                    var lineWidth = ctx.measureText(lines[i]).width;
                    var lineRect = [lineLength / 2 - lineWidth / 2, bottom - this.style.lineHeight, lineWidth, this.style.lineHeight];

                    if (!ltr) {
                        lineRect[0] += capLength;
                    }

                    var linePolygon = Geometry.rotateRectangle(Geometry.translateRectangle(lineRect, origin[0], origin[1]), origin, angle);

                    this._textBounds.push(linePolygon);
                    bounds = Geometry.unionRectangle(bounds, Geometry.polygonBoundingRectangle(linePolygon));

                    bottom -= this.style.lineHeight;
                }
            }

            bounds = Geometry.inflateRectangle(bounds, 2 + this.style.outlineWidth, 2 + this.style.outlineWidth);

            return bounds;
        }

        public onPaint(ctx: CanvasRenderingContext2D): void {
            var start = this.startPoint;
            var end = this.endPoint;

            if (start == null || end == null) {
                return;
            }

            var ltr = end[0] >= start[0];
            var length = start[1] == end[1] ? Math.abs(end[0] - start[0]) : Geometry.lineLength([start[0], start[1], end[0], end[1]]);
            var capLength = Math.max(this.style.width * 5, 3 * 5);
            var capWidth = Math.max(this.style.width * 3, 3 * 3);
            var lineLength = length - capLength;

            if (lineLength < 0) {
                lineLength = length;
                capLength = 0;
                capWidth = 0;
            }

            ctx.save();

            // translate;
            if (ltr) {
                ctx.translate(start[0], start[1]);
            } else {
                ctx.translate(end[0], end[1]);
            }

            if (start[1] != end[1]) {
                if (ltr) {
                    ctx.rotate(Geometry.lineAngle([start[0], start[1], end[0], end[1]]) * Math.PI / 180);
                }
                else {
                    ctx.rotate(Geometry.lineAngle([end[0], end[1], start[0], start[1]]) * Math.PI / 180);
                }
            }

            // arrow;
            ctx.beginPath();

            if (ltr) {
                ctx.moveTo(0, 0);
                ctx.lineTo(lineLength, 0);
            }
            else {
                ctx.moveTo(capLength, 0);
                ctx.lineTo(lineLength + capLength, 0);
            }

            ctx.lineWidth = this.style.width;

            if (this.style.lineDash != null) {
                ctx.setLineDash(this.style.lineDash);
            }

            ctx.strokeStyle = this.style.color;
            ctx.stroke();

            if (capLength > 0) {
                ctx.beginPath();

                if (ltr) {
                    ctx.moveTo(lineLength, -capWidth / 2);
                    ctx.lineTo(lineLength + capLength, 0);
                    ctx.lineTo(lineLength, capWidth / 2);
                    ctx.lineTo(lineLength, -capWidth / 2);
                }
                else {
                    ctx.moveTo(0, 0);
                    ctx.lineTo(capLength, -capWidth / 2);
                    ctx.lineTo(capLength, capWidth / 2);
                    ctx.lineTo(0, 0);
                }

                ctx.fillStyle = this.style.color;
                ctx.fill();
            }

            // anchors;
            if (this.anchors) {
                ctx.beginPath();
                ctx.arc(0, 0, this.style.anchorRadius, 0, Math.PI * 2);
                ctx.moveTo(length + this.style.anchorRadius + this.style.anchorBorderWidth / 2, 0);
                ctx.arc(length, 0, this.style.anchorRadius, 0, Math.PI * 2);
                ctx.fillStyle = this.style.anchorBackgroundColor;
                ctx.fill();

                ctx.setLineDash([]);
                ctx.lineWidth = this.style.anchorBorderWidth;
                ctx.strokeStyle = this.style.anchorBorderColor;
                ctx.stroke();
            }

            // text;
            if (this.text != null && this.text.length > 0 && lineLength > 0) {
                ctx.fillStyle = this.style.color;
                ctx.font = this.style.color;
                ctx.textAlign = "center";
                ctx.textBaseline = "bottom";

                var left = ltr ? 0 : capLength;
                var bottom = -this.style.width / 2 - this.style.textOffset;
                var lines = this.wrapText(this.text, ctx, this.style.font, 3, lineLength - 16);

                for (var i = lines.length - 1; i >= 0; i--) {
                    if (ltr) {
                        ctx.fillText(lines[i], lineLength / 2, bottom);
                    }
                    else {
                        ctx.fillText(lines[i], capLength + lineLength / 2, bottom);
                    }

                    bottom -= this.style.lineHeight;
                }

                bottom = -this.style.width / 2 - this.style.textOffset;

                if (this.style.textUnderline) {
                    ctx.beginPath();

                    for (var i = lines.length - 1; i >= 0; i--) {
                        var lineWidth = ctx.measureText(lines[i]).width;
                        var x = ltr ? lineLength / 2 - lineWidth / 2 : capLength + lineLength / 2 - lineWidth / 2;
                        ctx.moveTo(x, bottom);
                        ctx.lineTo(x + lineWidth, bottom);

                        bottom -= this.style.lineHeight;
                    }

                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }

            ctx.restore();
        }

        public onPaintOutline(ctx: CanvasRenderingContext2D): void {
            var start = this.startPoint;
            var end = this.endPoint;

            if (start == null || end == null) {
                return;
            }

            var ltr = end[0] >= start[0];
            var length = start[1] == end[1] ? Math.abs(end[0] - start[0]) : Geometry.lineLength([start[0], start[1], end[0], end[1]]);
            var capLength = Math.max(this.style.width * 5, 3 * 5);
            var capWidth = Math.max(this.style.width * 3, 3 * 3);
            var lineLength = length - capLength;
            var outline = this.style.outlineWidth;

            if (lineLength < 0) {
                lineLength = length;
                capLength = 0;
                capWidth = 0;
            }

            ctx.save();

            // translate;
            if (ltr) {
                ctx.translate(start[0], start[1]);
            } else {
                ctx.translate(end[0], end[1]);
            }

            if (start[1] != end[1]) {
                if (ltr) {
                    ctx.rotate(Geometry.lineAngle([start[0], start[1], end[0], end[1]]) * Math.PI / 180);
                }
                else {
                    ctx.rotate(Geometry.lineAngle([end[0], end[1], start[0], start[1]]) * Math.PI / 180);
                }
            }

            // arrow;
            ctx.beginPath();

            if (ltr) {
                ctx.moveTo(-outline, 0);
                ctx.lineTo(lineLength - outline, 0);
            }
            else {
                ctx.moveTo(capLength + outline, 0);
                ctx.lineTo(capLength + lineLength + outline, 0);
            }

            ctx.lineWidth = this.style.width + outline * 2;
            ctx.strokeStyle = this.style.outlineColor;
            ctx.stroke();

            if (capLength > 0) {
                ctx.beginPath();

                if (ltr) {
                    ctx.moveTo(lineLength - outline, -capWidth / 2 - outline);
                    ctx.lineTo(lineLength + capLength + outline * 2, 0);
                    ctx.lineTo(lineLength - outline, capWidth / 2 + outline);
                    ctx.lineTo(lineLength - outline, -capWidth / 2 - outline);
                }
                else {
                    ctx.moveTo(-outline * 2, 0);
                    ctx.lineTo(capLength + outline, -capWidth / 2 - outline);
                    ctx.lineTo(capLength + outline, capWidth / 2 + outline);
                    ctx.lineTo(-outline * 2, 0);
                }

                ctx.fillStyle = this.style.outlineColor;
                ctx.fill();
            }

            ctx.restore();
        }

        public testPath(rect: number[]): boolean {
            var result = super.testPath(rect);

            if (result == false) {
                if (Geometry.polygonIntersectsRectangle(this._arrowBounds, rect)) {
                    return true;
                }
            }

            return false;
        }

        public testPoint(point: number[]): string {
            var anchor = super.testPoint(point);

            if (anchor == null) {
                if (this.anchors) {
                    if (Geometry.circleContainsPoint(this._startAnchorBounds, point)) {
                        return "START";
                    }

                    if (Geometry.circleContainsPoint(this._endAnchorBounds, point)) {
                        return "END";
                    }
                }

                for (var i = 0; i < this._textBounds.length; i++) {
                    if (Geometry.polygonContainsPoint(this._textBounds[i], point)) {
                        return "TEXT";
                    }
                }

                if (Geometry.polygonContainsPoint(this._arrowBounds, point)) {
                    return "ARROW";
                }
            }

            return anchor;
        }

        public draw(ctx: CanvasRenderingContext2D): void {
            if (this._locationChanged) {
                this.updateLocation();
            }

            super.draw(ctx);
        }

        public drawOutline(ctx: CanvasRenderingContext2D): void {
            if (this._locationChanged) {
                this.updateLocation();
            }

            super.drawOutline(ctx);
        }

        private updateLocation(): void {
            var invalidate = true;

            if (this._imageEndPoint != null && this._imageStartPoint != null) {
                if (this._imageStartPoint[0] - this.startPoint[0] == this._imageEndPoint[0] - this.endPoint[0]) {
                    if (this._imageStartPoint[1] - this.startPoint[1] == this._imageEndPoint[1] - this.endPoint[1]) {
                        invalidate = false;
                    }
                }
            }

            if (invalidate) {
                this.updateCanvas();
                this.updateOutline();
            }

            this._imageEndPoint = this.endPoint;
            this._imageStartPoint = this.startPoint;
            this._locationChanged = false;
        }

        private comparePoints(p1: number[], p2: number[]): boolean {
            if (p1 != null && p2 != null) {
                return p1[0] == p2[0] && p1[1] == p2[1];
            }

            return p1 == null && p2 == null;
        }

        private onNodeChanged(node: PertElement, propertyName: string): void {
            this.updateNodePoints();

            if (node == this.startNode) {
                this.onPropertyChanged("startPoint");
            }
            else {
                this.onPropertyChanged("endPoint");
            }
        }

        private floorPoint(point: number[]): number[]{
            return [Math.floor(point[0]), Math.floor(point[1])];
        }

        private updateNodePoints(): void {
            if (this._endNode == null) {
                this._endNodePoint = null;
            }
            else {
                var nodeRadius = this._endNode.style.radius + this._endNode.style.borderWidth / 2;

                if (this._startNode != null) {
                    this._endNodePoint = this.floorPoint(Geometry.movePoint(this._endNode.location, this._startNode.location, nodeRadius));
                }
                else {
                    if (this.startPoint != null) {
                        this._endNodePoint = this.floorPoint(Geometry.movePoint(this._endNode.location, this.startPoint, nodeRadius));
                    } else {
                        this._endNodePoint = this._endNode.location;
                    }
                }
            }

            if (this._startNode == null) {
                this._startNodePoint = null;
            }
            else {
                var nodeRadius = this._startNode.style.radius + this._startNode.style.borderWidth / 2;

                if (this._endNode != null) {
                    this._startNodePoint = this.floorPoint(Geometry.movePoint(this._startNode.location, this._endNode.location, nodeRadius));
                }
                else {
                    if (this.endPoint != null) {
                        this._startNodePoint = this.floorPoint(Geometry.movePoint(this._startNode.location, this.endPoint, nodeRadius));
                    } else {
                        this._startNodePoint = this._startNode.location;
                    }
                }
            }
        }

        private getArrowBounds(start: number[], end: number[], width: number, capLength: number, capWidth: number): number[][] {
            var length = start[1] == end[1] ? Math.abs(end[0] - start[0]) : Geometry.lineLength([start[0], start[1], end[0], end[1]]);
            var lineLength = length - capLength;

            if (lineLength < 0) {
                lineLength = length;
                capLength = 0;
                capWidth = width;
            }

            var arrow = [
                [0, -width / 2],
                [lineLength, -width / 2],
                [lineLength, -capWidth / 2],
                [lineLength + capLength, 0],
                [lineLength, capWidth / 2],
                [lineLength, width / 2],
                [0, width / 2]
            ];

            arrow = Geometry.translatePolygon(arrow, start[0], start[1]);

            if (start[1] != end[1] || end[0] < start[0]) {
                var angle = Geometry.lineAngle([start[0], start[1], end[0], end[1]]);
                arrow = Geometry.rotatePolygon(arrow, start, angle);
            }

            return arrow;
        }

        private wrapText(text: string, ctx: CanvasRenderingContext2D, font: string, maxLines: number, maxWidth: number): string[] {
            ctx.font = font;

            var lines: string[] = [];
            var lineWidth = 0;
            var spaceWidth = ctx.measureText(" ").width;
            var words = text.split(' ');

            for (var i = 0; i < words.length; i++) {
                var wordWidth = ctx.measureText(words[i]).width;
                var newLine = (lineWidth == 0) || (lineWidth + spaceWidth + wordWidth > maxWidth);

                if (newLine) {
                    if (lines.length == maxLines) {
                        lines[lines.length - 1] += "...";
                        break;
                    }

                    lines.push(words[i]);
                    lineWidth = wordWidth;
                }
                else {
                    lines[lines.length - 1] += " " + words[i];
                    lineWidth += spaceWidth + wordWidth;
                }
            }

            return lines;
        }
    }

    export class ConnectorStyle extends ElementStyle {
        private _anchorBackgroundColor = "#9b59b6";
        private _anchorBorderColor = "#8e44ad";
        private _anchorBorderWidth = 2;
        private _anchorRadius = 6;
        private _color = "#2e75b5";
        private _font = "12px Tahoma";
        private _lineDash: number[];
        private _lineHeight = 14;
        private _textOffset = 10;
        private _textUnderline = false;
        private _width = 4;

        constructor(element: PertElement) {
            super(element);
        }

        public get anchorBackgroundColor(): string {
            return this._anchorBackgroundColor;
        }

        public set anchorBackgroundColor(anchorBackgroundColor: string) {
            if (this._anchorBackgroundColor != anchorBackgroundColor) {
                this._anchorBackgroundColor = anchorBackgroundColor;
                this.onPropertyChanged("anchorBackgroundColor");
            }
        }

        public get anchorBorderColor(): string {
            return this._anchorBorderColor;
        }

        public set anchorBorderColor(anchorBorderColor: string) {
            if (this._anchorBorderColor != anchorBorderColor) {
                this._anchorBorderColor = anchorBorderColor;
                this.onPropertyChanged("anchorBorderColor");
            }
        }

        public get anchorBorderWidth(): number {
            return this._anchorBorderWidth;
        }

        public set anchorBorderWidth(anchorBorderWidth: number) {
            if (this._anchorBorderWidth != anchorBorderWidth) {
                this._anchorBorderWidth = anchorBorderWidth;
                this.onPropertyChanged("anchorBorderWidth");
            }
        }

        public get anchorRadius(): number {
            return this._anchorRadius;
        }

        public set anchorRadius(anchorRadius: number) {
            if (this._anchorRadius != anchorRadius) {
                this._anchorRadius = anchorRadius;
                this.onPropertyChanged("anchorRadius");
            }
        }

        public get color(): string {
            return this._color;
        }

        public set color(color: string) {
            if (this._color != color) {
                this._color = color;
                this.onPropertyChanged("color");
            }
        }

        public get font(): string {
            return this._font;
        }

        public set font(font: string) {
            if (this._font != font) {
                this._font = font;
                this.onPropertyChanged("font");
            }
        }

        public get lineDash(): number[] {
            return this._lineDash;
        }

        public set lineDash(lineDash: number[]) {
            if (this._lineDash != lineDash) {
                this._lineDash = lineDash;
                this.onPropertyChanged("lineDash");
            }
        }

        public get lineHeight(): number {
            return this._lineHeight;
        }

        public set lineHeight(lineHeight: number) {
            if (this._lineHeight != lineHeight) {
                this._lineHeight = lineHeight;
                this.onPropertyChanged("lineHeight");
            }
        }

        public get textOffset(): number {
            return this._textOffset;
        }

        public set textOffset(textOffset: number) {
            if (this._textOffset != textOffset) {
                this._textOffset = textOffset;
                this.onPropertyChanged("textOffset");
            }
        }

        public get textUnderline(): boolean {
            return this._textUnderline;
        }

        public set textUnderline(textUnderline: boolean) {
            if (this._textUnderline != textUnderline) {
                this._textUnderline = textUnderline;
                this.onPropertyChanged("textUnderline");
            }
        }

        public get width(): number {
            return this._width;
        }

        public set width(width: number) {
            if (this._width != width) {
                this._width = width;
                this.onPropertyChanged("width");
            }
        }
    }
}