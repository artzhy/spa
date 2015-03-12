/** Returns the number of days in the specified month and year. */
function daysInMonth(year, month) {
    var nextMonth: Date = null;

    if (month == 11) {
        nextMonth = new Date(year + 1, 0, 1);
    }
    else {
        nextMonth = new Date(year, month + 1, 1);
    }

    nextMonth.setDate(0);

    return nextMonth.getDate();
}

function parseDate(value: any, sourceFormat = "yyyy-MM-dd HH:mm:ss"): Date {
    if (value instanceof Date) {
        return value;
    }

    function extractDatePart(dateString: string, format: string, part: string): number {
        if (format.indexOf(part) == -1) {
            return undefined;
        } else {
            var result = parseInt(dateString.substr(format.indexOf(part), part.length));

            if (result == null || isNaN(result)) {
                throw "Invalid date string " + value;
            }

            return result;
        }
    }

    if (value) {
        var s: string = value.toString();

        try {
            var year = extractDatePart(s, sourceFormat, "yyyy");
            var month = extractDatePart(s, sourceFormat, "MM");
            var day = extractDatePart(s, sourceFormat, "dd");
            var hours = extractDatePart(s, sourceFormat, "HH");
            var minutes = extractDatePart(s, sourceFormat, "mm");
            var seconds = extractDatePart(s, sourceFormat, "ss");

            var result = new Date(year, month - 1, day, hours, minutes, seconds);

            if ((result instanceof Date) && !(isNaN(result.getTime()))) {
                return result;
            }
        }
        catch (error) {
        }
    }

    return null;
}

function parseRussianDate(value: any): Date {
    return parseDate(value, "dd.MM.yyyy HH:mm:ss");
}