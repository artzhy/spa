module spa {
    export class Transliterator {
        public static toEn(text: string): string {
            if (text == null || text.length == 0) {
                return text;
            }

            var translit = "";

            for (var i = 0; i < text.length; i++) {
                var char = text[i];

                switch (char) {
                    case "А": translit += "A"; break;
                    case "а": translit += "a"; break;
                    case "Б": translit += "B"; break;
                    case "б": translit += "b"; break;
                    case "В": translit += "V"; break;
                    case "в": translit += "v"; break;
                    case "Г": translit += "G"; break;
                    case "г": translit += "g"; break;
                    case "Д": translit += "D"; break;
                    case "д": translit += "d"; break;
                    case "Е": translit += "E"; break;
                    case "е": translit += "e"; break;
                    case "Ё": translit += "E"; break;
                    case "ё": translit += "e"; break;
                    case "Ж": translit += "Zh"; break;
                    case "ж": translit += "zh"; break;
                    case "З": translit += "Z"; break;
                    case "з": translit += "z"; break;
                    case "И": translit += "I"; break;
                    case "и": translit += "i"; break;
                    case "Й": translit += "J"; break;
                    case "й": translit += "j"; break;
                    case "К": translit += "K"; break;
                    case "к": translit += "k"; break;
                    case "Л": translit += "L"; break;
                    case "л": translit += "l"; break;
                    case "М": translit += "M"; break;
                    case "м": translit += "m"; break;
                    case "Н": translit += "N"; break;
                    case "н": translit += "n"; break;
                    case "О": translit += "O"; break;
                    case "о": translit += "o"; break;
                    case "П": translit += "P"; break;
                    case "п": translit += "p"; break;
                    case "Р": translit += "R"; break;
                    case "р": translit += "r"; break;
                    case "С": translit += "S"; break;
                    case "с": translit += "s"; break;
                    case "Т": translit += "T"; break;
                    case "т": translit += "t"; break;
                    case "У": translit += "U"; break;
                    case "у": translit += "u"; break;
                    case "Ф": translit += "F"; break;
                    case "ф": translit += "f"; break;
                    case "Х": translit += "Kh"; break;
                    case "х": translit += "kh"; break;
                    case "Ц": translit += "C"; break;
                    case "ц": translit += "c"; break;
                    case "Ч": translit += "Ch"; break;
                    case "ч": translit += "ch"; break;
                    case "Ш": translit += "Sh"; break;
                    case "ш": translit += "sh"; break;
                    case "Щ": translit += "Shh"; break;
                    case "щ": translit += "shh"; break;
                    case "Ъ": translit += ""; break;
                    case "ъ": translit += ""; break;
                    case "Ы": translit += "Y"; break;
                    case "ы": translit += "y"; break;
                    case "Ь": translit += ""; break;
                    case "ь": translit += ""; break;
                    case "Э": translit += "E"; break;
                    case "э": translit += "e"; break;
                    case "Ю": translit += "Yu"; break;
                    case "ю": translit += "yu"; break;
                    case "Я": translit += "Ya"; break;
                    case "я": translit += "ya"; break;
                    default: translit += char;
                }
            }

            return translit;
        }

        public static toEnUrl(text: string): string {
            if (text == null || text.length == 0) {
                return null;
            }

            var translit = Transliterator.toEn(text);
            var url = "";

            for (var i = 0; i < translit.length; i++) {
                var char = translit[i];

                if ((char >= "A" && char <= "Z")
                    || (char >= "a" && char <= "z")
                    || (char >= "0" && char <= "9")) {
                    url += char;
                } else {
                    if (url.length > 0 && url[url.length - 1] == "-") {
                        continue;
                    }

                    url += "-";
                }
            }

            return url;
        }
    }
} 