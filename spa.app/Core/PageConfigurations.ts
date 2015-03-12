module spa {
    export class PageConfigurations {
        private _items: IPageConfig[] = [];
        private _itemByName: { [name: string]: IPageConfig } = {};

        public get items(): IPageConfig[] {
            return this._items;
        }

        public find(name: string): IPageConfig {
            if (isNullOrWhiteSpace(name)) {
                throw new ArgumentNullException("name");
            }

            return this._itemByName[name.toLowerCase()];
        }

        public register(config: IPageConfig): void {
            if (config == null) {
                throw new ArgumentNullException("config");
            }

            if (isNullOrWhiteSpace(config.name)) {
                throw new ArgumentException("Не задано название страницы.");
            }

            if (isNullOrWhiteSpace(config.template) && isNullOrWhiteSpace(config.templateUrl)) {
                throw new ArgumentException("Не задан шаблон страницы {0}.".format(config.name));
            }

            if (this._itemByName[config.name.toLowerCase()] != null) {
                throw new Exception("Страница {0} уже зарегистрирована.".format(config.name));
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