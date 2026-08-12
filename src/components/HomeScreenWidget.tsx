import React, { useState, useEffect, useRef } from 'react';
import { Cat, Sun } from 'lucide-react';

export const TopTimeWidget: React.FC = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const month = time.getMonth() + 1;
  const date = time.getDate();
  const year = time.getFullYear();
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const monthName = monthNames[time.getMonth()];

  const getCalendarGrid = () => {
    const currentDayOfWeek = time.getDay();
    const startOfCurrentWeek = new Date(year, time.getMonth(), date - currentDayOfWeek);

    const grid = [];
    for (let w = 0; w < 3; w++) {
      const row = [];
      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(startOfCurrentWeek.getFullYear(), startOfCurrentWeek.getMonth(), startOfCurrentWeek.getDate() + (w * 7) + d);
        row.push(cellDate.getDate());
      }
      grid.push(row);
    }
    return grid;
  };

  const grid = getCalendarGrid();

  return (
    <div className="w-full flex flex-col items-center select-none text-zinc-900 dark:text-zinc-100">
      <div className="text-[1.25rem] font-bold mb-1 tracking-wider">
        {month}月{date}日 · 乙巳年腊月初十
      </div>
      <div
        className="text-[6.5rem] leading-none font-black tracking-tighter mb-3"
        style={{ fontFamily: 'ui-rounded, "Arial Rounded MT Bold", sans-serif' }}
      >
        {hours}:{minutes}
      </div>
      <div className="flex items-center justify-between w-full px-6 max-w-[380px]">
        <Cat size={56} strokeWidth={1.5} className="text-zinc-800 dark:text-zinc-200" />
        <Sun size={56} strokeWidth={1.5} className="text-zinc-800 dark:text-zinc-200" />
        <div className="flex gap-4">
          <div className="flex flex-col items-end justify-between py-1 font-bold">
            <span className="text-[1.8rem] leading-none mb-1">{date}</span>
            <span className="text-[11px] text-zinc-500">{year}</span>
            <span className="text-[11px] text-zinc-500">{monthName}</span>
          </div>
          <div className="flex flex-col text-[10px] font-mono gap-1 font-bold mt-1">
            <div className="flex justify-between w-[120px] text-zinc-400 mb-0.5">
              <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
            </div>
            {grid.map((row, i) => (
              <div key={i} className="flex justify-between w-[120px]">
                {row.map((d, j) => (
                  <span
                    key={j}
                    className={`w-[18px] h-[18px] flex items-center justify-center ${
                      d === date && i === 0
                        ? 'rounded-full border-[1.5px] border-zinc-900 dark:border-zinc-100'
                        : ''
                    }`}
                  >
                    {d}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ChatBubblesWidget: React.FC = () => {
  const [img1, setImg1] = useState('https://api.dicebear.com/9.x/notionists/svg?seed=Mia');
  const [img2, setImg2] = useState('https://api.dicebear.com/9.x/notionists/svg?seed=Jocelyn');
  const [text1, setText1] = useState('.*+ 〰〰 ୨୧ 〰〰 ✧.+°');
  const [text2, setText2] = useState('.*+ * . . * . .+');

  const fileInput1Ref = useRef<HTMLInputElement>(null);
  const fileInput2Ref = useRef<HTMLInputElement>(null);

  const [isEditing1, setIsEditing1] = useState(false);
  const [isEditing2, setIsEditing2] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, setImg: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImg(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 px-2 select-none">
      {/* Hidden File Inputs */}
      <input type="file" accept="image/*" className="hidden" ref={fileInput1Ref} onChange={(e) => handleImageChange(e, setImg1)} />
      <input type="file" accept="image/*" className="hidden" ref={fileInput2Ref} onChange={(e) => handleImageChange(e, setImg2)} />

      {/* Top Bubble */}
      <div className="flex items-center -space-x-3">
        <div
          className="w-[42px] h-[42px] rounded-full bg-zinc-200 border-[2px] border-[#f8f9fa] dark:border-[#09090b] shadow-sm z-10 overflow-hidden flex-shrink-0 relative cursor-pointer group"
          onClick={() => fileInput1Ref.current?.click()}
        >
          <img src={img1} alt="avatar" className="w-full h-full object-cover scale-[1.15] -translate-y-1" />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <span className="text-white text-[8px] font-bold">更换</span>
          </div>
        </div>
        <div
          className="bg-zinc-100/90 dark:bg-zinc-800/80 backdrop-blur-xl pl-6 pr-5 py-2.5 rounded-[20px] shadow-sm flex items-center justify-center min-w-[100px] cursor-text"
          onClick={() => setIsEditing1(true)}
        >
          {isEditing1 ? (
            <input
              type="text"
              value={text1}
              onChange={(e) => setText1(e.target.value)}
              onBlur={() => setIsEditing1(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditing1(false)}
              autoFocus
              className="bg-transparent outline-none border-none text-zinc-600 dark:text-zinc-400 tracking-[0.2em] text-[10px] font-semibold w-full min-w-[100px]"
            />
          ) : (
            <span className="text-zinc-600 dark:text-zinc-400 tracking-[0.2em] text-[10px] font-semibold whitespace-nowrap overflow-hidden">
              {text1}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Bubble */}
      <div className="flex items-center flex-row-reverse -space-x-3 space-x-reverse ml-auto">
        <div
          className="w-[42px] h-[42px] rounded-full bg-zinc-200 border-[2px] border-[#f8f9fa] dark:border-[#09090b] shadow-sm z-10 overflow-hidden flex-shrink-0 relative cursor-pointer group"
          onClick={() => fileInput2Ref.current?.click()}
        >
          <img src={img2} alt="avatar" className="w-full h-full object-cover scale-[1.15]" />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <span className="text-white text-[8px] font-bold">更换</span>
          </div>
        </div>
        <div
          className="bg-zinc-100/90 dark:bg-zinc-800/80 backdrop-blur-xl pr-6 pl-5 py-2.5 rounded-[20px] shadow-sm flex items-center justify-center min-w-[100px] cursor-text"
          onClick={() => setIsEditing2(true)}
        >
          {isEditing2 ? (
            <input
              type="text"
              value={text2}
              onChange={(e) => setText2(e.target.value)}
              onBlur={() => setIsEditing2(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditing2(false)}
              autoFocus
              className="bg-transparent outline-none border-none text-zinc-600 dark:text-zinc-400 tracking-[0.3em] text-[10px] font-semibold w-full min-w-[100px] text-right"
            />
          ) : (
            <span className="text-zinc-600 dark:text-zinc-400 tracking-[0.3em] text-[10px] font-semibold whitespace-nowrap overflow-hidden">
              {text2}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
