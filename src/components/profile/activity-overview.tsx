export default function ActivityOverview() {
  return (
    <div className="bg-[#212830] rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Activity overview</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left side - Contributions */}
        <div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-[#9198a1] mr-2" fill="currentColor" viewBox="0 0 16 16">
                <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 1 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 0 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 0 1 1-1h8zM5 12.25v3.25a.25.25 0 0 0 .4.2l1.45-1.087a.25.25 0 0 1 .3 0L8.6 15.7a.25.25 0 0 0 .4-.2v-3.25a.25.25 0 0 0-.25-.25h-3.5a.25.25 0 0 0-.25.25z" />
              </svg>
              <span className="text-[#9198a1]">Contributed to</span>
            </div>
            <div className="ml-6 space-y-1">
              <div>
                <a href="#" className="text-[#1f6feb] hover:underline">
                  rahulsharmadev-community/suite
                </a>
                <span className="text-[#9198a1]">,</span>
              </div>
              <div>
                <a href="#" className="text-[#1f6feb] hover:underline">
                  rahulsharmadev-community/eMart
                </a>
                <span className="text-[#9198a1]">,</span>
              </div>
              <div>
                <a href="#" className="text-[#1f6feb] hover:underline">
                  rahulsharmadev-community/worl...
                </a>
              </div>
              <div className="text-[#9198a1]">and 14 other repositories</div>
            </div>
          </div>
        </div>

        {/* Right side - Chart */}
        <div className="relative">
          <div className="h-32 bg-[#161b22] rounded border border-[#3d444d] p-4">
            {/* Activity Chart */}
            <div className="relative h-full">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-[#9198a1]">
                <span>100%</span>
                <span>Commits</span>
              </div>

              {/* Chart area */}
              <div className="ml-12 h-full relative">
                {/* Green line representing activity */}
                <svg className="absolute inset-0 w-full h-full">
                  <polyline fill="none" stroke="#39d353" strokeWidth="2" points="0,80 20,60 40,40 60,30 80,20 100,10" />
                </svg>

                {/* Corner labels */}
                <div className="absolute top-0 right-0 text-xs text-[#9198a1]">
                  6/hour
                  <br />
                  Code review
                </div>
                <div className="absolute bottom-0 right-0 text-xs text-[#9198a1]">
                  6/hour
                  <br />
                  Pull requests
                </div>
                <div className="absolute bottom-0 left-0 text-xs text-[#9198a1]">
                  8/hour
                  <br />
                  Issues
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
