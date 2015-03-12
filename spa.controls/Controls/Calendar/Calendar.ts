/// <reference path="../component.ts" />

module spa.controls {
    export class Calendar extends Component {
        public static componentName = "calendar";

        private cells: KnockoutComputed<ICalendarCellData[]>;
        private date = ko.observable<Date>(new Date());
        private headerCells: KnockoutComputed<string[]>;
        private headerVisible: KnockoutComputed<boolean>;
        private level = ko.observable<number>(2);
        private period: KnockoutComputed<string>;

        // bindable properties;
        public value: KnockoutObservable<Date>;

        constructor(params: any) {
            super(params);

            this.ensureParametersValid(["value"], params, Calendar.componentName);

            if (params == null) {
                params = {};
            }

            this.bindHandlers();
            this.createObservableProperty("value", null, params.value);
            this.createComputedProperties();

            this.onValueChanged(this.value());

            this.subscribe(this.value, this.onValueChanged);
        }

        private bindHandlers(): void {
            this.back = this.back.bind(this);
            this.cellClick = this.cellClick.bind(this);
            this.forward = this.forward.bind(this);
            this.up = this.up.bind(this);
            this.onValueChanged = this.onValueChanged.bind(this);
        }

        private onValueChanged(value: Date): void {
            this.date(value == null ? new Date() : value);
        }

        private back(): void {
            switch (this.level()) {
                case 0: this.date(this.addYears(this.date(), -10)); break;
                case 1: this.date(this.addYears(this.date(), -1)); break;
                case 2: this.date(this.addMonths(this.date(), -1)); break;
                default: break;
            }
        }

        private up(): void {
            if (this.level() > 0) {
                this.level(this.level() - 1);
            }
        }

        private forward(): void {
            switch (this.level()) {
                case 0: this.date(this.addYears(this.date(), 10)); break;
                case 1: this.date(this.addYears(this.date(), 1)); break;
                case 2: this.date(this.addMonths(this.date(), 1)); break;
                default: break;
            }
        }

        private cellClick(cell: ICalendarCellData): void {
            switch (this.level()) {
                case 0:
                    this.date(cell.value);
                    this.level(1);
                    break;

                case 1:
                    this.date(cell.value);
                    this.level(2);
                    break;

                case 2:
                    this.date(cell.value);

                    if (!this.isSameDate(this.value(), cell.value)) {
                        this.value(cell.value);
                    }
                    break;

                default:
                    break;
            }
        }

        // #region Computed properties

        private createComputedProperties(): void {
            this.cells = ko.computed(() => {
                return this.getCells();
            }).extend({ rateLimit: 1 });

            this.headerCells = ko.computed(() => {
                return this.getHeaderCells();
            });

            this.headerVisible = ko.computed(() => {
                return this.getHeaderVisible();
            });

            this.period = ko.computed(() => {
                return this.getPeriod();
            });
        }

        private getCells(): ICalendarCellData[]{
            var cells: ICalendarCellData[] = [];
            var now = new Date();
            
            // years;
            if (this.level() == 0) {
                var decadeStart = Math.floor(this.date().getUTCFullYear() / 10) * 10;

                for (var i = decadeStart - 1; i < decadeStart + 11; i++) {
                    var value = new Date(Date.UTC(i, 0, 1));

                    cells.push({
                        grayed: i == decadeStart - 1 || i == decadeStart + 11 - 1,
                        selected: this.isSameYear(value, this.value()),
                        text: i.toString(),
                        today: this.isSameYear(value, now),
                        value: value
                    });
                }
            }

            // months;
            if (this.level() == 1) {
                for (var i = 0; i <= 11; i++) {
                    var value = new Date(Date.UTC(this.date().getUTCFullYear(), i, 1));

                    cells.push({
                        grayed: false,
                        selected: this.isSameMonth(value, this.value()),
                        text: this.getMonthText(i).substr(0, 3).toLowerCase(),
                        today: this.isSameMonth(value, now),
                        value: value
                    });
                }
            }

            // days;
            if (this.level() == 2) {
                var firstDayOfMonth = new Date(Date.UTC(this.date().getUTCFullYear(), this.date().getUTCMonth(), 1));
                var dow = firstDayOfMonth.getUTCDay();
                var firstMonday = dow == 0 ? this.addDays(firstDayOfMonth, -6) : this.addDays(firstDayOfMonth, 1 - dow);

                for (var i = 0; i < 42; i++) {
                    var value = this.addDays(firstMonday, i);

                    cells.push({
                        grayed: this.isSameMonth(firstDayOfMonth, value) == false,
                        selected: this.isSameDate(value, this.value()),
                        text: value.getUTCDate().toString(),
                        today: this.isSameDate(value, now),
                        value: value
                    });
                }
            }

            cells.forEach((cell) => {
                var className = [];

                switch (this.level()) {
                    case 0: className.push("year"); break;
                    case 1: className.push("month"); break;
                    case 2: className.push("day"); break;
                    default: break;
                }

                if (cell.grayed) {
                    className.push("grayed");
                }

                if (cell.selected) {
                    className.push("selected");
                }

                if (cell.today) {
                    className.push("today");
                }

                cell.className = className.join(" ");
            });

            return cells;
        }

