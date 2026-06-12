import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, Plus, RefreshCw, Send, Upload } from 'lucide-react';
import './styles.css';

const uploadItems = [
  {
    id: 'bank-statement',
    label: 'Bank Statement',
    button: 'Upload Bank Statement',
    accept:
      '.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/pdf',
    invalidMessage: 'Bank statement must be an Excel file or PDF.',
    validateFile: (file) => isSpreadsheet(file) || isPdf(file),
  },
  {
    id: 'sales-invoice',
    label: 'Sales Invoice',
    button: 'Upload Sales Invoice',
    accept: 'application/pdf,image/*',
    invalidMessage: 'Sales invoice must be a PDF or image.',
    validateFile: (file) => isPdf(file) || isImage(file),
  },
  {
    id: 'purchase-invoice',
    label: 'Purchase Invoice',
    button: 'Upload Purchase Invoice',
    accept: 'application/pdf,image/*',
    invalidMessage: 'Purchase invoice must be a PDF or image.',
    validateFile: (file) => isPdf(file) || isImage(file),
  },
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const parsedVoucherJson = {
  document_type: 'Tax Invoice',
  invoice_no: 'ASPL/26-27/E0227',
  invoice_date: '28-Apr-26',
  seller: {
    name: 'ANJANISUTA STEELS PRIVATE LIMITED',
    gstin: '20AATCA2149Q1ZA',
    pan: 'AATCA2149Q',
  },
  buyer: {
    name: 'SHUBHAM STEEL AND FERTILIZERS',
    gstin: '08ABFPK5275M1Z6',
    pan: '',
  },
  irn: 'e6d8a962574adf1cd9f8ea952d1dc171c7815b8581569603-30a2fe9f79cd608e',
  ack_no: '142620163545041',
  ack_date: '28-Apr-26',
  transportation: {
    eway_bill_no: '4417 1817 4560',
    vehicle_no: 'RJ42GA5078',
    transporter_name: 'JAI SHRI SHYAM ROADWAYS',
    transporter_gstin: '20MBVPK0170K1ZC',
    lr_no: '184',
    from_location: 'Koderma',
    to_location: 'Jaipur',
  },
  items: [
    {
      description: 'M.S. Billet',
      hsn_code: '72071920',
      quantity: '43.960 MTs',
      rate: 41800,
      taxable_amount: 1837528,
      lines: [
        {
          line_type: 'igst',
          description: 'IGST Output 18%',
          rate: 18,
          amount: 330755.04,
        },
        {
          line_type: 'round_off',
          description: 'R/off',
          rate: '',
          amount: -0.04,
        },
      ],
      line_total: 2168283,
    },
  ],
  invoice_lines: [
    {
      line_type: 'freight',
      description: 'Freight',
      rate: '',
      amount: 96712,
    },
  ],
  totals: {
    taxable_amount: 1837528,
    cgst_amount: 0,
    sgst_amount: 0,
    igst_amount: 330755.04,
    cess_amount: 0,
    total_tax_amount: 330755.04,
    round_off_amount: -0.04,
    grand_total: 2168283,
  },
};

const parsedBankStatementJson = {
  bank: 'ICICI Bank',
  account_number: '337705001075',
  statement_period: 'From 01/05/2026 To 01/06/2026',
  transactions: [
    {
      value_date: '2026-05-01',
      txn_date: '2026-05-01 07:51:08 AM',
      description: 'RTGS/ICICR42026050100502895/HDFC0001968/BHAGWATITRANSPORT CO',
      mode: 'RTGS',
      direction: 'debit',
      amount: 450000,
      reference: 'ICICR42026050100502895',
      party_name: 'BHAGWATITRANSPORT CO',
      party_identifier: null,
      ifsc: 'HDFC0001968',
      balance: 826288.1,
    },
    {
      value_date: '2026-05-01',
      txn_date: '2026-05-01 07:00:05 PM',
      description: 'RTGS-UTIBR72026050100131060-ULTRA TECH CEMENT LTD-084010200013129-UTIB0000084',
      mode: 'RTGS',
      direction: 'credit',
      amount: 412037.16,
      reference: 'UTIBR72026050100131060',
      party_name: 'ULTRA TECH CEMENT LTD',
      party_identifier: '084010200013129',
      ifsc: 'UTIB0000084',
      balance: 1238325.26,
    },
    {
      value_date: '2026-05-01',
      txn_date: '2026-05-01 10:19:58 PM',
      description: 'UPI/109722460725/HR55AT7757/bachhu.singh4@i//ICI669ab0024aaa4b7387bc8bb48a82d08c/',
      mode: 'UPI',
      direction: 'debit',
      amount: 4200,
      reference: '109722460725',
      party_name: null,
      party_identifier: 'bachhu.singh4@i',
      ifsc: null,
      balance: 1234125.26,
    },
  ],
};

function isPdf(file) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

function isImage(file) {
  const fileName = file.name.toLowerCase();
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tif', '.tiff'];

  return file.type.startsWith('image/') || imageExtensions.some((extension) => fileName.endsWith(extension));
}

function isSpreadsheet(file) {
  const fileName = file.name.toLowerCase();
  const spreadsheetTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  return (
    fileName.endsWith('.xls') ||
    fileName.endsWith('.xlsx') ||
    spreadsheetTypes.includes(file.type)
  );
}

function cloneVoucherData(data) {
  return JSON.parse(JSON.stringify(data));
}

function normalizeLooseDate(value) {
  if (!value) {
    return value;
  }

  const text = String(value).trim();
  const match = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/);

  if (!match) {
    return value;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);

  if (!year || month < 1 || month > 12 || day < 1) {
    return value;
  }

  return [
    '01',
    String(month).padStart(2, '0'),
    String(year),
  ].join('-');
}

function normalizeTallyPayloadDate(fileId, data) {
  if (fileId === 'bank-statement') {
    return data;
  }

  const normalized = cloneVoucherData(data);
  normalized.invoice_date = normalizeLooseDate(normalized.invoice_date);
  normalized.ack_date = normalizeLooseDate(normalized.ack_date);
  return normalized;
}

function emptyParty() {
  return {
    name: '',
    gstin: '',
    pan: '',
  };
}

function emptyTransportation() {
  return {
    eway_bill_no: '',
    vehicle_no: '',
    transporter_name: '',
    transporter_gstin: '',
    lr_no: '',
    from_location: '',
    to_location: '',
  };
}

function normalizeInvoiceResult(result) {
  const normalized = cloneVoucherData(result || {});

  normalized.seller = { ...emptyParty(), ...(normalized.seller || {}) };
  normalized.buyer = { ...emptyParty(), ...(normalized.buyer || {}) };
  normalized.transportation = {
    ...emptyTransportation(),
    ...(normalized.transportation || {}),
  };
  normalized.items = (normalized.items || []).map((item) => ({
    description: '',
    hsn_code: '',
    quantity: '',
    rate: '',
    taxable_amount: '',
    line_total: '',
    ...item,
    lines: item.lines || [],
  }));
  normalized.invoice_lines = normalized.invoice_lines || normalized.additional_items || [];
  normalized.totals = {
    taxable_amount: '',
    cgst_amount: '',
    sgst_amount: '',
    igst_amount: '',
    cess_amount: '',
    total_tax_amount: '',
    other_charges: '',
    round_off_amount: '',
    grand_total: '',
    ...(normalized.totals || {}),
  };

  return normalized;
}

function normalizeBankStatementResult(result) {
  const transactions = (result?.transactions || []).map((transaction) => ({
    value_date: transaction.value_date ?? '',
    txn_date: transaction.txn_date ?? '',
    description: transaction.description ?? '',
    mode: transaction.mode ?? transaction.payment_mode ?? '',
    direction: transaction.direction ?? '',
    amount: transaction.amount ?? '',
    reference: transaction.reference ?? transaction.transaction_number ?? '',
    party_name: transaction.party_name ?? transaction.party?.name ?? '',
    party_identifier: transaction.party_identifier ?? transaction.party?.identifier ?? '',
    ifsc: transaction.ifsc ?? '',
    balance: transaction.balance ?? '',
    account_name: transaction.account_name ?? transaction.account ?? transaction.party_ledger ?? '',
  }));
  const partyNamesByIdentifier = buildPartyNamesByIdentifier(transactions);

  return {
    bank: result?.bank ?? '',
    bank_account_name: result?.bank_account_name ?? result?.bank_ledger ?? '',
    account_number: result?.account_number ?? '',
    statement_period: result?.statement_period ?? '',
    transactions: transactions.map((transaction) => ({
      ...transaction,
      party_name:
        partyNamesByIdentifier.get(String(transaction.party_identifier).trim()) ||
        transaction.party_name,
    })),
  };
}

