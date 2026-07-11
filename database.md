# Database Schema — SFA

PostgreSQL + Prisma.

## Relasi

```
users ──< leads (assigned_to, created_by)
users ──< activities (user_id)
users ──< targets (user_id)
users ──< orders (salesperson_id)
leads ──< opportunities (lead_id)
leads ──< activities (lead_id)
opportunities ──< activities (opportunity_id)
opportunities ──< orders (opportunity_id)
accounts ──< opportunities (account_id)
accounts ──< contacts (account_id)
accounts ──< orders (account_id)
contacts ──< activities (contact_id)
orders ──< order_items (order_id)
```

## Tabel

### users
| Kolom | Tipe |
|---|---|
| id | UUID PK |
| name | VARCHAR |
| email | VARCHAR UNIQUE |
| password | VARCHAR |
| role | ENUM: `sales_rep`, `sales_manager` |
| created_at | TIMESTAMP |

### leads
| Kolom | Tipe | Catatan |
|---|---|---|
| id | UUID PK | |
| name | VARCHAR | |
| email | VARCHAR | |
| phone | VARCHAR | |
| interest | TEXT | |
| status | ENUM | `new`, `contacted`, `qualified`, `converted`, `dead` |
| source | ENUM | `web_form`, `manual`, `referral`, `import` |
| created_by | UUID FK → users | NULL jika dari form publik |
| assigned_to | UUID FK → users | |
| notes | TEXT | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### opportunities
| Kolom | Tipe | Catatan |
|---|---|---|
| id | UUID PK | |
| lead_id | UUID FK → leads | |
| account_id | UUID FK → accounts | |
| title | VARCHAR | |
| stage | ENUM | `prospecting`, `qualification`, `proposal`, `negotiation`, `closed_won`, `closed_lost` |
| amount | DECIMAL | |
| probability | INTEGER | 0–100 |
| expected_close | DATE | |
| loss_reason | TEXT | Diisi jika closed_lost |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### accounts
| Kolom | Tipe |
|---|---|
| id | UUID PK |
| company_name | VARCHAR |
| industry | VARCHAR |
| website | VARCHAR |
| address | TEXT |
| created_at | TIMESTAMP |

### contacts
| Kolom | Tipe |
|---|---|
| id | UUID PK |
| account_id | UUID FK → accounts |
| name | VARCHAR |
| email | VARCHAR |
| phone | VARCHAR |
| position | VARCHAR |
| created_at | TIMESTAMP |

### activities
Append-only. Minimal satu FK harus terisi.

| Kolom | Tipe | Catatan |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users | Wajib |
| lead_id | UUID FK → leads | Nullable |
| opportunity_id | UUID FK → opportunities | Nullable |
| contact_id | UUID FK → contacts | Nullable |
| account_id | UUID FK → accounts | Nullable |
| type | ENUM | `call`, `email`, `meeting`, `note`, `status_change` |
| notes | TEXT | |
| meta | JSONB | Contoh: `{ from: 'new', to: 'qualified' }` |
| activity_date | TIMESTAMP | |
| created_at | TIMESTAMP | |

### orders
| Kolom | Tipe | Catatan |
|---|---|---|
| id | UUID PK | |
| order_number | VARCHAR UNIQUE | |
| account_id | UUID FK → accounts | |
| opportunity_id | UUID FK → opportunities | Nullable |
| salesperson_id | UUID FK → users | |
| status | ENUM | `draft`, `submitted`, `approved`, `processing`, `delivered`, `cancelled` |
| order_date | DATE | |
| delivery_date | DATE | Nullable |
| total_amount | DECIMAL | |
| notes | TEXT | Nullable |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### order_items
| Kolom | Tipe | Catatan |
|---|---|---|
| id | UUID PK | |
| order_id | UUID FK → orders | |
| product_name | VARCHAR | |
| quantity | INTEGER | |
| unit_price | DECIMAL | |
| discount | DECIMAL | |
| subtotal | DECIMAL | |
| created_at | TIMESTAMP | |

### targets
| Kolom | Tipe | Catatan |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users | |
| period_type | ENUM | `monthly`, `quarterly`, `yearly` |
| period_start | DATE | |
| period_end | DATE | |
| target_amount | DECIMAL | Target omzet |
| target_visits | INTEGER | Target kunjungan |
| target_new_leads | INTEGER | Target prospek baru |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |