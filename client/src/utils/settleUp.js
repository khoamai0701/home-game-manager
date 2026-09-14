/**
 * Greedy debt simplification: repeatedly match the largest creditor with the
 * largest debtor until every balance is settled. This isn't guaranteed to be
 * the mathematically minimal number of transfers in every case, but it's
 * close in practice and simple to reason about — an actual minimum-transfer
 * solver is exponential in the number of players, which is overkill here.
 *
 * `balances`: [{ name, amount }] where a positive amount means that person is
 * owed money overall, negative means they owe. Returns [{ from, to, amount }].
 */
export function computeSettlements(balances) {
    const EPSILON = 0.005

    const creditors = balances
        .filter(b => b.amount > EPSILON)
        .map(b => ({ ...b }))
        .sort((a, b) => b.amount - a.amount)

    const debtors = balances
        .filter(b => b.amount < -EPSILON)
        .map(b => ({ ...b, amount: -b.amount }))
        .sort((a, b) => b.amount - a.amount)

    const transfers = []
    let i = 0
    let j = 0

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i]
        const creditor = creditors[j]
        const amount = Math.min(debtor.amount, creditor.amount)

        if (amount > EPSILON) {
            transfers.push({ from: debtor.name, to: creditor.name, amount })
        }

        debtor.amount -= amount
        creditor.amount -= amount

        if (debtor.amount <= EPSILON) i++
        if (creditor.amount <= EPSILON) j++
    }

    return transfers
}
