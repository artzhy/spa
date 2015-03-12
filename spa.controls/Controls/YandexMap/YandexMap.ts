module spa.controls {
    export class YandexMap extends Component {
        public static componentName = "YandexMap";

        public center: KnockoutObservable<number[]>;
        public placemarks: KnockoutObservableArray<IPlacemark>;
        public type: KnockoutObservable<YandexMapType>;
        public zoom: KnockoutObservable<number>;

        constructor(params: any) {
            super(params);

            this.ensureParametersValid(["center", "placemarks", "type", "zoom"], params, YandexMap.componentName);

            if (params == null) {
                params = {};
            }

            this.createObservableProperty("center", null, params.center);
            this.createObservableArrayProperty("placemarks", null, params.placemarks);
            this.createObservableProperty("type", YandexMapType.Roadmap, params.type);
            this.createObservableProperty("zoom", 11, params.zoom);
        }

        public dispose() {
            super.dispose();
        }
    }

    export enum YandexMapType {
        Hybrid,
        HybridPublic,
        Public,
        Roadmap,
        Satellite
    }

    export interface IPlacemark {
        coordinates?: number[] | KnockoutObservable<number[]>;
        draggable?: boolean | KnockoutObservable<boolean>;
    }

    ko.bindingHandlers["yandexMap"] = {
        init: function (element: HTMLElement, valueAccessor, allBindings, viewModel: YandexMap, bindingContext) {
            initYandexApi(() => {
                var center = ko.unwrap(viewModel.center);

                if (center == null) {
                    center = [ymaps.geolocation.latitude, ymaps.geolocation.longitude];
                }

                var mapType = ko.unwrap(viewModel.type);

                if (mapType == null) {
                    mapType = YandexMapType.Roadmap;
                }

                var zoom = ko.unwrap(viewModel.zoom);

                if (zoom == null) {
                    zoom = 7;
                }

                var map = new ymaps.Map(element, {
                    center: [center[0], center[1]],
                    type: mapTypeToString(mapType),
                    zoom: zoom
                });

                map.controls.add("mapTools").add("zoomControl").add("typeSelector");
                map.behaviors.enable('scrollZoom');

                var binding = new MapBinding(map, viewModel);

                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    binding.dispose();
                    map.destroy();
                });
            });
        }
    };

    function initYandexApi(callback: () => any) {
        ymaps.ready(() => {
            ymaps.load(['package.standard'],() => {
                callback();
            });
        });
    }

    function mapTypeToString(mapType: YandexMapType) {
        switch (mapType) {
            case YandexMapType.Hybrid: return "yandex#hybrid"; break;
            case YandexMapType.HybridPublic: return "yandex#publicMapHybrid"; break;
            case YandexMapType.Public: return "yandex#publicMap"; break;
            case YandexMapType.Roadmap: return "yandex#map"; break;
            case YandexMapType.Satellite: return "yandex#satellite"; break;
            default: return "yandex#map";
        }
    }

    function compareCoordinates(coords1: number[], coords2: number[]): boolean {
        if (coords1 == null && coords2 == null) {
            return true;
        }

        if (coords1 == null || coords2 == null) {
            return false;
        }

        if (coords1.length != coords2.length) {
            return false;
        }

        for (var i = 0; i < coords1.length; i++) {
            if (coords1[i] != coords2[i]) {
                return false;
            }
        }

        return true;
    }

    ko.components.register("yandex-map", {
        viewModel: YandexMap,
        template: "YandexMap.html"
    });

    declare var ymaps: any;

    class MapBinding {
        private bindingSource: YandexMap;
        private map: any;
        private subscriptions: KnockoutSubscription[] = [];

        constructor(map: any, bindingSource: YandexMap) {
            this.bindingSource = bindingSource;
            this.map = map;

            var placemarks = bindingSource.placemarks();

            if (placemarks != null) {
                placemarks.forEach((placemark) => {
                    this.onBindingSourcePlacemarkAdded(placemark);
                });
            }

            this.bindMethods();
            this.subscribeEvents();
        }

        private bindMethods() {
            this.getMapCenter = this.getMapCenter.bind(this);
            this.getMapType = this.getMapType.bind(this);
            this.getMapZoom = this.getMapZoom.bind(this);
            this.setMapCenter = this.setMapCenter.bind(this);
            this.setMapType = this.setMapType.bind(this);
            this.setMapZoom = this.setMapZoom.bind(this);
            this.onBindingSourceCenterChanged = this.onBindingSourceCenterChanged.bind(this);
            this.onBindingSourcePlacemarkAdded = this.onBindingSourcePlacemarkAdded.bind(this);
            this.onBindingSourcePlacemarkRemoved = this.onBindingSourcePlacemarkRemoved.bind(this);
            this.onBindingSourceTypeChanged = this.onBindingSourceTypeChanged.bind(this);
            this.onBindingSourceZoomChanged = this.onBindingSourceZoomChanged.bind(this);
            this.onMapBoundsChanged = this.onMapBoundsChanged.bind(this);
            this.onMapTypeChanged = this.onMapTypeChanged.bind(this);
        }

        private subscribeEvents() {
            this.map.events.add("boundschange", this.onMapBoundsChanged);
            this.map.events.add("typechange", this.onMapTypeChanged);

            this.subscriptions.push(this.bindingSource.center.subscribe(this.onBindingSourceCenterChanged));
            this.subscriptions.push(this.bindingSource.type.subscribe(this.onBindingSourceTypeChanged));
            this.subscriptions.push(this.bindingSource.zoom.subscribe(this.onBindingSourceZoomChanged));

            this.subscriptions.push(this.bindingSource.placemarks.subscribe((changes) => {
                changes.forEach((change: any) => {
                    if (change.status == "added") {
                        this.onBindingSourcePlacemarkAdded(change.value);
                    } else {
                        if (change.status == "deleted") {
                            this.onBindingSourcePlacemarkRemoved(change.value);
                        }
                    }
                });
            }, null, "arrayChange"));          
        }

        private getMapCenter(): number[]{
            return this.map.getCenter();
        }

        private getMapType(): YandexMapType {
            switch (this.map.getType()) {
                case "yandex#hybrid": return YandexMapType.Hybrid; break;
                case "yandex#publicMapHybrid": return YandexMapType.HybridPublic; break;
                case "yandex#publicMap": return YandexMapType.Public; break;
                case "yandex#map": return YandexMapType.Roadmap; break;
                case "yandex#satellite": return YandexMapType.Satellite; break;
                default: return YandexMapType.Roadmap;
            }
        }

        private getMapZoom(): number {
            return this.map.getZoom();
        }

        private setMapCenter(center: number[]) {
            this.map.setCenter(center);
        }

        private setMapType(type: YandexMapType) {
            switch (type) {
                case YandexMapType.Hybrid: this.map.setType("yandex#hybrid"); break;
                case YandexMapType.HybridPublic: this.map.setType("yandex#publicMapHybrid"); break;
                case YandexMapType.Public: this.map.setType("yandex#publicMap"); break;
                case YandexMapType.Roadmap: this.map.setType("yandex#map"); break;
                case YandexMapType.Satellite: this.map.setType("yandex#satellite"); break;
                default: this.map.setType("yandex#map");
            }
        }

        private setMapZoom(zoom: number) {
            this.map.setZoom(zoom);
        }

        private onBindingSourceCenterChanged(center: number[]) {
            this.setMapCenter(center);
        }

        private onBindingSourcePlacemarkAdded(placemarkBindingSource: IPlacemark) {
            var coordinates = ko.unwrap(placemarkBindingSource.coordinates);

            if (coordinates == null) {
                coordinates = [ymaps.geolocation.latitude, ymaps.geolocation.longitude];
            }

            var draggable = ko.unwrap(placemarkBindingSource.draggable);

            if (draggable == null) {
                draggable = false;
            }

            var placemark = new ymaps.Placemark(
                coordinates,
                {
                    //balloonContentHeader: ymaps.geolocation.country,
                    //balloonContent: ymaps.geolocation.city,
                    //balloonContentFooter: ymaps.geolocation.region
                }, {
                    draggable: draggable
                    //preset: "twirl#lightblueIcon",
                });

            this.map.geoObjects.add(placemark);

            var binding = new PlacemarkBinding(placemark, placemarkBindingSource);

            placemarkBindingSource["$binding"] = binding;
            placemarkBindingSource["$placemark"] = placemark;
        }

        private onBindingSourcePlacemarkRemoved(placemarkBindingSource: IPlacemark) {
            if (placemarkBindingSource["$placemark"] != null) {
                this.map.geoObjects.remove(placemarkBindingSource["$placemark"]);
                delete placemarkBindingSource["$placemark"];
            }

            if (placemarkBindingSource["$binding"] != null) {
                placemarkBindingSource["$binding"].dispose();
                delete placemarkBindingSource["$binding"];
            }
        }

        private onBindingSourceTypeChanged(type: YandexMapType) {
            this.setMapType(type);
        }

        private onBindingSourceZoomChanged(zoom: number) {
            this.setMapZoom(zoom);
        }

        private onMapBoundsChanged() {
            if (!compareCoordinates(this.getMapCenter(), this.bindingSource.center())) {
                this.bindingSource.center(this.getMapCenter());
            }

            if (this.getMapZoom() != this.bindingSource.zoom()) {
                this.bindingSource.zoom(this.getMapZoom());
            }
        }

        private onMapTypeChanged() {
            if (this.getMapType() != this.bindingSource.type()) {
                this.bindingSource.type(this.getMapType());
            }
        }

        public dispose() {
            this.subscriptions.forEach((subscription) => {
                subscription.dispose();
            });

            this.subscriptions.length = 0;

            var placemarks = this.bindingSource.placemarks();
            placemarks.forEach((placemark) => {
                if (placemark["$placemark"] != null) {
                    this.map.geoObjects.remove(placemark["$placemark"]);
                    delete placemark["$placemark"];
                }

                if (placemark["$binding"] != null) {
                    placemark["$binding"].dispose();
                    delete placemark["$binding"];
                }
            });

            this.map.events.remove("boundschange", this.onMapBoundsChanged);
            this.map.events.remove("typechange", this.onMapTypeChanged);
        }
    }

    class PlacemarkBinding {
        private bindingSource: IPlacemark;
        private placemark: any;
        private subscriptions: KnockoutSubscription[] = [];

        constructor(placemark: any, bindingSource: IPlacemark) {
            this.bindingSource = bindingSource;
            this.placemark = placemark;

            this.bindMethods();
            this.subscribeEvents();
        }

        private bindMethods() {
            this.getPlacemarkCoordinates = this.getPlacemarkCoordinates.bind(this);
            this.getPlacemarkDraggable = this.getPlacemarkDraggable.bind(this);
            this.setPlacemarkCoordinates = this.setPlacemarkCoordinates.bind(this);
            this.setPlacemarkDraggable = this.setPlacemarkDraggable.bind(this);
            this.onPlacemarkCoordinatesChanged = this.onPlacemarkCoordinatesChanged.bind(this);
            this.onBindingSourceCoordinatesChanged = this.onBindingSourceCoordinatesChanged.bind(this);
            this.onBindingSourceDraggableChanged = this.onBindingSourceDraggableChanged.bind(this);
        }

        private subscribeEvents() {
            this.placemark.events.add("dragend", this.onPlacemarkCoordinatesChanged, this);

            if (ko.isSubscribable(this.bindingSource.coordinates)) {
                this.subscriptions.push((<any>this.bindingSource.coordinates).subscribe(this.onBindingSourceCoordinatesChanged));
            }

            if (ko.isSubscribable(this.bindingSource.draggable)) {
                this.subscriptions.push((<any>this.bindingSource.draggable).subscribe(this.onBindingSourceDraggableChanged));
            }
        }

        private getPlacemarkCoordinates() {
            return this.placemark.geometry.getCoordinates();
        }

        private getPlacemarkDraggable() {
            return this.placemark.options.get("draggable");
        }

        private setPlacemarkCoordinates(coordinates: number[]) {
            this.placemark.geometry.setCoordinates(coordinates);
        }

        private setPlacemarkDraggable(draggable: boolean) {
            this.placemark.options.set("draggable", draggable);
        }

        private onPlacemarkCoordinatesChanged() {
            var coordinates = this.getPlacemarkCoordinates();

            if (ko.isObservable(this.bindingSource.coordinates)) {
                if (ko.isWriteableObservable(this.bindingSource.coordinates)) {
                    var sourceCoordinates = (<KnockoutObservable<number[]>>this.bindingSource.coordinates)();

                    if (!compareCoordinates(coordinates, sourceCoordinates)) {
                        (<KnockoutObservable<number[]>>this.bindingSource.coordinates)(coordinates);
                    }
                }
            }
            else {
                if (!compareCoordinates(<any>this.bindingSource.coordinates, coordinates)) {
                    this.bindingSource.coordinates = coordinates;
                }
            }
        }

        private onBindingSourceCoordinatesChanged(coordinates: number[]) {
            this.setPlacemarkCoordinates(coordinates);
        }

        private onBindingSourceDraggableChanged(draggable: boolean) {
            this.setPlacemarkDraggable(draggable);
        }

        public dispose() {
            this.subscriptions.forEach((subscription) => {
                subscription.dispose();
            });

            this.subscriptions.length = 0;

            this.placemark.events.remove("dragend", this.onPlacemarkCoordinatesChanged, this);
        }
    }
}