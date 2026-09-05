type BookingRow = {
  categoryName: string;
  subcategoryName: string;
  price: number | string;
  startDate: string;
  endDate: string;
  serialNumber: string;
};

type Props = {
  logoSrc?: string;
  orgName?: string;
  invoiceTitle?: string;
  invoiceNo?: string;
  invoiceDate?: string;
  customer: { fullName: string; mobile: string; address: string };
  bookings: BookingRow[];
  billing: { subtotal: number; payment_method: string; payment_status: string; total: number, paid_amount: number
    pending_amount: number };
    bill_created_by?: string;
    refered_by?: string
};

const INR = (n: number | string) =>
  `₹ ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(n || 0))}`;

export function renderInvoiceHtml(data: Props) {
  const {
    logoSrc,
    orgName = "Maa Traditional Dresses",
    invoiceTitle = "Invoice",
    invoiceNo,
    invoiceDate,
    customer,
    bookings = [],
    billing,
    bill_created_by,
    refered_by
  } = data;

  const paymentStatus = String(billing?.payment_status).toLowerCase();
  let badgeClass = 'unpaid';
  if (paymentStatus === 'paid') {
    badgeClass = 'paid';
  } else if (paymentStatus === 'partial') {
    badgeClass = 'partial';
  }

  const rows = bookings.length
    ? bookings
        .map(
          (b, i) => `
          <tr>
            <td class="w-sn">${i + 1}</td>
            <td class="w-cat">${b.categoryName || "-"}</td>
            <td class="w-sn">${b.serialNumber || "-"}</td>
            <td class="w-sub">${b.subcategoryName || "-"}</td>
            <td class="w-price">${INR(b.price)}</td>
            <td class="w-date">${b.startDate || "-"}</td>
            <td class="w-date">${b.endDate || "-"}</td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="7" style="padding:10px;border:1px solid #E5E7EB;">No bookings added.</td></tr>`;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${invoiceTitle}${invoiceNo ? " #" + invoiceNo : ""}</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Arial, "Noto Sans", "Helvetica Neue", sans-serif;
         color: #111827; margin: 0; padding: 24px; font-size: 12px; }
  .header { display: flex; align-items: center; border-bottom: 2px solid #DC2626; padding-bottom: 12px; }
  .logo { width: 48px; height: 48px; object-fit: contain; margin-right: 10px; }
  .title { font-size: 20px; margin: 0; color: #DC2626; }
  .subtitle { color: #6B7280; margin: 2px 0 6px 0; }
  .badge { display:inline-block; font-size: 10px; padding: 2px 8px; border-radius: 999px; color: #fff; text-transform: uppercase; }
  .badge.paid { background: #16A34A; } 
  .badge.partial { background: #F59E0B; }
  .badge.unpaid { background: #DC2626; }

  .section-tag { background: #FACC15; display:inline-block; padding: 6px 10px; border-radius: 4px;
                 font-weight: 700; margin: 14px 0 8px; }
  .card { border: 1px solid #E5E7EB; border-radius: 6px; padding: 10px; }

  .row { display:flex; gap: 16px; }
  .col { flex: 1; }
  .label { color: #374151; font-weight: 700; margin-bottom: 2px; }
  .value { margin-bottom: 6px; }

  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  thead th { background: #DC2626; color: #fff; text-align: left; padding: 6px 8px; font-weight: 700; }
  tbody td { padding: 6px 8px; border-left: 1px solid #E5E7EB; border-right: 1px solid #E5E7EB; }
  tbody tr { border-bottom: 1px solid #E5E7EB; }
  .w-sn { width: 40px; }
  .w-cat { width: 160px; }
  .w-sub { width: 200px; }
  .w-price { width: 90px; text-align: right; }
  .w-date { width: 110px; }

  .billing { display:flex; justify-content:flex-start; margin-top: 10px; }
  .billing-box { width: 280px; border: 1px solid #E5E7EB; border-radius: 6px; overflow:hidden; }
  .billing-line { display:flex; justify-content:space-between; padding: 8px 10px;
                  border-bottom: 1px solid #E5E7EB; }
  .billing-total { background: #FACC15; font-weight: 700; }

  .footer { margin-top: 16px; text-align:center; color:#6B7280; }
  @page { size: A4; margin: 12mm 10mm; }
</style>
</head>
<body>
  <div class="header">
    ${logoSrc ? `<img class="logo" src="${logoSrc}" alt="Logo" />` : ""}
    <div>
      <h1 class="title">${orgName}</h1>
      <div class="subtitle">
        ${invoiceTitle}${invoiceNo ? ` • #${invoiceNo}` : ""}${invoiceDate ? ` • ${invoiceDate}` : ""}
      </div>
      <span class="badge ${badgeClass}">${paymentStatus}</span>
    </div>
  </div>

  <div class="section-tag">Personal Information</div>
  <div class="card">
    <div class="row">
      <div class="col">
        <div class="label">Full Name</div>
        <div class="value">${customer?.fullName || "-"}</div>
      </div>
      <div class="col">
        <div class="label">Mobile</div>
        <div class="value">${customer?.mobile || "-"}</div>
      </div>
    </div>
    <div class="label">Address</div>
    <div class="value">${customer?.address || "-"}</div>
  </div>

  <div class="section-tag">Booking Summary</div>
  <table>
    <thead>
      <tr>
        <th class="w-sn">Sr</th>
        <th class="w-cat">Category</th>
        <th class="w-sn">Serial Number</th>
        <th class="w-sub">Subcategory</th>
        <th class="w-price">Price</th>
        <th class="w-date">Start Date</th>
        <th class="w-date">End Date</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="section-tag">Billing</div>
  <div class="billing" style="justify-content:flex-start;">
    <div class="billing-box">
  <div class="billing-line"><span>Subtotal</span><span>${INR(billing?.subtotal || 0)}</span></div>
  <div class="billing-line"><span>Paid Amount</span><span>${INR(billing?.paid_amount || 0)}</span></div>
  <div class="billing-line"><span>Pending Amount</span>
    <span style="color: ${billing?.pending_amount > 0 ? 'red' : 'green'};">
      ${INR(billing?.pending_amount || 0)}
    </span>
  </div>
  <div class="billing-line"><span>Payment Method</span><span>${billing?.payment_method || "-"}</span></div>
  <div class="billing-line billing-total"><span>Total</span>
  <span>${INR((billing?.paid_amount || 0) + (billing?.pending_amount || 0))}</span>
</div>
</div>
  </div>

   <div class="section-tag">Acknowledgement</div>
  <div class="card" style="display:flex; justify-content:space-between; margin-top:6px;">
    <div>
      <div class="label">Bill Created By</div>
      <div class="value">${bill_created_by || "-"}</div>
    </div>
    <div>
      <div class="label">Refered By</div>
      <div class="value">${refered_by || "-"}</div>
    </div>
  </div>

  <div class="footer">Thank you for booking with us.</div>
</body>
</html>`;
}