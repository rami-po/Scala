/**
 * Created by Rami Khadder on 7/10/2017.
 */

var postheaders = {
    'Content-Type' : 'application/json',
    'Accept' : 'application/json',
    'Authorization': 'Basic ' + new Buffer('').toString('base64')
};

var options = {
    host : 'productops.harvestapp.com',
    port : 443,
    path : '',
    method : 'GET',
    headers : postheaders
};


function fnUpdateClients(res) {
    options.path = '/clients'

    var reqGet = https.request(options, function(ret) {
        console.log("statusCode: ", ret.statusCode);
        var data = [];
        ret.on('data', function(chunk) {
            data.push(chunk);
        });
        ret.on('end', function() {
            console.info('GET result:\n');
            var body = Body.concat(data);
            var obj = JSON.parse(body);
            for (var index in obj){
                var client = obj[index].client;
                aUpdatesComplete['clients_cnt']++;
                fnUpdateClientRecord(client);
            }
            console.info('\n\nCall completed');
        });
    });
    reqGet.end();
    reqGet.on('error', function(e) {
        console.error(e);
    });

    function fnUpdateClientRecord(client){
        //console.log('\n\nclient: '+ client.name);
        mysql.query('select * from clients where id = "' + client.id + '"',
            function(err, result, fields){
                if (err || (result.length == 0)){
                    mysql.query('insert into clients (id, name, active) values("' + client.id + '", "' + client.name + '", ' + client.active + ')');
                } else {
                    mysql.query('update clients set active = ' + client.active + ' where id = "' + client.id + '"');
                };
            }
        );
    }
}

function fnUpdateProjects(res) {

    options.path = '/projects'

    var reqGet = https.request(options, function(ret) {
        console.log("statusCode: ", ret.statusCode);
        var data = [];
        ret.on('data', function(chunk) {
            data.push(chunk);
        });
        ret.on('end', function() {
            console.info('GET result:\n');
            var body = Body.concat(data)
            var obj = JSON.parse(body);
            for (var index in obj){
                var project = obj[index].project;
                fnUpdateProjectRecord(project);
            }
            console.info('\n\nCall completed');
        });
    });
    reqGet.end();
    reqGet.on('error', function(e) {
        console.error(e);
    });

    function fnUpdateProjectRecord(project){
        console.log('\n\nproject: '+ project.name);
        mysql.query('select * from projects where id = "' + project.id + '"',
            function(err, result, fields){
                var now = new Date();
                if (err || (result.length == 0)){
                    mysql.query('INSERT INTO projects (id, client_id, active, name, code, cost_budget, billable, budget_by, state, created_date, last_checked_date) values ("' + project.id + '", "' + project.client_id + '", ' + project.active + ', "' + project.name + '", "' + project.code + '", "' + project.cost_budget + '", ' + project.billable + ', "' + project.budget_by + '", "lead", "' + project.created_at + '", "' + now.toLocaleDateString() + '")');
                } else {
                    mysql.query('update projects set active = ' + project.active + ', name = "'+project.name+'", billable = '+project.billable+', cost_budget = "'+project.cost_budget+'", code = "'+project.code+'"  where id = "' + project.id + '"');
                };
            }
        );
    }
}

function fnUpdateInvoices(res) {

    for (var page = 1; page < 7; page++){

        options.path = '/invoices?page='+page.toString();

        var reqGet = https.request(options, function(ret) {
            console.log("statusCode: ", ret.statusCode);
            var data = [];
            ret.on('data', function(chunk) {
                data.push(chunk);
            });
            ret.on('end', function() {
                console.info('GET result:\n');
                var obj = JSON.parse(data);
                console.log("invoice cnt: ", obj.length);
                for (var index in obj){
                    var invoice = obj[index].invoices;
                    fnUpdateInvoiceRecord(invoice);
                }
                console.info('\n\nCall completed');
            });
        });
        reqGet.end();
        reqGet.on('error', function(e) {
            console.error(e);
        });
    }

    function fnUpdateInvoiceRecord(invoice){
        console.log('\n\ninvoice: '+ invoice.id);
        mysql.query('select * from invoices where id = "' + invoice.id + '"',
            function(err, result, fields){
                if (err || (result.length == 0)){
                    mysql.query('INSERT INTO invoices (id, client_id, number, amount, state, created_date, issued_date) values ("' + invoice.id + '", "' + invoice.client_id + '", "' + invoice.number + '", "' + invoice.amount + '", "' + invoice.state + '", "' + invoice.created_at + '", "' + invoice.issued_at + '")');
                } else {
                    mysql.query('update invoices set amount = "' + invoice.amount + '", state = "'+invoice.state+'", number = "'+invoice.number+'", issued_date = "'+invoice.issued_at+'" where id = "' + invoice.id + '"');
                };
            }
        );
    }
}

