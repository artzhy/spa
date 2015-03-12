/// <reference path="connector.ts" />

module spa.controls {
    export class PertActivity extends PertConnector {
        private _days: number;
        private _progress: number;

        public get days(): number {
            return this._days;
        }

        public set days(days: number) {
            if (this._days !== days) {
                this._days = days;
                this.onPropertyChanged("days");
            }
        }

        public get progress(): number {
            return this._days;
        }

        public set progress(progress: number) {
            if (this._progress !== progress) {
                this._progress = progress;
                this.onPropertyChanged("progress");
            }
        }

        public onLayout(ctx: CanvasRenderingContext2D): number[] {
            var bounds = super.onLayout(ctx);
            var start = this.startPoint;
            var end = this.endPoint;

            if (start == null || end == null) {
                return bounds;
            }

            var ltr = end[0] >= start[0];
            var length = Geometry.lineLength([start[0], start[1], end[0], end[1]]);
            var capLength = Math.max(this.style.width * 5, 5 * 5);
            var lineLength = length - capLength;
            var width = Math.max(this.style.width, 5);

            if (lineLength < 0) {
                lineLength = length;
                capLength = 0;
            }

            if (this._days != null) {
                ctx.font = this.style.font;

                var text = this._days.toString();
                var textWidth = ctx.measureText(text).width;
                var origin = ltr ? start : end;
                var angle = ltr ? Geometry.lineAngle([start[0], start[1], end[0], end[1]]) : Geometry.lineAngle([end[0], end[1], start[0], start[1]]);

                var rect = [lineLength / 2 - textWidth / 2, width / 2 + this.style.textOffset, textWidth, this.style.lineHeight];

                if (!ltr) {
                    rect[0] += capLength;
                }

                var linePolygon = Geometry.rotateRectangle(Geometry.translateRectangle(rect, origin[0], origin[1]), origin, angle);
                bounds = Geometry.unionRectangle(bounds, Geometry.polygonBoundingRectangle(linePolygon));
            }

            return bounds;
        }

        public onPaint(ctx: CanvasRenderingContext2D): void {
            super.onPaint(ctx);

            var start = this.startPoint;
            var end = this.endPoint;

            if (start == null || end == null) {
                return;
            }

            if (this.days != null) {
                ctx.save();

                var ltr = end[0] >= start[0];
                var length = start[1] == end[1] ? Math.abs(end[0] - start[0]) : Geometry.lineLength([start[0], start[1], end[0], end[1]]);
                var capLength = Math.max(this.style.width * 5, 3 * 5);
                var lineLength = length - capLength;

                if (lineLength < 0) {
                    lineLength = length;
                    capLength = 0;
                }

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

                ctx.fillStyle = this.style.color;
                ctx.font = this.style.color;
                ctx.textAlign = "center";
                ctx.textBaseline = "bottom";

                var bottom = this.style.width / 2 + this.style.textOffset / 2 + this.style.lineHeight;
                var text = this.days.toString() + " д";

                if (ltr) {
                    ctx.fillText(text, lineLength / 2, bottom);
                }
                else {
                    ctx.fillText(text, capLength + lineLength / 2, bottom);
                }

                ctx.restore();
            }
        }

        public onPropertyChanged(propertyName: string): void {
            if (["days"].indexOf(propertyName) != -1) {
                this.updateBounds();
                this.updateCanvas();
            }

            if (["progress"].indexOf(propertyName) != -1) {
                this.updateCanvas();
            }

            super.onPropertyChanged(propertyName);
        }
    }
} 