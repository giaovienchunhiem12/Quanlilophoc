import React, { useState, useMemo } from 'react';
import { Student, User } from '../types';
import { exportTuitionToExcel } from '../utils/excelExport';
import { 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Download, 
  CreditCard, 
  Receipt, 
  Clock, 
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Settings,
  Coffee
} from 'lucide-react';

interface TuitionProps {
  currentUser: User;
  students: Student[];
  onToggleTuitionPaid: (studentId: string, paid: boolean) => void;
  onToggleLunchPaid?: (studentId: string, paid: boolean) => void;
  onUpdateBulkTuition?: (bantruAmount: number, haibuoiAmount: number) => void;
  onUpdateBulkLunch?: (lunchAmount: number) => void;
  onUpdatePaymentPromiseDate?: (studentId: string, promiseDate: string) => void;
  onUpdateIndividualTuition?: (studentId: string, newAmount: number) => void;
}

export default function Tuition({ 
  currentUser, 
  students, 
  onToggleTuitionPaid, 
  onToggleLunchPaid,
  onUpdateBulkTuition,
  onUpdateBulkLunch,
  onUpdatePaymentPromiseDate,
  onUpdateIndividualTuition
}: TuitionProps) {
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [search, setSearch] = useState('');
  const [showSimulatePayment, setShowSimulatePayment] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  // Bulk tuition rates setup states
  const [bulkBantru, setBulkBantru] = useState<number>(() => {
    return students.find(s => s.learningMode === 'Bán trú')?.tuitionAmount ?? 2200000;
  });
  const [bulkHaibuoi, setBulkHaibuoi] = useState<number>(() => {
    return students.find(s => s.learningMode === 'Ngoại trú')?.tuitionAmount ?? 1800000;
  });
  const [showBulkSuccess, setShowBulkSuccess] = useState(false);

  // Bulk lunch rate state
  const [bulkLunch, setBulkLunch] = useState<number>(() => {
    return students.find(s => s.learningMode === 'Bán trú')?.lunchAmount ?? 800000;
  });
  const [showBulkLunchSuccess, setShowBulkLunchSuccess] = useState(false);

  // Inline editing states
  const [editingTuitionId, setEditingTuitionId] = useState<string | null>(null);
  const [tuitionInput, setTuitionInput] = useState<string>('');

  // Compute average or current rate from actual student list
  const currentBantruRate = useMemo(() => {
    const sList = students.filter(s => s.learningMode === 'Bán trú');
    return sList.length > 0 ? sList[0].tuitionAmount : 2200000;
  }, [students]);

  const currentHaibuoiRate = useMemo(() => {
    const sList = students.filter(s => s.learningMode === 'Ngoại trú');
    return sList.length > 0 ? sList[0].tuitionAmount : 1800000;
  }, [students]);

  const currentLunchRate = useMemo(() => {
    const sList = students.filter(s => s.learningMode === 'Bán trú');
    return sList.length > 0 && sList[0].lunchAmount !== undefined ? sList[0].lunchAmount : 800000;
  }, [students]);

  const handleBulkUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateBulkTuition) {
      onUpdateBulkTuition(bulkBantru, bulkHaibuoi);
      setShowBulkSuccess(true);
      setTimeout(() => setShowBulkSuccess(false), 3500);
    }
  };

  const handleTuitionCellClick = (student: Student) => {
    if (currentUser.role !== 'teacher') return;
    setEditingTuitionId(student.id);
    setTuitionInput(student.tuitionAmount.toString());
  };

  const handleTuitionSave = (studentId: string) => {
    if (editingTuitionId === studentId && onUpdateIndividualTuition) {
      const parsedAmount = parseInt(tuitionInput, 10);
      if (!isNaN(parsedAmount) && parsedAmount >= 0) {
        onUpdateIndividualTuition(studentId, parsedAmount);
      }
    }
    setEditingTuitionId(null);
  };

  const handleTuitionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, studentId: string) => {
    if (e.key === 'Enter') {
      handleTuitionSave(studentId);
    } else if (e.key === 'Escape') {
      setEditingTuitionId(null);
    }
  };

  const handleBulkLunchUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateBulkLunch) {
      onUpdateBulkLunch(bulkLunch);
      setShowBulkLunchSuccess(true);
      setTimeout(() => setShowBulkLunchSuccess(false), 3500);
    }
  };

  // Stats
  const total = students.length;
  const paid = students.filter(s => s.tuitionPaid).length;
  const unpaid = total - paid;
  
  const totalTuitionCollected = students.filter(s => s.tuitionPaid).reduce((sum, s) => sum + s.tuitionAmount, 0);
  const totalTuitionPending = students.filter(s => !s.tuitionPaid).reduce((sum, s) => sum + s.tuitionAmount, 0);

  const totalLunchCollected = students.filter(s => s.lunchPaid).reduce((sum, s) => sum + (s.lunchAmount || 0), 0);
  const totalLunchPending = students.filter(s => !s.lunchPaid).reduce((sum, s) => sum + (s.lunchAmount || 0), 0);

  const totalCollected = totalTuitionCollected + totalLunchCollected;
  const totalPending = totalTuitionPending + totalLunchPending;

  // Filter students
  const filteredStudents = students.filter(s => {
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'paid' ? s.tuitionPaid : !s.tuitionPaid;
    
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Find current student/parent record
  const userStudent = currentUser.studentId ? students.find(s => s.id === currentUser.studentId) : null;
  const isStudentOrParent = currentUser.role === 'student' || currentUser.role === 'parent';

  const handleSimulatedPayment = () => {
    if (!userStudent) return;
    setIsPaying(true);
    setTimeout(() => {
      setIsPaying(false);
      setPaySuccess(true);
      onToggleTuitionPaid(userStudent.id, true);
      if (onToggleLunchPaid && userStudent.learningMode === 'Bán trú') {
        onToggleLunchPaid(userStudent.id, true);
      }
    }, 1500);
  };

  // Reminders and Notifications
  const today = new Date('2026-07-12');
  const todayStr = today.toISOString().split('T')[0];
  const threeDaysFromNow = new Date(today);
  threeDaysFromNow.setDate(today.getDate() + 3);
  const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0];

  const defaultDeadline = '2026-07-15';

  const unpaidStudents = students.filter(s => !s.tuitionPaid || (s.learningMode === 'Bán trú' && !s.lunchPaid));
  
  const overdueStudents = unpaidStudents.filter(s => {
    const deadline = s.paymentPromiseDate || defaultDeadline;
    return deadline < todayStr;
  });

  const upcomingStudents = unpaidStudents.filter(s => {
    const deadline = s.paymentPromiseDate || defaultDeadline;
    return deadline >= todayStr && deadline <= threeDaysStr;
  });

  const otherUnpaidStudents = unpaidStudents.filter(s => {
    const deadline = s.paymentPromiseDate || defaultDeadline;
    return deadline > threeDaysStr;
  });

  const formatVND = (num: number) => {
    return num.toLocaleString('vi-VN') + ' ₫';
  };

  return (
    <div className="space-y-6" id="tuition-tab">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="tuition-header-box">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-indigo-600" />
            Học Phí Lớp Học
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý học phí tháng 7/2026, các cổng thanh toán trực tuyến dành cho phụ huynh và học sinh
          </p>
        </div>

        {currentUser.role === 'teacher' && (
          <button
            type="button"
            id="export-tuition-btn"
            onClick={() => exportTuitionToExcel(students, '12A4')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold border border-slate-200 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Download className="h-4 w-4" />
            Xuất báo cáo Excel
          </button>
        )}
      </div>

      {/* Role specific view: STUDENT / PARENT INVOICE */}
      {userStudent && (() => {
        const hasUnpaidFees = !userStudent.tuitionPaid || (userStudent.learningMode === 'Bán trú' && !userStudent.lunchPaid);
        const allFeesPaid = userStudent.tuitionPaid && (userStudent.learningMode !== 'Bán trú' || userStudent.lunchPaid);
        
        let personalAlert = null;
        if (hasUnpaidFees) {
          const deadline = userStudent.paymentPromiseDate || defaultDeadline;
          if (deadline < todayStr) {
            personalAlert = { type: 'overdue', msg: `Quá hạn đóng (Hạn cuối: ${deadline})` };
          } else if (deadline >= todayStr && deadline <= threeDaysStr) {
            personalAlert = { type: 'upcoming', msg: `Sắp tới hạn đóng (Hạn cuối: ${deadline})` };
          }
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="student-tuition-view">
            
            {/* Tuition Status Card */}
            <div className="md:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between" id="student-fee-invoice">
              
              {personalAlert && personalAlert.type === 'overdue' && (
                <div className="mb-4 bg-rose-50 text-rose-800 p-3 rounded-lg flex items-center gap-2 border border-rose-200 text-sm font-bold">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <span>{personalAlert.msg}. Vui lòng hoàn thành phí trong thời gian sớm nhất.</span>
                </div>
              )}
              {personalAlert && personalAlert.type === 'upcoming' && (
                <div className="mb-4 bg-amber-50 text-amber-800 p-3 rounded-lg flex items-center gap-2 border border-amber-200 text-sm font-bold">
                  <Clock className="h-5 w-5 shrink-0" />
                  <span>{personalAlert.msg}. Vui lòng chú ý thời gian đóng học phí.</span>
                </div>
              )}

              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Học phí tháng 7/2026</span>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mt-1 font-display">Chi Tiết Phiếu Thu Hóa Đơn</h3>
                  <p className="text-xs text-slate-500 mt-1">Học sinh: <b className="text-slate-700">{userStudent.name}</b> ({userStudent.id})</p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-500 font-medium">Học phí:</span>
                    {userStudent.tuitionPaid ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded text-[10px] font-bold border border-emerald-150">
                        <CheckCircle className="h-3 w-3" /> Đã đóng
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-800 rounded text-[10px] font-bold border border-rose-150 animate-pulse">
                        <Clock className="h-3 w-3" /> Chưa đóng
                      </span>
                    )}
                  </div>
                  {userStudent.learningMode === 'Bán trú' && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500 font-medium">Tiền cơm:</span>
                      {userStudent.lunchPaid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded text-[10px] font-bold border border-emerald-150">
                          <CheckCircle className="h-3 w-3" /> Đã đóng
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-800 rounded text-[10px] font-bold border border-rose-150 animate-pulse">
                          <Clock className="h-3 w-3" /> Chưa đóng
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Receipt Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden mb-6" id="invoice-details-table">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-slate-600">Khoản thu</th>
                      <th className="px-4 py-3 text-right font-bold text-slate-600">Số tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-600 bg-white">
                    <tr>
                      <td className="px-4 py-3 text-xs">Học phí chính khóa THPT (Tháng 7)</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{formatVND(userStudent.tuitionAmount - (userStudent.busStatus === 'Đăng ký xe bus' ? 300000 : 0))}</td>
                    </tr>
                    {userStudent.learningMode === 'Bán trú' && (
                      <tr>
                        <td className="px-4 py-3 text-xs">Phí quản lý bán trú & tiền ăn trưa</td>
                        <td className="px-4 py-3 text-right font-mono text-xs">{formatVND(userStudent.lunchAmount || 800000)}</td>
                      </tr>
                    )}
                    {userStudent.busStatus === 'Đăng ký xe bus' && (
                      <tr>
                        <td className="px-4 py-3 text-xs">Phí xe bus đưa đón tại nhà (Tuyến số 1)</td>
                        <td className="px-4 py-3 text-right font-mono text-xs">300.000 ₫</td>
                      </tr>
                    )}
                    <tr className="bg-slate-50/50 font-bold text-slate-800">
                      <td className="px-4 py-3 text-xs">Tổng cộng các khoản thu</td>
                      <td className="px-4 py-3 text-right text-xs text-indigo-600 font-mono">
                        {formatVND(userStudent.tuitionAmount + (userStudent.learningMode === 'Bán trú' ? (userStudent.lunchAmount || 800000) : 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Simulated Payment Trigger */}
              {hasUnpaidFees && !showSimulatePayment && (
                <button
                  type="button"
                  id="pay-now-btn"
                  onClick={() => { setShowSimulatePayment(true); setPaySuccess(false); }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  <CreditCard className="h-5 w-5" />
                  Thanh Toán Trực Tuyến
                </button>
              )}

              {allFeesPaid && (
                <div className="bg-emerald-50 text-emerald-800 p-4 rounded-lg flex items-center gap-3 border border-emerald-150" id="payment-success-msg">
                  <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-sm">Tất cả các khoản phí đã hoàn thành!</p>
                    <p className="mt-0.5 text-slate-500">Cảm ơn Quý phụ huynh và học sinh đã thực hiện đóng học phí và tiền cơm đúng thời hạn quy định.</p>
                  </div>
                </div>
              )}
            </div>

            {/* QR Payment Gateway */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm" id="payment-gateway-sim">
              {showSimulatePayment && hasUnpaidFees ? (
                <div className="space-y-4" id="sim-gateway-box">
                  <h4 className="font-bold text-slate-800 font-display text-xs uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-1.5">
                    <Receipt className="h-4 w-4 text-indigo-600" />
                    Thanh Toán Học Phí & Tiền Cơm (Mã QR)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {!userStudent.tuitionPaid && (
                      <div className="border border-slate-200 p-3 rounded-lg flex flex-col items-center text-center">
                        <p className="text-xs font-bold text-slate-700 mb-2">QR Tiền Học Phí</p>
                        <img src="https://img.vietqr.io/image/vietinbank-113657017979-compact2.png" alt="QR Học phí" className="w-full max-w-[220px] aspect-square object-contain rounded-lg border border-slate-100" />
                        <p className="text-[10px] font-mono font-bold mt-2 text-indigo-600">{formatVND(userStudent.tuitionAmount)}</p>
                      </div>
                    )}
                    {userStudent.learningMode === 'Bán trú' && !userStudent.lunchPaid && (
                      <div className="border border-slate-200 p-3 rounded-lg flex flex-col items-center text-center">
                        <p className="text-xs font-bold text-slate-700 mb-2">QR Tiền Cơm</p>
                        <img src="https://storage.googleapis.com/mpx-node/snaps/b6ea5561-bdfe-481b-a5d5-86f2b4ffaf35.jpg" alt="QR Tiền cơm" className="w-full max-w-[220px] aspect-square object-contain rounded-lg border border-slate-100" />
                        <p className="text-[10px] font-mono font-bold mt-2 text-indigo-600">{formatVND(userStudent.lunchAmount || 800000)}</p>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 space-y-2 mt-4" id="sim-card-form">
                    <p className="font-semibold text-slate-700">Xác nhận thanh toán học phí & tiền cơm:</p>
                    <p className="flex justify-between border-b border-dashed border-slate-150 pb-1">
                      <span>Số tiền:</span>
                      <b className="text-indigo-600 font-mono">{formatVND(
                        (!userStudent.tuitionPaid ? userStudent.tuitionAmount : 0) +
                        (userStudent.learningMode === 'Bán trú' && !userStudent.lunchPaid ? (userStudent.lunchAmount || 800000) : 0)
                      )}</b>
                    </p>
                    <p className="flex justify-between">
                      <span>Nguồn nộp:</span>
                      <span className="font-semibold text-slate-700">Ngân hàng liên kết</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    id="confirm-pay-btn"
                    onClick={handleSimulatedPayment}
                    disabled={isPaying}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:bg-emerald-400"
                  >
                    {isPaying ? (
                      <>
                        <span className="animate-spin">🔄</span> Đang xác nhận...
                      </>
                    ) : (
                      <>
                        Đã chuyển khoản {formatVND(
                          (!userStudent.tuitionPaid ? userStudent.tuitionAmount : 0) +
                          (userStudent.learningMode === 'Bán trú' && !userStudent.lunchPaid ? (userStudent.lunchAmount || 800000) : 0)
                        )}
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 flex flex-col items-center justify-center space-y-3" id="sim-gateway-empty">
                  <Receipt className="h-12 w-12 text-slate-300" />
                  <div className="text-xs max-w-[200px] font-medium leading-relaxed">
                    {allFeesPaid 
                      ? 'Bạn đã đóng đầy đủ các khoản học phí và tiền cơm! Không có hóa đơn chờ nộp.' 
                      : 'Bấm nút "Thanh Toán Trực Tuyến" ở bên để xem mã QR.'}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Stats row (Teacher sees this, students also see high-level overview if desired) */}
      {!isStudentOrParent && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2" id="tuition-reminders-boxes">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-rose-800 text-sm uppercase flex items-center gap-2 mb-3"><AlertTriangle className="h-4 w-4" /> Quá hạn đóng</h3>
              {overdueStudents.length === 0 ? <p className="text-xs text-rose-600 font-medium">Không có học sinh nào.</p> : (
                <ul className="text-xs text-rose-700 space-y-1.5 font-medium max-h-[120px] overflow-y-auto pr-2">
                  {overdueStudents.map(s => <li key={s.id} className="flex justify-between"><span>{s.name}</span> <span className="text-[10px] bg-rose-200 text-rose-800 px-1 rounded">{s.paymentPromiseDate || defaultDeadline}</span></li>)}
                </ul>
              )}
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-amber-800 text-sm uppercase flex items-center gap-2 mb-3"><Clock className="h-4 w-4" /> Sắp tới hạn</h3>
              {upcomingStudents.length === 0 ? <p className="text-xs text-amber-600 font-medium">Không có học sinh nào.</p> : (
                <ul className="text-xs text-amber-700 space-y-1.5 font-medium max-h-[120px] overflow-y-auto pr-2">
                  {upcomingStudents.map(s => <li key={s.id} className="flex justify-between"><span>{s.name}</span> <span className="text-[10px] bg-amber-200 text-amber-800 px-1 rounded">{s.paymentPromiseDate || defaultDeadline}</span></li>)}
                </ul>
              )}
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm uppercase flex items-center gap-2 mb-3"><Clock className="h-4 w-4 text-slate-500" /> Chưa đóng (Còn hạn)</h3>
              {otherUnpaidStudents.length === 0 ? <p className="text-xs text-slate-600 font-medium">Không có học sinh nào.</p> : (
                <ul className="text-xs text-slate-700 space-y-1.5 font-medium max-h-[120px] overflow-y-auto pr-2">
                  {otherUnpaidStudents.map(s => <li key={s.id} className="flex justify-between"><span>{s.name}</span> <span className="text-[10px] bg-slate-200 text-slate-700 px-1 rounded">{s.paymentPromiseDate || defaultDeadline}</span></li>)}
                </ul>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="tuition-stats-boxes">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4" id="stat-total-revenue">
            <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Doanh Thu Phí Tháng 7</p>
              <h3 className="text-xl font-black text-slate-900 mt-1 font-mono">
                {formatVND(totalCollected + totalPending)}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                HP: <span className="font-bold text-indigo-600">{formatVND(totalTuitionCollected + totalTuitionPending)}</span> • Cơm: <span className="font-bold text-teal-600">{formatVND(totalLunchCollected + totalLunchPending)}</span>
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4" id="stat-collected">
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Số Tiền Đã Thu Được</p>
              <h3 className="text-xl font-black text-emerald-600 mt-1 font-mono">
                {formatVND(totalCollected)}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                HP: <span className="font-bold text-emerald-600">{formatVND(totalTuitionCollected)}</span> • Cơm: <span className="font-bold text-teal-600">{formatVND(totalLunchCollected)}</span>
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4" id="stat-pending">
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Số Tiền Còn Nợ Đọng</p>
              <h3 className="text-xl font-black text-rose-600 mt-1 font-mono">
                {formatVND(totalPending)}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                HP: <span className="font-bold text-rose-600">{formatVND(totalTuitionPending)}</span> • Cơm: <span className="font-bold text-rose-600">{formatVND(totalLunchPending)}</span>
              </p>
            </div>
          </div>
        </div>
        </>
      )}

      {/* Teacher Only: Bulk Updates Setting Panels */}
      {currentUser.role === 'teacher' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="bulk-updates-panels">
          {/* Tuition Fee Panel */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all" id="bulk-tuition-panel">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5" id="bulk-tuition-header-wrapper">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm font-display uppercase tracking-wider flex items-center gap-2" id="bulk-tuition-title">
                  <span className="p-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg">
                    <Settings className="h-4 w-4 animate-spin-slow" />
                  </span>
                  Cập Nhật Học Phí Đồng Loạt
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Áp dụng mức học phí mới cho học sinh bán trú và hai buổi (ngoại trú)
                </p>
              </div>
              
              {showBulkSuccess && (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl animate-bounce flex items-center gap-1.5 shadow-sm" id="bulk-success-badge">
                  ✨ Đã cập nhật!
                </span>
              )}
            </div>

            <form onSubmit={handleBulkUpdateSubmit} className="space-y-4" id="bulk-tuition-form">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div id="field-bulk-bantru">
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2 tracking-wide">Chế độ Bán trú</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold font-mono">₫</span>
                    <input
                      type="number"
                      min="0"
                      step="50000"
                      value={bulkBantru}
                      onChange={(e) => setBulkBantru(parseInt(e.target.value) || 0)}
                      className="w-full pl-7 pr-4 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition-all shadow-inner"
                      placeholder="Nhập số tiền..."
                      id="input-bulk-bantru"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Hiện tại: <span className="font-bold text-slate-600">{formatVND(currentBantruRate)}</span></p>
                </div>

                <div id="field-bulk-haibuoi">
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2 tracking-wide">Hai buổi (Ngoại trú)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold font-mono">₫</span>
                    <input
                      type="number"
                      min="0"
                      step="50000"
                      value={bulkHaibuoi}
                      onChange={(e) => setBulkHaibuoi(parseInt(e.target.value) || 0)}
                      className="w-full pl-7 pr-4 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition-all shadow-inner"
                      placeholder="Nhập số tiền..."
                      id="input-bulk-haibuoi"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Hiện tại: <span className="font-bold text-slate-600">{formatVND(currentHaibuoiRate)}</span></p>
                </div>
              </div>

              <button
                type="submit"
                id="btn-bulk-tuition-submit"
                className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 h-[34px]"
              >
                Cập Nhật Học Phí Đồng Loạt
              </button>
            </form>
          </div>

          {/* Lunch Fee Panel */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all" id="bulk-lunch-panel">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5" id="bulk-lunch-header-wrapper">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm font-display uppercase tracking-wider flex items-center gap-2" id="bulk-lunch-title">
                  <span className="p-1.5 bg-teal-50 border border-teal-100 text-teal-600 rounded-lg">
                    <Coffee className="h-4 w-4" />
                  </span>
                  Cập Nhật Tiền Cơm Đồng Loạt
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tự động cập nhật tiền cơm áp dụng cho toàn bộ học sinh có chế độ Bán trú
                </p>
              </div>
              
              {showBulkLunchSuccess && (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl animate-bounce flex items-center gap-1.5 shadow-sm" id="bulk-lunch-success-badge">
                  ✨ Đã cập nhật!
                </span>
              )}
            </div>

            <form onSubmit={handleBulkLunchUpdateSubmit} className="space-y-4" id="bulk-lunch-form">
              <div id="field-bulk-lunch">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wide">Số tiền cơm tự động</label>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold font-mono">₫</span>
                  <input
                    type="number"
                    min="0"
                    value={bulkLunch}
                    onChange={(e) => setBulkLunch(parseInt(e.target.value) || 0)}
                    className="w-full pl-7 pr-4 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:bg-white rounded-xl outline-none transition-all shadow-inner"
                    placeholder="Nhập số tiền cơm mới..."
                    id="input-bulk-lunch"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Hiện tại trong danh sách: <span className="font-bold text-slate-600">{formatVND(currentLunchRate)}</span></p>
              </div>

              <button
                type="submit"
                id="btn-bulk-lunch-submit"
                className="w-full py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 h-[34px]"
              >
                Cập Nhật Tiền Cơm Tự Động
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Teacher View: FULL LIST OF STUDENTS TUITION STATUS */}
      {!isStudentOrParent && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" id="tuition-students-table-section">
          <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50" id="table-controls">
            <div id="table-filter-title">
              <h3 className="font-bold text-slate-900 font-display text-sm uppercase tracking-wider">Danh Sách Học Phí Chi Tiết</h3>
              <p className="text-xs text-slate-500 mt-1">Giáo viên quản lý đóng phí hoặc phụ huynh theo dõi đối soát chéo</p>
            </div>

            <div className="flex flex-wrap items-center gap-3" id="table-filters-wrapper">
              {/* Search */}
              <div className="px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-xs flex items-center gap-2">
                <span>🔍</span>
                <input
                  type="text"
                  placeholder="Tìm tên học sinh..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent border-0 focus:outline-none text-xs w-40 text-slate-700"
                />
              </div>

              {/* Filter buttons */}
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  id="filter-tuition-all"
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded cursor-pointer ${filter === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'}`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  id="filter-tuition-paid"
                  onClick={() => setFilter('paid')}
                  className={`px-3 py-1 rounded cursor-pointer ${filter === 'paid' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600'}`}
                >
                  Đã đóng
                </button>
                <button
                  type="button"
                  id="filter-tuition-unpaid"
                  onClick={() => setFilter('unpaid')}
                  className={`px-3 py-1 rounded cursor-pointer ${filter === 'unpaid' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600'}`}
                >
                  Chưa đóng
                </button>
              </div>
            </div>
          </div>

          {/* Table layout */}
          <div className="overflow-x-auto" id="tuition-table-wrapper">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">STT</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Mã Học Sinh</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Học Sinh</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Chế độ học</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">SĐT Phụ Huynh</th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Học phí phải thu</th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Tiền cơm bán trú</th>
                  <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng Thái</th>
                  <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Hẹn ngày đóng</th>
                  {currentUser.role === 'teacher' && (
                    <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Thao tác</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                {filteredStudents.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-medium">{idx + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-bold text-slate-500">{s.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-850">{s.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                        s.learningMode === 'Bán trú'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {s.learningMode}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-xs">{s.parentPhone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-800 font-mono">
                      {editingTuitionId === s.id ? (
                        <div className="flex flex-col gap-1 items-end">
                          <input
                            type="number"
                            value={tuitionInput}
                            onChange={(e) => setTuitionInput(e.target.value)}
                            onKeyDown={(e) => handleTuitionKeyDown(e, s.id)}
                            onBlur={() => handleTuitionSave(s.id)}
                            autoFocus
                            className="px-2 py-1 text-xs text-right font-mono bg-white border border-indigo-500 rounded outline-none w-28"
                          />
                          <span className="text-[10px] text-slate-400 font-normal">Nhấn Enter để lưu</span>
                        </div>
                      ) : (
                        <span 
                          onClick={() => handleTuitionCellClick(s)}
                          className={currentUser.role === 'teacher' ? "cursor-pointer hover:text-indigo-600 transition-colors hover:underline" : ""}
                          title={currentUser.role === 'teacher' ? "Nhấn để chỉnh sửa" : ""}
                        >
                          {formatVND(s.tuitionAmount)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-700 font-mono">
                      {formatVND(s.learningMode === 'Bán trú' ? (s.lunchAmount !== undefined ? s.lunchAmount : 800000) : 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex flex-col gap-1.5 items-center justify-center">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400 font-bold min-w-[50px] text-right">Học phí:</span>
                          {s.tuitionPaid ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold border border-emerald-150">
                              <CheckCircle className="h-2.5 w-2.5" /> Đã đóng
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded text-[10px] font-bold border border-rose-150 animate-pulse">
                              <XCircle className="h-2.5 w-2.5" /> Chưa đóng
                            </span>
                          )}
                        </div>
                        {s.learningMode === 'Bán trú' && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 font-bold min-w-[50px] text-right">Tiền cơm:</span>
                            {s.lunchPaid ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold border border-emerald-150">
                                <CheckCircle className="h-2.5 w-2.5" /> Đã đóng
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded text-[10px] font-bold border border-rose-150 animate-pulse">
                                <XCircle className="h-2.5 w-2.5" /> Chưa đóng
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center">
                        {s.tuitionPaid && (s.learningMode !== 'Bán trú' || s.lunchPaid) ? (
                          <span className="text-xs text-slate-400 font-medium italic">Đã đóng đủ</span>
                        ) : currentUser.role === 'teacher' ? (
                          <input
                            type="date"
                            value={s.paymentPromiseDate || ''}
                            onChange={(e) => onUpdatePaymentPromiseDate && onUpdatePaymentPromiseDate(s.id, e.target.value)}
                            className="px-2 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-500 focus:bg-white outline-none hover:border-slate-300 transition-all font-mono"
                          />
                        ) : s.paymentPromiseDate ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-mono font-bold">
                            📅 {s.paymentPromiseDate.split('-').reverse().join('/')}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Chưa hẹn ngày</span>
                        )}
                      </div>
                    </td>
                    {currentUser.role === 'teacher' && (
                      <td className="px-6 py-4 whitespace-nowrap text-center text-xs">
                        <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
                          <button
                            type="button"
                            id={`toggle-pay-${s.id}`}
                            onClick={() => onToggleTuitionPaid(s.id, !s.tuitionPaid)}
                            className={`text-[11px] px-2.5 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
                              s.tuitionPaid
                                ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            HP: {s.tuitionPaid ? 'Thu hồi' : 'Duyệt'}
                          </button>
                          {s.learningMode === 'Bán trú' && onToggleLunchPaid && (
                            <button
                              type="button"
                              id={`toggle-lunch-${s.id}`}
                              onClick={() => onToggleLunchPaid(s.id, !s.lunchPaid)}
                              className={`text-[11px] px-2.5 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
                                s.lunchPaid
                                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                                  : 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100'
                              }`}
                            >
                              Cơm: {s.lunchPaid ? 'Thu hồi' : 'Duyệt'}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}

                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={currentUser.role === 'teacher' ? 10 : 9} className="px-6 py-10 text-center text-slate-400 italic">
                      Không tìm thấy học sinh nào khớp điều kiện lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
