import { useState, useEffect } from 'react';
import api from '../api/client';

interface Invoice {
  id: number;
  invoice_number: string;
  date_issue: string;
  total_amount: string;
}

interface Payment {
  id: number;
  payment_id: string;
  invoice_id: number;
  amount_paid: string;
  payment_date: string;
}

const STATUS_LABEL: Record<string, string> = {
  paid: 'bg-green-100 text-green-800',
  unpaid: 'bg-yellow-100 text-yellow-800',
};

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const [inv, pay] = await Promise.all([
          api.get<Invoice[]>('/billing/invoices/'),
          api.get<Payment[]>('/billing/payments/'),
        ]);
        setInvoices(inv.data);
        setPayments(pay.data);
      } catch {
        setError('Failed to load billing data.');
      } finally {
        setLoading(false);
      }
    };
    fetchBilling();
  }, []);

  const paidInvoiceIds = new Set(payments.map((p) => p.invoice_id));

  const totalBilled = invoices.reduce(
    (sum, inv) => sum + parseFloat(inv.total_amount),
    0
  );
  const totalPaid = payments.reduce(
    (sum, p) => sum + parseFloat(p.amount_paid),
    0
  );

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">💳 Billing</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Invoices', value: invoices.length, icon: '📄' },
          {
            label: 'Total Billed',
            value: `₹${totalBilled.toFixed(2)}`,
            icon: '💰',
          },
          {
            label: 'Total Paid',
            value: `₹${totalPaid.toFixed(2)}`,
            icon: '✅',
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4"
          >
            <span className="text-3xl">{s.icon}</span>
            <div>
              <p className="text-xl font-bold text-gray-800">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          {/* Invoices table */}
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Invoices</h2>
          {invoices.length === 0 ? (
            <p className="text-gray-400 mb-8">No invoices found.</p>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-8">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3">Invoice #</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Amount</th>
                    <th className="text-left px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => {
                    const paid = paidInvoiceIds.has(inv.id);
                    return (
                      <tr
                        key={inv.id}
                        className="border-t border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 font-medium">
                          {inv.invoice_number}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(inv.date_issue).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">₹{inv.total_amount}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              STATUS_LABEL[paid ? 'paid' : 'unpaid']
                            }`}
                          >
                            {paid ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Payments table */}
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Payments</h2>
          {payments.length === 0 ? (
            <p className="text-gray-400">No payments recorded.</p>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3">Payment ID</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Amount Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr
                      key={p.id}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-medium">{p.payment_id}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(p.payment_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">₹{p.amount_paid}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
