module spa {
    export interface IPage {
        pageParams?: any | KnockoutObservable<any>;
        pageTitle?: string | KnockoutObservable<string>;
        onPageShown?: () => any;
        onPageHiding?: (callback: (cancel: boolean) => any) => any;
        onPageHide?: () => any;
        dispose?: () => any;
    }
} 