        private getHeaderCells(): string[] {
            return ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];
        }

        private getHeaderVisible(): boolean {
            return this.level() == 2;
        }

        private getPeriod(): string {
            switch (this.level()) {
                case 0:
                    var decadeStart = Math.floor(this.date().getUTCFullYear() / 10) * 10;
                    return decadeStart.toString() + "-" + (decadeStart + 9).toString();
                case 1:
                    return this.date().getUTCFullYear().toString();
                case 2:
                    return this.getMonthText(this.date().getUTCMonth()) + " " + this.date().getUTCFullYear().toString();
                default:
                    return "";
            }
        }

        // #endregion

        // #region Helpers

        private getMonthText(month: number): string {
            switch (month) {
                case 0: return "Январь";
                case 1: return "Февраль";
                case 2: return "Март";
                case 3: return "Апрель";
                case 4: return "Май";
                case 5: return "Июнь";
                case 6: return "Июль";
                case 7: return "Август";
                case 8: return "Сентябрь";
                case 9: return "Октябрь";
                case 10: return "Ноябрь";
                case 11: return "Декабрь";
            }
        }

        private addDays(date: Date, days: number): Date {
            return new Date(date.getTime() + 1000 * 60 * 60 * 24 * days);
        }

        private addMonths(date: Date, months: number): Date {
            var year = date.getUTCFullYear();
            var month = date.getUTCMonth();

            while (months != 0) {
                month += months > 0 ? 1 : -1;

                if (month == -1) {
                    month = 11;
                    year--;
                }

                if (month == 12) {
                    month = 0;
                    year++;
                }

                months += months > 0 ? -1 : 1;
            }

            return new Date(Date.UTC(year, month, date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds()));
        }

        private addYears(date: Date, years: number): Date {
            return new Date(Date.UTC(date.getUTCFullYear() + years, date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds()));
        }

        private isSameDate(date1: Date, date2: Date): boolean {
            if (date1 != null && date2 != null) {
                return date1.toDateString() == date2.toDateString();
            } else {
                return date1 == null && date2 == null;
            }
        }

        private isSameMonth(date1: Date, date2: Date): boolean {
            if (date1 != null && date2 != null) {
                return date1.getUTCFullYear() == date2.getUTCFullYear() && date1.getUTCMonth() == date2.getUTCMonth();
            }

            return false;
        }

        private isSameYear(date1: Date, date2: Date): boolean {
            if (date1 != null && date2 != null) {
                return date1.getUTCFullYear() == date2.getUTCFullYear();
            }

            return false;
        }

        private isSameDecade(date1: Date, date2: Date): boolean {
            if (date1 != null && date2 != null) {
                var decadeStart = Math.floor(date1.getUTCFullYear() / 10) * 10;

                if (date2.getUTCFullYear() >= decadeStart && date2.getUTCFullYear() < decadeStart + 10) {
                    return true;
                }
            }

            return false;
        }

        // #endregion

        public dispose(): void {
            this.cells.dispose();
            this.headerCells.dispose();
            this.headerVisible.dispose();
            this.period.dispose();
        }
    }

    interface ICalendarCellData {
        className?: string;
        grayed: boolean;
        selected: boolean;
        text: string;
        today: boolean;
        value: Date;
    }

    ko.components.register(Calendar.componentName, {
        viewModel: Calendar,
        template: "Calendar.html"
    });
}