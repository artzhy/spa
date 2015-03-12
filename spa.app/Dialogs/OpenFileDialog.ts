 module spa {
    export class OpenFileDialog {
        private static createFileInput(multiple: boolean, accept: string): HTMLInputElement {
            var fileInput = document.createElement('input');

            fileInput.setAttribute('type', 'file');
            fileInput.style.left = "-200px";
            fileInput.style.top = "-200px";
            fileInput.style.width = "0";
            fileInput.style.height = "0";
            fileInput.style.overflow = "hidden";
            fileInput.style.position = "absolute";

            if (accept) {
                fileInput.setAttribute("accept", accept);
            }

            if (multiple) {
                fileInput.setAttribute('multiple', 'multiple');
            }

            document.body.appendChild(fileInput);

            return fileInput;
        }

        public static show(handler: (files: File[]) => any, multiple = false, accept: string = ""): void {
            var fileInput = OpenFileDialog.createFileInput(multiple, accept);

            fileInput.onchange = () => {
                if (handler) {
                    if (fileInput.files && fileInput.files.length > 0) {
                        var files: File[] = [];

                        for (var i = 0; i < fileInput.files.length; i++) {
                            files.push(fileInput.files[i]);
                        }

                        handler(files);
                    }
                }

                document.body.removeChild(fileInput);
            };

            fileInput.click();
        }
    }
 }