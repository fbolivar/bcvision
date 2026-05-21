export default function MainLoading() {
  return (
    <div className="flex flex-col flex-1 min-h-0 animate-pulse">
      <div className="h-14 border-b border-[#0f2038] px-6 flex items-center gap-4" style={{ background: 'rgba(6,10,18,0.85)' }}>
        <div className="h-4 w-32 bg-[#0f2038] rounded-lg" />
        <div className="ml-auto flex gap-3">
          <div className="h-7 w-48 bg-[#0f2038] rounded-xl" />
          <div className="h-7 w-24 bg-[#0f2038] rounded-xl" />
          <div className="h-7 w-7 bg-[#0f2038] rounded-xl" />
        </div>
      </div>
      <div className="flex-1 p-6 space-y-4 mesh-bg">
        <div className="h-24 glass rounded-2xl" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 glass rounded-2xl" />)}
        </div>
        <div className="h-72 glass rounded-2xl" />
      </div>
    </div>
  )
}
