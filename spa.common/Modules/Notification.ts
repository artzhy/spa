module spa {
    /** Уведомление. */
    export class Notification<TArgs> {
        private _dispatched = false;
        private _listeners: { (args?: TArgs): any }[] = [];
        private _args: TArgs;

        /** Уведомляет подписчиков о событии. */
        public notify(args?: TArgs): void {
            this._listeners.forEach((listener) => {
                listener(args);
            });
        }

        /** Уведомляет подписчиков о событии. Последующие подписчики также будут уведомлены о событии. */
        public notifyOnce(args?: TArgs) {
            if (this._dispatched) {
                return;
            }
            else {
                this._args = args;
                this._dispatched = true;

                this.notify(args);
            }
        }

        /** Освобождает ресурсы уведомления и очищает список подпичсчиков. */
        public dispose(): void {
            this._args = null;
            this._listeners.length = 0;
            this._listeners = null;
        }

        /** Подписаться на событие. */
        public subscribe(handler: (args?: TArgs) => any): void {
            this._listeners.push(handler);

            if (this._dispatched) {
                handler(this._args);
            }
        }

        /** Отписаться от события. */
        public unsubscribe(handler: (args?: TArgs) => any): boolean {
            return this._listeners.remove(handler);
        }
    }
} 