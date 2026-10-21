const PDFDocument = require("pdfkit");

const PAGE_MARGIN = 48;
const FOOTER_HEIGHT = 40;
const CURRENCY_FORMATTER = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatCurrency = (value) => {
  const amount = Number(value);
  return `INR ${CURRENCY_FORMATTER.format(Number.isFinite(amount) ? amount : 0)}`;
};

const sanitizeText = (value, fallback = "") => {
  if (typeof value !== "string") return fallback;

  const cleaned = value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || fallback;
};

const getOrderMoney = (order) => {
  const items = Array.isArray(order?.items) ? order.items : [];
  const subtotalFromItems = items.reduce(
    (sum, item) =>
      sum + Number(item?.unitPrice || 0) * Number(item?.quantity || 0),
    0,
  );
  const totalMrpFromItems = items.reduce(
    (sum, item) =>
      sum + Number(item?.originalUnitPrice || 0) * Number(item?.quantity || 0),
    0,
  );
  const priceSummary = order?.priceSummary || {};
  const subtotal = Number(priceSummary.subtotal ?? subtotalFromItems);
  const totalMrp = Number(priceSummary.totalMrp ?? totalMrpFromItems);

  return {
    subtotal,
    totalMrp,
    discount: Number(priceSummary.discount ?? Math.max(totalMrp - subtotal, 0)),
    couponDiscount: Number(priceSummary.couponDiscount ?? 0),
    delivery: Number(priceSummary.delivery ?? 0),
    totalAmount: Number(order?.totalAmount ?? subtotal - Number(priceSummary.couponDiscount ?? 0) + Number(priceSummary.delivery ?? 0)),
  };
};

const drawPageFooter = (doc, pageNumber, pageCount) => {
  const pageHeight = doc.page.height;
  const footerY = pageHeight - FOOTER_HEIGHT;
  const contentWidth = doc.page.width - PAGE_MARGIN * 2;

  doc.save();
  doc.moveTo(PAGE_MARGIN, footerY - 10)
    .lineTo(doc.page.width - PAGE_MARGIN, footerY - 10)
    .strokeColor("#e2e8f0")
    .stroke();
  doc.font("Helvetica")
    .fontSize(8)
    .fillColor("#64748b")
    .text("StyleKart | Fashion e-commerce", PAGE_MARGIN, footerY, {
      width: contentWidth / 2,
      lineBreak: false,
    })
    .text(`Page ${pageNumber} of ${pageCount}`, PAGE_MARGIN + contentWidth / 2, footerY, {
      width: contentWidth / 2,
      align: "right",
      lineBreak: false,
    });
  doc.restore();
};

const drawTableHeader = (doc, y, columns) => {
  doc.save();
  doc.rect(PAGE_MARGIN, y - 5, doc.page.width - PAGE_MARGIN * 2, 24)
    .fill("#f1f5f9");
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#334155");
  doc.text("Item", columns.item.x, y + 2, { lineBreak: false });
  doc.text("Qty", columns.quantity.x, y + 2, {
    width: columns.quantity.width,
    align: "center",
    lineBreak: false,
  });
  doc.text("Unit price", columns.unitPrice.x, y + 2, {
    width: columns.unitPrice.width,
    align: "right",
    lineBreak: false,
  });
  doc.text("Line total", columns.lineTotal.x, y + 2, {
    width: columns.lineTotal.width,
    align: "right",
    lineBreak: false,
  });
  doc.restore();
};

const drawSummary = (doc, order, money) => {
  const lines = [
    ["Items subtotal (before discounts)", formatCurrency(money.totalMrp)],
    ["Product discount", `-${formatCurrency(money.discount)}`],
    ["Subtotal after product discount", formatCurrency(money.subtotal)],
    ["Coupon discount", `-${formatCurrency(money.couponDiscount)}`],
    ["Delivery", formatCurrency(money.delivery)],
  ];
  const summaryHeight = 30 + lines.length * 19 + 42;

  if (doc.y + summaryHeight > doc.page.height - FOOTER_HEIGHT - 14) {
    doc.addPage();
  }

  const x = doc.page.width - PAGE_MARGIN - 270;
  let y = doc.y + 14;
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a")
    .text("Order total", x, y, { lineBreak: false });
  y += 22;

  lines.forEach(([label, value]) => {
    doc.font("Helvetica").fontSize(9).fillColor("#475569")
      .text(label, x, y, { width: 190, lineBreak: false });
    doc.font("Helvetica").fontSize(9).fillColor("#0f172a")
      .text(value, x + 190, y, { width: 80, align: "right", lineBreak: false });
    y += 19;
  });

  doc.moveTo(x, y + 1).lineTo(x + 270, y + 1).strokeColor("#cbd5e1").stroke();
  y += 10;
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a")
    .text("Amount due", x, y, { lineBreak: false });
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a")
    .text(formatCurrency(money.totalAmount), x + 140, y, {
      width: 130,
      align: "right",
      lineBreak: false,
    });
  doc.y = y + 25;

  if (order.orderStatus === "CANCELLED") {
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#9a3412")
      .text(`Order status: CANCELLED | Refund status: ${sanitizeText(order.refundStatus, "NOT_REQUIRED").replace(/_/g, " ")}`, PAGE_MARGIN, doc.y + 5, {
        width: doc.page.width - PAGE_MARGIN * 2,
      });
  }
};

