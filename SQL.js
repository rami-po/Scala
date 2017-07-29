/**
 * Created by Rami Khadder on 7/24/2017.
 */
var RetrieveData = require('./RetrieveData');
var mysql = require('mysql');

var harvestSecret = require('./secrets/harvest_secret.json');
var sqlSecret = require('./secrets/sql_secret.json');

var postheaders = {
    'Content-Type' : 'application/json',
    'Accept' : 'application/json',
    'Authorization': 'Basic ' + new Buffer(harvestSecret.user + ':' + harvestSecret.password).toString('base64')
};

//Harvester Database
var options = {
    host: 'productops.harvestapp.com',
    port: 443,
    path: '',
    method: 'GET',
    headers: postheaders
};

var connection = mysql.createConnection({
    host: sqlSecret.HOST,
    port: sqlSecret.PORT,
    user: sqlSecret.MYSQL_USER,
    password: sqlSecret.MYSQL_PASS,
    database: sqlSecret.DATABASE
});

Date.prototype.isLeapYear = function() {
    var year = this.getFullYear();
    if((year & 3) != 0) return false;
    return ((year % 100) != 0 || (year % 400) == 0);
};

// Get Day of Year
Date.prototype.getDOY = function() {
    var dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    var mn = this.getMonth();
    var dn = this.getDate();
    var dayOfYear = dayCount[mn] + dn;
    if(mn > 1 && this.isLeapYear()) dayOfYear++;
    return dayOfYear;
};

exports.updateClients = function (){
    options.path = '/clients';                                                      //change path
    RetrieveData.getJSON(options, function(statusCode, result) {                    //pull data from Harvest
        if (statusCode === 200) {                                                   //if pull was successful, continue
            console.log("Updating clients: done!");
            for (var i = 0; i < result.length; i++) {
                var client = result[i].client;
                var name = client.name;

                //if the name has a single apostrophe, we have to escape it by adding another single apostrophe next to it.
                var index = client.name.indexOf("'");
                if (index !== -1) {
                    name = name.substring(0, index) + "'" + name.substring(index);
                }
                connection.query("INSERT INTO clients (id, name, active) VALUES ('" + client.id + "', '" + name + "', '" + +client.active + "') " +
                    "ON DUPLICATE KEY UPDATE name='" + name + "', active='" + +client.active + "'");
            }
        } else{
            console.log("An error has occurred when updating clients.")
        }
    })
};

exports.updateEmployees = function(){
    options.path = '/people';                                                       //change path
    RetrieveData.getJSON(options, function(statusCode, result) {                    //pull data from Harvest
        if (statusCode === 200) {                                                   //if pull was successful, continue
            console.log("Updating employees: done!");
            for (var i = 0; i < result.length; i++) {
                var employee = result[i].user;

                connection.query("INSERT INTO employees (id, email, created_at, is_admin, first_name, last_name, is_contractor, telephone, is_active, default_hourly_rate, department, updated_at, cost_rate, capacity) " +
                    "VALUES ('" + employee.id + "', '" + employee.email + "', '" + employee.created_at + "', '" + +employee.is_admin + "', '" + employee.first_name + "', '" + employee.last_name + "', '" +
                    +employee.is_contractor + "', '" + employee.telephone + "', '" + +employee.is_active + "', '" + employee.default_hourly_rate + "', '" + employee.department + "', '" + employee.updated_at + "', '" +
                    employee.cost_rate + "', '" + employee.weekly_capacity + "') ON DUPLICATE KEY UPDATE email='" + employee.email + "', created_at='" + employee.created_at + "', first_name='" + employee.first_name +
                    "', last_name='" + employee.last_name + "', is_contractor='" + +employee.is_contractor + "', telephone='" + employee.telephone + "', is_active='" + +employee.is_active + "', default_hourly_rate='" +
                    employee.default_hourly_rate + "', department='" + employee.department + "', updated_at='" + employee.updated_at + "', cost_rate='" + employee.cost_rate + "', capacity='" + employee.weekly_capacity + "'");
            }
        } else {
            console.log("An error has occurred when updating employees.")
        }
    })
};

