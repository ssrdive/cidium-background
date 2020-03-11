const MySql = require('./con')
const Queries = require('./queries')
const Database = module.exports = {}

Database.allContractsForStateUpdate = callback => {
    MySql.pool.getConnection((poolErr, conn) => {
        if (poolErr)
            return callback(poolErr, null);

        conn.query(Queries.CONTRACTS_FOR_STATE_UPDATE, (err, rows) => {
            if (err)
                return callback(err, null);
            return callback(err, rows);
        })
    });
}

Database.updateContractState = (contractID, stateID, callback) => {
    MySql.pool.getConnection((poolErr, conn) => {
        if (poolErr)
            return callback(poolErr, false);

        conn.beginTransaction(err => {
            if (err) {
                conn.release();
                return callback(err, false);
            }

            conn.query(Queries.CREATE_CONTRACT_STATE, [contractID, stateID], (err, results) => {
                if (err) {
                    return conn.rollback(() => {
                        conn.release();
                        callback(err, false);
                    })
                }

                const newStateID = results.insertId;

                conn.query(Queries.GET_CONTRACT_STATE_ID, contractID, (err, rows, fields) => {
                    if (err) {
                        return conn.rollback(() => {
                            conn.release();
                            callback(err, false);
                        })
                    }

                    const currentStateID = rows[0].contract_state_id;

                    conn.query(Queries.CREATE_STATE_TRANSITION, [currentStateID, newStateID], (err, results) => {
                        if (err) {
                            return conn.rollback(() => {
                                conn.release();
                                callback(err, false);
                            })
                        }

                        conn.query(Queries.UPDATE_CONTRACT_STATE, [newStateID, contractID], (err, results) => {
                            if (err) {
                                return conn.rollback(() => {
                                    conn.release();
                                    callback(err, false);
                                })
                            }

                            conn.commit(err => {
                                if (err) {
                                    return conn.rollback(() => {
                                        conn.release();
                                        callback(err, false);
                                    })
                                }
                                conn.release();
                                callback(err, true);
                            })
                        });
                    });

                })
            })
        })
    });
}