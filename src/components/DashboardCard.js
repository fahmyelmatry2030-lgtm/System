export default function DashboardCard({ title, value, icon: Icon, colorClass, subtitle1, val2, subtitle2, val3 }) {
  return (
    <div className={`relative overflow-hidden p-6 rounded-3xl text-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] ${colorClass} transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.12)]`}>
      {/* Soft glass decorative circles */}
      <div className="absolute -right-8 -top-8 w-40 h-40 bg-white opacity-[0.08] rounded-full blur-xl pointer-events-none"></div>
      <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-white opacity-[0.06] rounded-full blur-xl pointer-events-none"></div>
      
      <div className="flex items-start gap-4 relative z-10">
        <div className="p-3.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
          {Icon && <Icon size={26} strokeWidth={1.5} className="text-white drop-shadow-sm" />}
        </div>
        <div className="flex-1">
          <div className="text-[28px] leading-tight font-extrabold mb-1 drop-shadow-sm tracking-tight">{value}</div>
          <div className="text-[13px] font-semibold text-white/90 uppercase tracking-wide">{title}</div>
          
          {(subtitle1 || subtitle2) && (
            <div className="mt-5 flex flex-col gap-1.5 text-xs text-white/80 font-medium">
              {subtitle1 && (
                <div className="flex justify-between items-center bg-black/5 px-2 py-1 rounded-md">
                  <span>{subtitle1}</span>
                  <span className="font-bold text-white bg-black/10 px-2 py-0.5 rounded">{val2}</span>
                </div>
              )}
              {subtitle2 && (
                <div className="flex justify-between items-center bg-black/5 px-2 py-1 rounded-md">
                  <span>{subtitle2}</span>
                  <span className="font-bold text-white bg-black/10 px-2 py-0.5 rounded">{val3}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