function buildPartyNamesByIdentifier(transactions) {
  return transactions.reduce((partyNames, transaction) => {
    const partyIdentifier = String(transaction.party_identifier ?? '').trim();
    const partyName = String(transaction.party_name ?? '').trim();
    if (partyIdentifier && partyName && !partyNames.has(partyIdentifier)) {
      partyNames.set(partyIdentifier, partyName);
    }
    return partyNames;
  }, new Map());
}

function getBackendDocumentType(fileId) {
  return fileId === 'bank-statement' ? 'bank_statement' : 'invoice';
}

function normalizeParsedResult(fileId, result) {
  if (fileId === 'bank-statement') {
    return normalizeBankStatementResult(result);
  }

  return normalizeInvoiceResult(result);
}

function formatLabel(key) {
  return key
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function displayValue(value) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  return String(value);
}

function accountKey(value) {
  return String(value ?? '').trim().toLowerCase();
}

function findAccount(accounts, accountName) {
  const key = accountKey(accountName);
  return accounts.find((account) => accountKey(account.name) === key);
}

function transactionPartyMatchKeys(transaction) {
  return [
    accountKey(transaction.party_identifier),
    accountKey(transaction.party_name),
  ].filter(Boolean);
}

function transactionsShareParty(firstTransaction, secondTransaction) {
  const firstKeys = new Set(transactionPartyMatchKeys(firstTransaction));
  if (firstKeys.size === 0) {
    return false;
  }

  return transactionPartyMatchKeys(secondTransaction).some((key) => firstKeys.has(key));
}

function selectedAccountDetail(transaction, accounts) {
  const account = findAccount(accounts, transaction.account_name);
  if (account?.parent) {
    return `${account.name} · ${account.parent}`;
  }

  return transaction.account_name || '';
}

function missingBankAccountSelections(statement) {
  return (statement?.transactions || [])
    .map((transaction, index) => ({ transaction, index }))
    .filter(({ transaction }) => !String(transaction.account_name || '').trim());
}

function invalidBankAccountSelections(statement, accounts) {
  if (!accounts.length) {
    return [];
  }

  return (statement?.transactions || [])
    .map((transaction, index) => ({ transaction, index }))
    .filter(
      ({ transaction }) =>
        String(transaction.account_name || '').trim() &&
        !findAccount(accounts, transaction.account_name),
    );
}

function missingStatementBankAccount(statement) {
  return !String(statement?.bank_account_name || '').trim();
}

function invalidStatementBankAccount(statement, bankAccounts) {
  if (!bankAccounts.length || missingStatementBankAccount(statement)) {
    return false;
  }

  return !findAccount(bankAccounts, statement.bank_account_name);
}

function numberInputValue(value) {
  return value === null || value === undefined ? '' : value;
}

function parsePositiveInteger(value) {
  const text = String(value ?? '').trim();
  if (!text) {
    return null;
  }

  const number = Number(text);
  if (!Number.isInteger(number) || number < 1) {
    return null;
  }

  return number;
}

function renderFieldGrid(fields) {
  return `
    <div class="field-grid">
      ${fields
        .map(
          ([label, value]) => `
            <div class="field">
              <span>${escapeHtml(label)}</span>
              <strong>${escapeHtml(displayValue(value))}</strong>
            </div>
          `,
        )
        .join('')}
    </div>
  `;
}

function renderObjectFields(object = {}) {
  return renderFieldGrid(Object.entries(object).map(([key, value]) => [formatLabel(key), value]));
}

function renderInvoicePrintHtml(voucher) {
  const itemRows = (voucher.items || [])
    .map(
      (item, itemIndex) => `
        <tr>
          <td>Item ${itemIndex + 1}</td>
          <td>Product</td>
          <td>${escapeHtml(displayValue(item.description))}</td>
          <td>${escapeHtml(displayValue(item.hsn_code))}</td>
          <td>${escapeHtml(displayValue(item.quantity))}</td>
          <td>${escapeHtml(displayValue(item.rate))}</td>
          <td>${escapeHtml(displayValue(item.taxable_amount))}</td>
          <td>${escapeHtml(displayValue(item.line_total))}</td>
        </tr>
        ${(item.lines || [])
          .map(
            (line) => `
              <tr>
                <td>Item Line</td>
                <td>${escapeHtml(displayValue(line.line_type))}</td>
                <td>${escapeHtml(displayValue(line.description))}</td>
                <td></td>
                <td></td>
                <td>${escapeHtml(displayValue(line.rate))}</td>
                <td></td>
                <td>${escapeHtml(displayValue(line.amount))}</td>
              </tr>
            `,
          )
          .join('')}
      `,
    )
    .join('');

  const invoiceLineRows = (voucher.invoice_lines || [])
    .map(
      (line) => `
        <tr>
          <td>Invoice Line</td>
          <td>${escapeHtml(displayValue(line.line_type))}</td>
          <td>${escapeHtml(displayValue(line.description))}</td>
          <td></td>
          <td></td>
          <td>${escapeHtml(displayValue(line.rate))}</td>
          <td></td>
          <td>${escapeHtml(displayValue(line.amount))}</td>
        </tr>
      `,
    )
    .join('');

  return `
    <section>
      <h2>Invoice</h2>
      ${renderFieldGrid([
        ['Document Type', voucher.document_type],
        ['Invoice No', voucher.invoice_no],
        ['Invoice Date', voucher.invoice_date],
        ['Ack No', voucher.ack_no],
        ['Ack Date', voucher.ack_date],
        ['IRN', voucher.irn],
      ])}
    </section>

    <section>
      <h2>Seller</h2>
      ${renderObjectFields(voucher.seller)}
    </section>

    <section>
      <h2>Buyer</h2>
      ${renderObjectFields(voucher.buyer)}
    </section>

    <section>
      <h2>Transportation</h2>
      ${renderObjectFields(voucher.transportation)}
    </section>

    <section>
      <h2>Product Item Summary</h2>
      <table>
        <thead>
          <tr>
            <th>Section</th>
            <th>Line Type</th>
            <th>Description</th>
            <th>HSN</th>
            <th>Quantity</th>
            <th>Rate</th>
            <th>Taxable</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
          ${invoiceLineRows}
          <tr class="total-row">
            <td colspan="7">Grand Total</td>
            <td>${escapeHtml(displayValue(voucher.totals?.grand_total))}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section>
      <h2>Totals</h2>
      ${renderObjectFields(voucher.totals)}
    </section>
  `;
}

