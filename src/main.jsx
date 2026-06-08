import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, Upload } from 'lucide-react';
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001';

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
    charge_amount: 96712,
    total_tax_amount: 330755.04,
    round_off_amount: -0.04,
    grand_total: 2168283,
  },
};

const parsedBankStatementJson = {
  transactions: [
    {
      value_date: '2026-05-01',
      transaction_number: 'ICICR42026050100502895',
      payment_mode: 'RTGS',
      party: {
        name: 'BHAGWATITRANSPORT CO',
        identifier: 'HDFC0001968',
      },
      amount: 450000,
      direction: 'debit',
    },
    {
      value_date: '2026-05-01',
      transaction_number: 'UTIBR72026050100131060',
      payment_mode: 'RTGS',
      party: {
        name: 'ULTRA TECH CEMENT LTD',
        identifier: '084010200013129',
      },
      amount: 412037.16,
      direction: 'credit',
    },
    {
      value_date: '2026-05-01',
      transaction_number: '109722460725',
      payment_mode: 'UPI',
      party: {
        name: '',
        identifier: 'bachhu.singh4@i',
      },
      amount: 4200,
      direction: 'debit',
    },
    {
      value_date: '2026-05-01',
      transaction_number: '109722463673',
      payment_mode: 'UPI',
      party: {
        name: '',
        identifier: '9318456385-a865',
      },
      amount: 4100,
      direction: 'debit',
    },
    {
      value_date: '2026-05-02',
      transaction_number: 'IN42612257625004',
      payment_mode: 'NEFT',
      party: {
        name: 'LAVITRADELINKSR',
        identifier: 'RJ29GB0240',
      },
      amount: 103650,
      direction: 'debit',
    },
    {
      value_date: '2026-05-03',
      transaction_number: '044268784461',
      payment_mode: 'INFT',
      party: {
        name: 'FATEHCHANDHR57A',
        identifier: 'HR57A1301',
      },
      amount: 841329,
      direction: 'debit',
    },
    {
      value_date: '2026-05-04',
      transaction_number: 'INDBR52026050400829031',
      payment_mode: 'RTGS',
      party: {
        name: 'AJAY KUMAR',
        identifier: '158950600029',
      },
      amount: 200000,
      direction: 'credit',
    },
    {
      value_date: '2026-05-05',
      transaction_number: 'ICICR42026050500514406',
      payment_mode: 'RTGS',
      party: {
        name: 'JAI HANUMAN TRANSPORT CO',
        identifier: 'HDFC0002762',
      },
      amount: 300000,
      direction: 'debit',
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
    charge_amount: '',
    other_charges: '',
    total_tax_amount: '',
    round_off_amount: '',
    grand_total: '',
    ...(normalized.totals || {}),
  };

  return normalized;
}

function normalizeBankStatementResult(result) {
  return {
    transactions: (result?.transactions || []).map((transaction) => ({
      value_date: transaction.value_date ?? '',
      transaction_number: transaction.transaction_number ?? '',
      payment_mode: transaction.payment_mode ?? '',
      party: {
        name: transaction.party?.name ?? '',
        identifier: transaction.party?.identifier ?? '',
      },
      amount: transaction.amount ?? '',
      direction: transaction.direction ?? '',
    })),
  };
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

function VoucherSection({ title, children }) {
  return (
    <section className="voucher-section" aria-label={title}>
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
      <div className="voucher-editor-header">
        <p className="eyebrow">Parsed Voucher</p>
        <h1>{voucher.document_type || 'Voucher'}</h1>
      </div>

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

function BankStatementVouchers({ statement, onStatementChange }) {
  const transactions = statement.transactions || [];
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

  const setTransactionField = (transactionIndex, key, value) => {
    onStatementChange((currentStatement) => ({
      ...currentStatement,
      transactions: currentStatement.transactions.map((transaction, index) =>
        index === transactionIndex ? { ...transaction, [key]: value } : transaction,
      ),
    }));
  };

  const setPartyField = (transactionIndex, key, value) => {
    onStatementChange((currentStatement) => ({
      ...currentStatement,
      transactions: currentStatement.transactions.map((transaction, index) =>
        index === transactionIndex
          ? {
              ...transaction,
              party: {
                ...transaction.party,
                [key]: value,
              },
            }
          : transaction,
      ),
    }));
  };

  return (
    <div className="bank-voucher-editor">
      <div className="voucher-editor-header">
        <p className="eyebrow">Parsed Bank Statement</p>
        <h1>{transactions.length} Transaction Vouchers</h1>
      </div>

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

      <div className="transaction-voucher-list">
        {transactions.map((transaction, transactionIndex) => (
          <section
            className={`transaction-voucher ${transaction.direction || ''}`}
            key={`${transaction.transaction_number}-${transactionIndex}`}
          >
            <div className="transaction-voucher-header">
              <div>
                <span className="transaction-label">Voucher {transactionIndex + 1}</span>
                <h2>{transaction.party?.name || transaction.party?.identifier || 'Unknown Party'}</h2>
              </div>
              <div className="amount-pill">
                <span>{transaction.direction || 'direction'}</span>
                <strong>Rs. {formatMoney(transaction.amount)}</strong>
              </div>
            </div>

            <div className="voucher-grid">
              <VoucherField
                label="Value Date"
                value={transaction.value_date}
                onChange={(value) => setTransactionField(transactionIndex, 'value_date', value)}
              />
              <VoucherField
                label="Payment Mode"
                value={transaction.payment_mode}
                onChange={(value) => setTransactionField(transactionIndex, 'payment_mode', value)}
              />
              <VoucherField
                label="Transaction Number"
                value={transaction.transaction_number}
                onChange={(value) =>
                  setTransactionField(transactionIndex, 'transaction_number', value)
                }
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
                label="Party Name"
                value={transaction.party?.name}
                onChange={(value) => setPartyField(transactionIndex, 'name', value)}
              />
              <VoucherField
                label="Party Identifier"
                value={transaction.party?.identifier}
                onChange={(value) => setPartyField(transactionIndex, 'identifier', value)}
              />
              <VoucherField
                label="Amount"
                value={transaction.amount}
                onChange={(value) => setTransactionField(transactionIndex, 'amount', value)}
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

function FilePreviewPage({ selectedFile, onBack }) {
  const splitPaneRef = useRef(null);
  const parsePaneRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [spreadsheetRows, setSpreadsheetRows] = useState([]);
  const [previewError, setPreviewError] = useState('');
  const [voucherData, setVoucherData] = useState(null);
  const [parseStatus, setParseStatus] = useState('idle');
  const [parseError, setParseError] = useState('');
  const [leftPaneWidth, setLeftPaneWidth] = useState(58);

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
    } catch (error) {
      setParseStatus('error');
      setParseError(error.message || 'The backend could not parse this file.');
    }
  };

  useEffect(() => {
    if (!selectedFile?.file) {
      return undefined;
    }

    const { file } = selectedFile;
    setPreviewError('');
    setSpreadsheetRows([]);
    setVoucherData(null);
    setParseStatus('idle');
    setParseError('');

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
          const [firstSheetName] = workbook.SheetNames;
          const firstSheet = workbook.Sheets[firstSheetName];
          const rows = XLSX.utils.sheet_to_json(firstSheet, {
            blankrows: false,
            defval: '',
            header: 1,
          });

          setSpreadsheetRows(rows.slice(0, 80));
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
    if (voucherData && parsePaneRef.current) {
      parsePaneRef.current.scrollTo({ left: 0, top: 0 });
    }
  }, [voucherData]);

  if (!selectedFile) {
    return null;
  }

  const { file, label } = selectedFile;

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
              {spreadsheetRows.length > 0 ? (
                <table>
                  <tbody>
                    {spreadsheetRows.map((row, rowIndex) => (
                      <tr key={`row-${rowIndex}`}>
                        {row.map((cell, cellIndex) => (
                          <td key={`cell-${rowIndex}-${cellIndex}`}>{String(cell)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
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
        {voucherData && selectedFile.id === 'bank-statement' ? (
          <BankStatementVouchers statement={voucherData} onStatementChange={setVoucherData} />
        ) : voucherData ? (
          <EditableVoucher voucher={voucherData} onVoucherChange={setVoucherData} />
        ) : (
          <div className="parse-action">
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
    return <FilePreviewPage selectedFile={activeFile} onBack={() => setActiveFile(null)} />;
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
          <select id="client" name="client" defaultValue="">
            <option value="" disabled>
              Select Client
            </option>
            <option value="acme-industries">Acme Industries</option>
            <option value="northstar-trading">Northstar Trading</option>
            <option value="greenfield-supplies">Greenfield Supplies</option>
          </select>
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
