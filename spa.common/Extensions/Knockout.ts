module spa {
    var templateFromUrlLoader = {
        loadTemplate: function (name, templateConfig, callback) {
            if (templateConfig.url) {
                var webClient = new spa.WebClient();
                webClient.getAsync(templateConfig.url).then(
                    (templateHtml) => {
                        ko.components.defaultLoader.loadTemplate(name, templateHtml, callback);
                    },
                    (error) => {
                        alert(error.toString());
                    });
            } else {
                callback(null);
            }
        }
    };

    ko.components.loaders.unshift(templateFromUrlLoader);
}