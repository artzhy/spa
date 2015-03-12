module spa {
    export class Geocoder {
        private static CitiesWithMetro = ["Москва", "Санкт-Петербург", "Волгоград", "Нижний Новгород", "Новосибирск", "Самара", "Екатеринбург", "Казань"];

        public static getAddress(coordinates: number[]): Task<IGeocodeAddress> {

            var task = new Task<IGeocodeAddress>((fulfill, reject, progress) => {

                ymaps.geocode(coordinates, {
                    json: true, kind: "house", results: 1
                }).then(
                    (res) => {
                        var address = Geocoder.parseAddress(res);

                        if (address.locality != null) {

                            Geocoder.getDistrict(coordinates).then(
                                (district) => {
                                    if (district != null) {
                                        address.district = district;
                                    }

                                    if (Geocoder.CitiesWithMetro.contains(address.locality)) {
                                        Geocoder.getMetro(coordinates).then(
                                            (metro) => {
                                                if (metro != null) {
                                                    address.metro = metro;
                                                }

                                                fulfill(address);
                                            },
                                            (metroError) => {
                                                reject(metroError);
                                            });

                                    } else {
                                        fulfill(address);
                                    }
                                },
                                (districtError) => {
                                    reject(districtError);
                                });

                        } else {
                            fulfill(address);
                        }
                    },
                    (error) => {
                        reject(new Exception(error.toString()));
                    });
            });

            task.start();

            return task;
        }

        public static getCoordinates(address: string): Task<IGeocodeCoordinates> {
            var task = new Task<IGeocodeCoordinates>((fulfill, reject, progress) => {

                var options: ymaps.IGeocodeOptions = {
                    json: false,
                    kind: "house",
                    results: 1
                };

                ymaps.geocode(address, options).then(
                    (res) => {
                        var firstGeoObject = res.geoObjects.get(0);
                        var coordinates = firstGeoObject.geometry.getCoordinates();
                        var bounds = firstGeoObject.properties.get('boundedBy');

                        fulfill({ bounds: bounds, coordinates: coordinates });
                    },
                    (error) => {
                        reject(new Exception(error.toString()));
                    });
            });

            task.start();

            return task;
        }

        private static getDistrict(coordinates: number[]): Task<string> {
            var task = new Task<string>((fulfill, reject, progress) => {
                ymaps.geocode(coordinates, {
                    json: false,
                    kind: "district",
                    results: 1
                }).then(
                    (metroRes) => {
                        if (metroRes.geoObjects.getLength() > 0) {
                            var firstGeoObject = metroRes.geoObjects.get(0);
                            var district = firstGeoObject.properties.get("name");

                            if (isNullOrWhiteSpace(district) == false) {
                                fulfill(district);
                            } else {
                                fulfill(null);
                            }
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

        private static getMetro(coordinates: number[]): Task<string> {
            var task = new Task<string>((fulfill, reject, progress) => {
                ymaps.geocode(coordinates, {
                    json: false,
                    kind: "metro",
                    results: 1
                }).then(
                    (metroRes) => {
                        if (metroRes.geoObjects.getLength() > 0) {
                            var firstGeoObject = metroRes.geoObjects.get(0);
                            var metro = firstGeoObject.properties.get("name");

                            if (isNullOrWhiteSpace(metro) == false) {
                                fulfill(metro);
                            } else {
                                fulfill(null);
                            }
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

        private static parseAddress(value: any): IGeocodeAddress {
            var xal = {
                CountryName: "",
                AdministrativeAreaName: "",
                LocalityName: "",
                DependentLocalityName: "",
                ThoroughfareName: "",
                ThoroughfareNumber: "",
                SubAdministrativeAreaName: "",
                PostalCodeNumber: "",
                PremiseName: "",
                PremiseNumber: "",
                PremiseNumberSuffix: "",
                PremiseNumberPrefix: "",
                BuildingName: "",
                SubPremiseName: ""
            };

            Geocoder.parseXAL(value, xal);

            for (var paramName in xal) {
                if (xal[paramName] == "") {
                    delete xal[paramName];
                }
            }

            var result: IGeocodeAddress = {};

            if (xal.CountryName != null) {
                result.country = xal.CountryName;
            }

            if (xal.AdministrativeAreaName != null) {
                result.area = xal.AdministrativeAreaName;
            }

            if (xal.SubAdministrativeAreaName != null) {
                //         result.district = xal.SubAdministrativeAreaName;
            }

            if (xal.LocalityName != null) {
                result.locality = xal.LocalityName;
            }

            if (xal.DependentLocalityName != null) {
                result.district = xal.DependentLocalityName;
            }

            if (xal.ThoroughfareName != null) {
                result.street = xal.ThoroughfareName;
            }

            if (xal.PremiseNumber != null) {
                result.house = xal.PremiseNumber;
            }

            var address = [result.country, result.area, result.locality, result.street, result.house];

            result.address = address.filter(x=> isNullOrWhiteSpace(x) == false).join(", ");

            //    metro: string;

            return result;
        }

        private static parseXAL(value: any, xal: XALResult): void {
            for (var memberName in value) {
                if (value[memberName] instanceof Object) {
                    Geocoder.parseXAL(value[memberName], xal);
                }
                else {
                    for (var xalMemberName in xal) {
                        if (memberName == xalMemberName) {
                            xal[xalMemberName] = value[memberName];
                        }
                    }
                }
            }
        }
    }

    interface XALResult {
        CountryName?: string;
        AdministrativeAreaName?: string;
        LocalityName?: string;
        DependentLocalityName?: string;
        ThoroughfareName?: string;
        ThoroughfareNumber?: string;
        SubAdministrativeAreaName?: string;
        PostalCodeNumber?: string;
        PremiseName?: string;
        PremiseNumber?: string;
        PremiseNumberSuffix?: string;
        PremiseNumberPrefix?: string;
        BuildingName?: string;
        SubPremiseName?: string;
    }

    export interface IGeocodeCoordinates {
        bounds: number[][];
        coordinates: number[];
    }

    export interface IGeocodeAddress {
        address?: string;
        country?: string;
        area?: string;
        locality?: string;
        district?: string;
        metro?: string;
        street?: string;
        house?: string;
    }
}