/**
 * Created by Rami Khadder on 7/10/2017.
 */
var http = require("http");
var https = require("https");

exports.getJSON = function(options, onResult)
{
    var prot = options.port == 443 ? https : http;
    var req = prot.request(options, function(res)
    {
        var output = '';
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            output += chunk;
        });

        res.on('end', function() {
            var obj = JSON.parse(output);
            onResult(res.statusCode, obj);
        });
    });

    req.on('error', function(err) {
        //res.send('error: ' + err.message);
    });

    req.end();
};

/*rest.getJSON(options, function(statusCode, result) {
    // I could work with the result html/json here.  I could also just return it
    console.log("onResult: (" + statusCode + ")" + JSON.stringify(result));
    res.statusCode = statusCode;
    res.send(result);
});*/