exports.initializeTimeEntries = function(){
    var year = 2008;
    var day = 1;
    var intervalID = setInterval(function() {
        if (year < 2018){
            if (day < 367){
                options.path = '/daily/' + day + '/' + year;
                updateTimeEntries();
                day++;
            } else {
                day = 1;
                year++;
            }
        }
        else {
            console.log("Updating timeEntries: done!");
            clearInterval(intervalID);
        }
    }, 16000);
};

function updateTimeEntries(){
    RetrieveData.getJSON(options, function(statusCode, result) {
        if (statusCode === 200) {
        for (var i = 0; i < result.day_entries.length; i++) {
            var timeEntry = result.day_entries[i];

            connection.query("INSERT INTO timeEntries (id, user_id, project_id, spent_at, hours) VALUES ('" + timeEntry.id + "', '" + timeEntry.user_id + "', '" +
                timeEntry.project_id + "', '" + timeEntry.spent_at + "', '" + timeEntry.hours + "') " + "ON DUPLICATE KEY UPDATE id='" + timeEntry.id + "', user_id='" +
                timeEntry.user_id + "', project_id='" + timeEntry.project_id + "', spent_at='" + timeEntry.spent_at + "', hours='" + timeEntry.hours + "'");

            }
        }
        else {
            console.log("An error has occurred when updating time entries.")
        }
    })
}

exports.updateInvoices = function(){
    options.path = '/invoices';
    RetrieveData.getJSON(options, function(statusCode, result) {
        if (statusCode === 200) {
            console.log("Updating invoices: done!");
            for (var i = 0; i < result.length; i++) {
                var invoice = result[i].invoices;

                connection.query("INSERT INTO invoices (id, client_id, number, amount, state, created_date, issued_date, project_id, companies) VALUES ('" + invoice.id + "', '" + invoice.client_id + "', '" +
                    invoice.number + "', '" + invoice.amount + "', '" + invoice.state + "', '" + invoice.created_at + "', '" + invoice.issued_at + "', '" + invoice.project_id + "', '" + invoice.companies + "') " +
                    "ON DUPLICATE KEY UPDATE client_id='" + invoice.client_id + "', number='" + invoice.number + "', amount='" + invoice.amount + "', state='" + invoice.state + "', created_date='" + invoice.created_at
                    + "', issued_date='" + invoice.issued_at + "', project_id='" + invoice.project_id + "', companies='" + invoice.companies + "'");
            }
        } else {
            console.log("An error has occurred when updating invoices.")
        }
    })
};

exports.updateProjectsAndAssignments = function(){
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate()-1);

    var updated_since = yesterday.toISOString().substring(0,10) + '+00%3A00';

    options.path = '/projects?updated_since=' + updated_since;
    var projectIds = [];

    RetrieveData.getJSON(options, function(statusCode, result) {
        if (statusCode === 200) {
            console.log("Updating projects: done!");
            for (var i = 0; i < result.length; i++) {
                var project = result[i].project;
                projectIds.push(project.id);

                connection.query("INSERT INTO projects (id, client_id, active, name, code, cost_budget, billable, budget_by, state, created_date, last_checked_date, weekly_hour_budget) VALUES ('" + project.id + "', '" + project.client_id + "', '" +
                    +project.active + "', '" + project.name + "', '" + project.code + "', '" + project.cost_budget + "', '" + +project.billable + "', '" + project.budget_by + "', '" + project.state + "', '" + project.created_at + "', '" +
                    project.hint_latest_record_at + "', '" + project.weekly_hour_budget + "') ON DUPLICATE KEY UPDATE client_id='" + project.client_id + "', active='" + +project.active + "', name='" + project.name + "', code='" + project.code +
                    "', cost_budget='" + project.cost_budget + "', billable='" + +project.billable + "', budget_by='" + project.budget_by + "', state='" + project.state + "', created_date='" + project.created_at + "', last_checked_date='" +
                    project.hint_latest_record_at + "', weekly_hour_budget='" + project.hourly_rate + "'");

            }
            updateAssignments(projectIds);
        } else {
            console.log("An error has occurred when updating projects.")
        }
    })
};

