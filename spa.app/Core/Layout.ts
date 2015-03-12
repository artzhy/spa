/// <reference path="view.ts" />

module spa {
    export class Layout extends View {
        private _config: ILayoutConfig;
        private _containerClassName: string;
        private _containerElement: HTMLElement;
        private _pages: Page[] = [];
        private _viewModel: ILayout;

        constructor(config: ILayoutConfig)
        constructor(template: string, containerClassName: string)
        constructor(templateOrConfig: any, containerClassName?: string) {
            super(templateOrConfig instanceof Object ? (<ILayoutConfig>templateOrConfig).template || (<ILayoutConfig>templateOrConfig).templateUrl : templateOrConfig);

            if (templateOrConfig instanceof Object) {
                this._config = templateOrConfig;
                this._containerClassName = this._config.containerClass;
            }
            else {
                this._containerClassName = containerClassName;
            }
        }

        protected load(callback: (error?: Exception) => void) {
            super.load((viewError) => {
                if (viewError != null) {
                    callback(viewError);
                    return;
                }

                if (isNullOrWhiteSpace(this._containerClassName)) {
                    var errorText: string;

                    if (this._config == null) {
                        callback(new Exception("В конфигурации макета '{0}' не указан класс элемента-контейнера страниц.".format(this.name)));
                    }
                    else {
                        callback(new Exception("Параметр containerClassName конструктора макета '{0}' содержит пустое значение.".format(this.name)));
                    }

                    return;
                }

                var containerNodes = this.template.getElementsByClassName(this._containerClassName);
                var containerError = "Шаблон макета '{0}' {1} элемента-контейнера страниц класса '{2}'.";

                if (containerNodes.length == 0) {
                    callback(new Exception(containerError.format(this.name, "не содержит", this._containerClassName)));
                    return;
                } else {
                    if (containerNodes.length > 1) {
                        callback(new Exception(containerError.format(this.name, "содержит более одного", this._containerClassName)));
                        return;
                    } else {
                        this._containerElement = <HTMLElement>containerNodes[0];
                    }
                }

                this.resolveViewModel((viewModel, viewModelError) => {
                    if (viewModelError != null) {
                        callback(viewModelError);
                        return;
                    }

                    if (viewModel != null) {
                        this._viewModel = viewModel;
                    }

                    var bindingModel = this._config == null ? this : viewModel;

                    if (bindingModel != null) {
                        var bindingError: Exception = null;

                        try {
                            ko.applyBindings(bindingModel, this.template);
                        }
                        catch (e) {
                            var errorText = "Произошла ошибка на этапе привязки модели представления (view model) к шаблону макета '{0}'. ".format(this.name);
                            bindingError = e == null ? new Exception(errorText) : e instanceof Exception ? e : new Exception(errorText + e.toString());
                        }

                        if (bindingError != null) {
                            callback(bindingError);
                            return;
                        }
                    }

                    callback();
                });
            });
        }

        private resolveViewModel(callback: (viewModel: any, error?: Exception) => any) {
            if (this._config.viewModel == null) {
                callback(null);
                return;
            }

            var async = getFunctionParameterNames(this._config.viewModel).length > 0;

            if (async) {
                this.resolveViewModelAsync(this._config.viewModel, callback);
            }
            else {
                var viewModel: any;
                var viewModelError: Exception;

                try {
                    viewModel = new this._config.viewModel();
                }
                catch (constructorError) {
                    viewModelError = constructorError;
                }

                if (viewModel != null) {
                    callback(viewModel);
                }
                else {
                    this.resolveViewModelError(viewModelError, callback);
                }
            }
        }

        private resolveViewModelAsync(viewModelClass: any, callback: (viewModel: any, error?: Exception) => any) {
            try {
                var asyncViewModel = new viewModelClass((viewModelError) => {
                    setTimeout(() => {
                        if (viewModelError == null) {
                            callback(asyncViewModel);
                        }
                        else {
                            this.resolveViewModelError(viewModelError, callback);
                        }
                    }, 0);
                });
            }
            catch (ex) {
                this.resolveViewModelError(ex, callback);
            }
        }

        private resolveViewModelError(error: Exception, callback: (viewModel: any, error?: Exception) => any) {
            var errorText = "Произошла ошибка при создании модели представления (view model) макета '{0}'.".format(this.name);

            if (error == null) {
                error = new Exception(errorText);
            } else {
                error = error instanceof Exception ? error : new Exception(errorText + error.toString());
            }

            callback(null, error);
        }

        public get name() {
            if (this._config == null) {
                var self = <any>this;

                if (self.__proto__) {
                    if (self.__proto__.constructor) {
                        return getFunctionName(self.__proto__.constructor);
                    }
                }

                return "";
            }
            else {
                return this._config.name;
            }
        }

        public get pages() {
            return this._pages;
        }

        public addPage(page: Page) {
            this._pages.push(page);
            this._containerElement.appendChild(page.template);

            if (this._viewModel != null && this._viewModel.onPageChanged != null) {
                this._viewModel.onPageChanged(page.name, page.params);
            }
        }

        public removePage(page: Page) {
            this._pages.remove(page);
            this._containerElement.removeChild(page.template);
        }

        public dispose() {
            if (this.disposed) {
                return;
            }

            if (this._config == null || this._config.viewModel != null) {
                ko.cleanNode(this.template);
            }

            this._pages.forEach((page) => {
                page.dispose();
            });

            if (this._viewModel != null && this._viewModel.dispose != null) {
                this._viewModel.dispose();
            }

            this._config = null;
            this._containerElement = null;
            this._pages.length = 0;
            this._viewModel = null;

            super.dispose();
        }
    }
}