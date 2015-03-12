module spa.controls {
    export class PertElement {
        private _bounds: number[] = [0, 0, 0, 0];
        private _boundsUpdated = false;
        private _creating = false;
        private _hovered: string = null;
        private _canvas: HTMLCanvasElement;
        private _canvasUpdated = false;
        private _outline: HTMLCanvasElement;
        private _outlineUpdated = false;
        private _selected = false;
        private _subscriptions: Array<(element: PertElement, propertyName: string) => any> = [];

        private get canvas(): HTMLCanvasElement {
            if (this._canvas == null) {
                this._canvas = document.createElement("canvas");
            }

            return this._canvas;
        }

        private get outline(): HTMLCanvasElement {
            if (this._outline == null) {
                this._outline = document.createElement("canvas");
            }

            return this._outline;
        }

        public get bounds(): number[]{
            if (this._boundsUpdated == false) {
                this._bounds = this.onLayout(this.canvas.getContext("2d"));
                this._boundsUpdated = true;
            }

            return this._bounds;
        }

        public get creating(): boolean {
            return this._creating;
        }

        public set creating(creating: boolean) {
            if (this._creating != creating) {
                this._creating = creating;
                this.onPropertyChanged("creating");
            }
        }

        public get hovered(): string {
            return this._hovered;
        }

        public set hovered(hovered: string) {
            if (this._hovered != hovered) {
                this._hovered = hovered;
                this.onPropertyChanged("hovered");
            }
        }

        public get selected(): boolean {
            return this._selected;
        }

        public set selected(selected: boolean) {
            if (this._selected != selected) {
                this._selected = selected;
                this.onPropertyChanged("selected");
            }
        }

        public get style(): ElementStyle {
            return null;
        }

        public subscribe(handler: (element: PertElement, propertyName: string) => any): void {
            this._subscriptions.push(handler);
        }

        public unsubscribe(handler: (element: PertElement, propertyName: string) => any): void {
            this._subscriptions.splice(this._subscriptions.indexOf(handler), 1);
        }

        public testBounds(rect: number[]): boolean {
            return Geometry.rectangleIntersectsRectangle(this.bounds, rect);
        }

        public testPath(rect: number[]): boolean {
            if (this._boundsUpdated == false) {
                this._bounds = this.onLayout(this.canvas.getContext("2d"));
                this._boundsUpdated = true;
            }

            return false;
        }

        public testPoint(point: number[]): string {
            if (this._boundsUpdated == false) {
                this._bounds = this.onLayout(this.canvas.getContext("2d"));
                this._boundsUpdated = true;
            }

            return null;
        }

        public draw(ctx: CanvasRenderingContext2D): void {
            if (this._canvasUpdated == false) {
                this.canvas.height = this.bounds[3];
                this.canvas.width = this.bounds[2];

                var canvasCtx = this._canvas.getContext("2d");
                canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                canvasCtx.save();
                canvasCtx.translate(-this.bounds[0], -this.bounds[1]);

                if (this.creating) {
                    canvasCtx.globalAlpha = 0.2;
                }

                this.onPaint(canvasCtx);

                if (this.creating) {
                    canvasCtx.globalAlpha = 1;
                }

                canvasCtx.restore();

                this._canvasUpdated = true;
            }

            ctx.drawImage(this.canvas, this.bounds[0], this.bounds[1]);
        }

        public drawOutline(ctx: CanvasRenderingContext2D): void {
            if (this._outlineUpdated == false) {
                this.outline.height = this.bounds[3];
                this.outline.width = this.bounds[2];

                var outlineCtx = this._outline.getContext("2d");
                outlineCtx.clearRect(0, 0, this.outline.width, this.outline.height);
                outlineCtx.save();
                outlineCtx.translate(-this.bounds[0], -this.bounds[1]);

                this.onPaintOutline(outlineCtx);

                outlineCtx.restore();

                this._outlineUpdated = true;
            }

            ctx.drawImage(this.outline, this.bounds[0], this.bounds[1]);
        }

        public onPropertyChanged(propertyName: string): void {
            if (propertyName == "creating" || propertyName == "hovered" || propertyName == "selected") {
                this.update();
            }

            for (var i = 0; i < this._subscriptions.length; i++) {
                this._subscriptions[i](this, propertyName);
            }
        }

        public onStyleChanged(propertyName: string): void {
            if (propertyName == "outlineColor") {
                this.updateOutline();
            }

            if (propertyName == "outlineWidth") {
                this.update();
            }

            for (var i = 0; i < this._subscriptions.length; i++) {
                this._subscriptions[i](this, propertyName);
            }
        }

        public onLayout(ctx: CanvasRenderingContext2D): number[] {
            return [];
        }

        public onPaint(ctx: CanvasRenderingContext2D): void {
        }

        public onPaintOutline(ctx: CanvasRenderingContext2D): void {
        }

        public update(): void {
            this._boundsUpdated = false;
            this._canvasUpdated = false;
            this._outlineUpdated = false;
        }

        public updateBounds(): void {
            this._boundsUpdated = false;
        }

        public updateCanvas(): void {
            this._canvasUpdated = false;
        }

        public updateOutline(): void {
            this._outlineUpdated = false;
        }
    }

    export class ElementStyle {
        private _element: PertElement;
        private _outlineColor = "#ffc526";
        private _outlineWidth = 4;

        constructor(element: PertElement) {
            this._element = element;
        }

        public get outlineColor(): string {
            return this._outlineColor;
        }

        public set outlineColor(outlineColor: string) {
            if (this._outlineColor != outlineColor) {
                this._outlineColor = outlineColor;
                this.onPropertyChanged("outlineColor");
            }
        }

        public get outlineWidth(): number {
            return this._outlineWidth;
        }

        public set outlineWidth(outlineWidth: number) {
            if (this._outlineWidth != outlineWidth) {
                this._outlineWidth = outlineWidth;
                this.onPropertyChanged("outlineWidth");
            }
        }

        public onPropertyChanged(propertyName: string): void {
            this._element.onStyleChanged(propertyName);
        }
    }
}