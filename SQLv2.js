/**
 * Created by Rami Khadder on 9/29/2017.
 */
let RetrieveData = require('./RetrieveData');
let mysql = require('mysql');

let harvestSecret = require('./secrets/harvest_secret_v2.json');
let sqlSecret = require('./secrets/sql_secret.json');
let tools = require('./tools');

let postheaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer ' + harvestSecret.accessToken,
    'Harvest-Account-Id': harvestSecret.accountNumber,
    'User-Agent': 'MyApp ' + harvestSecret.email
};

//Harvester Database
let options = {
    host: 'api.harvestapp.com',
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

const projects = [];

Object.prototype.getByIndex = function (index) {
    return this[Object.keys(this)[index]];
};

function getDataFromHarvest(path, table, id) {
    return new Promise((resolve, reject) => {
        options.path = path;
        RetrieveData.getJSON(options, function (statusCode, result) {
            if (result.getByIndex(0).length > 0) {
                updateData(0, result, table, resolve, id);
            } else {
                resolve();
                const assignmentProject = (table === 'assignments' ? '[' + id + ']' : '');
                console.log(table + assignmentProject + ' done updating! 0 fields updated.');
            }
        })
    });
}

function getDataFromHarvestNoPromise(path, table, resolve, id) {
    options.path = path;
    RetrieveData.getJSON(options, function (statusCode, result) {
        if (result.getByIndex(0).length > 0) {
            updateData(0, result, table, resolve, id);
        } else {
            resolve();
            const assignmentProject = (table === 'assignments' ? '[' + id + ']' : '');
            console.log(table + assignmentProject + ' done updating! 0 fields updated.');
        }
    })
}

function updateData(count, data, table, resolve, id) {
    let dataJSON;
    switch (table) {
        case 'assignments':
            dataJSON = {
                id: data.user_assignments[count].id,
                user_id: data.user_assignments[count].user.id,
                project_id: id,
                is_project_manager: +data.user_assignments[count].is_project_manager,
                deactivated: +!data.user_assignments[count].is_active,
                hourly_rate: data.user_assignments[count].hourly_rate,
                budget: data.user_assignments[count].budget,
                created_at: data.user_assignments[count].created_at,
                updated_at: data.user_assignments[count].updated_at,
                estimate: data.user_assignments[count].estimate,
                expected_weekly_hours: data.user_assignments[count].expected_weekly_hours
            };
            break;
        case 'clients':
            dataJSON = {
                id: data.clients[count].id,
                name: data.clients[count].name,
                active: +data.clients[count].is_active
            };
            break;
        case 'employees':
            dataJSON = {
                id: data.users[count].id,
                email: data.users[count].email,
                created_at: data.users[count].created_at,
                is_admin: +data.users[count].is_admin,
                first_name: data.users[count].first_name,
                last_name: data.users[count].last_name,
                is_contractor: +data.users[count].is_contractor,
                telephone: data.users[count].telephone,
                is_active: +data.users[count].is_active,
                default_hourly_rate: data.users[count].default_hourly_rate,
                department: data.users[count].department,
                updated_at: data.users[count].updated_at,
                cost_rate: data.users[count].cost_rate,
                capacity: data.users[count].weekly_capacity
            };
            break;
        case 'invoices':
            dataJSON = {
                id: data.invoices[count].id,
                client_id: data.invoices[count].client.id,
                number: data.invoices[count].number,
                amount: data.invoices[count].amount,
                state: data.invoices[count].state,
                created_date: data.invoices[count].created_at,
                issued_date: data.invoices[count].issue_date,
                project_id: undefined,
                companies: data.invoices[count].companies
            };
            break;
        case 'projects':
            if (data.projects[count].is_active) {
                projects.push(data.projects[count]);
            }
            dataJSON = {
                id: data.projects[count].id,
                client_id: data.projects[count].client.id,
                active: +data.projects[count].is_active,
                name: data.projects[count].name,
                code: data.projects[count].code,
                cost_budget: data.projects[count].cost_budget,
                billable: +data.projects[count].is_billable,
                budget_by: data.projects[count].budget_by,
                state: data.projects[count].state,
                created_date: data.projects[count].created_at,
                last_checked_date: data.projects[count].updated_at,
                weekly_hour_budget: data.projects[count].budget,
                notes: data.projects[count].notes
            };
            break;
        case 'tasks':
            dataJSON = {
                id: data.tasks[count].id,
                name: data.tasks[count].name,
                billable_by_default: +data.tasks[count].billable_by_default,
                created_at: data.tasks[count].created_at,
                updated_at: data.tasks[count].updated_at,
                is_default: data.tasks[count].is_default,
                default_hourly_rate: data.tasks[count].default_hourly_rate,
                deactivated: +!data.tasks[count].is_active
            };
            break;
        case 'timeEntries':
            dataJSON = {
                id: data.time_entries[count].id,
                user_id: data.time_entries[count].user.id,
                project_id: data.time_entries[count].project.id,
                task_id: data.time_entries[count].task.id,
                notes: data.time_entries[count].notes,
                spent_at: data.time_entries[count].spent_date,
                hours: data.time_entries[count].hours
            };
            break;
    }

    connection.query('INSERT INTO ' + table + ' SET ? ON DUPLICATE KEY UPDATE ?', [dataJSON, dataJSON], function (err, result) {
        count++;
        const assignmentProject = (table === 'assignments' ? '[' + id + ']' : '');
        if (count < data.getByIndex(0).length) {
            updateData(count, data, table, resolve, id);
        } else if (data.links.next !== null) {
            console.log('updating ' + table + assignmentProject + '... ' + count + ' fields updated.');
            getDataFromHarvestNoPromise(data.links.next, table, resolve, id);
        } else {
            console.log(table + assignmentProject + ' done updating! ' + count + ' fields updated.');
            resolve();
        }
    })
}

const promises = [];

function updateAssignments() {
    return new Promise(
        (resolve, reject) => {
            for (const project of projects) {
                promises.push(getDataFromHarvest('/v2/projects/' + project.id + '/user_assignments', 'assignments', project.id));
            }
            Promise.all(promises);
            resolve();
        }
    )
}

let d = new Date();
d.setDate(d.getDate() - 1);
const date = d.toISOString().split('.')[0] + "Z";
// getTimesFromHarvest('/v2/time_entries?updated_since=' + date);
// getClientsFromHarvest('/v2/clients?updated_since=' + date);

getDataFromHarvest('/v2/users?updated_since=' + date, 'employees')
.then(getDataFromHarvest.bind(null, '/v2/projects', 'projects'))
    .then(getDataFromHarvest.bind(null, '/v2/clients?updated_since=' + date, 'clients'))
    .then(getDataFromHarvest.bind(null, '/v2/invoices?updated_since=' + date, 'invoices'))
    .then(getDataFromHarvest.bind(null, '/v2/tasks?updated_since=' + date, 'tasks'))
    .then(getDataFromHarvest.bind(null, '/v2/time_entries?updated_since=' + date, 'timeEntries'))
    .then(updateAssignments);


// function getTimesFromHarvest(path) {
//     options.path = path;
//     RetrieveData.getJSON(options, function (statusCode, result) {
//         // console.log(result);
//         // console.log(Object.keys(result));
//         console.log(result.getByIndex(0));
//         if (result.time_entries.length > 0) {
//             // updateTimeEntries(0, result);
//         } else {
//             console.log('Done!')
//         }
//     })
// }
//
// function updateTimeEntries(count, data) {
//     const timeEntry = {
//         id: data.time_entries[count].id,
//         user_id: data.time_entries[count].user.id,
//         project_id: data.time_entries[count].project.id,
//         task_id: data.time_entries[count].task.id,
//         notes: data.time_entries[count].notes,
//         spent_at: data.time_entries[count].spent_date,
//         hours: data.time_entries[count].hours
//     };
//     connection.query('INSERT INTO timeEntries SET ? ON DUPLICATE KEY UPDATE ?', [timeEntry, timeEntry], function (err, result) {
//         count++;
//         if (count < data.time_entries.length) {
//             updateTimeEntries(count, data);
//         } else if (data.links.next !== null) {
//             getTimesFromHarvest(data.links.next);
//         } else {
//             console.log('Done!');
//         }
//     })
// }
//
// function getClientsFromHarvest(path) {
//     options.path = path;
//     RetrieveData.getJSON(options, function (statusCode, result) {
//         if (result.clients.length > 0) {
//             updateClients(0, result);
//         } else {
//             console.log('Done!')
//         }
//     })
// }
//
// function updateClients(count, data) {
//     console.log(count);
//     const client = {
//         id: data.clients[count].id,
//         name: data.clients[count].name,
//         active: +data.clients[count].is_active
//     };
//     connection.query('INSERT INTO clients SET ? ON DUPLICATE KEY UPDATE ?', [client, client], function (err, result) {
//         count++;
//         if (count < data.clients.length) {
//             updateClients(count, data);
//         } else if (data.links.next !== null) {
//             getClientsFromHarvest(data.links.next);
//         } else {
//             console.log('Done!');
//         }
//     })
// }