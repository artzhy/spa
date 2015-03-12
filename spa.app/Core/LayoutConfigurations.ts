module spa {
    export class LayoutConfigurations {
        private _items: ILayoutConfig[] = [];
        private _itemByName: { [name: string]: ILayoutConfig } = {};

        public get items(): ILayoutConfig[] {
            return this._items;
        }

        public find(name: string): ILayoutConfig {
            if (isNullOrWhiteSpace(name)) {
                throw new ArgumentNullException("name");
            }

            return this._itemByName[name.toLowerCase()];
        }

        public register(config: ILayoutConfig): void {
            if (config == null) {
                throw new ArgumentNullException("config");
            }

            if (isNullOrWhiteSpace(config.name)) {
                throw new ArgumentException("Не задано название макета.");
            }

            if (isNullOrWhiteSpace(config.template) && isNullOrWhiteSpace(config.templateUrl)) {
                throw new ArgumentException("Не задан шаблон макета {0}.".format(config.name));
            }

            if (isNullOrWhiteSpace(config.containerClass)) {
                throw new ArgumentException("Не задан класс контейнера макета {0}.".format(config.name));
            }

            if (this._items[config.name.toLowerCase()] != null) {
                throw new Exception("Макет {0} уже зарегистрирован.".format(config.name));
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