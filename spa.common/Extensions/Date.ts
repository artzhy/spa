interface Date {
    /** Returns a new Date that adds the specified number of days to the value of this instance. */
    addDays(value: number): Date;

    /** Returns a new Date that adds the specified number of hours to the value of this instance. */
    addHours(value: number): Date;

    /** Returns a new Date that adds the specified number of milliseconds to the value of this instance. */
    addMilliseconds(value: number): Date;

    /** Returns a new Date that adds the specified number of minutes to the value of this instance. */
    addMinutes(value: number): Date;

    /** Returns a new Date that adds the specified number of months to the value of this instance. */
    addMonths(value: number): Date;

    /** Returns a new Date that adds the specified number of seconds to the value of this instance. */
    addSeconds(value: number): Date;

    /** Returns a new Date that adds the specified number of years to the value of this instance. */
    addYears(value: number): Date;

    /** Gets the date component of this instance. */
    date: Date;

    daysAfter(date: Date): number;
    daysBefore(date: Date): number;
    format(format: string): string;
    toRussianDate(): string;
    toRussianDateTime(): string;
    toRussianTime(): string;
}

Date.prototype.addDays = function (days: number): Date {
    return new Date(this.getTime() + 1000 * 60 * 60 * 24 * days);
}

Date.prototype.addHours = function (hours: number): Date {
    return new Date(this.getTime() + 1000 * 60 * 60 * hours);
}

Date.prototype.addMilliseconds = function (milliseconds: number): Date {
    return new Date(this.getTime() + milliseconds);
}

Date.prototype.addMinutes = function (minutes: number): Date {
    return new Date(this.getTime() + 1000 * 60 * minutes);
}

Date.prototype.addMonths = function (months: number): Date {
    var month = this.getMonth();
    var year = this.getFullYear();

    while (months != 0) {
        if (months > 0) {
            month++;
            months--;
            if (month == 12) {
                year++;
                month = 0;
            }
        }
        else {
            month--;
            months++;
            if (month == -1) {
                year--;
                month = 11;
            }
        }
    }

    var day = Math.min(this.getDate(), daysInMonth(year, month));

    return new Date(year, month, day, this.getHours(), this.getMinutes(), this.getSeconds(), this.getMilliseconds());
}

Date.prototype.addSeconds = function (seconds: number): Date {
    return new Date(this.getTime() + 1000 * seconds);
}

Date.prototype.addYears = function (years: number): Date {
    var month = this.getMonth();
    var year = this.getFullYear() + years;
    var day = Math.min(this.getDate(), daysInMonth(year, month));

    return new Date(year, month, day, this.getHours(), this.getMinutes(), this.getSeconds(), this.getMilliseconds());
}

Date.prototype.daysAfter = function (date: Date) {
    return (this.getTime() - date.getTime()) / (24 * 60 * 60 * 1000);
}

Date.prototype.daysBefore = function (date: Date) {
    return (date.getTime() - this.getTime()) / (24 * 60 * 60 * 1000);
}

Object.defineProperty(Date.prototype, "date", {
    get: function () {
        return new Date(this.getFullYear(), this.getMonth(), this.getDate(), 0, 0, 0, 0);
    }
});

Date.prototype.format = function (format: string): string {
    // yyyy-MM-dd HH:mm:ss

    //getDate() Returns the day of the month(from 1 - 31)
    //getDay() Returns the day of the week(from 0 - 6)
    //getFullYear() Returns the year(four digits)
    //getHours() Returns the hour(from 0 - 23)
    //getMilliseconds() Returns the milliseconds(from 0 - 999)
    //getMinutes() Returns the minutes(from 0 - 59)
    //getMonth() Returns the month(from 0 - 11)
    //getSeconds() Returns the seconds(from 0 - 59) 

    var year = this.getFullYear();
    var month = this.getMonth() + 1;
    var day = this.getDate();
    var hours = this.getHours();
    var minutes = this.getMinutes();
    var seconds = this.getSeconds();
    var milliseconds = this.getMilliseconds();

    return format
        .replace("yyyy", year)
        .replace("MM", month < 10 ? ("0" + month.toString()) : month.toString())
        .replace("dd", day < 10 ? ("0" + day.toString()) : day.toString())
        .replace("HH", hours < 10 ? ("0" + hours.toString()) : hours.toString())
        .replace("mm", minutes < 10 ? ("0" + minutes.toString()) : minutes.toString())
        .replace("ss", seconds < 10 ? ("0" + seconds.toString()) : seconds.toString());
}

Date.prototype.toRussianDate = function (): string {
    return this.format("dd.MM.yyyy");
}

Date.prototype.toRussianDateTime = function (): string {
    return this.format("dd.MM.yyyy HH:mm");
}

Date.prototype.toRussianTime = function (): string {
    return this.format("HH:mm");
}