const generateInvoicePdf = async (order) => {
  const safeOrder =
    order && typeof order.toObject === "function" ? order.toObject() : order || {};
  const money = getOrderMoney(safeOrder);
  const invoiceNumber =
    sanitizeText(safeOrder.invoiceNumber) ||
    sanitizeText(safeOrder.orderNumber) ||
    `INV-${String(safeOrder._id || Date.now()).replace(/[^a-zA-Z0-9]/g, "").slice(-12) || "STYLEKART"}`;
  const paymentLabel =
    safeOrder.paymentMethod === "RAZORPAY"
      ? "Razorpay"
      : safeOrder.paymentMethod === "COD"
        ? "Cash on Delivery"
        : "Online payment";
  const shipping = safeOrder.shippingAddress || {};
  const customerName = sanitizeText(shipping.fullName, "Customer");
  const addressLines = [
    customerName,
    sanitizeText(shipping.addressLine1),
    sanitizeText(shipping.addressLine2),
    [sanitizeText(shipping.city), sanitizeText(shipping.state)]
      .filter(Boolean)
      .join(", "),
    sanitizeText(shipping.pinCode) ? `PIN ${sanitizeText(shipping.pinCode)}` : "",
    sanitizeText(shipping.mobile) ? `Mobile: ${sanitizeText(shipping.mobile)}` : "",
  ].filter(Boolean);
  const invoiceDate = new Date(safeOrder.createdAt || Date.now()).toLocaleDateString("en-IN");

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: {
        top: PAGE_MARGIN,
        bottom: 20,
        left: PAGE_MARGIN,
        right: PAGE_MARGIN,
      },
      bufferPages: true,
    });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const contentWidth = doc.page.width - PAGE_MARGIN * 2;
    doc.font("Helvetica-Bold").fontSize(23).fillColor("#0f172a")
      .text("StyleKart", PAGE_MARGIN, 48, { lineBreak: false });
    doc.font("Helvetica").fontSize(10).fillColor("#64748b")
      .text("Fashion e-commerce", PAGE_MARGIN, 76, { lineBreak: false });
    doc.font("Helvetica-Bold").fontSize(25).fillColor("#0f172a")
      .text("INVOICE", PAGE_MARGIN, 49, {
        width: contentWidth,
        align: "right",
        lineBreak: false,
      });

    doc.moveTo(PAGE_MARGIN, 102)
      .lineTo(doc.page.width - PAGE_MARGIN, 102)
      .strokeColor("#cbd5e1")
      .stroke();

    const metadataY = 116;
    const leftColumnX = PAGE_MARGIN;
    const rightColumnX = PAGE_MARGIN + contentWidth / 2;
    const metadataLabelWidth = 88;
    const metadataValueWidth = contentWidth / 2 - metadataLabelWidth - 10;
    const metadata = [
      ["Invoice number", invoiceNumber, "Order number", sanitizeText(safeOrder.orderNumber, "N/A")],
      ["Invoice date", invoiceDate, "Payment method", paymentLabel],
      ["", "", "Payment status", sanitizeText(safeOrder.paymentStatus, "PENDING").replace(/_/g, " ")],
    ];

    metadata.forEach((row, index) => {
      const y = metadataY + index * 19;
      if (row[0]) {
        doc.font("Helvetica-Bold").fontSize(8).fillColor("#475569")
          .text(row[0], leftColumnX, y, { width: metadataLabelWidth, lineBreak: false });
        doc.font("Helvetica").fontSize(8).fillColor("#0f172a")
          .text(row[1], leftColumnX + metadataLabelWidth, y, {
            width: metadataValueWidth,
            ellipsis: true,
            lineBreak: false,
          });
      }
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#475569")
        .text(row[2], rightColumnX, y, { width: metadataLabelWidth, lineBreak: false });
      doc.font("Helvetica").fontSize(8).fillColor("#0f172a")
        .text(row[3], rightColumnX + metadataLabelWidth, y, {
          width: metadataValueWidth,
          ellipsis: true,
          lineBreak: false,
        });
    });

    const addressY = 184;
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#0f172a")
      .text("Deliver to", PAGE_MARGIN, addressY, { lineBreak: false });
    let addressYCursor = addressY + 17;
    addressLines.forEach((line, index) => {
      doc.font(index === 0 ? "Helvetica-Bold" : "Helvetica")
        .fontSize(9)
        .fillColor("#334155")
        .text(line, PAGE_MARGIN, addressYCursor, {
          width: contentWidth,
          lineBreak: false,
          ellipsis: true,
        });
      addressYCursor += 13;
    });

    const tableX = PAGE_MARGIN;
    const quantityWidth = 42;
    const unitPriceWidth = 100;
    const lineTotalWidth = 100;
    const itemWidth = contentWidth - quantityWidth - unitPriceWidth - lineTotalWidth;
    const columns = {
      item: { x: tableX, width: itemWidth },
      quantity: { x: tableX + itemWidth, width: quantityWidth },
      unitPrice: { x: tableX + itemWidth + quantityWidth, width: unitPriceWidth },
      lineTotal: { x: tableX + itemWidth + quantityWidth + unitPriceWidth, width: lineTotalWidth },
    };
    let y = addressYCursor + 18;
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#0f172a")
      .text("Items", PAGE_MARGIN, y, { lineBreak: false });
    y += 22;
    drawTableHeader(doc, y, columns);
    y += 28;

    const items = Array.isArray(safeOrder.items) ? safeOrder.items : [];
    items.forEach((item) => {
      const itemName = sanitizeText(item?.itemName, "Product");
      const details = [
        item?.selectedSize ? `Size: ${sanitizeText(item.selectedSize)}` : "",
        item?.selectedColor ? `Color: ${sanitizeText(item.selectedColor)}` : "",
      ].filter(Boolean).join(" | ");
      const nameHeight = doc.heightOfString(itemName, {
        width: columns.item.width - 10,
        font: "Helvetica",
        fontSize: 9,
        lineGap: 2,
      });
      const detailsHeight = details
        ? doc.heightOfString(details, {
            width: columns.item.width - 10,
            font: "Helvetica",
            fontSize: 8,
          })
        : 0;
      const rowHeight = Math.max(24, nameHeight + detailsHeight + 12);

      if (y + rowHeight > doc.page.height - FOOTER_HEIGHT - 18) {
        doc.addPage();
        y = PAGE_MARGIN;
        drawTableHeader(doc, y, columns);
        y += 28;
      }

      doc.font("Helvetica").fontSize(9).fillColor("#1e293b")
        .text(itemName, columns.item.x, y, {
          width: columns.item.width - 10,
          lineGap: 2,
        });
      if (details) {
        doc.font("Helvetica").fontSize(8).fillColor("#64748b")
          .text(details, columns.item.x, y + nameHeight + 2, {
            width: columns.item.width - 10,
          });
      }
      doc.font("Helvetica").fontSize(9).fillColor("#1e293b")
        .text(String(Number(item?.quantity || 0)), columns.quantity.x, y, {
          width: columns.quantity.width,
          align: "center",
          lineBreak: false,
        })
        .text(formatCurrency(item?.unitPrice), columns.unitPrice.x, y, {
          width: columns.unitPrice.width,
          align: "right",
          lineBreak: false,
        })
        .text(
          formatCurrency(Number(item?.unitPrice || 0) * Number(item?.quantity || 0)),
          columns.lineTotal.x,
          y,
          { width: columns.lineTotal.width, align: "right", lineBreak: false },
        );

      y += rowHeight;
      doc.moveTo(PAGE_MARGIN, y - 4)
        .lineTo(doc.page.width - PAGE_MARGIN, y - 4)
        .strokeColor("#e2e8f0")
        .stroke();
      y += 7;
    });

    doc.y = y;
    drawSummary(doc, safeOrder, money);

    const range = doc.bufferedPageRange();
    for (let index = range.start; index < range.start + range.count; index += 1) {
      doc.switchToPage(index);
      drawPageFooter(doc, index + 1, range.count);
    }

    doc.end();
  });
};

module.exports = { generateInvoicePdf };
