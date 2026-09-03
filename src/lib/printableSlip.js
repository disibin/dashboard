import toast from 'react-hot-toast';

export function printReceipt(order, userObj) {
  const item = order;
  if (!item) return;

  const printWindow = window.open('', '_blank', 'width=850,height=1000');
  if (!printWindow) {
    toast.error('Pop-up blocked! Please allow pop-ups to print invoices.');
    return;
  }

  const storeName = 'DISIBIN';
  const storePhone = '+880 1700 000000';
  const storeEmail = 'support@disibin.com';
  const storeWebsite = 'www.disibin.com';
  const storeAddress = 'Dhaka 1212, Bangladesh';

  let orderId = (item.order_id || (item.purchase_id ? `PUR-${item.purchase_id}` : item.payment_id ? `PAY-${item.payment_id}` : `INV-${item.id || '4032'}`)).toString();
  if (orderId.startsWith('#')) orderId = orderId.slice(1);
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
  const paid = parseFloat(item.paid || item.paid_amount || (isPaid ? total : 0));
  const due = Math.max(0, parseFloat(item.due || item.due_amount || (total - paid)));

  const packageName = item.package_name || item.package_title || item.title || item.name || 'Software Solutions & Tech Services';
  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/icon.png` : '/icon.png';

  const formatMoney = (amount) => '৳' + Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt #${orderId}</title>
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
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 32px;
            background-color: #ffffff;
            font-size: 13px;
            line-height: 1.5;
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
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 32px;
          }
          .recipient-label {
            font-size: 11px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            margin-bottom: 6px;
          }
          .customer-name {
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
            line-height: 1.2;
          }
          .customer-address {
            font-size: 13px;
            color: #475569;
            margin-top: 4px;
            line-height: 1.4;
          }
          .receipt-green-box {
            width: 320px;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          }
          .green-top-banner {
            background-color: #76a300;
            color: #ffffff;
            padding: 10px 16px;
            font-size: 20px;
            font-weight: 700;
            letter-spacing: -0.01em;
          }
          .grey-sub-banner {
            background-color: #f1f5f9;
            color: #475569;
            padding: 8px 16px;
            font-size: 12px;
            font-weight: 500;
          }
          .item-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 36px;
          }
          .item-table th {
            background-color: #76a300;
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.05em;
            padding: 10px 12px;
            text-transform: uppercase;
          }
          .item-table th:first-child {
            border-top-left-radius: 4px;
            border-bottom-left-radius: 4px;
          }
          .item-table th:last-child {
            border-top-right-radius: 4px;
            border-bottom-right-radius: 4px;
          }
          .item-table td {
            padding: 14px 12px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: top;
            color: #1e293b;
          }
          .product-title {
            font-weight: 600;
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
            font-weight: 500;
          }
          .totals-box {
            width: 320px;
          }
          .totals-title {
            font-size: 18px;
            font-weight: 800;
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
          }
          .totals-row.grand-total {
            font-size: 15px;
            font-weight: 800;
            color: #0f172a;
            border-bottom: none;
            padding-top: 10px;
          }
          .footer-website {
            margin-top: 40px;
            text-align: center;
            font-size: 13px;
            font-weight: 500;
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
            <div>
              <div class="recipient-label">RECIPIENT:</div>
              <div class="customer-name">${customerName}</div>
              <div class="customer-address">
                ${customerEmail ? `<div>${customerEmail}</div>` : ''}
                ${customerPhone ? `<div>${customerPhone}</div>` : ''}
                ${customerLocation ? `<div>${customerLocation}</div>` : ''}
              </div>
            </div>

            <div class="receipt-green-box">
              <div class="green-top-banner">Receipt for #${orderId}</div>
              <div class="grey-sub-banner">Transaction Date: ${createdAt}</div>
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
              <tr>
                <td>
                  <div class="product-title">${packageName}</div>
                </td>
                <td style="text-align: center; font-family: monospace;">1</td>
                <td style="text-align: right; font-family: monospace;">${formatMoney(price)}</td>
                <td style="text-align: right; font-family: monospace; font-weight: 700;">${formatMoney(price)}</td>
              </tr>
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
              <div class="totals-row" style="color: #059669;">
                <span>Discount</span>
                <span style="font-family: monospace;">-${formatMoney(discount)}</span>
              </div>
              ` : ''}

              <div class="totals-row grand-total">
                <span>Total</span>
                <span style="font-family: monospace;">${formatMoney(total)}</span>
              </div>

              ${paid > 0 ? `
              <div class="totals-row" style="color: #059669; font-weight: 600;">
                <span>Amount Paid</span>
                <span style="font-family: monospace;">${formatMoney(paid)}</span>
              </div>
              ` : ''}

              ${due > 0 ? `
              <div class="totals-row" style="color: #dc2626; font-weight: 700;">
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
