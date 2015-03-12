module spa {
    export class GC {
        private static _container: HTMLDivElement;

        public static disposeElement(element: HTMLElement): void {
            if (GC._container == null) {
                GC._container = document.createElement("div");
                GC._container.style.display = "none";
            }

            document.body.appendChild(GC._container);

            GC._container.appendChild(element);
            GC._container.innerHTML = "";

            document.body.removeChild(GC._container);
        }
    }
}