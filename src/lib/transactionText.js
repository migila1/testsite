/** Tekst waarin regels zoeken (omschrijving, tegenpartij, mededelingen). */
export function transactionMatchText(tx) {
  return `${tx.description ?? ''} ${tx.counterparty_name ?? ''} ${tx.memo ?? ''}`.toLowerCase()
}
