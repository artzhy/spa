module spa {
    export interface IPageConfig {
        name: string;
        route?: string;
        template?: string;
        templateUrl?: string;
        title?: string;
        viewModel?: any;
    }
} 