function renderBankStatementPrintHtml(statement, accounts = []) {
  const transactions = statement.transactions || [];
  const transactionRows = transactions
    .map(
      (transaction, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(displayValue(transaction.txn_date))}</td>
          <td>${escapeHtml(displayValue(transaction.value_date))}</td>
          <td>${escapeHtml(displayValue(transaction.mode))}</td>
          <td>${escapeHtml(displayValue(transaction.direction))}</td>
          <td>${escapeHtml(displayValue(transaction.amount))}</td>
          <td>${escapeHtml(displayValue(transaction.reference))}</td>
          <td>${escapeHtml(displayValue(transaction.party_name))}</td>
          <td>${escapeHtml(displayValue(selectedAccountDetail(transaction, accounts)))}</td>
          <td>${escapeHtml(displayValue(transaction.balance))}</td>
        </tr>
      `,
    )
    .join('');

  return `
    <section>
      <h2>Statement</h2>
      ${renderFieldGrid([
        ['Bank', statement.bank],
        ['Selected Bank Account', statement.bank_account_name],
        ['Account Number', statement.account_number],
        ['Statement Period', statement.statement_period],
        ['Transactions', transactions.length],
      ])}
    </section>

    <section>
      <h2>Transaction Vouchers</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Txn Date</th>
            <th>Value Date</th>
            <th>Mode</th>
            <th>Direction</th>
            <th>Amount</th>
            <th>Reference</th>
            <th>Party</th>
            <th>Selected Account</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>${transactionRows}</tbody>
      </table>
    </section>
  `;
}

function createOutputPdf(data, title, fileId, accounts = []) {
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    window.alert('Popup blocked. Allow popups to create the PDF.');
    return;
  }

  printWindow.opener = null;
  const outputHtml =
    fileId === 'bank-statement' ? renderBankStatementPrintHtml(data, accounts) : renderInvoicePrintHtml(data);
  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          @page { margin: 18mm; }
          body {
            margin: 0;
            color: #111827;
            font-family: Inter, Arial, sans-serif;
            font-size: 11px;
            line-height: 1.35;
          }
          h1 {
            margin: 0 0 14px;
            font-size: 18px;
          }
          section {
            margin: 0 0 14px;
            border: 1px solid #dce3ee;
            break-inside: avoid;
          }
          h2 {
            margin: 0;
            padding: 8px 10px;
            border-bottom: 1px solid #dce3ee;
            background: #f4f7fb;
            font-size: 13px;
          }
          .field-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 0;
          }
          .field {
            min-height: 44px;
            padding: 8px 10px;
            border-right: 1px solid #e5eaf2;
            border-bottom: 1px solid #e5eaf2;
          }
          .field span {
            display: block;
            margin-bottom: 3px;
            color: #52637a;
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
          }
          .field strong {
            font-size: 11px;
            font-weight: 700;
            overflow-wrap: anywhere;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th,
          td {
            padding: 6px 7px;
            border: 1px solid #dce3ee;
            text-align: left;
            vertical-align: top;
            overflow-wrap: anywhere;
          }
          th {
            color: #52637a;
            background: #f8fafc;
            font-size: 9px;
            text-transform: uppercase;
          }
          .total-row td {
            background: #eef6ff;
            font-weight: 800;
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        ${outputHtml}
      </body>
    </html>
  `);
  printWindow.document.close();
  window.setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 100);
}

