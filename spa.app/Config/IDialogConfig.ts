module spa {
    export interface IDialogConfig {
        name: string;
        title?: string;
        template?: string;
        templateUrl?: string;
        size?: ISize;
        viewModel?: any;
    }
} 