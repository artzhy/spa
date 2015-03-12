declare module spa {
    interface IValidationError {
        errorText: string;
        propertyName: string;
    }
}
declare module spa {
    interface IDialog {
        close?(result?: any): any;
        dialogSize?: ISize | KnockoutObservable<ISize>;
        dialogTitle?: string | KnockoutObservable<string>;
        dispose?(): any;
    }
    class DialogViewModel<TResult> {
        size: KnockoutObservable<ISize>;
        title: KnockoutObservable<string>;
        constructor(params?: any, ready?: (dialog: DialogViewModel<TResult>, error?: Exception) => any);
        protected close(result?: TResult): void;
        show(closeCallback: (result?: TResult) => any): void;
        dispose(): void;
    }
    class InputNumberDialog extends DialogViewModel<number> {
        value: KnockoutObservable<number>;
        private okClick();
        private cancelClick();
    }
}
declare module spa {
    interface IDialogConfig {
        name: string;
        title?: string;
        template?: string;
        templateUrl?: string;
        size?: ISize;
        viewModel?: any;
    }
}
declare module spa {
    interface ILayout {
        onPageChanged?: (name: string, params: any) => any;
        dispose?: () => any;
    }
}
declare module spa {
    interface ILayoutConfig {
        containerClass: string;
        name: string;
        template?: string;
        templateUrl?: string;
        viewModel?: any;
    }
}
declare module spa {
    interface IPage {
        pageParams?: any | KnockoutObservable<any>;
        pageTitle?: string | KnockoutObservable<string>;
        onPageShown?: () => any;
        onPageHiding?: (callback: (cancel: boolean) => any) => any;
        onPageHide?: () => any;
        dispose?: () => any;
    }
}
declare module spa {
    interface IPageConfig {
        name: string;
        route?: string;
        template?: string;
        templateUrl?: string;
        title?: string;
        viewModel?: any;
    }
}
declare module spa {
    class Application {
        private _activePage;
        private _activeLayout;
        private _cachedRoutes;
        private _cachedLayouts;
        private _errorElement;
        private _errorHandlers;
        private _firstPage;
        private _layoutHandlers;
        private _onroutechanged;
        private _pageHandlers;
        private _started;
        constructor();
        onroutechanged: Notification<IRouteChangedEventArgs>;
        mapPage(pattern: string, handler: (params?: any) => IRoutePage): void;
        mapLayout(handler: (pageNameOrClass: any) => IRouteLayout): void;
        mapError(handler: (error?: Exception) => IRoutePage): void;
        mapRegisteredPages(): void;
        mapAttributeRoutes(): void;
        private onBodyClick(ev);
        private onPopState();
        /** Запуск приложения. */
        start(): void;
        /** Остановка приложения. */
        stop(): void;
        /** Переход на страницу.
            @param pageNameOrClass Название зарегистрированной страницы, класс модели представления зарегистрированной страницы или класс-потомок Page.
            @param params Параметры конструктора.
        */
        navigate(pageNameOrClass: any, params?: any): void;
        /** Переход на указанный адрес.
            @param url Адрес страницы.
        */
        navigateUrl(url: string): void;
        /** Переход на предыдущую страницу. */
        back(): void;
        /** Переход на следующую страницу. */
        forward(): void;
        /** Переход на домашнюю страницу. */
        home(): void;
        private onRouteChanged();
        private openUrl(url);
        private findRoute(pathname, search);
        private resolveRoute(route, resolve);
        private resolveWithPage(pageNameOrClass, params, layoutNameOrClass, resolve);
        private resolveWithErrorPage(error, resolve);
        private resolveWithDefaultErrorPage(error, resolve);
        private createLayout(nameOrClass, callback);
        private createPage(nameOrClass, params, callback);
        private showPage(page, layout?);
        private showStandardError(error);
        private hideActivePage();
        private hideActiveLayout();
        private onPageParamsChanged(page);
        private onPageTitleChanged(page);
        private matchRoute(pathname, pattern);
        private extractRouteParams(pathname, search, pattern);
        private makeUrl(pattern, params);
    }
    interface IRoutePage {
        /** Название зарегистрированной страницы, класс модели представления зарегистрированной страницы или класс-потомок Page. */
        page: any;
        /** Параметры конструктора страницы. */
        params?: any;
    }
    interface IRouteLayout {
        /** Название зарегистрированного макета, класс модели представления зарегистрированного макета или класс-потомок Layout. */
        layout: any;
    }
    interface IRouteChangedEventArgs {
        /** Название зарегистрированной страницы или класс-потомок Page. */
        page: any;
        /** Параметры конструктора страницы. */
        params?: any;
        /** Название зарегистрированного макета или класс-потомок Layout. */
        layout?: any;
        /** Адрес страницы. */
        url: string;
    }
}
declare module spa {
    class View {
        private static loadedTemplates;
        private _disposed;
        private _loadResult;
        private _onready;
        private _template;
        private _templateParam;
        constructor(template: string);
        protected load(loaded: (error?: Exception) => void): void;
        disposed: boolean;
        onready: Notification<Exception>;
        template: HTMLElement;
        visible: boolean;
        hide(): void;
        show(): void;
        dispose(): void;
    }
}
declare module spa {
    class Dialog extends View {
        private _closeCallback;
        private _config;
        private _dialogBodyElement;
        private _dialogHeaderElement;
        private _location;
        private _params;
        private _size;
        private _subscriptions;
        private _title;
        private _viewModel;
        constructor(config: IDialogConfig, params: any);
        constructor(template: string, params?: any);
        name: string;
        location: IPoint;
        size: ISize;
        title: string;
        show(closeCallback?: (result?: any) => any): void;
        showModal(closeCallback?: (result?: any) => any): void;
        protected close(result?: any): void;
        static disposeAll(): void;
        protected load(callback: (error?: Exception) => void): void;
        private resolveViewModel(params, callback);
        private resolveViewModelAsync(viewModelClass, params, callback);
        private resolveViewModelError(error, callback);
        private onLocationChanged();
        private onSizeChanged();
        private onTitleChanged();
        private getAbsoluteSize(size, containerSize);
        private internalShow(modal, closeCallback);
        dispose(): void;
    }
    function showDialog(dialogName: string, params?: any, close?: (result?: any) => any): any;
    function showDialog(dialogClassOrViewModelClass: any, params?: any, close?: (result?: any) => any): any;
}
declare module spa {
    class DialogConfigurations {
        private _items;
        private _itemByName;
        items: IDialogConfig[];
        find(name: string): IDialogConfig;
        register(config: IDialogConfig): void;
        remove(name: string): boolean;
    }
}
declare module spa {
    class LayoutConfigurations {
        private _items;
        private _itemByName;
        items: ILayoutConfig[];
        find(name: string): ILayoutConfig;
        register(config: ILayoutConfig): void;
        remove(name: string): boolean;
    }
}
declare module spa {
    class PageConfigurations {
        private _items;
        private _itemByName;
        items: IPageConfig[];
        find(name: string): IPageConfig;
        register(config: IPageConfig): void;
        remove(name: string): boolean;
    }
}
declare module spa {
    var dialogs: DialogConfigurations;
    var layouts: LayoutConfigurations;
    var pages: PageConfigurations;
}
declare module spa {
    class Layout extends View {
        private _config;
        private _containerClassName;
        private _containerElement;
        private _pages;
        private _viewModel;
        constructor(config: ILayoutConfig);
        constructor(template: string, containerClassName: string);
        protected load(callback: (error?: Exception) => void): void;
        private resolveViewModel(callback);
        private resolveViewModelAsync(viewModelClass, callback);
        private resolveViewModelError(error, callback);
        name: string;
        pages: Page[];
        addPage(page: Page): void;
        removePage(page: Page): void;
        dispose(): void;
    }
}
declare module spa {
    class Page extends View {
        private _config;
        private _onparamschanged;
        private _ontitlechanged;
        private _params;
        private _subscriptions;
        private _title;
        private _viewModel;
        constructor(config: IPageConfig, params: any);
        constructor(template: string, params?: any);
        onparamschanged: Notification<any>;
        ontitlechanged: Notification<string>;
        name: string;
        params: any;
        title: string;
        show(): void;
        hiding(callback: (cancel: boolean) => any): void;
        hide(): void;
        protected load(callback: (error?: Exception) => void): void;
        private resolveViewModel(params, callback);
        private resolveViewModelAsync(viewModelClass, params, callback);
        private resolveViewModelError(error, callback);
        dispose(): void;
    }
}
declare module spa {
    class RouteAttribute extends Attribute {
        url: string;
        constructor(url: string);
    }
}
declare module spa {
    class InputStringDialog implements IDialog {
        static dialogName: string;
        constructor();
        text: KnockoutObservable<string>;
        close(result?: any): void;
        okClick(): void;
    }
}
declare module spa {
    class OpenFileDialog {
        private static createFileInput(multiple, accept);
        static show(handler: (files: File[]) => any, multiple?: boolean, accept?: string): void;
    }
}
declare module spa {
    class ForbiddenPage implements IPage {
        static pageName: string;
        errorMessage: KnockoutObservable<string>;
        constructor(params: any);
    }
}
declare module spa {
    class InternalServerErrorPage implements IPage {
        static pageName: string;
        errorMessage: KnockoutObservable<string>;
        constructor(params: any);
    }
}
declare module spa {
    class NotFoundPage implements IPage {
        static pageName: string;
        errorMessage: KnockoutObservable<string>;
        constructor(params: any);
    }
}
declare module spa {
    class UnknownError implements IPage {
        static pageName: string;
        errorMessage: KnockoutObservable<string>;
        constructor(params: any);
    }
}