function updateAssignments(projectIds){
    var j = 0;
    var intervalID = setInterval(function() {
        if (j < projectIds.length){
            options.path = '/projects/' + projectIds[j] + '/user_assignments';
            updateAssignment();
            j++;
        } else {
            console.log("Updating assignments: done!");
            clearInterval(intervalID);
        }
    }, 16000);
    /*
    for (var j = 0; j < projectIds.length; j++){
        options.path = '/projects/' + projectIds[j] + '/user_assignments';
        updateAssignment();
        //setTimeout(updateAssignment, 16000);
    }
    console.log("Updating assignments: done!");
    */
}

function updateAssignment(){
    RetrieveData.getJSON(options, function(statusCode, result) {
        if (statusCode === 200) {
            for (var i = 0; i < result.length; i++) {
                var assignment = result[i].user_assignment;

                connection.query("INSERT INTO assignments (id, user_id, project_id, is_project_manager, deactivated, hourly_rate, budget, created_at, updated_at, estimate, expected_weekly_hours) VALUES ('" + assignment.id + "', '" +
                    assignment.user_id + "', '" + assignment.project_id + "', '" + +assignment.is_project_manager + "', '" + +assignment.deactivated + "', '" + assignment.hourly_rate + "', '" + assignment.budget + "', '" +
                    assignment.created_at + "', '" + assignment.updated_at + "', '" + assignment.estimate + "', '" + assignment.expected_weekly_hours + "') ON DUPLICATE KEY UPDATE user_id='" + assignment.user_id +
                    "', project_id='" + assignment.project_id + "', is_project_manager='" + +assignment.is_project_manager + "', deactivated='" + +assignment.deactivated + "', hourly_rate='" + assignment.default_hourly_rate +
                    "', budget='" + assignment.budget + "', created_at='" + assignment.created_at + "', updated_at='" + assignment.updated_at + "', estimate='" + assignment.estimate + "', expected_weekly_hours='" + assignment.expected_weekly_hours + "'");

            }
            console.log("Updating assignment...")
        } else {
            console.log("An error has occurred when updating assignments: " + JSON.stringify(result));
        }
    })
}

exports.updateTimeEntries = function(){
    var d = new Date();
    d.setDate(d.getDate() - 1);
    var dayOfTheYearYesterday = d.getDOY();

    options.path = '/people';
    RetrieveData.getJSON(options, function(statusCode, result) {
        if (statusCode === 200) {
            console.log("Updating time entries: done!");
            for (var i = 0; i < result.length; i++) {
                var employee = result[i].user;
                if (employee.is_active) {
                    options.path = '/daily/' + dayOfTheYearYesterday + '/' + d.getFullYear() + "?of_user=" + employee.id;
                    RetrieveData.getJSON(options, function (statusCode, result) {
                        if (statusCode === 200) {
                            for (var i = 0; i < result.day_entries.length; i++) {
                                var timeEntry = result.day_entries[i];

                                connection.query("INSERT INTO timeEntries (id, user_id, project_id, spent_at, hours) VALUES ('" + timeEntry.id + "', '" + timeEntry.user_id + "', '" +
                                    timeEntry.project_id + "', '" + timeEntry.spent_at + "', '" + timeEntry.hours + "') " + "ON DUPLICATE KEY UPDATE id='" + timeEntry.id + "', user_id='" +
                                    timeEntry.user_id + "', project_id='" + timeEntry.project_id + "', spent_at='" + timeEntry.spent_at + "', hours='" + timeEntry.hours + "'");

                            }
                        } else {
                            console.log("An error has occurred when updating time entries.")
                        }
                    })
                }
            }
        } else{
            console.log("An error has occurred when updating time entries.")
        }
    });
};