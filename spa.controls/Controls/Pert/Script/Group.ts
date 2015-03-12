/// <reference path="activity.ts" />

module spa.controls {
    export class PertGroup extends PertActivity {
        constructor() {
            super();

            this.style.font = "bold 12px Tahoma";
            this.style.textUnderline = true;
            this.style.width = 5;
        }
    }
} 