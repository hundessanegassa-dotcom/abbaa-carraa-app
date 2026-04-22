{/* Hero Section - Responsive for mobile */}
<section className="relative bg-gradient-to-r from-green-900/90 to-blue-900/90 text-white overflow-hidden">
  {/* Background Image */}
  <div className="absolute inset-0 z-0">
    <img 
      src="/images/abbaa-carraa-banner-image.png"
      alt="Abbaa Carraa Celebration"
      className="w-full h-full object-cover object-center"
      onError={(e) => {
        e.target.style.display = 'none';
        e.target.parentElement.style.backgroundColor = '#1a4d2e';
      }}
    />
    <div className="absolute inset-0 bg-black/40"></div>
  </div>
  
  {/* Content - Responsive padding and positioning */}
  <div className="relative z-10 container mx-auto px-4 py-32 sm:py-40 md:py-48 lg:py-56 text-center flex flex-col justify-end min-h-[450px] sm:min-h-[550px] md:min-h-[650px] lg:min-h-[700px]">
    <div className="mt-auto">
      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-2 sm:mb-3 drop-shadow-lg">
        Welcome to <span className="text-yellow-300">Abbaa Carraa</span>
      </h1>
      <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl mb-4 sm:mb-6 max-w-2xl mx-auto drop-shadow-md opacity-95 px-2">
        {t('common.tagline')}
      </p>
      
      {/* Buttons - Responsive sizes */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
        <Link href="/register" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-full font-semibold text-xs sm:text-sm md:text-base transition-all shadow-lg hover:shadow-xl">
          {t('common.get_started')}
        </Link>
        <Link href="/listings" className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-full font-semibold text-xs sm:text-sm md:text-base transition-all border border-white/30">
          {t('common.browse_prizes')}
        </Link>
      </div>
    </div>
  </div>
</section>
