import React, { useEffect, useState } from 'react';
import { loanAPI } from '../services/api';
import { formatCurrency } from '../utils/calculations';
import { CheckCircle, X, Eye } from 'lucide-react';

const SMEStatus: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [activeLoans, setActiveLoans] = useState<any[]>([]);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);

  const fetchMyLoans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await loanAPI.getMyLoans();
      const apps = res?.data?.applications || [];
      const loans = res?.data?.active_loans || [];
      setApplications(apps);
      setActiveLoans(loans);
    } catch (err: any) {
      console.error('Failed to load my loans', err);
      setError(err?.message || 'Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLoans();
  }, []);

  const openLoanDetails = async (application: any) => {
    // Only approved applications will have a loan record.
    const loanId = `loan_${application.application_id}`;
    setDetailModalOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setSelectedDetail(null);
    try {
      const res = await loanAPI.getLoanDetails(loanId);
      setSelectedDetail(res?.data || null);
    } catch (err: any) {
      console.error('Failed to fetch loan details', err);
      setDetailError(err?.message || 'Failed to load loan details');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Loan Applications</h1>
          <p className="text-gray-600">Track the status of your loan applications and active loans</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-600">Loading your applications...</div>
        ) : error ? (
          <div className="text-center py-6 text-red-600">{error}</div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Applications</h2>
              {applications.length === 0 ? (
                <div className="text-sm text-gray-500">You have not submitted any applications yet.</div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.application_id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm text-gray-600">Application ID</div>
                          <div className="font-medium text-gray-900">{app.application_id}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Submitted</div>
                          <div className="text-sm text-gray-900">{new Date(app.submitted_at).toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Amount</div>
                          <div className="font-medium text-gray-900">{formatCurrency(app.requested_amount)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Term</div>
                          <div className="font-medium text-gray-900">{app.loan_term_months} months</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Status</div>
                          <div className="flex items-center space-x-2">
                            {app.application_status === 'approved' ? (
                              <><CheckCircle className="h-4 w-4 text-green-600" /><span className="text-sm font-semibold text-green-700">Approved</span></>
                            ) : app.application_status === 'rejected' ? (
                              <><X className="h-4 w-4 text-red-600" /><span className="text-sm font-semibold text-red-700">Rejected</span></>
                            ) : (
                              <span className="text-sm font-semibold text-gray-700">{app.application_status}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-500">Risk Grade: <span className="font-medium text-gray-900">{app.risk_grade}</span></div>
                        <div className="space-x-2">
                          {app.application_status === 'approved' && (
                            <button onClick={() => openLoanDetails(app)} className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                              <Eye className="h-4 w-4 mr-2" /> View Loan
                            </button>
                          )}
                        </div>
                      </div>

                      {app.application_status === 'rejected' && app.rejection_reason && (
                        <div className="mt-3 text-sm text-red-600">Rejection reason: {app.rejection_reason}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Loans</h2>
              {activeLoans.length === 0 ? (
                <div className="text-sm text-gray-500">You have no active loans at the moment.</div>
              ) : (
                <div className="space-y-4">
                  {activeLoans.map((loan) => (
                    <div key={loan.loan_id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm text-gray-600">Loan ID</div>
                          <div className="font-medium text-gray-900">{loan.loan_id}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Disbursed</div>
                          <div className="text-sm text-gray-900">{new Date(loan.disbursement_date).toLocaleDateString()}</div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Principal</div>
                          <div className="font-medium text-gray-900">{formatCurrency(loan.principal_amount)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Monthly Payment</div>
                          <div className="font-medium text-gray-900">{formatCurrency(loan.monthly_payment)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Amount Remaining</div>
                          <div className="font-medium text-gray-900">{formatCurrency(loan.amount_remaining)}</div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-500">Next payment: <span className="text-gray-900">{new Date(loan.next_payment_date).toLocaleDateString()}</span></div>
                        <div>
                          <span className="text-sm text-gray-700">Lender: </span>
                          <span className="font-medium text-gray-900">{loan.corporate?.corporation_name || '—'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Details Modal */}
        {detailModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Loan Details</h3>
                <button onClick={() => setDetailModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
              </div>

              {detailLoading ? (
                <div className="text-center py-12 text-gray-600">Loading details...</div>
              ) : detailError ? (
                <div className="text-center py-6 text-red-600">{detailError}</div>
              ) : selectedDetail ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Loan ID</div>
                      <div className="font-medium text-gray-900">{selectedDetail.loan_id}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Corporate</div>
                      <div className="font-medium text-gray-900">{selectedDetail.corporate?.corporation_name || '—'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Principal</div>
                      <div className="font-medium text-gray-900">{formatCurrency(selectedDetail.principal_amount)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Interest Rate</div>
                      <div className="font-medium text-gray-900">{selectedDetail.interest_rate}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Term</div>
                      <div className="font-medium text-gray-900">{selectedDetail.loan_term_months} months</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600">Monthly Payment</div>
                    <div className="font-medium text-gray-900">{formatCurrency(selectedDetail.monthly_payment)}</div>
                  </div>

                  <div className="text-sm text-gray-500">Total repayable: {formatCurrency(selectedDetail.total_repayable)}</div>
                </div>
              ) : (
                <div className="text-center text-sm text-gray-500">No details available</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SMEStatus;
