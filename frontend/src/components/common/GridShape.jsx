export default function GridShape({ className = '' }) {
  return (
    <>
      <div className={`absolute right-0 top-0 -z-10 w-full max-w-[250px] xl:max-w-[450px] pointer-events-none opacity-40 ${className}`}>
        <img src="/images/shape/grid-01.svg" alt="grid pattern" className="w-full h-auto" />
      </div>
      <div className={`absolute left-0 bottom-0 -z-10 w-full max-w-[250px] rotate-180 xl:max-w-[450px] pointer-events-none opacity-40 ${className}`}>
        <img src="/images/shape/grid-01.svg" alt="grid pattern" className="w-full h-auto" />
      </div>
    </>
  )
}
