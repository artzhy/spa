module spa.controls {
    export class PertNode extends PertElement {
        private _location: number[] = [0, 0];
        private _nodeBounds: number[];
        private _text: string = "";

        constructor() {
            super();
        }

        public get location(): number[] {
            return this._location;
        }

        public set location(location: number[]) {
            if (location == null) {
                location = [0, 0];
            }

            if (this._location[0] != location[0] || this._location[1] != location[1]) {
                this._location = location;
                this.onPropertyChanged("location");
            }
        }

        public get style(): NodeStyle {
            return null;
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
            if (propertyName == "location") {
                this.update();
            }

            if (propertyName == "text") {
                this.updateCanvas();
            }

            super.onPropertyChanged(propertyName);
        }

        public onStyleChanged(propertyName: string): void {
            if (propertyName == "borderWidth" || propertyName == "radius") {
                this.update();
            }

            if (propertyName == "backgroundColor" || propertyName == "color" || propertyName == "font") {
                this.updateCanvas();
            }

            super.onStyleChanged(propertyName);
        }

        public onLayout(ctx: CanvasRenderingContext2D): number[]{
            var nodeRadius = this.style.radius + this.style.borderWidth / 2;

            this._nodeBounds = [this.location[0], this.location[1], nodeRadius];

            var bounds = [this.location[0] - nodeRadius, this.location[1] - nodeRadius, nodeRadius * 2, nodeRadius * 2];
            bounds = Geometry.inflateRectangle(bounds, this.style.outlineWidth + 2, this.style.outlineWidth + 2);

            return bounds;
        }

        public onPaint(ctx: CanvasRenderingContext2D): void {
            super.onPaint(ctx);

            // node;
            ctx.beginPath();
            ctx.arc(this.location[0], this.location[1], this.style.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.style.backgroundColor;
            ctx.fill();
            ctx.lineWidth = this.style.borderWidth;
            ctx.strokeStyle = this.style.color;
            ctx.stroke();

            // text;
            if (!this.creating) {
                ctx.font = this.style.font;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = this.style.color;
                ctx.fillText(this.text, this.location[0], this.location[1]);
            }
        }

        public onPaintOutline(ctx: CanvasRenderingContext2D): void {
            super.onPaintOutline(ctx);

            var radius = this.style.radius + this.style.borderWidth / 2 + this.style.outlineWidth;

            ctx.beginPath();
            ctx.arc(this.location[0], this.location[1], radius, 0, Math.PI * 2);

            ctx.fillStyle = this.style.outlineColor;
            ctx.fill();
        }

        public testPath(rect: number[]): boolean {
            var result = super.testPath(rect);

            if (!result) {
                result = Geometry.circleIntersectsRectangle(this._nodeBounds, rect);
            }

            return result;
        }

        public testPoint(point: number[]): string {
            var result = super.testPoint(point);

            if (result == null) {
                if (Geometry.circleContainsPoint(this._nodeBounds, point)) {
                    result = "NODE";
                }
            }

            return result;
        }
    }

    export class NodeStyle extends ElementStyle {
        private _backgroundColor = "#fff";
        private _borderWidth = 4;
        private _color = "#2e75b5";
        private _font = "bold 12px Tahoma";
        private _radius = 20;

        constructor(element: PertElement) {
            super(element);
        }

        public get backgroundColor(): string {
            return this._backgroundColor;
        }

        public set backgroundColor(backgroundColor: string) {
            if (this._backgroundColor != backgroundColor) {
                this._backgroundColor = backgroundColor;
                this.onPropertyChanged("backgroundColor");
            }
        }

        public get borderWidth(): number {
            return this._borderWidth;
        }

        public set borderWidth(borderWidth: number) {
            if (this._borderWidth != borderWidth) {
                this._borderWidth = borderWidth;
                this.onPropertyChanged("borderWidth");
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

        public get radius(): number {
            return this._radius;
        }

        public set radius(radius: number) {
            if (this._radius != radius) {
                this._radius = radius;
                this.onPropertyChanged("radius");
            }
        }
    }
} 