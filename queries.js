const Queries = module.exports = {}

Queries.CONTRACTS_FOR_STATE_UPDATE = `
    SELECT C.id, S.name as state, SUM(CASE WHEN (CI.due_date < NOW() AND CI.installment_paid < CI.installment) THEN CI.installment - CI.installment_paid ELSE 0 END) as amount_pending, COALESCE(SUM(CI.installment-CI.installment_paid), 0) AS total_payable
    FROM contract C
    LEFT JOIN user U ON U.id = C.recovery_officer_id
    LEFT JOIN contract_state CS ON CS.id = C.contract_state_id
    LEFT JOIN state S ON S.id = CS.state_id
    LEFT JOIN model M ON C.model_id = M.id
    LEFT JOIN (SELECT CI.id, CI.contract_id, CI.capital+CI.interest+CI.default_interest AS installment, CI.capital+CI.interest AS agreed_installment, SUM(COALESCE(CCP.amount, 0)+COALESCE(CIP.amount, 0)) AS installment_paid, COALESCE(SUM(CDIP.amount), 0) as defalut_interest_paid, CI.due_date
    FROM contract_installment CI
    LEFT JOIN (
        SELECT CDIP.contract_installment_id, COALESCE(SUM(amount), 0) as amount
        FROM contract_default_interest_payment CDIP
        GROUP BY CDIP.contract_installment_id
    ) CDIP ON CDIP.contract_installment_id = CI.id
    LEFT JOIN (
        SELECT CIP.contract_installment_id, COALESCE(SUM(amount), 0) as amount
        FROM contract_interest_payment CIP
        GROUP BY CIP.contract_installment_id
    ) CIP ON CIP.contract_installment_id = CI.id
    LEFT JOIN (
        SELECT CCP.contract_installment_id, COALESCE(SUM(amount), 0) as amount
        FROM contract_capital_payment CCP
        GROUP BY CCP.contract_installment_id
    ) CCP ON CCP.contract_installment_id = CI.id
    GROUP BY CI.id, CI.contract_id, CI.capital, CI.interest, CI.interest, CI.default_interest, CI.due_date
    ORDER BY CI.due_date ASC) CI ON CI.contract_id = C.id
    GROUP BY C.id
`

Queries.GET_CONTRACT_STATE_ID = `
    SELECT C.contract_state_id
    FROM contract C
    WHERE C.id = ?
`

Queries.CREATE_CONTRACT_STATE = `
    INSERT INTO contract_state (contract_id, state_id)
    VALUES (?, ?)
`

Queries.CREATE_STATE_TRANSITION = `
    INSERT INTO contract_state_transition
    VALUES (?, ?, NULL, NOW())
`

Queries.UPDATE_CONTRACT_STATE = `
    UPDATE contract
    SET contract_state_id = ?
    WHERE id = ?
`