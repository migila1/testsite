/** Velden waarin regels zoeken (elk veld apart; geen match over veldgrenzen heen). */
export function transactionRuleFields(tx) {
  return [
    tx.description ?? '',
    tx.memo ?? '',
    tx.counterparty_name ?? '',
    tx.counterparty_iban ?? '',
  ]
}

/** Gecombineerde tekst voor zoekfilter op transacties. */
export function transactionMatchText(tx) {
  return transactionRuleFields(tx).join(' ').toLowerCase()
}
