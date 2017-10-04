/**
 * Created by Rami Khadder on 7/10/2017.
 */
var https = require('https');
var express = require('express');
var RetrieveData = require('./RetrieveData');
var SQL = require('./SQL');

var postheaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Basic ' + new Buffer('ops@productops.com:product0ps2017').toString('base64')
};

//Harvester Database
var options = {
    host: 'productops.harvestapp.com',
    port: 443,
    path: '',
    method: 'GET',
    headers: postheaders
};



function getAllTimesOld() {
    let d = new Date();
    d.setDate(d.getDate() - 1);
    let dayOfTheYearYesterday = d.getDOY();

    options.path = '/daily/' + dayOfTheYearYesterday + '/' + d.getFullYear() + '?slim=1';
    console.log(options.path);
    RetrieveData.getJSON(options, function (statusCode, result) {
        console.log("onResult: (" + statusCode + ")" + JSON.stringify(result));
    })
}

exports.updateSQL = function () {
    SQL.updateClients();
    SQL.updateEmployees();
    SQL.updateInvoices();
    SQL.updateProjectsAndAssignments();
    SQL.updateTimeEntries();

    var now = new Date();
    var millisTillMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 24, 0, 0, 0) - now;
    if (millisTillMidnight < 0) {
        millisTillMidnight += 86400000; // it's after midnight, try midnight tomorrow.
    }

    setTimeout(module.exports.updateSQL, millisTillMidnight);
};

function updateSQLCron() {

    SQL.updateEmployees()
        .then(SQL.updateClients)
        .then(SQL.updateInvoices)
        .then(SQL.updateTasks)
        .then(SQL.updateProjectsAndAssignments)
        .then(SQL.updateTimeEntries);

    // let i = 150;
    // const intervalID = setInterval(function () {
    //     if (i < 180) {
    //         SQL.updateTimeEntries(i);
    //         i++;
    //     } else {
    //         clearInterval(intervalID);
    //     }
    // }, 10000);

}

updateSQLCron();

function test() {
    SQL.getTimeEntries({params: {}, query: {}}, function (err, result) {
            if (err) {
                console.log(err);
            } else {
                const totalCapacities = [];
                for (let i = 0; i < result.length; i++) {
                    const monday = getMonday(result[i].spent_at);
                    if (totalCapacities[monday + '/' + result[i].user_id] == null) {
                        totalCapacities[monday + '/' + result[i].user_id] = 0;
                    }
                    totalCapacities[monday + '/' + result[i].user_id] += result[i].hours;
                }
                for (const week in totalCapacities) {
                    console.log(week + ', ' + totalCapacities[week]);
                }
            }
        }
    );
}

function getMonday(d) {
    const date = new Date(d);
    while (date.getDay() !== 1) {
        date.setDate(date.getDate() - 1);
    }
    return date;
}

function getClient(request, response, next) {
    options.path = '/clients' + request.param.id;
    RetrieveData.getJSON(options, function (statusCode, result) {
        console.log("onResult: (" + statusCode + ")" + JSON.stringify(result));
    })
}

function getProjects(request, response, next) {
    options.path = '/projects'
    RetrieveData.getJSON(options, function (statusCode, result) {
        console.log("onResult: (" + statusCode + ")" + JSON.stringify(result));
    })
}

function getProject(request, response, next) {
    options.path = '/projects' + request.param.id;
    RetrieveData.getJSON(options, function (statusCode, result) {
        console.log("onResult: (" + statusCode + ")" + JSON.stringify(result));
    })
}

function getAssignments(request, response, next) {
    options.path = '/projects/13107980/user_assignments/112727236';
    RetrieveData.getJSON(options, function (statusCode, result) {
        console.log("onResult: (" + statusCode + ")" + JSON.stringify(result));
    })
}

function getAssignment(request, response, next) {
    options.path = '/assignment' + request.param.id;
    RetrieveData.getJSON(options, function (statusCode, result) {
        console.log("onResult: (" + statusCode + ")" + JSON.stringify(result));
    })
}

function getEmployees(request, response, next) {
    options.path = '/employees'
    RetrieveData.getJSON(options, function (statusCode, result) {
        console.log("onResult: (" + statusCode + ")" + JSON.stringify(result));
    })
}

function getEmployee(request, response, next) {
    options.path = '/employee' + request.param.id;
    RetrieveData.getJSON(options, function (statusCode, result) {
        console.log("onResult: (" + statusCode + ")" + JSON.stringify(result));
    })
}

function getInvoices(request, response, next) {
    options.path = '/invoices'
    RetrieveData.getJSON(options, function (statusCode, result) {
        console.log("onResult: (" + statusCode + ")" + JSON.stringify(result));
    })
}

function getInvoice(request, response, next) {
    options.path = '/invoices' + request.param.id;
    RetrieveData.getJSON(options, function (statusCode, result) {
        console.log("onResult: (" + statusCode + ")" + JSON.stringify(result));
    })
}