function fnUpdateTasks(res) {
    options.path = '/clients'

    var reqGet = https.request(options, function(ret) {
        console.log("statusCode: ", ret.statusCode);
        var data = [];
        ret.on('data', function(chunk) {
            data.push(chunk);
        });
        ret.on('end', function() {
            console.info('GET result:\n');
            var body = Body.concat(data);
            var obj = JSON.parse(body);
            for (var index in obj){
                var client = obj[index].client;
                aUpdatesComplete['clients_cnt']++;
                fnUpdateClientRecord(client);
            }
            console.info('\n\nCall completed');
        });
    });
    reqGet.end();
    reqGet.on('error', function(e) {
        console.error(e);
    });

    function fnUpdateClientRecord(client){
        //console.log('\n\nclient: '+ client.name);
        mysql.query('select * from clients where id = "' + client.id + '"',
            function(err, result, fields){
                if (err || (result.length == 0)){
                    mysql.query('insert into clients (id, name, active) values("' + client.id + '", "' + client.name + '", ' + client.active + ')');
                } else {
                    mysql.query('update clients set active = ' + client.active + ' where id = "' + client.id + '"');
                };
            }
        );
    }
}

function fnUpdateTimeEntries(res) {
    options.path = '/clients'

    var reqGet = https.request(options, function(ret) {
        console.log("statusCode: ", ret.statusCode);
        var data = [];
        ret.on('data', function(chunk) {
            data.push(chunk);
        });
        ret.on('end', function() {
            console.info('GET result:\n');
            var body = Body.concat(data);
            var obj = JSON.parse(body);
            for (var index in obj){
                var client = obj[index].client;
                aUpdatesComplete['clients_cnt']++;
                fnUpdateClientRecord(client);
            }
            console.info('\n\nCall completed');
        });
    });
    reqGet.end();
    reqGet.on('error', function(e) {
        console.error(e);
    });

    function fnUpdateClientRecord(client){
        //console.log('\n\nclient: '+ client.name);
        mysql.query('select * from clients where id = "' + client.id + '"',
            function(err, result, fields){
                if (err || (result.length == 0)){
                    mysql.query('insert into clients (id, name, active) values("' + client.id + '", "' + client.name + '", ' + client.active + ')');
                } else {
                    mysql.query('update clients set active = ' + client.active + ' where id = "' + client.id + '"');
                };
            }
        );
    }
}

function fnUpdateEmployees(res) {
    options.path = '/clients'

    var reqGet = https.request(options, function(ret) {
        console.log("statusCode: ", ret.statusCode);
        var data = [];
        ret.on('data', function(chunk) {
            data.push(chunk);
        });
        ret.on('end', function() {
            console.info('GET result:\n');
            var body = Body.concat(data);
            var obj = JSON.parse(body);
            for (var index in obj){
                var client = obj[index].client;
                fnUpdateClientRecord(client);
            }
            console.info('\n\nCall completed');
        });
    });
    reqGet.end();
    reqGet.on('error', function(e) {
        console.error(e);
    });

    function fnUpdateEmployeeRecord(employee){
        //console.log('\n\nclient: '+ client.name);
        mysql.query('select * from clients where id = "' + employee.id + '"',
            function(err, result, fields){
                if (err || (result.length == 0)){
                    mysql.query('insert into employees (id, name, active) values("' + employee.id + '", "' + employee.name + '", ' + employee.active + ')');
                } else {
                    mysql.query('update employees set active = ' + employee.active + ' where id = "' + employee.id + '"');
                };
            }
        );
    }
}