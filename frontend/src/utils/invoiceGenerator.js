import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Generate Professional PDF Invoice/Receipt
 * @param {string} txHash - Transaction hash
 * @param {string} amount - Payment amount in ETH
 * @param {string} agentAddress - Agent wallet address
 * @param {object} additionalData - Optional additional data (gasUsed, secret, etc.)
 * @returns {void} - Downloads PDF automatically
 */
export function generateInvoice(txHash, amount, agentAddress, additionalData = {}) {
  const doc = new jsPDF();
  
  // Colors
  const primaryColor = [124, 58, 237]; // Purple
  const secondaryColor = [100, 100, 100]; // Gray
  const accentColor = [34, 197, 94]; // Green
  
  // Header Section
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('⚡ MICROGATE', 105, 18, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Payment Receipt & Transaction Proof', 105, 28, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text('AI Agent Payment Dashboard on Base Sepolia', 105, 35, { align: 'center' });
  
  // Date and Receipt Number
  const currentDate = new Date();
  const receiptNumber = `RCP-${Date.now().toString().slice(-8)}`;
  
  doc.setTextColor(...secondaryColor);
  doc.setFontSize(10);
  doc.text(`Date: ${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}`, 20, 50);
  doc.text(`Receipt #: ${receiptNumber}`, 20, 56);
  
  // Transaction Details Section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Transaction Details', 20, 70);
  
  // Transaction Table
  const transactionData = [
    ['Transaction Hash', txHash],
    ['Agent Address', agentAddress],
    ['Payment Amount', `${amount} ETH`],
    ['Network', 'Base Sepolia Testnet'],
    ['Status', '✅ CONFIRMED'],
    ['Gas Used', additionalData.gasUsed || 'N/A'],
    ['Block Explorer', `basescan.org/tx/${txHash}`]
  ];
  
  doc.autoTable({
    startY: 75,
    head: [],
    body: transactionData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 130, fontSize: 8, fontStyle: 'normal' }
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    }
  });
  
  // Payment Summary Section
  const finalY = doc.lastAutoTable.finalY + 10;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Summary', 20, finalY);
  
  doc.autoTable({
    startY: finalY + 5,
    body: [
      ['Subtotal', `${amount} ETH`],
      ['Network Fee', `~${additionalData.gasUsed || '0.00001'} ETH`],
      ['Total Paid', `${amount} ETH`]
    ],
    theme: 'plain',
    bodyStyles: {
      fontSize: 10,
      cellPadding: 2
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50, halign: 'right' },
      1: { cellWidth: 130, halign: 'right', fontStyle: 'bold' }
    }
  });
  
  // Secret/Result Section (if available)
  if (additionalData.secret) {
    const secretY = doc.lastAutoTable.finalY + 10;
    
    doc.setFillColor(...accentColor);
    doc.rect(20, secretY, 170, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('🎉 Payment Verified - Access Granted', 105, secretY + 8, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Secret: "${additionalData.secret}"`, 105, secretY + 16, { align: 'center' });
  }
  
  // Compliance Footer
  const footerY = 270;
  
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(20, footerY, 190, footerY);
  
  doc.setTextColor(...secondaryColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Settled on Base Sepolia Testnet • Non-Custodial Payment', 105, footerY + 5, { align: 'center' });
  doc.text('Compliance: UK FCA Registered Payment Provider (Transak)', 105, footerY + 10, { align: 'center' });
  doc.text('Agent-Driven Payment System • Zero Middlemen • Full Transparency', 105, footerY + 15, { align: 'center' });
  
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toISOString()}`, 105, footerY + 22, { align: 'center' });
  
  // Watermark
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(60);
  doc.setFont('helvetica', 'bold');
  doc.text('VERIFIED', 105, 150, { 
    align: 'center', 
    angle: 45,
    opacity: 0.1 
  });
  
  // Save PDF
  const filename = `MicroGate_Receipt_${receiptNumber}_${Date.now()}.pdf`;
  doc.save(filename);
  
  return filename;
}

/**
 * Generate Batch Invoice for multiple transactions
 * @param {Array} transactions - Array of transaction objects
 * @returns {void} - Downloads PDF automatically
 */
export function generateBatchInvoice(transactions) {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, 210, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('⚡ MICROGATE - Batch Report', 105, 18, { align: 'center' });
  
  // Transaction Table
  const tableData = transactions.map((tx, index) => [
    index + 1,
    tx.tx_hash?.slice(0, 10) + '...' || 'N/A',
    tx.amount || '0',
    tx.status || 'pending',
    new Date(tx.created_at).toLocaleDateString()
  ]);
  
  doc.autoTable({
    startY: 40,
    head: [['#', 'Tx Hash', 'Amount (ETH)', 'Status', 'Date']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [124, 58, 237],
      textColor: 255,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9
    }
  });
  
  // Summary
  const totalAmount = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
  const finalY = doc.lastAutoTable.finalY + 10;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Transactions: ${transactions.length}`, 20, finalY);
  doc.text(`Total Volume: ${totalAmount.toFixed(6)} ETH`, 20, finalY + 7);
  
  doc.save(`MicroGate_Batch_Report_${Date.now()}.pdf`);
}
