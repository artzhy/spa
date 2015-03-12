module spa {
    export class DialogConfigurations {
        private _items: IDialogConfig[] = [];
        private _itemByName: { [name: string]: IDialogConfig } = {};

        public get items() {
            return this._items;
        }

        public find(name: string): IDialogConfig {
            if (isNullOrWhiteSpace(name)) {
                throw new ArgumentNullException("name");
            }

            return this._itemByName[name.toLowerCase()];
        }

        public register(config: IDialogConfig): void {
            if (config == null) {
                throw new ArgumentNullException("config");
            }

            if (isNullOrWhiteSpace(config.name)) {
                throw new ArgumentException("Не задано название диалогового окна.");
            }

            if (isNullOrWhiteSpace(config.template) && isNullOrWhiteSpace(config.templateUrl)) {
                throw new ArgumentException("Не задан шаблон диалогового окна {0}.".format(config.name));
            }

            if (this._itemByName[config.name.toLowerCase()] != null) {
                throw new Exception("Шаблон диалогового окна {0} уже зарегистрирован.".format(config.name));
            }

            this._items.push(config);
            this._itemByName[config.name.toLowerCase()] = config;
        }

        public remove(name: string): boolean {
            if (name == null) {
                throw new ArgumentNullException("name");
            }

            var config = this._itemByName[name.toLowerCase()];

            if (config != null) {
                this._items.remove(config);
                delete this._items[name.toLowerCase()];
            }

            return config != null;
        }
    }
} 