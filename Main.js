/**
 * Created by Rami Khadder on 7/10/2017.
 */
var https = require('https');
var express = require('express');
var RetrieveData = require('./RetrieveData');
var SQL = require('./SQL');

var postheaders = {
    'Content-Type' : 'application/json',
    'Accept' : 'application/json',
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

exports.updateSQL = function(){
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

function updateSQLCron(){
    SQL.updateClients();
    SQL.updateEmployees();
    SQL.updateInvoices();
    SQL.updateProjectsAndAssignments();
    SQL.updateTimeEntries();
    SQL.updateTasks();
}

updateSQLCron();

function getClient(request, response, next){
    options.path = '/clients' + request.param.id;
    RetrieveData.getJSON(options, function(statusCode, result) {
        console.log("onResult: (" + statusCode + ")" + JSON.stringify(result));
    })
}

function getProjects(request, response, next){
    options.path = '/projects'
    RetrieveData.getJSON(options, function(statusCode, result) {
        console.log("onResult: (" + statusCode + ")" + JSON.stringify(result));
    })
}

function getProject(request, response, next){
    options.path = '/projects' + request.param.id;
    RetrieveData.getJSON(options, function(statusCode, result) {
        console.log("onResult: (" + statusCode + ")" + JSON.stringify(result));
    })
}

function getAssignments(request, response, next){
    options.path = '/assignments'
    RetrieveData.getJSON(options, function(statusCode, result) {
        console.log("onResult: (" + statusCode + ")" + JSON.stringify(result));
    })
}

function getAssignment(request, response, next){
    options.path = '/assignment' + request.param.id;
    RetrieveData.getJSON(options, function(statusCode, result) {
        console.log("onResult: (" + statusCode + ")" + JSON.stringify(result));
    })
}

function getEmployees(request, response, next){
    options.path = '/employees'
    RetrieveData.getJSON(options, function(statusCode, result) {
        console.log("onResult: (" + statusCode + ")" + JSON.stringify(result));
    })
}

function getEmployee(request, response, next){
    options.path = '/employee' + request.param.id;
    RetrieveData.getJSON(options, function(statusCode, result) {
        console.log("onResult: (" + statusCode + ")" + JSON.stringify(result));
    })
}

function getInvoices(request, response, next){
    options.path = '/invoices'
    RetrieveData.getJSON(options, function(statusCode, result) {
        console.log("onResult: (" + statusCode + ")" + JSON.stringify(result));
    })
}

function getInvoice(request, response, next){
    options.path = '/invoices' + request.param.id;
    RetrieveData.getJSON(options, function(statusCode, result) {
        console.log("onResult: (" + statusCode + ")" + JSON.stringify(result));
    })
}
