/**
 * Created by Rami Khadder on 7/24/2017.
 */
let RetrieveData = require('./RetrieveData');
let mysql = require('mysql');

let harvestSecret = require('./secrets/harvest_secret.json');
let sqlSecret = require('./secrets/sql_secret.json');
let tools = require('./tools');

let postheaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Basic ' + new Buffer(harvestSecret.user + ':' + harvestSecret.password).toString('base64')
};

//Harvester Database
let options = {
    host: 'productops.harvestapp.com',
    port: 443,
    path: '',
    method: 'GET',
    headers: postheaders
};

let connection = mysql.createConnection({
    host: sqlSecret.HOST,
    port: sqlSecret.PORT,
    user: sqlSecret.MYSQL_USER,
    password: sqlSecret.MYSQL_PASS,
    database: sqlSecret.DATABASE
});

Date.prototype.isLeapYear = function () {
    let year = this.getFullYear();
    if ((year & 3) != 0) return false;
    return ((year % 100) != 0 || (year % 400) == 0);
};

// Get Day of Year
Date.prototype.getDOY = function () {
    let dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let mn = this.getMonth();
    let dn = this.getDate();
    let dayOfYear = dayCount[mn] + dn;
    if (mn > 1 && this.isLeapYear()) dayOfYear++;
    return dayOfYear;
};

