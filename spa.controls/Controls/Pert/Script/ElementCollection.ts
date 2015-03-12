/// <reference path="element.ts" />

module spa.controls {
    export class PertElementCollection {
        private _elements: PertElement[] = [];

        public onelementadded: (element: PertElement) => any;
        public onelementpropertychanged: (element: PertElement, propertyName: string) => any;
        public onelementremoved: (element: PertElement) => any;

        constructor() {
            this.onElementPropertyChanged = this.onElementPropertyChanged.bind(this);
        }

        public get length(): number {
            return this._elements.length;
        }

        public add(element: PertElement): void {
            this._elements.push(element);

            element.subscribe(this.onElementPropertyChanged);

            if (this.onelementadded != null) {
                this.onelementadded(element);
            }
        }

        public clear(): void {
            var removedElements = this._elements.slice();

            this._elements.length = 0;

            for (var i = 0; i < removedElements.length; i++) {
                removedElements[i].unsubscribe(this.onElementPropertyChanged);

                if (this.onelementremoved != null) {
                    this.onelementremoved(removedElements[i]);
                }
            }
        }

        public filter(callbackfn: (element: PertElement, index?: number) => boolean): PertElement[] {
            return this._elements.filter(callbackfn);
        }

        public indexOf(element: PertElement): number {
            return this._elements.indexOf(element);
        }

        public item(index: number): PertElement {
            return this._elements[index];
        }

        public map(callbackfn: (element: PertElement, index?: number) => PertElement): PertElement[] {
            return this._elements.map(callbackfn);
        }

        public remove(element: PertElement): void {
            this._elements.splice(this.indexOf(element), 1);

            if (this.onelementremoved != null) {
                this.onelementremoved(element);
            }
        }

        public dispose(): void {
            this._elements.length = 0;

            this.onelementadded = null;
            this.onelementpropertychanged = null;
            this.onelementremoved = null;
        }

        private onElementPropertyChanged(element: PertElement, propertyName: string): void {
            if (this.onelementpropertychanged != null) {
                this.onelementpropertychanged(element, propertyName);
            }
        }
    }
} 