function VoucherField({ label, value, onChange, multiline = false }) {
  return (
    <label className="voucher-field">
      <span>{label}</span>
      {multiline ? (
        <textarea value={value ?? ''} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input value={value ?? ''} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function VoucherSection({ title, children, sectionRef }) {
  return (
    <section ref={sectionRef} className="voucher-section" aria-label={title}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function EditableVoucher({ voucher, onVoucherChange }) {
  const setField = (key, value) => {
    onVoucherChange((currentVoucher) => ({
      ...currentVoucher,
      [key]: value,
    }));
  };

  const setNestedField = (section, key, value) => {
    onVoucherChange((currentVoucher) => ({
      ...currentVoucher,
      [section]: {
        ...currentVoucher[section],
        [key]: value,
      },
    }));
  };

  const setItemField = (itemIndex, key, value) => {
    onVoucherChange((currentVoucher) => ({
      ...currentVoucher,
      items: currentVoucher.items.map((item, index) =>
        index === itemIndex ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const setItemLineField = (itemIndex, lineIndex, key, value) => {
    onVoucherChange((currentVoucher) => ({
      ...currentVoucher,
      items: currentVoucher.items.map((item, index) =>
        index === itemIndex
          ? {
              ...item,
              lines: item.lines.map((line, nestedIndex) =>
                nestedIndex === lineIndex ? { ...line, [key]: value } : line,
              ),
            }
          : item,
      ),
    }));
  };

  const setInvoiceLineField = (lineIndex, key, value) => {
    onVoucherChange((currentVoucher) => ({
      ...currentVoucher,
      invoice_lines: currentVoucher.invoice_lines.map((line, index) =>
        index === lineIndex ? { ...line, [key]: value } : line,
      ),
    }));
  };

  const setTotalField = (key, value) => {
    onVoucherChange((currentVoucher) => ({
      ...currentVoucher,
      totals: {
        ...currentVoucher.totals,
        [key]: value,
      },
    }));
  };

  return (
    <div className="voucher-editor">
      <VoucherSection title="Invoice">
        <div className="voucher-grid">
          <VoucherField
            label="Document Type"
            value={voucher.document_type}
            onChange={(value) => setField('document_type', value)}
          />
          <VoucherField
            label="Invoice No"
            value={voucher.invoice_no}
            onChange={(value) => setField('invoice_no', value)}
          />
          <VoucherField
            label="Invoice Date"
            value={voucher.invoice_date}
            onChange={(value) => setField('invoice_date', value)}
          />
          <VoucherField label="Ack No" value={voucher.ack_no} onChange={(value) => setField('ack_no', value)} />
          <VoucherField
            label="Ack Date"
            value={voucher.ack_date}
            onChange={(value) => setField('ack_date', value)}
          />
        </div>
        <VoucherField label="IRN" value={voucher.irn} onChange={(value) => setField('irn', value)} />
      </VoucherSection>

      <VoucherSection title="Seller">
        <div className="voucher-grid">
          {Object.entries(voucher.seller).map(([key, value]) => (
            <VoucherField
              key={key}
              label={formatLabel(key)}
              value={value}
              onChange={(nextValue) => setNestedField('seller', key, nextValue)}
            />
          ))}
        </div>
      </VoucherSection>

      <VoucherSection title="Buyer">
        <div className="voucher-grid">
          {Object.entries(voucher.buyer).map(([key, value]) => (
            <VoucherField
              key={key}
              label={formatLabel(key)}
              value={value}
              onChange={(nextValue) => setNestedField('buyer', key, nextValue)}
            />
          ))}
        </div>
      </VoucherSection>

      <VoucherSection title="Transportation">
        <div className="voucher-grid">
          {Object.entries(voucher.transportation).map(([key, value]) => (
            <VoucherField
              key={key}
              label={formatLabel(key)}
              value={value}
              onChange={(nextValue) => setNestedField('transportation', key, nextValue)}
            />
          ))}
        </div>
      </VoucherSection>

      <VoucherSection title="Product Item Summary">
        <div className="editable-table-wrap">
          <table className="editable-table product-summary-table">
            <thead>
              <tr>
                <th>Section</th>
                <th>Line Type</th>
                <th>Description</th>
                <th>HSN</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Taxable</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {voucher.items.map((item, itemIndex) => (
                <React.Fragment key={`item-summary-${itemIndex}`}>
                  <tr className="product-row">
                    <td>
                      <span className="row-label">Item {itemIndex + 1}</span>
                    </td>
                    <td>
                      <input value="product" readOnly />
                    </td>
                    {['description', 'hsn_code', 'quantity', 'rate', 'taxable_amount', 'line_total'].map((key) => (
                      <td key={key}>
                        <input
                          value={item[key] ?? ''}
                          onChange={(event) => setItemField(itemIndex, key, event.target.value)}
                        />
                      </td>
                    ))}
                  </tr>

                  {item.lines.map((line, lineIndex) => (
                    <tr className="item-charge-row" key={`item-${itemIndex}-line-${lineIndex}`}>
                      <td>
                        <span className="row-label">Item Line</span>
                      </td>
                      {['line_type', 'description'].map((key) => (
                        <td key={key}>
                          <input
                            value={line[key] ?? ''}
                            onChange={(event) =>
                              setItemLineField(itemIndex, lineIndex, key, event.target.value)
                            }
                          />
                        </td>
                      ))}
                      <td>
                        <input value="" readOnly aria-label="No HSN for item line" />
                      </td>
                      <td>
                        <input value="" readOnly aria-label="No quantity for item line" />
                      </td>
                      {['rate', 'amount'].map((key) => (
                        <td key={key} colSpan={key === 'amount' ? 2 : 1}>
                          <input
                            value={line[key] ?? ''}
                            onChange={(event) =>
                              setItemLineField(itemIndex, lineIndex, key, event.target.value)
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}

              {voucher.invoice_lines.map((line, lineIndex) => (
                <tr className="invoice-line-row" key={`invoice-line-${lineIndex}`}>
                  <td>
                    <span className="row-label">Invoice Line</span>
                  </td>
                  {['line_type', 'description'].map((key) => (
                    <td key={key}>
                      <input
                        value={line[key] ?? ''}
                        onChange={(event) => setInvoiceLineField(lineIndex, key, event.target.value)}
                      />
                    </td>
                  ))}
                  <td>
                    <input value="" readOnly aria-label="No HSN for invoice line" />
                  </td>
                  <td>
                    <input value="" readOnly aria-label="No quantity for invoice line" />
                  </td>
                  {['rate', 'amount'].map((key) => (
                    <td key={key} colSpan={key === 'amount' ? 2 : 1}>
                      <input
                        value={line[key] ?? ''}
                        onChange={(event) => setInvoiceLineField(lineIndex, key, event.target.value)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="grand-total-row">
                <td colSpan="7">Grand Total</td>
                <td>
                  <input
                    value={voucher.totals.grand_total ?? ''}
                    onChange={(event) => setTotalField('grand_total', event.target.value)}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </VoucherSection>

      <VoucherSection title="Totals">
        <div className="voucher-grid">
          {Object.entries(voucher.totals).map(([key, value]) => (
            <VoucherField
              key={key}
              label={formatLabel(key)}
              value={value}
              onChange={(nextValue) => setTotalField(key, nextValue)}
            />
          ))}
        </div>
      </VoucherSection>
    </div>
  );
}

function formatMoney(value) {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return '0.00';
  }

  return numberValue.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

function BankStatementVouchers({
  statement,
  onStatementChange,
  accounts,
  accountsStatus,
  accountsMessage,
  bankAccounts,
  bankAccountsStatus,
  bankAccountsMessage,
  onFetchAccounts,
  onFetchBankAccounts,
  onAddAccount,
}) {
  const transactions = statement.transactions || [];
  const [selectedTransactions, setSelectedTransactions] = useState(() => new Set());
  const [bulkAccount, setBulkAccount] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountParent, setNewAccountParent] = useState('Sundry Creditors');
  const [newAccountStatus, setNewAccountStatus] = useState('idle');
  const [newAccountError, setNewAccountError] = useState('');
  const accountsSectionRef = useRef(null);
  const missingAccounts = missingBankAccountSelections(statement);
  const selectedVoucherDetails = transactions
    .map((transaction, index) => ({ transaction, index }))
    .filter(({ index }) => selectedTransactions.has(index));
  const totals = transactions.reduce(
    (summary, transaction) => {
      const amount = Number(transaction.amount) || 0;

      if (transaction.direction === 'credit') {
        return {
          ...summary,
          credit: summary.credit + amount,
          creditCount: summary.creditCount + 1,
        };
      }

      if (transaction.direction === 'debit') {
        return {
          ...summary,
          debit: summary.debit + amount,
          debitCount: summary.debitCount + 1,
        };
      }

      return summary;
    },
    { credit: 0, debit: 0, creditCount: 0, debitCount: 0 },
  );

  const setStatementField = (key, value) => {
    onStatementChange((currentStatement) => ({
      ...currentStatement,
      [key]: value,
    }));
  };

  const setTransactionField = (transactionIndex, key, value) => {
    onStatementChange((currentStatement) => ({
      ...currentStatement,
      transactions: currentStatement.transactions.map((transaction, index) =>
        index === transactionIndex ? { ...transaction, [key]: value } : transaction,
      ),
    }));
  };

  const toggleTransactionSelection = (transactionIndex) => {
    setSelectedTransactions((currentSelection) => {
      const nextSelection = new Set(currentSelection);
      if (nextSelection.has(transactionIndex)) {
        nextSelection.delete(transactionIndex);
      } else {
        nextSelection.add(transactionIndex);
      }
      return nextSelection;
    });
  };

  const selectSamePartyForAccount = (transaction) => {
    if (!transaction.account_name || transactionPartyMatchKeys(transaction).length === 0) {
      return;
    }

    setBulkAccount(transaction.account_name);
    setSelectedTransactions(
      new Set(
        transactions
          .map((candidate, index) => ({ candidate, index }))
          .filter(({ candidate }) => transactionsShareParty(transaction, candidate))
          .map(({ index }) => index),
      ),
    );
    window.setTimeout(() => {
      accountsSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);
  };

  const applyAccountToSelected = () => {
    if (!bulkAccount || selectedTransactions.size === 0) {
      return;
    }

    onStatementChange((currentStatement) => ({
      ...currentStatement,
      transactions: currentStatement.transactions.map((transaction, index) =>
        selectedTransactions.has(index)
          ? { ...transaction, account_name: bulkAccount }
          : transaction,
      ),
    }));
  };

  const handleBulkAccountChange = (accountName) => {
    setBulkAccount(accountName);
    if (accountName) {
      onFetchAccounts();
    }
  };

  const handleTransactionAccountChange = (transactionIndex, accountName) => {
    setTransactionField(transactionIndex, 'account_name', accountName);
    if (accountName) {
      onFetchAccounts();
    }
  };

  const handleStatementBankAccountChange = (accountName) => {
    setStatementField('bank_account_name', accountName);
    if (accountName) {
      onFetchBankAccounts();
    }
  };

  const handleAddAccount = async () => {
    setNewAccountStatus('loading');
    setNewAccountError('');

    try {
      const account = await onAddAccount({
        name: newAccountName,
        parent: newAccountParent,
      });
      setNewAccountName('');
      setBulkAccount(account.name);
      setNewAccountStatus('complete');
    } catch (error) {
      setNewAccountStatus('error');
      setNewAccountError(error.message || 'Could not add this account.');
    }
  };

  return (
    <div className="bank-voucher-editor">
      <VoucherSection title="Statement">
        <div className="voucher-grid">
          <VoucherField
            label="Bank"
            value={statement.bank}
            onChange={(value) => setStatementField('bank', value)}
          />
          <label className="voucher-field">
            <span>Bank Account</span>
            <select
              value={statement.bank_account_name ?? ''}
              disabled={bankAccountsStatus === 'loading'}
              onChange={(event) => handleStatementBankAccountChange(event.target.value)}
            >
              <option value="">
                {bankAccountsStatus === 'loading' ? 'Loading bank accounts...' : 'Select bank account'}
              </option>
              {bankAccounts.map((account) => (
                <option value={account.name} key={account.name}>
                  {account.parent ? `${account.name} (${account.parent})` : account.name}
                </option>
              ))}
            </select>
          </label>
          <VoucherField
            label="Account Number"
            value={statement.account_number}
            onChange={(value) => setStatementField('account_number', value)}
          />
          <VoucherField
            label="Statement Period"
            value={statement.statement_period}
            onChange={(value) => setStatementField('statement_period', value)}
          />
          <button
            type="button"
            className="secondary-action-button fetch-bank-account-button"
            disabled={bankAccountsStatus === 'loading'}
            onClick={onFetchBankAccounts}
          >
            <RefreshCw aria-hidden="true" size={16} />
            <span>{bankAccountsStatus === 'loading' ? 'Fetching...' : 'Fetch Bank Accounts'}</span>
          </button>
        </div>
        {(bankAccountsMessage || missingStatementBankAccount(statement)) && (
          <p className={`account-status ${missingStatementBankAccount(statement) ? 'error' : ''}`}>
            {bankAccountsMessage || 'Select the Tally bank account for this statement.'}
          </p>
        )}
      </VoucherSection>

      <div className="bank-summary-grid">
        <div className="bank-summary-tile">
          <span>Total Credits</span>
          <strong>Rs. {formatMoney(totals.credit)}</strong>
          <small>{totals.creditCount} vouchers</small>
        </div>
        <div className="bank-summary-tile debit">
          <span>Total Debits</span>
          <strong>Rs. {formatMoney(totals.debit)}</strong>
          <small>{totals.debitCount} vouchers</small>
        </div>
        <div className="bank-summary-tile neutral">
          <span>Net Movement</span>
          <strong>Rs. {formatMoney(totals.credit - totals.debit)}</strong>
          <small>Credit minus debit</small>
        </div>
      </div>

      <VoucherSection title="Accounts" sectionRef={accountsSectionRef}>
        <div className="account-toolbar">
          <label className="voucher-field">
            <span>Bulk Account</span>
            <select
              value={bulkAccount}
              disabled={accountsStatus === 'loading'}
              onChange={(event) => handleBulkAccountChange(event.target.value)}
            >
              <option value="">
                {accountsStatus === 'loading' ? 'Loading accounts...' : 'Select account'}
              </option>
              {accounts.map((account) => (
                <option value={account.name} key={account.name}>
                  {account.parent ? `${account.name} (${account.parent})` : account.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="secondary-action-button"
            disabled={!bulkAccount || selectedTransactions.size === 0}
            onClick={applyAccountToSelected}
          >
            Apply to selected
          </button>
          <button
            type="button"
            className="secondary-action-button"
            disabled={accountsStatus === 'loading'}
            onClick={onFetchAccounts}
          >
            <RefreshCw aria-hidden="true" size={16} />
            <span>{accountsStatus === 'loading' ? 'Fetching...' : 'Fetch Accounts'}</span>
          </button>
          <span className="selection-count">{selectedTransactions.size} selected</span>
        </div>

        {selectedVoucherDetails.length > 0 && (
          <div className="selected-voucher-panel">
            <div className="selected-voucher-header">
              <strong>Selected Vouchers</strong>
              <span>
                {bulkAccount
                  ? `Ready for ${bulkAccount}`
                  : 'Choose a bulk account to apply'}
              </span>
            </div>
            <div className="selected-voucher-list">
              {selectedVoucherDetails.map(({ transaction, index }) => (
                <div className="selected-voucher-item" key={`selected-${index}`}>
                  <span>Voucher {index + 1}</span>
                  <div className="selected-voucher-main">
                    <strong>
                      {transaction.party_name ||
                        transaction.party_identifier ||
                        transaction.reference ||
                        'Unknown Party'}
                    </strong>
                    <p>{transaction.description || transaction.reference || 'No narration'}</p>
                  </div>
                  <em>Rs. {formatMoney(transaction.amount)}</em>
                  <small>{transaction.account_name || 'No account selected'}</small>
                  <button
                    type="button"
                    className="remove-selected-voucher"
                    onClick={() => toggleTransactionSelection(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="new-account-row">
          <VoucherField
            label="New Account"
            value={newAccountName}
            onChange={setNewAccountName}
          />
          <label className="voucher-field">
            <span>Parent</span>
            <select
              value={newAccountParent}
              onChange={(event) => setNewAccountParent(event.target.value)}
            >
              <option value="Sundry Creditors">Sundry Creditors</option>
              <option value="Sundry Debtors">Sundry Debtors</option>
              <option value="Indirect Expenses">Indirect Expenses</option>
              <option value="Indirect Incomes">Indirect Incomes</option>
              <option value="Bank Accounts">Bank Accounts</option>
              <option value="Current Assets">Current Assets</option>
              <option value="Current Liabilities">Current Liabilities</option>
            </select>
          </label>
          <button
            type="button"
            className="secondary-action-button add-account-button"
            disabled={!newAccountName.trim() || newAccountStatus === 'loading'}
            onClick={handleAddAccount}
          >
            <Plus aria-hidden="true" size={16} />
            <span>{newAccountStatus === 'loading' ? 'Adding...' : 'Add Account'}</span>
          </button>
        </div>

        {(accountsMessage || newAccountError || missingAccounts.length > 0) && (
          <p className={`account-status ${missingAccounts.length > 0 ? 'error' : ''}`}>
            {newAccountError ||
              accountsMessage ||
              `${missingAccounts.length} transaction${missingAccounts.length === 1 ? '' : 's'} still need an account.`}
          </p>
        )}
      </VoucherSection>

      <div className="transaction-voucher-list">
        {transactions.map((transaction, transactionIndex) => (
          <section
            className={`transaction-voucher ${transaction.direction || ''}`}
            key={`${transaction.reference || transactionIndex}-${transactionIndex}`}
          >
            <div className="transaction-voucher-header">
              <div>
                <span className="transaction-label">Voucher {transactionIndex + 1}</span>
                <h2>
                  {transaction.party_name ||
                    transaction.party_identifier ||
                    transaction.description ||
                    'Unknown Party'}
                </h2>
              </div>
              <div className="amount-pill">
                <span>{transaction.direction || 'direction'}</span>
                <strong>Rs. {formatMoney(transaction.amount)}</strong>
              </div>
            </div>

            <div className="transaction-account-row">
              <label className="transaction-selector">
                <input
                  type="checkbox"
                  checked={selectedTransactions.has(transactionIndex)}
                  onChange={() => toggleTransactionSelection(transactionIndex)}
                />
                <span>Select</span>
              </label>
              <label className="voucher-field">
                <span>Selected Account</span>
                <select
                  value={transaction.account_name ?? ''}
                  disabled={accountsStatus === 'loading'}
                  onChange={(event) =>
                    handleTransactionAccountChange(transactionIndex, event.target.value)
                  }
                >
                  <option value="">
                    {accountsStatus === 'loading' ? 'Loading accounts...' : 'Select account'}
                  </option>
                  {accounts.map((account) => (
                    <option value={account.name} key={account.name}>
                      {account.parent ? `${account.name} (${account.parent})` : account.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="match-button"
                disabled={!transaction.account_name || transactionPartyMatchKeys(transaction).length === 0}
                onClick={() => selectSamePartyForAccount(transaction)}
              >
                Select same party
              </button>
              {transaction.account_name && (
                <span className="account-detail">
                  {selectedAccountDetail(transaction, accounts)}
                </span>
              )}
            </div>

            <div className="voucher-grid">
              <VoucherField
                label="Value Date"
                value={transaction.value_date}
                onChange={(value) => setTransactionField(transactionIndex, 'value_date', value)}
              />
              <VoucherField
                label="Txn Date"
                value={transaction.txn_date}
                onChange={(value) => setTransactionField(transactionIndex, 'txn_date', value)}
              />
              <VoucherField
                label="Mode"
                value={transaction.mode}
                onChange={(value) => setTransactionField(transactionIndex, 'mode', value)}
              />
              <label className="voucher-field">
                <span>Direction</span>
                <select
                  value={transaction.direction ?? ''}
                  onChange={(event) =>
                    setTransactionField(transactionIndex, 'direction', event.target.value)
                  }
                >
                  <option value="">Select</option>
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>
              </label>
              <VoucherField
                label="Amount"
                value={transaction.amount}
                onChange={(value) => setTransactionField(transactionIndex, 'amount', value)}
              />
              <VoucherField
                label="Reference"
                value={transaction.reference}
                onChange={(value) => setTransactionField(transactionIndex, 'reference', value)}
              />
              <VoucherField
                label="Party Name"
                value={transaction.party_name}
                onChange={(value) => setTransactionField(transactionIndex, 'party_name', value)}
              />
              <VoucherField
                label="Party Identifier"
                value={transaction.party_identifier}
                onChange={(value) => setTransactionField(transactionIndex, 'party_identifier', value)}
              />
              <VoucherField
                label="IFSC"
                value={transaction.ifsc}
                onChange={(value) => setTransactionField(transactionIndex, 'ifsc', value)}
              />
              <VoucherField
                label="Balance"
                value={transaction.balance}
                onChange={(value) => setTransactionField(transactionIndex, 'balance', value)}
              />
              <VoucherField
                label="Description"
                value={transaction.description}
                multiline
                onChange={(value) => setTransactionField(transactionIndex, 'description', value)}
              />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function PdfPreview({ file }) {
  const containerRef = useRef(null);
  const [status, setStatus] = useState('Preparing PDF preview...');

  useEffect(() => {
    let isCancelled = false;
    let loadingTask;
    const renderTasks = [];
    const container = containerRef.current;

    async function renderPdf() {
      try {
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/legacy/build/pdf.worker.mjs',
          import.meta.url,
        ).toString();

        const pdfData = new Uint8Array(await file.arrayBuffer());
        loadingTask = pdfjs.getDocument({ data: pdfData });
        const pdf = await loadingTask.promise;

        if (isCancelled || !container) {
          return;
        }

        container.replaceChildren();

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          if (isCancelled) {
            return;
          }

          const page = await pdf.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1.35 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');

          if (!context) {
            throw new Error('Canvas is not supported in this browser.');
          }

          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.className = 'pdf-page';
          container.appendChild(canvas);

          const renderTask = page.render({ canvasContext: context, viewport });
          renderTasks.push(renderTask);
          await renderTask.promise;
        }

        setStatus('');
      } catch (error) {
        if (!isCancelled) {
          setStatus(`This PDF could not be previewed. ${error.message || ''}`.trim());
        }
      }
    }

    renderPdf();

    return () => {
      isCancelled = true;
      renderTasks.forEach((task) => task.cancel());
      loadingTask?.destroy();
      container?.replaceChildren();
    };
  }, [file]);

  return (
    <div className="pdf-preview">
      {status && <p>{status}</p>}
      <div ref={containerRef} className="pdf-pages" />
    </div>
  );
}

function FilePreviewPage({ selectedFile, selectedClient, onBack }) {
  const splitPaneRef = useRef(null);
  const parsePaneRef = useRef(null);
  const parseContentRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [spreadsheetSheets, setSpreadsheetSheets] = useState([]);
  const [previewError, setPreviewError] = useState('');
  const [voucherData, setVoucherData] = useState(null);
  const [parseStatus, setParseStatus] = useState('idle');
  const [parseError, setParseError] = useState('');
  const [tallyStatus, setTallyStatus] = useState('idle');
  const [tallyMessage, setTallyMessage] = useState('');
  const [tallyAccounts, setTallyAccounts] = useState([]);
  const [accountsStatus, setAccountsStatus] = useState('idle');
  const [accountsMessage, setAccountsMessage] = useState('');
  const [tallyBankAccounts, setTallyBankAccounts] = useState([]);
  const [bankAccountsStatus, setBankAccountsStatus] = useState('idle');
  const [bankAccountsMessage, setBankAccountsMessage] = useState('');
  const [leftPaneWidth, setLeftPaneWidth] = useState(58);
  const [parseRows, setParseRows] = useState({
    headingRow: '',
    rowFrom: '',
    rowTo: '',
  });

  const handleResizeStart = (event) => {
    event.preventDefault();
    const container = splitPaneRef.current;

    if (!container) {
      return;
    }

    const containerRect = container.getBoundingClientRect();

    const handlePointerMove = (moveEvent) => {
      const nextWidth =
        ((moveEvent.clientX - containerRect.left) / containerRect.width) * 100;
      setLeftPaneWidth(Math.min(72, Math.max(32, nextWidth)));
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      document.body.classList.remove('is-resizing-pane');
    };

    document.body.classList.add('is-resizing-pane');
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleParse = async () => {
    const formData = new FormData();
    formData.append('file', selectedFile.file);
    formData.append('document_type', getBackendDocumentType(selectedFile.id));

    const headingRow = parsePositiveInteger(parseRows.headingRow);
    const rowFrom = parsePositiveInteger(parseRows.rowFrom);
    const rowTo = parsePositiveInteger(parseRows.rowTo);

    if (parseRows.headingRow && !headingRow) {
      setParseStatus('error');
      setParseError('Heading row must be a positive row number.');
      return;
    }
    if (parseRows.rowFrom && !rowFrom) {
      setParseStatus('error');
      setParseError('From row must be a positive row number.');
      return;
    }
    if (parseRows.rowTo && !rowTo) {
      setParseStatus('error');
      setParseError('To row must be a positive row number.');
      return;
    }
    if (rowFrom && rowTo && rowFrom > rowTo) {
      setParseStatus('error');
      setParseError('From row cannot be greater than To row.');
      return;
    }

    if (selectedFile.id === 'bank-statement' && isSpreadsheet(selectedFile.file)) {
      if (headingRow) {
        formData.append('heading_row', String(headingRow));
      }
      if (rowFrom) {
        formData.append('row_from', String(rowFrom));
      }
      if (rowTo) {
        formData.append('row_to', String(rowTo));
      }
    }

    setParseStatus('loading');
    setParseError('');

    try {
      const response = await fetch(`${API_BASE_URL}/extract`, {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.detail || 'The backend could not parse this file.');
      }

      setVoucherData(normalizeParsedResult(selectedFile.id, payload.result));
      setParseStatus('complete');
      setTallyStatus('idle');
      setTallyMessage('');
      if (selectedFile.id === 'bank-statement') {
        await loadTallyAccounts();
        await loadTallyBankAccounts();
      }
    } catch (error) {
      setParseStatus('error');
      if (error instanceof TypeError) {
        setParseError(`Could not reach the backend at ${API_BASE_URL}. Make sure it is running.`);
      } else {
        setParseError(error.message || 'The backend could not parse this file.');
      }
    }
  };

  useEffect(() => {
    if (!selectedFile?.file) {
      return undefined;
    }

    const { file } = selectedFile;
    setPreviewError('');
    setSpreadsheetSheets([]);
    setVoucherData(null);
    setParseStatus('idle');
    setParseError('');
    setTallyStatus('idle');
    setTallyMessage('');
    setTallyAccounts([]);
    setAccountsStatus('idle');
    setAccountsMessage('');
    setTallyBankAccounts([]);
    setBankAccountsStatus('idle');
    setBankAccountsMessage('');
    setParseRows({
      headingRow: '',
      rowFrom: '',
      rowTo: '',
    });

    if (isPdf(file)) {
      setPreviewUrl('');
      return undefined;
    }

    if (isImage(file)) {
      const nextPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(nextPreviewUrl);

      return () => {
        URL.revokeObjectURL(nextPreviewUrl);
      };
    }

    if (isSpreadsheet(file)) {
      setPreviewUrl('');
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const XLSX = await import('xlsx');
          const workbook = XLSX.read(event.target.result, { type: 'array' });
          const sheets = workbook.SheetNames.map((sheetName) => {
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, {
              blankrows: true,
              defval: '',
              header: 1,
            })
              .map((row, rowIndex) => ({
                rowNumber: rowIndex + 1,
                cells: row,
              }))
              .filter((row) => row.cells.some((cell) => String(cell).trim()));

            return {
              name: sheetName,
              rows,
            };
          }).filter((sheet) => sheet.rows.length > 0);

          setSpreadsheetSheets(sheets);
        } catch {
          setPreviewError('This spreadsheet could not be previewed.');
        }
      };

      reader.onerror = () => {
        setPreviewError('This file could not be read.');
      };

      reader.readAsArrayBuffer(file);
    }

    return undefined;
  }, [selectedFile]);

  useEffect(() => {
    if (voucherData && parseContentRef.current) {
      parseContentRef.current.scrollTo({ left: 0, top: 0 });
    }
  }, [voucherData]);

  const onInvalidBankAccounts = useCallback((invalidSelections) => {
    const invalidIndexes = new Set(invalidSelections.map(({ index }) => index));
    setVoucherData((currentData) => ({
      ...currentData,
      transactions: (currentData.transactions || []).map((transaction, index) =>
        invalidIndexes.has(index) ? { ...transaction, account_name: '' } : transaction,
      ),
    }));
    setAccountsMessage(
      `Cleared ${invalidSelections.length} invalid account selection${
        invalidSelections.length === 1 ? '' : 's'
      }. Select an account returned by Tally.`,
    );
  }, []);

  useEffect(() => {
    if (
      selectedFile.id !== 'bank-statement' ||
      !voucherData ||
      accountsStatus !== 'complete' ||
      tallyAccounts.length === 0
    ) {
      return;
    }

    const invalidSelections = invalidBankAccountSelections(voucherData, tallyAccounts);
    if (invalidSelections.length === 0) {
      return;
    }

    onInvalidBankAccounts(invalidSelections);
  }, [accountsStatus, onInvalidBankAccounts, selectedFile.id, tallyAccounts, voucherData]);

  useEffect(() => {
    if (
      selectedFile.id !== 'bank-statement' ||
      !voucherData ||
      bankAccountsStatus !== 'complete' ||
      tallyBankAccounts.length === 0 ||
      !invalidStatementBankAccount(voucherData, tallyBankAccounts)
    ) {
      return;
    }

    setVoucherData((currentData) => ({
      ...currentData,
      bank_account_name: '',
    }));
    setBankAccountsMessage('Cleared an invalid bank account selection. Select a bank account returned by Tally.');
  }, [bankAccountsStatus, selectedFile.id, tallyBankAccounts, voucherData]);

  const loadTallyAccounts = async () => {
    setAccountsStatus('loading');
    setAccountsMessage('');

    try {
      if (!selectedClient) {
        throw new Error('Select a client before loading Tally accounts.');
      }

      const params = new URLSearchParams({ company_name: selectedClient });
      const response = await fetch(`${API_BASE_URL}/tally/accounts?${params.toString()}`);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.detail || 'Could not load Tally accounts.');
      }

      setTallyAccounts(payload.accounts || []);
      setAccountsStatus('complete');
    } catch (error) {
      setAccountsStatus('error');
      if (error instanceof TypeError) {
        setAccountsMessage(`Could not reach the backend at ${API_BASE_URL}. Make sure it is running.`);
      } else {
        setAccountsMessage(error.message || 'Could not load Tally accounts.');
      }
    }
  };

  const loadTallyBankAccounts = async () => {
    setBankAccountsStatus('loading');
    setBankAccountsMessage('');

    try {
      if (!selectedClient) {
        throw new Error('Select a client before loading Tally bank accounts.');
      }

      const params = new URLSearchParams({ company_name: selectedClient });
      const response = await fetch(`${API_BASE_URL}/tally/bank-accounts?${params.toString()}`);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.detail || 'Could not load Tally bank accounts.');
      }

      setTallyBankAccounts(payload.accounts || []);
      setBankAccountsStatus('complete');
    } catch (error) {
      setBankAccountsStatus('error');
      if (error instanceof TypeError) {
        setBankAccountsMessage(`Could not reach the backend at ${API_BASE_URL}. Make sure it is running.`);
      } else {
        setBankAccountsMessage(error.message || 'Could not load Tally bank accounts.');
      }
    }
  };

  const handleAddTallyAccount = async ({ name, parent }) => {
    if (!selectedClient) {
      throw new Error('Select a client before adding an account.');
    }

    const response = await fetch(`${API_BASE_URL}/tally/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company_name: selectedClient,
        name,
        parent,
      }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.detail || 'Could not add this account.');
    }

    const account = payload.account;
    setTallyAccounts((currentAccounts) => {
      const withoutDuplicate = currentAccounts.filter(
        (currentAccount) => accountKey(currentAccount.name) !== accountKey(account.name),
      );
      return [...withoutDuplicate, account].sort((first, second) =>
        first.name.localeCompare(second.name),
      );
    });
    setAccountsStatus('complete');
    setAccountsMessage('');
    return account;
  };

  const ensureBankAccountsSelected = () => {
    if (selectedFile.id !== 'bank-statement') {
      return true;
    }

    if (missingStatementBankAccount(voucherData)) {
      setTallyStatus('error');
      setTallyMessage('Select the Tally bank account for this bank statement before continuing.');
      return false;
    }

    if (invalidStatementBankAccount(voucherData, tallyBankAccounts)) {
      setTallyStatus('error');
      setTallyMessage('The selected bank account is not valid in Tally. Fetch bank accounts and select a valid bank account.');
      return false;
    }

    const invalidSelections = invalidBankAccountSelections(voucherData, tallyAccounts);
    if (invalidSelections.length > 0) {
      const firstInvalid = invalidSelections[0].index + 1;
      setTallyStatus('error');
      setTallyMessage(
        `Voucher ${firstInvalid} uses an account that is not valid in Tally. Fetch accounts and select a valid account before continuing.`,
      );
      return false;
    }

    const missingAccounts = missingBankAccountSelections(voucherData);
    if (missingAccounts.length === 0) {
      return true;
    }

    const firstMissing = missingAccounts[0].index + 1;
    setTallyStatus('error');
    setTallyMessage(
      `Select an account for every transaction before continuing. Voucher ${firstMissing} is missing an account.`,
    );
    return false;
  };

  const handlePost = () => {
    if (!ensureBankAccountsSelected()) {
      return;
    }

    createOutputPdf(voucherData, `${label} Output`, selectedFile.id, tallyAccounts);
  };

  const handlePostToTally = async () => {
    setTallyStatus('loading');
    setTallyMessage('');

    try {
      if (!selectedClient) {
        throw new Error('Select a client before posting to Tally.');
      }
      if (!ensureBankAccountsSelected()) {
        return;
      }

      const tallyData = normalizeTallyPayloadDate(selectedFile.id, voucherData);
      if (tallyData !== voucherData) {
        setVoucherData(tallyData);
      }

      const response = await fetch(`${API_BASE_URL}/post-to-tally`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_type: getBackendDocumentType(selectedFile.id),
          source: selectedFile.id,
          company_name: selectedClient,
          data: tallyData,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.detail || 'Tally rejected this voucher.');
      }

      const created = payload.tally?.created ?? payload.posted;
      const skipped = payload.skipped ?? 0;
      const batches = payload.tally?.batches ?? 0;
      setTallyStatus('complete');
      setTallyMessage(
        `Posted ${created} voucher${created === 1 ? '' : 's'} to Tally.${
          batches > 1 ? ` Sent in ${batches} batches.` : ''
        }${
          skipped ? ` Skipped ${skipped} already-posted voucher${skipped === 1 ? '' : 's'}.` : ''
        }`,
      );
    } catch (error) {
      setTallyStatus('error');
      if (error instanceof TypeError) {
        setTallyMessage(`Could not reach the backend at ${API_BASE_URL}. Make sure it is running.`);
      } else {
        setTallyMessage(error.message || 'Could not post this voucher to Tally.');
      }
    }
  };

  if (!selectedFile) {
    return null;
  }

  const { file, label } = selectedFile;
  const headingRowNumber = parsePositiveInteger(parseRows.headingRow);
  const rowFromNumber = parsePositiveInteger(parseRows.rowFrom);
  const rowToNumber = parsePositiveInteger(parseRows.rowTo);
  const showSpreadsheetParseControls = selectedFile.id === 'bank-statement' && isSpreadsheet(file);
  const parsedHeader = voucherData
    ? selectedFile.id === 'bank-statement'
      ? {
          eyebrow: 'Parsed Bank Statement',
          title: `${voucherData.bank || 'Bank Statement'} · ${
            (voucherData.transactions || []).length
          } transaction vouchers`,
          subtitle: '',
        }
      : {
          eyebrow: 'Parsed Voucher',
          title: voucherData.document_type || 'Voucher',
          subtitle: [voucherData.invoice_no, voucherData.invoice_date].filter(Boolean).join(' · '),
        }
    : null;

  const setParseRowField = (field, value) => {
    setParseRows((currentRows) => ({
      ...currentRows,
      [field]: value,
    }));
  };

  const spreadsheetRowClassName = (rowNumber) => {
    const classNames = [];
    if (headingRowNumber === rowNumber) {
      classNames.push('heading-row');
    }
    if (
      (!rowFromNumber || rowNumber >= rowFromNumber) &&
      (!rowToNumber || rowNumber <= rowToNumber) &&
      (rowFromNumber || rowToNumber)
    ) {
      classNames.push('selected-row');
    }
    return classNames.join(' ');
  };

  return (
    <main
      ref={splitPaneRef}
      className={`preview-page ${voucherData ? 'has-voucher' : ''}`}
      style={{ '--left-pane-width': `${leftPaneWidth}%` }}
    >
      <section className="preview-pane" aria-labelledby="preview-title">
        <div className="preview-header">
          <button type="button" className="back-button" onClick={onBack}>
            <ArrowLeft aria-hidden="true" size={18} />
            <span>Back</span>
          </button>
          <div>
            <p className="eyebrow">{label}</p>
            <h1 id="preview-title">{file.name}</h1>
          </div>
        </div>

        <div className="file-preview">
          {isPdf(file) && <PdfPreview file={file} />}

          {isImage(file) && previewUrl && <img src={previewUrl} alt={file.name} />}

          {isSpreadsheet(file) && (
            <div className="spreadsheet-preview">
              {spreadsheetSheets.length > 0 ? (
                spreadsheetSheets.map((sheet) => (
                  <div className="spreadsheet-sheet" key={sheet.name}>
                    <div className="spreadsheet-sheet-header">
                      <strong>{sheet.name}</strong>
                      <span>{sheet.rows.length} rows</span>
                    </div>
                    <table>
                      <tbody>
                        {sheet.rows.map((row) => (
                          <tr
                            className={spreadsheetRowClassName(row.rowNumber)}
                            key={`${sheet.name}-row-${row.rowNumber}`}
                          >
                            <th scope="row" className="row-number-cell">
                              {row.rowNumber}
                            </th>
                            {row.cells.map((cell, cellIndex) => (
                              <td key={`${sheet.name}-cell-${row.rowNumber}-${cellIndex}`}>
                                {String(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))
              ) : (
                <p>{previewError || 'Preparing spreadsheet preview...'}</p>
              )}
            </div>
          )}

          {!isPdf(file) && !isImage(file) && !isSpreadsheet(file) && (
            <p>This file type cannot be previewed.</p>
          )}
        </div>
      </section>

      <button
        type="button"
        className="pane-resizer"
        aria-label="Resize file and voucher sections"
        onPointerDown={handleResizeStart}
      />

      <aside ref={parsePaneRef} className="parse-pane" aria-label="Parse document">
        {voucherData ? (
          <>
            <div className="tally-action-bar">
              <div className="parsed-pane-title">
                <p className="eyebrow">{parsedHeader.eyebrow}</p>
                <h1>{parsedHeader.title}</h1>
                {parsedHeader.subtitle && <p>{parsedHeader.subtitle}</p>}
              </div>
              <div className="parse-toolbar">
                <button type="button" className="post-button" onClick={handlePost}>
                  Print
                </button>
                <button
                  type="button"
                  className="post-button tally-button"
                  disabled={tallyStatus === 'loading' || !selectedClient}
                  onClick={handlePostToTally}
                >
                  <Send aria-hidden="true" size={16} />
                  <span>{tallyStatus === 'loading' ? 'Posting...' : 'Post to Tally'}</span>
                </button>
              </div>
              {tallyMessage && (
                <p className={`tally-status ${tallyStatus}`} role={tallyStatus === 'error' ? 'alert' : 'status'}>
                  {tallyMessage}
                </p>
              )}
            </div>
            <div ref={parseContentRef} className="parsed-scroll-content">
              {selectedFile.id === 'bank-statement' ? (
                <BankStatementVouchers
                  statement={voucherData}
                  onStatementChange={setVoucherData}
                  accounts={tallyAccounts}
                  accountsStatus={accountsStatus}
                  accountsMessage={accountsMessage}
                  bankAccounts={tallyBankAccounts}
                  bankAccountsStatus={bankAccountsStatus}
                  bankAccountsMessage={bankAccountsMessage}
                  onFetchAccounts={loadTallyAccounts}
                  onFetchBankAccounts={loadTallyBankAccounts}
                  onAddAccount={handleAddTallyAccount}
                />
              ) : (
                <EditableVoucher voucher={voucherData} onVoucherChange={setVoucherData} />
              )}
            </div>
          </>
        ) : (
          <div className="parse-action">
            {showSpreadsheetParseControls && (
              <div className="parse-row-controls">
                <label className="voucher-field">
                  <span>Heading Row</span>
                  <input
                    type="number"
                    min="1"
                    value={numberInputValue(parseRows.headingRow)}
                    onChange={(event) => setParseRowField('headingRow', event.target.value)}
                  />
                </label>
                <label className="voucher-field">
                  <span>From Row</span>
                  <input
                    type="number"
                    min="1"
                    value={numberInputValue(parseRows.rowFrom)}
                    onChange={(event) => setParseRowField('rowFrom', event.target.value)}
                    placeholder={headingRowNumber ? String(headingRowNumber + 1) : ''}
                  />
                </label>
                <label className="voucher-field">
                  <span>To Row</span>
                  <input
                    type="number"
                    min="1"
                    value={numberInputValue(parseRows.rowTo)}
                    onChange={(event) => setParseRowField('rowTo', event.target.value)}
                  />
                </label>
              </div>
            )}
            <button
              type="button"
              className="parse-button"
              disabled={parseStatus === 'loading'}
              onClick={handleParse}
            >
              {parseStatus === 'loading' ? 'Parsing...' : 'Parse'}
            </button>
            {parseError && (
              <p className="parse-error" role="alert">
                {parseError}
              </p>
            )}
          </div>
        )}
      </aside>
    </main>
  );
}

function App() {
  const fileInputRefs = useRef({});
  const [selectedFiles, setSelectedFiles] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [activeFile, setActiveFile] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [clientsStatus, setClientsStatus] = useState('idle');

  useEffect(() => {
    let isCancelled = false;

    async function loadClients() {
      setClientsStatus('loading');
      try {
        const response = await fetch(`${API_BASE_URL}/tally/companies`);
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.detail || 'Could not load Tally companies.');
        }

        const companies = payload.companies || [];
        if (isCancelled) {
          return;
        }

        setClients(companies);
        setSelectedClient((currentClient) => currentClient || companies[0] || '');
        setClientsStatus('complete');
      } catch {
        if (!isCancelled) {
          setClients([]);
          setClientsStatus('error');
        }
      }
    }

    loadClients();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleUploadClick = (id) => {
    fileInputRefs.current[id]?.click();
  };

  const handleFileChange = (item, event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!item.validateFile(file)) {
      event.target.value = '';
      setSelectedFiles((currentFiles) => ({
        ...currentFiles,
        [item.id]: '',
      }));
      setValidationErrors((currentErrors) => ({
        ...currentErrors,
        [item.id]: item.invalidMessage,
      }));
      return;
    }

    setValidationErrors((currentErrors) => ({
      ...currentErrors,
      [item.id]: '',
    }));

    setSelectedFiles((currentFiles) => ({
      ...currentFiles,
      [item.id]: file.name,
    }));

    setActiveFile({
      file,
      id: item.id,
      label: item.label,
    });
  };

  if (activeFile) {
    return (
      <FilePreviewPage
        selectedFile={activeFile}
        selectedClient={selectedClient}
        onBack={() => setActiveFile(null)}
      />
    );
  }

  return (
    <main className="page-shell">
      <section className="upload-panel" aria-labelledby="voucher-upload-title">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Voucher Documents</p>
            <h1 id="voucher-upload-title">Upload source files</h1>
          </div>
        </div>

        <div className="client-row">
          <label htmlFor="client">Client:</label>
          <div>
            <select
              id="client"
              name="client"
              value={selectedClient}
              disabled={clientsStatus === 'loading'}
              onChange={(event) => setSelectedClient(event.target.value)}
            >
              <option value="" disabled>
                {clientsStatus === 'loading' ? 'Loading clients...' : 'Select Client'}
              </option>
              {clients.map((client) => (
                <option value={client} key={client}>
                  {client}
                </option>
              ))}
            </select>
            {clientsStatus === 'error' && (
              <span className="validation-error" role="alert">
                Could not load Tally companies.
              </span>
            )}
          </div>
        </div>

        <div className="document-list">
          {uploadItems.map((item) => (
            <div className="document-row" key={item.id}>
              <label htmlFor={`${item.id}-input`}>{item.label}</label>
              <div className="upload-control">
                <input
                  ref={(element) => {
                    fileInputRefs.current[item.id] = element;
                  }}
                  id={`${item.id}-input`}
                  className="file-input"
                  type="file"
                  accept={item.accept}
                  aria-describedby={`${item.id}-error`}
                  onChange={(event) => handleFileChange(item, event)}
                />
                <button
                  type="button"
                  className="upload-button"
                  onClick={() => handleUploadClick(item.id)}
                >
                  <Upload aria-hidden="true" size={18} />
                  <span>{item.button}</span>
                </button>
                {selectedFiles[item.id] && (
                  <span className="file-name" title={selectedFiles[item.id]}>
                    {selectedFiles[item.id]}
                  </span>
                )}
                {validationErrors[item.id] && (
                  <span
                    id={`${item.id}-error`}
                    className="validation-error"
                    role="alert"
                  >
                    {validationErrors[item.id]}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
