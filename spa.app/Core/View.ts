module spa {
    export class View {
        private static loadedTemplates: { [url: string]: string } = {};
        private _disposed = false;
        private _loadResult: Exception;
        private _onready = new Notification<Exception>();
        private _template: HTMLElement;
        private _templateParam: string;

        constructor(template: string) {
            this._template = document.createElement("div");
            this._template.style.display = "none";
            this._templateParam = template;

            setTimeout(() => {
                this.load((error) => {
                    this._loadResult = error == null ? null : error;
                    this._onready.notifyOnce(error);
                });
            }, 0);
        }

        protected load(loaded: (error?: Exception) => void): void {
            if (this._templateParam == null || this._templateParam.length == 0) {
                loaded(null);
            } else {
                if (this._templateParam.length >= 5) {
                    if (this._templateParam.substr(this._templateParam.length - 5, 5).toLowerCase() == ".html") {
                        var key = this._templateParam.toLowerCase();

                        if (key in View.loadedTemplates) {
                            this._template.innerHTML = View.loadedTemplates[key];
                            loaded();
                        }
                        else {
                            Http.getAsync<string>(this._templateParam).then(
                                (template) => {
                                    View.loadedTemplates[key] = template;
                                    this._template.innerHTML = template;
                                    loaded();
                                },
                                (error) => {
                                    loaded(error);
                                });
                        }
                    }
                    else {
                        this._template.innerHTML = this._templateParam;
                        loaded();
                    }
                }
                else {
                    this._template.innerHTML = this._templateParam;
                    loaded();
                }
            }
        }

        public get disposed(): boolean {
            return this._disposed;
        }

        public get onready() {
            return this._onready;
        }

        public get template() {
            return this._template;
        }

        public get visible() {
            return this._template.style.display != "none";
        }

        public hide() {
            this._template.style.display = "none";
        }

        public show() {
            this._template.style.display = "";
        }

        public dispose() {
            if (this._disposed) {
                return;
            }

            this._onready.dispose();

            GC.disposeElement(this._template);

            this._template = null;
            this._disposed = true;
        }
    }
}