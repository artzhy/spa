/// <reference path="node.ts" />

module spa.controls {
    export class PertMilestone extends PertNode {
        private _date: Date;
        private _dateOffset = 10;
        private _dateLineHeight = 20;
        private _flag = false;
        private _style: MilestoneStyle;

        public get date(): Date {
            return this._date;
        }

        public set date(date: Date) {
            if (this._date != date) {
                this._date = date;
                this.onPropertyChanged("date");
            }
        }

        public get flag(): boolean {
            return this._flag;
        }

        public set flag(flag: boolean) {
            if (this._flag != flag) {
                this._flag = flag;
                this.onPropertyChanged("flag");
            }
        }

        public get style(): MilestoneStyle {
            if (this._style == null) {
                this._style = new MilestoneStyle(this);
            }

            return this._style;
        }

        public onPropertyChanged(propertyName: string): void {
            if (propertyName == "date" || propertyName == "flag") {
                this.update();
            }

            super.onPropertyChanged(propertyName);
        }

        public onStyleChanged(propertyName: string): void {
            if (propertyName == "dateFont" || propertyName == "flagHeight") {
                this.update();
            }

            super.onStyleChanged(propertyName);
        }

        public onLayout(ctx: CanvasRenderingContext2D): number[]{
            var bounds = super.onLayout(ctx);

            if (this.creating) {
                return bounds;
            }

            if (this.date != null) {
                ctx.font = this.style.dateFont;

                var dateText = this.getDateText();
                var dateTextWidth = ctx.measureText(dateText).width;

                if (dateTextWidth > bounds[2]) {
                    bounds[0] = this.location[0] - dateTextWidth / 2;
                    bounds[2] = dateTextWidth;
                }

                bounds[3] += this._dateOffset + this._dateLineHeight;
            }

            if (this.flag) {
                bounds[1] -= this.style.flagHeight;
                bounds[3] += this.style.flagHeight;
            }

            return bounds;
        }

        public onPaint(ctx: CanvasRenderingContext2D): void {
            super.onPaint(ctx);

            if (this.creating) {
                return;
            }

            // flag;
            if (this.flag) {
                var x = this.location[0];
                var y = this.location[1] - this.style.radius - this.style.borderWidth / 2;
                var height = this.style.flagHeight;

                ctx.beginPath();

                ctx.moveTo(x, y);
                ctx.lineTo(x, y - height);
                ctx.lineTo(x + height * 0.66, y - height * 0.66);
                ctx.lineTo(x, y - height * 0.33);

                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // date;
            if (this.date != null) {
                var dateText = this.getDateText();

                ctx.font = this.style.dateFont;
                ctx.fillStyle = this.style.color;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(dateText, this.location[0], this.location[1] + this.style.radius + this.style.borderWidth / 2 + this._dateOffset + this._dateLineHeight / 2);
            }
        }

        public onPaintOutline(ctx: CanvasRenderingContext2D): void {
            super.onPaintOutline(ctx);
        }

        public testPath(rect: number[]): boolean {
            return super.testPath(rect);
        }

        public testPoint(point: number[]): string {
            return super.testPoint(point);
        }

        private getDateText(): string {
            var text = this.date.getDate().toString() + " ";

            switch (this.date.getMonth()) {
                case 0: text += "янв"; break;
                case 1: text += "фев"; break;
                case 2: text += "мар"; break;
                case 3: text += "апр"; break;
                case 4: text += "май"; break;
                case 5: text += "июн"; break;
                case 6: text += "июл"; break;
                case 7: text += "авг"; break;
                case 8: text += "сен"; break;
                case 9: text += "окт"; break;
                case 10: text += "ноя"; break;
                case 11: text += "дек"; break;
            }

            return text;
        }
    }

    export class MilestoneStyle extends NodeStyle {
        private _dateFont = "12px Tahoma";
        private _flagHeight = 20;

        constructor(element: PertElement) {
            super(element);
        }

        public get dateFont(): string {
            return this._dateFont;
        }

        public set dateFont(dateFont: string) {
            if (this._dateFont != dateFont) {
                this._dateFont = dateFont;
                this.onPropertyChanged("dateFont");
            }
        }

        public get flagHeight(): number {
            return this._flagHeight;
        }

        public set flagHeight(flagHeight: number) {
            if (this._flagHeight != flagHeight) {
                this._flagHeight = flagHeight;
                this.onPropertyChanged("flagHeight");
            }
        }
    }
}