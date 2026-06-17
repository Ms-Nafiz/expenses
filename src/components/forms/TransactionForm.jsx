import React from 'react';
import { useForm } from 'react-hook-form';
import { FaDollarSign, FaTag, FaStickyNote, FaCalendarAlt, FaMagic, FaMicrophone, FaPaste } from 'react-icons/fa';
import { suggestCategory, parseTransactionText } from '../../ai/gemini';
import { useEffect, useState, useCallback } from 'react';

const TransactionForm = ({ onSubmit, initialData, isLoading }) => {
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [smartInput, setSmartInput] = useState('');
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: initialData || {
      type: 'expense',
      amount: '',
      category: 'Food',
      note: '',
      date: new Date().toISOString().split('T')[0]
    }
  });

  const categories = [
    'Food', 'Shopping', 'Bills', 'Medical', 'Education', 
    'Entertainment', 'Transport', 'Investment', 'Other'
  ];

  const selectedCategory = watch('category');
  const noteValue = watch('note');

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (noteValue && noteValue.length > 3 && !initialData) {
        setIsSuggesting(true);
        const suggestion = await suggestCategory(noteValue);
        if (suggestion && categories.includes(suggestion)) {
          setValue('category', suggestion);
        }
        setIsSuggesting(false);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [noteValue, setValue, initialData, categories]);

  const handleSmartParse = async (text) => {
    if (!text || text.length < 5) return;
    setIsParsing(true);
    const result = await parseTransactionText(text);
    if (result) {
      if (result.amount) setValue('amount', result.amount);
      if (result.type) setValue('type', result.type);
      if (result.category) setValue('category', result.category);
      if (result.note) setValue('note', result.note);
      if (result.date) setValue('date', result.date);
    }
    setIsParsing(false);
    setSmartInput('');
  };

  const startVoiceCapture = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("এই ব্রাউজারে ভয়েস রিকগনিশন সমর্থিত নয়।");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'bn-BD'; // Use Bangla
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      handleSmartParse(transcript);
    };
    recognition.start();
  }, []);

  const handleFormSubmit = (data) => {
    const finalData = {
      ...data,
      category: data.category === 'Other' ? data.customCategory : data.category
    };
    // Remove temporary field before sending to Firebase
    delete finalData.customCategory;
    onSubmit(finalData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Smart AI Entry Section */}
      {!initialData && (
        <div className="bg-indigo-600/5 p-4 rounded-2xl border border-indigo-500/10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
              <FaMagic size={12} />
              স্মার্ট এআই এন্ট্রি
            </h4>
            <button
              type="button"
              onClick={startVoiceCapture}
              className={`p-2 rounded-xl transition-all ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30'}`}
              title="ভয়েস ইনপুট"
            >
              <FaMicrophone size={14} />
            </button>
          </div>
          <div className="relative">
              <textarea
              value={smartInput}
              onChange={(e) => setSmartInput(e.target.value)}
              placeholder="এসএমএস/ব্যাংক টেক্সট বা নোট এখানে পেস্ট করুন... (যেমন: Dinner-এ 500 টাকার খরচ)"
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300 focus:border-indigo-500 outline-none transition-all resize-none h-20"
            />
            {smartInput && (
              <button
                type="button"
                onClick={() => handleSmartParse(smartInput)}
                className="absolute bottom-3 right-3 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-500 transition-all flex items-center gap-1"
                disabled={isParsing}
              >
                {isParsing ? 'পাঠ বিশ্লেষণ হচ্ছে...' : <><FaPaste size={10} /> বের করুন</>}
              </button>
            )}
          </div>
        </div>
      )}
      <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700">
        <label className="flex-1 cursor-pointer text-center">
          <input 
            type="radio" 
            value="expense" 
            {...register('type')} 
            className="hidden peer"
          />
          <div className="py-2 rounded-lg peer-checked:bg-rose-500/20 peer-checked:text-rose-400 text-slate-400 transition-all">
            খরচ
          </div>
        </label>
        <label className="flex-1 cursor-pointer text-center">
          <input 
            type="radio" 
            value="income" 
            {...register('type')} 
            className="hidden peer"
          />
          <div className="py-2 rounded-lg peer-checked:bg-emerald-500/20 peer-checked:text-emerald-400 text-slate-400 transition-all">
            আয়
          </div>
        </label>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">৳</div>
        <input
          type="number"
          step="0.01"
          placeholder="0.00"
          {...register('amount', { required: 'টাকার পরিমাণ আবশ্যক', min: 0.01 })}
          className={`w-full bg-slate-800/50 border ${errors.amount ? 'border-rose-500' : 'border-slate-700'} rounded-xl px-12 py-3 text-white focus:border-indigo-500 outline-none`}
        />
        {watch('amount') > 10000 && watch('type') === 'expense' && (
          <div className="absolute -top-6 right-0 text-[10px] text-amber-400 flex items-center gap-1 font-bold animate-bounce">
            <FaMagic size={10} />
            বড় খরচ সতর্কতা!
          </div>
        )}
      </div>

      <div className="relative">
        <FaTag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <select
          {...register('category')}
          className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-12 py-3 text-white focus:border-indigo-500 outline-none appearance-none"
        >
          {categories.map(cat => <option key={cat} value={cat} className="bg-slate-900">{cat}</option>)}
        </select>
        {isSuggesting && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center space-x-1 text-indigo-400 text-xs animate-pulse">
          <FaMagic size={10} />
          <span>এআই পরামর্শ দিচ্ছে...</span>
          </div>
        )}
      </div>

      {selectedCategory === 'Other' && (
        <div className="relative animate-in fade-in slide-in-from-top-2 duration-300">
          <FaTag className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
          <input
            type="text"
            placeholder="কাস্টম ক্যাটেগরি নাম"
            {...register('customCategory', { required: selectedCategory === 'Other' })}
            className="w-full bg-indigo-500/10 border border-indigo-500/30 rounded-xl px-12 py-3 text-white focus:border-indigo-500 outline-none"
          />
          {errors.customCategory && <span className="text-rose-400 text-xs mt-1">অনুগ্রহ করে ক্যাটেগরির নাম লিখুন</span>}
        </div>
      )}

      <div className="relative">
        <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="date"
          {...register('date', { required: 'তারিখ আবশ্যক' })}
          className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-12 py-3 text-white focus:border-indigo-500 outline-none"
        />
      </div>

      <div className="relative">
        <FaStickyNote className="absolute left-4 top-4 text-slate-500" />
        <textarea
        placeholder="নোট (ঐচ্ছিক)"
        rows="3"
        {...register('note')}
        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-12 py-3 text-white focus:border-indigo-500 outline-none resize-none"
      ></textarea>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
      >
        {isLoading ? 'সংরক্ষণ হচ্ছে...' : (initialData ? 'লেনদেন আপডেট করুন' : 'লেনদেন যোগ করুন')}
      </button>
    </form>
  );
};

export default TransactionForm;
