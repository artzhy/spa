module spa.controls {
    export class PertDependency extends PertConnector {
        constructor() {
            super();

            this.style.color = "#999";
            this.style.lineDash = [8, 3];
            this.style.width = 1;
        }
    }
} 