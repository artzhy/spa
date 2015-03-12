module spa {
    export class Geolocator {
        public static getLocation(): Task<IGeolocation> {
            var task = new Task<IGeolocation>((fulfill, reject, progress) => {

                ymaps.geolocation.get({
                    provider: "yandex"
                }).then(
                    (result) => {
                        if (result != null && result.geoObjects.getLength() > 0) {
                            var coordinates = result.geoObjects.get(0).geometry.getCoordinates();

                            Geocoder.getAddress(coordinates).then(
                                (address) => {
                                    fulfill({ address: address, coordinates: coordinates });
                                },
                                (addressError) => {
                                    reject(addressError);
                                });
                        } else {
                            fulfill(null);
                        }
                    },
                    (error) => {
                        reject(new Exception(error.toString()));
                    });
            });

            task.start();

            return task;
        }
    }

    export interface IGeolocation {
        coordinates: number[];
        address: IGeocodeAddress;
    }
}  