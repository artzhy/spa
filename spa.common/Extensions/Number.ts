interface Number {
    toCurrency(precision?: number): string;
    toNumber(): string;
    round(decimals?: number): number;
}

Number.prototype.toCurrency = function (precision?: number) {
    var c = 2;

    if (precision === undefined) {
        c = this.toFixed(0) == this ? 0 : 2;
    }
    else {
        c = precision;
    }

    var n: any = this,
        d = ",",
        t = " ",
        s = n < 0 ? "-" : "",
        i: any = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;


    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "") + " р.";
};

Number.prototype.toNumber = function () {
    var c = (this.toString().split(".")[1] || []).length;

    var n: any = this,
        d = ",",
        t = " ",
        s = n < 0 ? "-" : "",
        i: any = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;


    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};

Number.prototype.round = function (decimalPlaces?: number) {
    if (decimalPlaces == 0) {
        return Math.round(this);
    }
    else {
        var pow = Math.pow(10, Math.abs(decimalPlaces));

        if (decimalPlaces > 0) {
            return Math.round(this * pow) / pow;
        }
        else {
            return Math.round(this / pow) * pow;
        }
    }
}