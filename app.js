const async = require('async')
const schedule = require('node-schedule')
const Database = require('./database')

let financeScheduler = new schedule.RecurrenceRule()

financeScheduler.second = 0
financeScheduler.minute = 5
financeScheduler.hour = 0

const updateContractStates = schedule.scheduleJob(financeScheduler, () => {
    Database.allContractsForStateUpdate((err, contracts) => {
        if (err) {
            console.log('Error retrieving contracts');
            return callback(err);
        }
        async.eachSeries(contracts, (contract, callback) => {
            console.log(`Started processing ${contract.id}`);
            if(parseFloat(contract.amount_pending) === 0 && parseFloat(contract.total_payable) === 0 && contract.state === 'Active') {
                // Change contract state to Settled
                Database.updateContractState(contract.id, 11, (err, status) => {})
            } else if (parseFloat(contract.amount_pending) !== 0 && contract.state === 'Active') {
                // Change contract state to Overdue
                Database.updateContractState(contract.id, 6, (err, status) => {})
            } else if (parseFloat(contract.amount_pending) === 0 && contract.state === 'Overdue') {
                // Change contract state to Active
                Database.updateContractState(contract.id, 5, (err, status) => {})
            }
            console.log(`Finished processing ${contract.id}`);
            callback(null);
        })
    })
})
