/// <reference path="view.ts" />

module spa {
    export class Page extends View {
        private _config: IPageConfig;
        private _onparamschanged = new Notification<any>();
        private _ontitlechanged = new Notification<string>();
        private _params: any;
        private _subscriptions: KnockoutSubscription[] = [];
        private _title: string;
        private _viewModel: IPage;

        constructor(config: IPageConfig, params: any)
        constructor(template: string, params?: any)
        constructor(templateOrConfig?: any, params?: any) {
            super(templateOrConfig instanceof Object ? (<ILayoutConfig>templateOrConfig).template || (<ILayoutConfig>templateOrConfig).templateUrl : templateOrConfig);

            if (templateOrConfig instanceof Object) {
                this._config = templateOrConfig;
            }

            this._params = params;
        }

        public get onparamschanged() {
            return this._onparamschanged;
        }

        public get ontitlechanged() {
            return this._ontitlechanged;
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

        public get params() {
            return this._params;
        }

        public set params(value: any) {
            if (this._params != value) {
                this._params = value;
                this.onparamschanged.notify(value);
            }
        }

        public get title() {
            return this._title;
        }

        public set title(value: string) {
            if (this._title != value) {
                this._title = value;
                this.ontitlechanged.notify(value);
            }
        }

        public show() {
            super.show();

            if (this._viewModel != null && this._viewModel.onPageShown != null) {
                this._viewModel.onPageShown();
            }
        }

        public hiding(callback: (cancel: boolean) => any): void {
            if (this._viewModel != null && this._viewModel.onPageHiding != null) {
                this._viewModel.onPageHiding(callback);
            }

            callback(false);
        }

        public hide() {
            super.hide();

            if (this._viewModel != null && this._viewModel.onPageShown != null) {
                this._viewModel.onPageHide();
            }
        }

        protected load(callback: (error?: Exception) => void) {
            super.load((viewError) => {
                if (viewError != null) {
                    callback(viewError);
                    return;
                }

                this.resolveViewModel(this._params, (viewModel, viewModelError) => {
                    if (viewModelError != null) {
                        callback(viewModelError);
                        return;
                    }

                    if (this._config != null) {
                        if (this._config.title != null) {
                            this.title = this._config.title;
                        }
                    }

                    if (viewModel != null) {
                        this._viewModel = viewModel;

                        if (this._viewModel.pageParams != null && ko.isObservable(this._viewModel.pageParams)) {
                            this._subscriptions.push((<KnockoutObservable<any>>this._viewModel.pageParams).subscribe((params) => {
                                this.params = params;
                            }));
                        }

                        if (this._viewModel.pageTitle != null && ko.isObservable(this._viewModel.pageTitle)) {
                            this._subscriptions.push((<KnockoutObservable<string>>this._viewModel.pageTitle).subscribe((title) => {
                                this.title = title;
                            }));
                        }
                    }

                    var bindingModel = this._config == null ? this : this._viewModel;

                    if (bindingModel != null) {
                        var bindingError: Exception = null;

                        try {
                            ko.applyBindings(bindingModel, this.template);
                        }
                        catch (e) {
                            var errorText = "Произошла ошибка на этапе привязки модели представления (view model) к шаблону страницы '{0}'. ".format(this.name);
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

        private resolveViewModel(params: any, callback: (viewModel: any, error?: Exception) => any) {
            if (this._config == null) {
                callback(this);
            }
            else {
                if (this._config.viewModel == null) {
                    callback(null);
                }
                else {
                    var async = getFunctionParameterNames(this._config.viewModel).length > 1;

                    if (async) {
                        this.resolveViewModelAsync(this._config.viewModel, params, callback);
                    }
                    else {
                        var viewModel: any;
                        var viewModelError: Exception;

                        try {
                            viewModel = new this._config.viewModel(params);
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
            }
        }

        private resolveViewModelAsync(viewModelClass: any, params: any, callback: (viewModel: any, error?: Exception) => any) {
            try {
                var asyncViewModel = new viewModelClass(params, (viewModelError) => {
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
            var errorText = "Произошла ошибка при создании модели представления (view model) страницы '{0}'.".format(this.name);

            if (error == null) {
                error = new Exception(errorText);
            } else {
                error = error instanceof Exception ? error : new Exception(errorText + error.toString());
            }

            callback(null, error);
        }

        public dispose() {
            if (this.disposed) {
                return;
            }

            if (this._config == null || this._config.viewModel != null) {
                ko.cleanNode(this.template);
            }

            if (this._viewModel != null && this._viewModel.dispose != null) {
                this._viewModel.dispose();
            }

            this._subscriptions.forEach((subscription) => {
                subscription.dispose();
            });

            this._config = null;
            this._onparamschanged.dispose();
            this._ontitlechanged.dispose();
            this._subscriptions.length = 0;
            this._title = null;
            this._viewModel = null;

            super.dispose();
        }
    }
}