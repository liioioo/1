import React, { useState } from 'react';
import { ChevronLeft, Wallet, CreditCard, Lock, Plus, KeyRound, ShieldCheck, History, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { BankCard, WalletTransaction } from '../../../types';
import { soundManager } from '../../../utils/audio';

interface WalletPageProps {
  balance: number;
  bankCards: BankCard[];
  transactions: WalletTransaction[];
  paymentPin: string;
  onBack: () => void;
  onRecharge: (amount: number) => void;
  onAddBankCard: (card: BankCard) => void;
  onUpdatePin: (newPin: string) => void;
}

export const WalletPage: React.FC<WalletPageProps> = ({
  balance,
  bankCards,
  transactions,
  paymentPin,
  onBack,
  onRecharge,
  onAddBankCard,
  onUpdatePin,
}) => {
  // Modals
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeAmtInput, setRechargeAmtInput] = useState('500');

  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [newBankName, setNewBankName] = useState('招商银行');
  const [newCardType, setNewCardType] = useState('储蓄卡');
  const [newCardNumber, setNewCardNumber] = useState('8888');
  const [newCardBalance, setNewCardBalance] = useState('10000');

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');

  const handleRechargeSubmit = () => {
    const val = parseFloat(rechargeAmtInput);
    if (isNaN(val) || val <= 0) return;
    soundManager.playTap();
    onRecharge(val);
    setShowRechargeModal(false);
    setRechargeAmtInput('500');
  };

  const handleAddCardSubmit = () => {
    if (!newBankName.trim() || !newCardNumber.trim()) {
      alert('请填写银行名称与卡号尾号！');
      return;
    }
    soundManager.playTap();
    const initBalance = parseFloat(newCardBalance) || 0;
    const newCard: BankCard = {
      id: `bc-${Date.now()}`,
      bankName: newBankName.trim(),
      cardType: newCardType,
      cardNumber: `**** ${newCardNumber.slice(-4)}`,
      balance: initBalance,
    };
    onAddBankCard(newCard);
    setShowAddCardModal(false);
    setNewCardNumber('8888');
    setNewCardBalance('10000');
  };

  const handlePinSubmit = () => {
    if (pinInput.length !== 6 || !/^\d+$/.test(pinInput)) {
      alert('请输入 6 位纯数字支付密码！');
      return;
    }
    soundManager.playTap();
    onUpdatePin(pinInput);
    setShowPinModal(false);
    setPinInput('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f1f1f1] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden animate-fade-in relative">
      {/* Top Header */}
      <div className="bg-[#edf0f2] dark:bg-zinc-900 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 z-20">
        <button onClick={onBack} className="flex items-center text-zinc-800 dark:text-zinc-200 text-xs font-semibold">
          <ChevronLeft className="w-5 h-5 -ml-1 text-zinc-900 dark:text-zinc-100" />
          返回
        </button>
        <span className="font-bold text-sm">微信支付 / 钱包</span>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Payment PIN Security Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3.5 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs">支付安全密码</div>
              <div className="text-[10px] text-zinc-400">已设置 6 位数字支付密码 ({paymentPin.replace(/./g, '*')})</div>
            </div>
          </div>

          <button
            onClick={() => setShowPinModal(true)}
            className="text-xs bg-white border border-zinc-900 text-zinc-900 font-bold px-2.5 py-1.5 rounded-xl hover:bg-zinc-50 transition-colors shadow-sm"
          >
            重置密码
          </button>
        </div>

        {/* Balance Card */}
        <div className="bg-white border border-zinc-900 text-zinc-900 p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-500 font-medium flex items-center gap-1">
              <Wallet className="w-4 h-4" /> 微信零钱总额 (元)
            </div>
            <div className="text-3xl font-black font-mono mt-1">¥{balance.toFixed(2)}</div>
          </div>

          <button
            onClick={() => setShowRechargeModal(true)}
            className="bg-white border border-zinc-900 text-zinc-900 font-extrabold text-xs px-4 py-2 rounded-2xl shadow-sm hover:bg-zinc-50 transition-all active:scale-95"
          >
            + 充值
          </button>
        </div>

        {/* Bank Cards Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <span className="font-bold text-xs flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-zinc-900 dark:text-zinc-100" /> 我的银行卡 ({bankCards.length})
            </span>
            <button
              onClick={() => setShowAddCardModal(true)}
              className="text-xs text-zinc-900 dark:text-zinc-100 hover:underline font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> 添加银行卡
            </button>
          </div>

          {bankCards.length === 0 ? (
            <div className="text-center py-6 text-zinc-400 text-xs">
              暂无已绑定银行卡 (初始为无)，点击上方 “+ 添加银行卡” 绑定
            </div>
          ) : (
            <div className="space-y-2">
              {bankCards.map((card) => (
                <div
                  key={card.id}
                  className="p-3 bg-white border border-zinc-900 text-zinc-900 rounded-2xl shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-zinc-900" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs">{card.bankName}</div>
                      <div className="text-[10px] text-zinc-500">{card.cardType} · {card.cardNumber}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-zinc-400">卡内可用余额</div>
                    <div className="font-mono font-bold text-xs text-zinc-900">¥{card.balance.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detailed Transaction History Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <span className="font-bold text-xs flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <History className="w-4 h-4 text-zinc-900 dark:text-zinc-100" /> 资金流水账单记录
          </span>

          {transactions.length === 0 ? (
            <div className="text-center py-6 text-zinc-400 text-xs">暂无流水记录</div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-2.5 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${tx.type === 'income' ? 'bg-zinc-50 text-zinc-900 border-zinc-900' : 'bg-white text-zinc-400 border-zinc-200'}`}>
                      {tx.type === 'income' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{tx.title}</div>
                      <div className="text-[10px] text-zinc-400">{tx.time} | 渠道: {tx.method}</div>
                    </div>
                  </div>

                  <span className={`font-mono font-extrabold text-sm ${tx.type === 'income' ? 'text-zinc-900 font-black' : 'text-zinc-400'}`}>
                    {tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recharge Modal */}
      {showRechargeModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 w-full max-w-xs border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-2xl">
            <h3 className="font-bold text-sm">充值微信零钱</h3>
            <input
              type="number"
              value={rechargeAmtInput}
              onChange={(e) => setRechargeAmtInput(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm font-mono font-bold"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowRechargeModal(false)} className="px-3 py-1.5 text-xs text-zinc-400">取消</button>
              <button onClick={handleRechargeSubmit} className="px-4 py-1.5 text-xs bg-white border border-zinc-900 text-zinc-900 font-bold rounded-xl shadow-sm hover:bg-zinc-50 transition-colors">确认充值</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Bank Card Modal */}
      {showAddCardModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 w-full max-w-xs border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-2xl">
            <h3 className="font-bold text-sm">添加新银行卡</h3>

            <div className="space-y-2">
              <div>
                <label className="text-[10px] font-bold text-zinc-400">选择银行</label>
                <select
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs"
                >
                  <option value="招商银行">招商银行</option>
                  <option value="工商银行">工商银行</option>
                  <option value="建设银行">建设银行</option>
                  <option value="农业银行">农业银行</option>
                  <option value="中国银行">中国银行</option>
                  <option value="支付宝余额宝">支付宝余额宝</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400">卡类型</label>
                <select
                  value={newCardType}
                  onChange={(e) => setNewCardType(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs"
                >
                  <option value="储蓄卡">储蓄卡</option>
                  <option value="信用卡">信用卡</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400">卡号尾号 (4位)</label>
                <input
                  type="text"
                  maxLength={4}
                  value={newCardNumber}
                  onChange={(e) => setNewCardNumber(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400">自行设置卡内初始余额 (元)</label>
                <input
                  type="number"
                  value={newCardBalance}
                  onChange={(e) => setNewCardBalance(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button onClick={() => setShowAddCardModal(false)} className="px-3 py-1.5 text-xs text-zinc-400">取消</button>
              <button onClick={handleAddCardSubmit} className="px-3 py-1.5 text-xs bg-white border border-zinc-900 text-zinc-900 font-bold rounded-xl shadow-sm hover:bg-zinc-50 transition-colors">绑定并开卡</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment PIN Reset Modal */}
      {showPinModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 w-full max-w-xs border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-2xl">
            <h3 className="font-bold text-sm">设置 6 位支付安全密码</h3>
            <input
              type="password"
              maxLength={6}
              placeholder="例如: 123456"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-center text-lg font-mono tracking-widest focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowPinModal(false)} className="px-3 py-1.5 text-xs text-zinc-400">取消</button>
              <button onClick={handlePinSubmit} className="px-3 py-1.5 text-xs bg-white border border-zinc-900 text-zinc-900 font-bold rounded-xl shadow-sm hover:bg-zinc-50 transition-colors">保存密码</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
