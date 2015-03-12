/// <reference path="view.ts" />

module spa {
    export class Dialog extends View {
        private _closeCallback: (result?: any) => any;
        private _config: IDialogConfig;
        private _dialogBodyElement: HTMLDivElement;
        private _dialogHeaderElement: HTMLDivElement;
        private _location: IPoint;
        private _params: any;
        private _size: ISize = { height: 480, width: 640 };
        private _subscriptions: KnockoutSubscription[] = [];
        private _title: string;
        private _viewModel: IDialog;

        constructor(config: IDialogConfig, params: any)
        constructor(template: string, params?: any)
        constructor(templateOrConfig?: any, params?: any) {
            super(templateOrConfig instanceof Object ? (<ILayoutConfig>templateOrConfig).template || (<ILayoutConfig>templateOrConfig).templateUrl : templateOrConfig);

            if (templateOrConfig instanceof Object) {
                this._config = templateOrConfig;
            }

            this._params = params;
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

        public get location() {
            return this._location;
        }

        public set location(value: IPoint) {
            this._location = value;
            this.onLocationChanged();
        }

        public get size() {
            return this._size;
        }

        public set size(value: ISize) {
            this._size = value;
            this.onSizeChanged();
        }

        public get title() {
            return this._title;
        }

        public set title(value: string) {
            this._title = value;
            this.onTitleChanged();
        }

        public show(closeCallback?: (result?: any) => any) {
            this.internalShow(false, closeCallback);
        }

        public showModal(closeCallback?: (result?: any) => any) {
            this.internalShow(true, closeCallback);
        }

        protected close(result?: any) {
            this.template.classList.add("dialog-hidden");

            setTimeout(() => {
                document.body.removeChild(this.template);

                super.hide();

                if (this._closeCallback != null) {
                    this._closeCallback(result);
                    this._closeCallback = null;
                }
            }, 200);

            var dialog = visibleDialogs.filter(x => x.dialog == this)[0];

            if (dialog != null) {
                visibleDialogs.remove(dialog);
            }

            if (overlayElement != null) {
                var hasModalDialogs = visibleDialogs.some(x => x.modal);

                if (hasModalDialogs) {
                    overlayElement.style.zIndex = (visibleDialogs.filter(x => x.modal).max(x => x.zIndex) - 1).toString();
                }
                else {
                    overlayElement.classList.add("dialog-overlay-hidden");

                    setTimeout(() => {
                        document.body.removeChild(overlayElement);
                    }, 200);
                }
            }
        }

        public static disposeAll(): void {
            while (visibleDialogs.length > 0) {
                var visibleDialog = visibleDialogs.pop();
                visibleDialog.dialog.dispose();
            }

            if (overlayElement != null && overlayElement.parentElement != null) {
                if (overlayElement.parentElement != null) {
                    document.body.removeChild(overlayElement);
                }
            }
        }

        protected load(callback: (error?: Exception) => void) {
            super.load((viewError) => {
                if (viewError != null) {
                    callback(viewError);
                    return;
                }

                this._dialogHeaderElement = document.createElement("div");
                this._dialogHeaderElement.classList.add("dialog-header");

                this._dialogBodyElement = document.createElement("div");
                this._dialogBodyElement.classList.add("dialog-body");

                while (this.template.firstChild) {
                    this._dialogBodyElement.appendChild(this.template.firstChild);
                }

                this.template.classList.add("dialog");
                this.template.classList.add("dialog-hidden");
                this.template.appendChild(this._dialogHeaderElement);
                this.template.appendChild(this._dialogBodyElement);

                this.resolveViewModel(this._params,(viewModel, viewModelError) => {
                    if (viewModelError != null) {
                        callback(viewModelError);
                        return;
                    }

                    if (this._config != null) {
                        if (this._config.size != null) {
                            this.size = this._config.size;
                        }

                        if (this._config.title != null) {
                            this.title = this._config.title;
                        }
                    }

                    if (viewModel != null) {
                        this._viewModel = viewModel;

                        if (this._viewModel.dialogSize != null) {
                            this.size = ko.unwrap(this._viewModel.dialogSize);

                            if (ko.isSubscribable(this._viewModel.dialogSize)) {
                                this._subscriptions.push((<KnockoutObservable<ISize>>this._viewModel.dialogSize).subscribe((size) => {
                                    this._size = size;
                                }));
                            }
                        }

                        if (this._viewModel.dialogTitle != null) {
                            this.title = ko.unwrap(this._viewModel.dialogTitle);

                            if (ko.isSubscribable(this._viewModel.dialogTitle)) {
                                this._subscriptions.push((<KnockoutObservable<string>>this._viewModel.dialogTitle).subscribe((title) => {
                                    this._title = title;
                                }));
                            }
                        }

                        this._viewModel.close = (result?: any) => {
                            this.close(result);
                        };
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

                    this.onLocationChanged();
                    this.onSizeChanged();
                    this.onTitleChanged();

                    callback();
                });
            });
        }

        private resolveViewModel(params: any, callback: (viewModel: IDialog, error?: Exception) => any) {
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

        private resolveViewModelAsync(viewModelClass: any, params: any, callback: (viewModel: any, error?: Exception) => any) {
            try {
                var asyncViewModel = new viewModelClass(params,(viewModelError) => {
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
            var errorText = "Произошла ошибка при создании модели представления (view model) диалогового окна '{0}'.".format(this.name);

            if (error == null) {
                error = new Exception(errorText);
            } else {
                error = error instanceof Exception ? error : new Exception(errorText + error.toString());
            }

            callback(null, error);
        }

        private onLocationChanged() {
            var dialogHeight = this.getAbsoluteSize(this.size.height, window.innerHeight);
            var dialogWidth = this.getAbsoluteSize(this.size.width, window.innerWidth);

            this.template.style.left = (window.innerWidth / 2 - dialogWidth / 2).toString() + "px";
            this.template.style.top = (window.innerHeight / 2 - dialogHeight / 2).toString() + "px";
        }

        private onSizeChanged() {
            this.template.style.height = typeof this.size.height == "number" ? this.size.height + "px" : this.size.height.toString();
            this.template.style.width = typeof this.size.width == "number" ? this.size.width + "px" : this.size.width.toString();
        }

        private onTitleChanged() {
            this._dialogHeaderElement.innerHTML = this.title;
        }

        private getAbsoluteSize(size: string | number, containerSize: number): number {
            if (typeof size == "number") {
                return <number>size;
            } else {
                var s = size.toString();

                if (s.contains("%")) {
                    return parseInt(s) * containerSize / 100;
                } else {
                    return parseInt(s);
                }
            }
        }

        private internalShow(modal: boolean, closeCallback: (result?: any) => any) {
            super.show();

            var zIndex = 1000;

            visibleDialogs.forEach((dialog) => {
                zIndex += Math.max(zIndex, dialog.zIndex + 2);
            });

            var dialog: IVisibleDialog = {
                dialog: this,
                modal: modal,
                zIndex: zIndex
            }

            visibleDialogs.push(dialog);

            this.template.style.zIndex = zIndex.toString();

            if (modal) {
                if (overlayElement == null) {
                    overlayElement = document.createElement("div");
                    overlayElement.classList.add("dialog-overlay");
                    overlayElement.classList.add("dialog-overlay-hidden");
                }

                overlayElement.style.zIndex = (zIndex - 1).toString();

                if (overlayElement.parentElement == null) {
                    document.body.appendChild(overlayElement);
                }

                if (overlayElement.classList.contains("dialog-overlay-hidden")) {
                    setTimeout(() => {
                        overlayElement.classList.remove("dialog-overlay-hidden");
                    }, 10);
                }
            }

            this._closeCallback = closeCallback;

            if (this.template.parentElement == null) {
                document.body.appendChild(this.template);
            }

            setTimeout(() => {
                this.template.classList.remove("dialog-hidden");
            }, 10);
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

            this._closeCallback = null;
            this._config = null;
            this._dialogBodyElement = null;
            this._dialogHeaderElement = null;
            this._params = null;
            this._subscriptions.length = 0;
            this._viewModel = null;

            super.dispose();
        }
    }

    interface IVisibleDialog {
        dialog: Dialog;
        modal: boolean;
        zIndex: number;
    }

    var overlayElement: HTMLDivElement = null;
    var visibleDialogs: IVisibleDialog[] = [];

    export function showDialog(dialogName: string, params?: any, close?: (result?: any) => any)
    export function showDialog(dialogClassOrViewModelClass: any, params?: any, close?: (result?: any) => any)
    export function showDialog(nameOrClass: any, params?: any, close?: (result?: any) => any): void {
        var config: IDialogConfig;

        if (typeof nameOrClass == "string") {
            var config = dialogs.find(nameOrClass);

            if (config == null) {
                throw new Exception("Диалоговое окно '{0}' не найдено.".format(nameOrClass));
            }
        }
        else {
            config = dialogs.items.filter(x => x.viewModel == nameOrClass)[0];

            if (config == null) {
                var dialogFromClass = new nameOrClass(params);
                dialogFromClass.onready.subscribe((error) => {
                    if (error != null) {
                        throw error;
                    }

                    dialogFromClass.showModal((result) => {
                        if (close != null) {
                            close(result);
                        }

                        dialogFromClass.dispose();
                    });
                });
            }
            else {
                var dialog = new Dialog(config, params);
                dialog.onready.subscribe((error) => {
                    if (error != null) {
                        throw error;
                    }

                    dialog.showModal((result) => {
                        if (close != null) {
                            close(result);
                        }

                        dialog.dispose();
                    });
                });
            }
        }
    }
} 