module spa {
    export interface ILayout {
        onPageChanged?: (name: string, params: any) => any;
        dispose?: () => any;
    }
}