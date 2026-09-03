import toast from 'react-hot-toast';
import {
  STORE_NAME,
  STORE_SUBTITLE,
  STORE_PHONE,
  STORE_EMAIL,
  STORE_WEBSITE,
  STORE_ADDRESS
} from '@/lib/secret';

export function printReceipt(order, userObj) {
  const item = order;
  if (!item) return;

  const printWindow = window.open('', '_blank', 'width=850,height=1000');
  if (!printWindow) {
    toast.error('Pop-up blocked! Please allow pop-ups to print invoices.');
    return;
  }

  const storeName = STORE_NAME;
  const storeSub = STORE_SUBTITLE;
  const storePhone = STORE_PHONE;
  const storeEmail = STORE_EMAIL;
  const storeWebsite = STORE_WEBSITE;
  const storeAddress = STORE_ADDRESS;

  const purId = item.purchase_id || (typeof item.id === 'number' ? item.id : null);
  const payId = item.payment_id;
  const displayOrderRef = purId ? `PUR-${purId}` : (payId ? `PAY-${payId}` : 'N/A');
  const createdAt = item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const rawName = item.user_name || item.customer_name || item.name || item.full_name || userObj?.name || userObj?.user_name || userObj?.full_name;
  const rawEmail = item.user_email || item.customer_email || item.email || userObj?.email || userObj?.user_email || '';
  const rawPhone = item.user_phone || item.customer_phone || item.phone || item.mobile || userObj?.phone || userObj?.user_phone || '';

  const cleanName = (rawName && rawName !== 'Customer' && rawName !== 'Valued Customer') ? rawName : '';
  const cleanEmail = (rawEmail && rawEmail !== 'No email' && rawEmail !== 'N/A') ? rawEmail : '';
  const cleanPhone = (rawPhone && rawPhone !== 'N/A') ? rawPhone : '';

  const customerName = cleanName || (cleanEmail ? cleanEmail.split('@')[0] : 'Customer');
  const customerEmail = cleanEmail;
  const customerPhone = cleanPhone;

  const locationParts = [item.user_city || item.city || userObj?.city, item.user_country || item.country || userObj?.country].filter(Boolean);
  const customerLocation = locationParts.join(', ');

  const transactionId = item.transaction_id || '';
  const paymentMethod = item.payment_method ? item.payment_method.replace(/_/g, ' ').toUpperCase() : '';

  const price = parseFloat(item.price || item.total_price || 0);
  const discount = parseFloat(item.discount || 0);
  const total = Math.max(0, price - discount);
  const rawStatus = (item.payment_status || item.purchase_status || item.status || 'complete').toLowerCase();
  const isPaid = rawStatus === 'paid' || rawStatus === 'complete';
  const paid = parseFloat(item.paid !== undefined ? item.paid : (item.paid_amount !== undefined ? item.paid_amount : (isPaid ? total : 0)));
  const due = Math.max(0, parseFloat(item.due !== undefined ? item.due : (item.due_amount !== undefined ? item.due_amount : (total - paid))));

  const packageName = item.package_name || item.package_title || item.title || item.name || 'Software Solutions & Tech Services';
  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/icon.png` : '/icon.png';

  const formatMoney = (amount) => '৳' + Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const hasItemsArray = Array.isArray(item.items) && item.items.length > 0;
  const tableRowsHtml = hasItemsArray
    ? item.items.map(it => {
        const itemPrice = parseFloat(it.price || 0);
        const itemDisc = parseFloat(it.discount || 0);
        const itemNet = Math.max(0, itemPrice - itemDisc);
        return `
          <tr>
            <td>
              <div class="product-title">${it.package_name || packageName}</div>
            </td>
            <td style="text-align: center; font-family: monospace;">1</td>
            <td style="text-align: right; font-family: monospace;">${formatMoney(itemPrice)}</td>
            <td style="text-align: right; font-family: monospace;">${formatMoney(itemNet)}</td>
          </tr>
        `;
      }).join('')
    : `
      <tr>
        <td>
          <div class="product-title">${packageName}</div>
        </td>
        <td style="text-align: center; font-family: monospace;">1</td>
        <td style="text-align: right; font-family: monospace;">${formatMoney(price)}</td>
        <td style="text-align: right; font-family: monospace;">${formatMoney(price)}</td>
      </tr>
    `;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt ${displayOrderRef}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
          * {
            box-sizing: border-box;
            font-weight: 400 !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 32px;
            background-color: #ffffff;
            font-size: 13px;
            line-height: 1.5;
            font-weight: 400;
          }
          .receipt-container {
            max-width: 800px;
            margin: 0 auto;
          }
          .header-box {
            margin-bottom: 32px;
          }
          .brand-logo-img {
            height: 48px;
            width: auto;
            object-fit: contain;
            margin-bottom: 8px;
          }
          .brand-title-normal {
            font-size: 24px;
            font-weight: 400;
            color: #0f172a;
            letter-spacing: 0.02em;
            line-height: 1.2;
          }
          .brand-contacts {
            font-size: 12px;
            color: #475569;
            margin-top: 4px;
            font-weight: 400;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 32px;
          }
          .meta-column {
            min-width: 220px;
          }
          .meta-label {
            font-size: 11px;
            font-weight: 400;
            color: #0f172a;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            margin-bottom: 6px;
          }
          .meta-heading {
            font-size: 18px;
            font-weight: 400;
            color: #0f172a;
            line-height: 1.2;
          }
          .meta-details {
            font-size: 13px;
            color: #475569;
            margin-top: 4px;
            line-height: 1.4;
            font-weight: 400;
          }
          .item-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 36px;
          }
          .item-table th {
            background-color: #f1f5f9;
            color: #0f172a;
            font-size: 11px;
            font-weight: 400;
            letter-spacing: 0.05em;
            padding: 10px 12px;
            text-transform: uppercase;
            border-bottom: 1px solid #e2e8f0;
          }
          .item-table td {
            padding: 14px 12px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: top;
            color: #1e293b;
            font-weight: 400;
          }
          .product-title {
            font-weight: 400;
            color: #0f172a;
            font-size: 13px;
          }
          .bottom-flex {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
          }
          .thanks-text {
            font-size: 13px;
            color: #64748b;
            font-weight: 400;
            line-height: 1.6;
          }
          .totals-box {
            width: 320px;
          }
          .totals-title {
            font-size: 16px;
            font-weight: 400;
            color: #1e293b;
            margin-bottom: 12px;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px solid #f1f5f9;
            font-size: 13px;
            color: #475569;
            font-weight: 400;
          }
          .totals-row.grand-total {
            font-size: 14px;
            font-weight: 400;
            color: #0f172a;
            border-bottom: none;
            padding-top: 10px;
          }
          .footer-website {
            margin-top: 40px;
            text-align: center;
            font-size: 13px;
            font-weight: 400;
            color: #64748b;
            border-top: 1px dashed #cbd5e1;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          
          <div class="header-box">
            <img src="${logoUrl}" alt="${storeName}" class="brand-logo-img" />
            <div class="brand-title-normal">${storeName}</div>
            <div class="brand-contacts">
              ${storeAddress}<br>
              ${storePhone} | ${storeEmail}
            </div>
          </div>

          <div class="meta-row">
            <div class="meta-column">
              <div class="meta-label">RECIPIENT:</div>
              <div class="meta-heading">${customerName}</div>
              <div class="meta-details">
                ${customerEmail ? `<div>${customerEmail}</div>` : ''}
                ${customerPhone ? `<div>${customerPhone}</div>` : ''}
                ${customerLocation ? `<div>${customerLocation}</div>` : ''}
              </div>
            </div>

            <div class="meta-column" style="text-align: right;">
              <div class="meta-label">PAYMENT DETAILS:</div>
              <div class="meta-heading">${displayOrderRef}</div>
              <div class="meta-details">
                <div>Date: ${createdAt}</div>
                <div>Status: ${rawStatus.toUpperCase()}</div>
                ${paymentMethod ? `<div>Method: ${paymentMethod}</div>` : ''}
                ${transactionId ? `<div>Trx ID: ${transactionId}</div>` : ''}
              </div>
            </div>
          </div>

          <table class="item-table">
            <thead>
              <tr>
                <th style="text-align: left; width: 46%;">PRODUCT / SERVICE</th>
                <th style="text-align: center; width: 14%;">QTY.</th>
                <th style="text-align: right; width: 20%;">COST</th>
                <th style="text-align: right; width: 20%;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>

          <div class="bottom-flex">
            <div class="thanks-text">
              Thanks for your business!
            </div>

            <div class="totals-box">
              <div class="totals-title">Receipt for Payment</div>
              
              <div class="totals-row">
                <span>Subtotal</span>
                <span style="font-family: monospace;">${formatMoney(price)}</span>
              </div>

              ${discount > 0 ? `
              <div class="totals-row">
                <span>Discount</span>
                <span style="font-family: monospace;">-${formatMoney(discount)}</span>
              </div>
              ` : ''}

              <div class="totals-row grand-total">
                <span>Total</span>
                <span style="font-family: monospace;">${formatMoney(total)}</span>
              </div>

              ${paid > 0 ? `
              <div class="totals-row">
                <span>Amount Paid</span>
                <span style="font-family: monospace;">${formatMoney(paid)}</span>
              </div>
              ` : ''}

              ${due > 0 ? `
              <div class="totals-row">
                <span>Remaining Due</span>
                <span style="font-family: monospace;">${formatMoney(due)}</span>
              </div>
              ` : ''}
            </div>
          </div>

          <div class="footer-website">
            ${storeWebsite}
          </div>

        </div>

        <script>
          window.onload = function() {
            window.focus();
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

export function printPaymentSlip(order, userObj) {
  return printReceipt(order, userObj);
}

export function printSalarySlip(sal, staffObj) {
  const item = sal;
  if (!item) return;

  const printWindow = window.open('', '_blank', 'width=850,height=1000');
  if (!printWindow) {
    toast.error('Pop-up blocked! Please allow pop-ups to print salary slips.');
    return;
  }

  const storeName = STORE_NAME;
  const storePhone = STORE_PHONE;
  const storeEmail = STORE_EMAIL;
  const storeWebsite = STORE_WEBSITE;
  const storeAddress = STORE_ADDRESS;

  const salId = item.id ? `SAL-${item.id}` : 'N/A';
  const staffName = item.staff_name || staffObj?.name || 'Staff Member';
  const staffEmail = item.staff_email || staffObj?.email || '';
  const staffRole = (item.staff_role || staffObj?.role || 'Employee').toUpperCase();

  const monthYear = item.month && item.year ? `${item.month}/${item.year}` : (item.payroll_title || 'Monthly Salary');
  const createdAt = item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const totalAmount = parseFloat(item.amount || 0);
  const paidAmount = parseFloat(item.paid_amount || 0);
  const dueAmount = Math.max(0, totalAmount - paidAmount);
  const rawStatus = (item.status || 'unpaid').toUpperCase();

  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/icon.png` : '/icon.png';
  const formatMoney = (amount) => '৳' + Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Salary Payslip ${salId}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          @media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
          * { box-sizing: border-box; font-weight: 400 !important; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1e293b; margin: 0; padding: 32px; background-color: #ffffff; font-size: 13px; line-height: 1.5; font-weight: 400; }
          .receipt-container { max-width: 800px; margin: 0 auto; }
          .header-box { margin-bottom: 32px; }
          .brand-logo-img { height: 48px; width: auto; object-fit: contain; margin-bottom: 8px; }
          .brand-title-normal { font-size: 24px; font-weight: 400; color: #0f172a; letter-spacing: 0.02em; line-height: 1.2; }
          .brand-contacts { font-size: 12px; color: #475569; margin-top: 4px; font-weight: 400; }
          .meta-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
          .meta-column { min-width: 220px; }
          .meta-label { font-size: 11px; font-weight: 400; color: #0f172a; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 6px; }
          .meta-heading { font-size: 18px; font-weight: 400; color: #0f172a; line-height: 1.2; }
          .meta-details { font-size: 13px; color: #475569; margin-top: 4px; line-height: 1.4; font-weight: 400; }
          .item-table { width: 100%; border-collapse: collapse; margin-bottom: 36px; }
          .item-table th { background-color: #f1f5f9; color: #0f172a; font-size: 11px; font-weight: 400; letter-spacing: 0.05em; padding: 10px 12px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
          .item-table td { padding: 14px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; color: #1e293b; font-weight: 400; }
          .bottom-flex { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
          .thanks-text { font-size: 13px; color: #64748b; font-weight: 400; line-height: 1.6; }
          .totals-box { width: 320px; }
          .totals-title { font-size: 16px; font-weight: 400; color: #1e293b; margin-bottom: 12px; }
          .totals-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #475569; font-weight: 400; }
          .totals-row.grand-total { font-size: 14px; font-weight: 400; color: #0f172a; border-bottom: none; padding-top: 10px; }
          .footer-website { margin-top: 40px; text-align: center; font-size: 13px; font-weight: 400; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header-box">
            <img src="${logoUrl}" alt="${storeName}" class="brand-logo-img" />
            <div class="brand-title-normal">${storeName}</div>
            <div class="brand-contacts">
              ${storeAddress}<br>
              ${storePhone} | ${storeEmail}
            </div>
          </div>

          <div class="meta-row">
            <div class="meta-column">
              <div class="meta-label">EMPLOYEE / RECIPIENT:</div>
              <div class="meta-heading">${staffName}</div>
              <div class="meta-details">
                <div>Role: ${staffRole}</div>
                ${staffEmail ? `<div>${staffEmail}</div>` : ''}
              </div>
            </div>

            <div class="meta-column" style="text-align: right;">
              <div class="meta-label">PAYSLIP DETAILS:</div>
              <div class="meta-heading">${salId}</div>
              <div class="meta-details">
                <div>Cycle: ${monthYear}</div>
                <div>Issue Date: ${createdAt}</div>
                <div>Status: ${rawStatus}</div>
              </div>
            </div>
          </div>

          <table class="item-table">
            <thead>
              <tr>
                <th style="text-align: left; width: 50%;">EARNING DESCRIPTION</th>
                <th style="text-align: center; width: 20%;">PERIOD</th>
                <th style="text-align: right; width: 30%;">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Monthly Base Salary Payout (${staffRole})</td>
                <td style="text-align: center;">${monthYear}</td>
                <td style="text-align: right; font-family: monospace;">${formatMoney(totalAmount)}</td>
              </tr>
            </tbody>
          </table>

          <div class="bottom-flex">
            <div class="thanks-text">
              Official Staff Salary Payslip Voucher<br>
              Generated by ${storeName} Finance & Management.
            </div>

            <div class="totals-box">
              <div class="totals-title">Salary Summary</div>
              
              <div class="totals-row">
                <span>Total Assigned Salary</span>
                <span style="font-family: monospace;">${formatMoney(totalAmount)}</span>
              </div>

              <div class="totals-row">
                <span>Amount Disbursed (Paid)</span>
                <span style="font-family: monospace;">${formatMoney(paidAmount)}</span>
              </div>

              <div class="totals-row grand-total">
                <span>Remaining Salary Due</span>
                <span style="font-family: monospace;">${formatMoney(dueAmount)}</span>
              </div>
            </div>
          </div>

          <div class="footer-website">
            ${storeWebsite}
          </div>
        </div>

        <script>
          window.onload = function() {
            window.focus();
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
