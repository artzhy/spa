/*
    Добавляет класс 'selected' строке таблицы по индексу. Индекс передается в valueAccessor.
*/
ko.bindingHandlers["selectedRowIndex"] = {
    update: function (element: HTMLTableElement, valueAccessor: KnockoutObservable<number>, allBindings, viewModel, bindingContext) {
        var rowIndex = ko.unwrap(valueAccessor());
        
        if (element.tBodies.length > 0) {
            var tableBody = element.tBodies[0];
            var rows = tableBody.getElementsByTagName("TR");

            for (var i = 0; i < rows.length; i++) {
                var row = <HTMLTableRowElement>rows[i];

                if (row.classList.contains("grid-row-selected")) {
                    if (rowIndex != i) {
                        row.classList.remove("grid-row-selected");
                    }
                }
                else {
                    if (rowIndex == i) {
                        row.classList.add("grid-row-selected");
                    }
                }
            }
        }
    }
};