exports.updateClients = function () {
    return new Promise(
        (resolve, reject) => {
            options.path = '/clients';                                                      //change path
            RetrieveData.getJSON(options, function (statusCode, result) {                    //pull data from Harvest
                if (statusCode === 200) {                                                   //if pull was successful, continue
                    console.log("Updating clients: done!");
                    for (let i = 0; i < result.length; i++) {
                        let client = result[i].client;
                        let name = client.name;

                        //if the name has apostrophes, we have to escape them by adding another single apostrophe next to it.
                        name.replace(/'/g, "''");

                        connection.query("INSERT INTO clients (id, name, active) VALUES ('" + client.id + "', '" + name + "', '" + +client.active + "') " +
                            "ON DUPLICATE KEY UPDATE name='" + name + "', active='" + +client.active + "'", function (err, result) {
                            resolve();
                        });
                    }
                } else {
                    console.log("An error has occurred when updating clients.")
                }
            })
        }
    );
};

exports.updateEmployees = function () {
    return new Promise(
        (resolve, reject) => {
            options.path = '/people';                                                       //change path
            RetrieveData.getJSON(options, function (statusCode, result) {                    //pull data from Harvest
                if (statusCode === 200) {                                                   //if pull was successful, continue
                    console.log("Updating employees: done!");
                    for (let i = 0; i < result.length; i++) {
                        let employee = result[i].user;

                        connection.query("INSERT INTO employees (id, email, created_at, is_admin, first_name, last_name, is_contractor, telephone, is_active, default_hourly_rate, department, updated_at, cost_rate, capacity) " +
                            "VALUES ('" + employee.id + "', '" + employee.email + "', '" + employee.created_at + "', '" + +employee.is_admin + "', '" + employee.first_name + "', '" + employee.last_name + "', '" +
                            +employee.is_contractor + "', '" + employee.telephone + "', '" + +employee.is_active + "', '" + employee.default_hourly_rate + "', '" + employee.department + "', '" + employee.updated_at + "', '" +
                            employee.cost_rate + "', '" + employee.weekly_capacity + "') ON DUPLICATE KEY UPDATE email='" + employee.email + "', created_at='" + employee.created_at + "', first_name='" + employee.first_name +
                            "', last_name='" + employee.last_name + "', is_contractor='" + +employee.is_contractor + "', telephone='" + employee.telephone + "', is_active='" + +employee.is_active + "', default_hourly_rate='" +
                            employee.default_hourly_rate + "', department='" + employee.department + "', updated_at='" + employee.updated_at + "', cost_rate='" + employee.cost_rate + "', capacity='" + employee.weekly_capacity + "'", function (err, result) {
                            resolve();
                        });
                    }
                } else {
                    console.log("An error has occurred when updating employees.")
                }
            });
        }
    );
};

exports.updateInvoices = function () {
    return new Promise(
        (resolve, reject) => {
            options.path = '/invoices';
            RetrieveData.getJSON(options, function (statusCode, result) {
                if (statusCode === 200) {
                    console.log("Updating invoices: done!");
                    for (let i = 0; i < result.length; i++) {
                        let invoice = result[i].invoices;

                        connection.query("INSERT INTO invoices (id, client_id, number, amount, state, created_date, issued_date, project_id, companies) VALUES ('" + invoice.id + "', '" + invoice.client_id + "', '" +
                            invoice.number + "', '" + invoice.amount + "', '" + invoice.state + "', '" + invoice.created_at + "', '" + invoice.issued_at + "', '" + invoice.project_id + "', '" + invoice.companies + "') " +
                            "ON DUPLICATE KEY UPDATE client_id='" + invoice.client_id + "', number='" + invoice.number + "', amount='" + invoice.amount + "', state='" + invoice.state + "', created_date='" + invoice.created_at
                            + "', issued_date='" + invoice.issued_at + "', project_id='" + invoice.project_id + "', companies='" + invoice.companies + "'", function (err, result) {
                            resolve();
                        });
                    }
                } else {
                    console.log("An error has occurred when updating invoices.")
                }
            });
        }
    );

};

exports.updateProjectsAndAssignments = function () {
    return new Promise(
        (resolve, reject) => {
            let yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            let updated_since = yesterday.toISOString().substring(0, 10) + '+00%3A00';

            options.path = '/projects'; // ?updated_since=' + updated_since;
            let projectIds = [];

            RetrieveData.getJSON(options, function (statusCode, result) {
                if (statusCode === 200) {
                    console.log("Updating projects: done!");
                    for (let i = 0; i < result.length; i++) {
                        let project = result[i].project;
                        if (project.active) {
                            projectIds.push(project.id);
                        }

                        if (project.notes != null) {
                            project.notes = project.notes.replace(/'/g, "''");
                        }

                        connection.query("INSERT INTO projects (id, client_id, active, name, code, cost_budget, billable, budget_by, state, created_date, last_checked_date, weekly_hour_budget, notes) VALUES ('" + project.id + "', '" + project.client_id + "', '" +
                            +project.active + "', '" + project.name + "', '" + project.code + "', '" + project.cost_budget + "', '" + +project.billable + "', '" + project.budget_by + "', '" + project.state + "', '" + project.created_at + "', '" +
                            project.hint_latest_record_at + "', '" + project.weekly_hour_budget + "', '" + project.notes + "') ON DUPLICATE KEY UPDATE client_id='" + project.client_id + "', active='" + +project.active + "', name='" + project.name + "', code='" + project.code +
                            "', cost_budget='" + project.cost_budget + "', billable='" + +project.billable + "', budget_by='" + project.budget_by + "', state='" + project.state + "', created_date='" + project.created_at + "', last_checked_date='" +
                            project.hint_latest_record_at + "', weekly_hour_budget='" + project.hourly_rate + "', notes='" + project.notes + "'");

                    }
                    updateAssignments(projectIds, resolve);
                } else {
                    console.log("An error has occurred when updating projects.")
                }
            })
        }
    );
};

function updateAssignments(projectIds, resolve) {
    let j = 0;
    let intervalID = setInterval(function () {
        if (j < projectIds.length) {
            options.path = '/projects/' + projectIds[j] + '/user_assignments';
            updateAssignment();
            j++;
        } else {
            console.log("Updating assignments: done!");
            resolve();
            clearInterval(intervalID);
        }
    }, 16000);
    /*
     for (let j = 0; j < projectIds.length; j++){
     options.path = '/projects/' + projectIds[j] + '/user_assignments';
     updateAssignment();
     //setTimeout(updateAssignment, 16000);
     }
     console.log("Updating assignments: done!");
     */
}

exports.updateTimeEntries = function () {
    let d = new Date();
    d.setDate(d.getDate() - 22);
    let dayOfTheYearYesterday = d.getDOY();

    options.path = '/people';
    RetrieveData.getJSON(options, function (statusCode, result) {
        if (statusCode === 200) {
            for (let i = 0; i < result.length; i++) {
                let employee = result[i].user;
                if (employee.is_active) {
                    options.path = '/daily/' + dayOfTheYearYesterday + '/' + d.getFullYear() + "?of_user=" + employee.id;
                    //options.path = '/daily?of_user=' + employee.id;
                    RetrieveData.getJSON(options, function (statusCode, result) {
                        if (statusCode === 200) {
                            for (let i = 0; i < result.day_entries.length; i++) {
                                let timeEntry = result.day_entries[i];

                                if (timeEntry.notes != null) {
                                    timeEntry.notes = timeEntry.notes.replace(/'/g, "''");
                                }

                                connection.query("INSERT INTO timeEntries (id, user_id, project_id, task_id, notes, spent_at, hours) VALUES ('" + timeEntry.id + "', '" + timeEntry.user_id + "', '" +
                                    timeEntry.project_id + "', '" + timeEntry.task_id + "', '" + timeEntry.notes + "', '" + timeEntry.spent_at + "', '" + timeEntry.hours + "') " +
                                    "ON DUPLICATE KEY UPDATE id='" + timeEntry.id + "', user_id='" + timeEntry.user_id + "', project_id='" + timeEntry.project_id + "', task_id='" +
                                    timeEntry.task_id + "', notes='" + timeEntry.notes + "', spent_at='" + timeEntry.spent_at + "', hours='" + timeEntry.hours + "'");

                            }
                        } else {
                            console.log("An error has occurred when updating time entries.");
                            console.log(statusCode + ' ' + JSON.stringify(result));
                        }
                    })
                }
            }
            console.log("Updating time entries for day " + dayOfTheYearYesterday + ": done!");
        } else {
            console.log("An error has occurred when updating time entries (getting employees).")
        }
    });
};

function updateTimeEntries(i) {
    let intervalID = setInterval(function () {
        if(i <= 7) {
            i++;
            console.log('After function is called and increment, i is ' +  i);
            module.exports.updateTimeEntries(i);
        }
        else {
            console.log("Updating timeEntries: done!");
            clearInterval(intervalID);
        }
    }, 31000);
}

exports.updateTasks = function () {
    return new Promise(
        (resolve, reject) => {
            options.path = '/tasks?updated_since=2008-01-01';
            RetrieveData.getJSON(options, function (statusCode, result) {
                if (statusCode === 200) {
                    console.log("Updating tasks: done!");
                    for (let i = 0; i < result.length; i++) {
                        let task = result[i].task;

                        connection.query("INSERT INTO tasks (id, name, billable_by_default, created_at, updated_at, is_default, default_hourly_rate, deactivated) VALUES ('" + task.id + "', '" + task.name + "', '" +
                            +task.billable_by_default + "', '" + task.created_at + "', '" + task.updated_at + "', '" + +task.is_default + "', '" + task.default_hourly_rate + "', '" + +task.deactivated +
                            "') ON DUPLICATE KEY UPDATE name='" + task.name + "', billable_by_default='" + +task.billable_by_default + "', created_at='" + task.created_at + "', updated_at='" + task.updated_at +
                            "', is_default='" + +task.is_default + "', default_hourly_rate='" + task.default_hourly_rate + "', deactivated='" + +task.deactivated + "'", function (err, result) {
                            resolve();
                        });

                    }
                } else {
                    console.log("An error has occurred when updating projects.")
                }
            });
        }
    );
};

/*
 * Other Functions
 */

exports.initializeTimeEntries = function () {
    let year = 2008;
    let day = 1;
    let intervalID = setInterval(function () {
        if (year < 2018) {
            if (day < 365) {
                console.log("Day: " + day + ", Year: " + year);
                options.path = '/daily/' + day + '/' + year + "?slim=1";
                updateTimeEntries2(day, year);
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

function updateTimeEntries3(day, year) {
    RetrieveData.getJSON(options, function (statusCode, result) {
        if (statusCode === 200) {
            console.log(result);

            for (let i = 0; i < result.day_entries.length; i++) {
                let timeEntry = result.day_entries[i];

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

function updateTimeEntries2(day, year) {
    options.path = '/people';
    RetrieveData.getJSON(options, function (statusCode, result) {
        if (statusCode === 200) {
            for (let i = 0; i < result.length; i++) {
                let employee = result[i].user;
                if (!employee.is_active) {
                    options.path = '/daily/' + day + '/' + year + "?of_user=" + employee.id;
                    RetrieveData.getJSON(options, function (statusCode, result) {
                        if (statusCode === 200) {
                            for (let i = 0; i < result.day_entries.length; i++) {
                                let timeEntry = result.day_entries[i];

                                if (timeEntry.notes != null) {
                                    timeEntry.notes = timeEntry.notes.replace(/'/g, "''");
                                }

                                connection.query("INSERT INTO timeEntries (id, user_id, project_id, spent_at, hours) VALUES ('" + timeEntry.id + "', '" + timeEntry.user_id + "', '" +
                                    timeEntry.project_id + "', '" + timeEntry.spent_at + "', '" + timeEntry.hours + "') " + "ON DUPLICATE KEY UPDATE id='" + timeEntry.id + "', user_id='" +
                                    timeEntry.user_id + "', project_id='" + timeEntry.project_id + "', spent_at='" + timeEntry.spent_at + "', hours='" + timeEntry.hours + "'");

                            }
                        } else {
                            console.log("An error has occurred when updating time entries. " + JSON.stringify(result));
                        }
                    })
                }
            }
            console.log("Updating time entries...");
        } else {
            console.log("An error has occurred when updating time entries.. " + JSON.stringify(result));
        }
    });
}

function updateAssignment() {
    RetrieveData.getJSON(options, function (statusCode, result) {
        if (statusCode === 200) {
            for (let i = 0; i < result.length; i++) {
                let assignment = result[i].user_assignment;

                connection.query("INSERT INTO assignments (id, user_id, project_id, is_project_manager, deactivated, hourly_rate, budget, created_at, updated_at, estimate, expected_weekly_hours) VALUES ('" + assignment.id + "', '" +
                    assignment.user_id + "', '" + assignment.project_id + "', '" + +assignment.is_project_manager + "', '" + +assignment.deactivated + "', '" + assignment.hourly_rate + "', '" + assignment.budget + "', '" +
                    assignment.created_at + "', '" + assignment.updated_at + "', '" + assignment.estimate + "', '" + assignment.expected_weekly_hours + "') ON DUPLICATE KEY UPDATE user_id='" + assignment.user_id +
                    "', project_id='" + assignment.project_id + "', is_project_manager='" + +assignment.is_project_manager + "', deactivated='" + +assignment.deactivated + "', hourly_rate='" + assignment.hourly_rate +
                    "', budget='" + assignment.budget + "', created_at='" + assignment.created_at + "', updated_at='" + assignment.updated_at + "', estimate='" + assignment.estimate + "', expected_weekly_hours='" + assignment.expected_weekly_hours + "'");

            }
            console.log("Updating assignment...")
        } else {
            console.log("An error has occurred when updating assignments: " + JSON.stringify(result));
        }
    })
}

exports.getTimeEntries = function (req, callback) {
    const id = (req.params.id !== undefined ? req.params.id : 't.id');
    const projectId = (req.query.projectid !== undefined ? req.query.projectid : 't.project_id');
    let userId = (req.query.userid !== undefined ? req.query.userid : 't.user_id');

    if (isNaN(userId) && userId !== 't.user_id') {
        userId = '\'' + userId + '\'';
    }

    connection.query('SELECT t.id, t.user_id, t.project_id, t.task_id, t.notes, t.spent_at, t.hours, ti.cost, e.capacity FROM timeEntries t ' +
        'LEFT OUTER JOIN employees e ON t.user_id = e.id ' +
        'LEFT OUTER JOIN tiers ti on ti.id = e.tier_id ' +
        'WHERE t.id = ' + id + ' ' +
        'AND t.project_id = ' + projectId + ' ' +
        'AND t.user_id = ' + userId + ' ' +
        'ORDER BY t.spent_at ASC', function (err, result) {
        callback(err, result);
    })
};