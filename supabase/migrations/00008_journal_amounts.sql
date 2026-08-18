-- Store PAS journal totals on the header so collections can post without GL account seeds.

alter table journal_entries
  add column if not exists debit numeric(14,2) not null default 0,
  add column if not exists credit numeric(14,2) not null default 0;

create index if not exists idx_journal_entries_operator_date
  on journal_entries (operator_id, entry_date desc);
