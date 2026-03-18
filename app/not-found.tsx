"use client";
import { LogoHeader } from "@/components";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaFilm, FaRocket, FaSearch, FaHome } from "react-icons/fa";
import { useTranslations } from "@/i18n/I18nProvider";

const NotFound = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("notFound");
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <div className="flex h-screen bg-gradient-to-br from-[#030712] via-[#0f172a] to-[#1e1b4b] items-center justify-center relative overflow-hidden">
        <LogoHeader />
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating orbs */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '0s' }}></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
          
          {/* Floating icons */}
          <div className="absolute top-1/4 left-1/4 text-purple-500/20 animate-float" style={{ animationDelay: '0.5s' }}>
            <FaFilm size={40} />
          </div>
          <div className="absolute bottom-1/4 right-1/4 text-pink-500/20 animate-float" style={{ animationDelay: '1.5s' }}>
            <FaRocket size={35} />
          </div>
          <div className="absolute top-1/3 right-1/3 text-rose-500/20 animate-float" style={{ animationDelay: '2.5s' }}>
            <FaSearch size={30} />
          </div>
        </div>

        <div className={`flex flex-col items-center gap-8 px-4 z-10 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Animated 404 */}
          <div className="relative">
            <h1 className="text-9xl md:text-[12rem] font-extrabold bg-gradient-to-r from-rose-400 via-pink-400 to-fuchsia-400 bg-clip-text text-transparent animate-pulse">
              404
            </h1>
            {/* Glow effect */}
            <div className="absolute inset-0 text-9xl md:text-[12rem] font-extrabold bg-gradient-to-r from-rose-400 via-pink-400 to-fuchsia-400 bg-clip-text text-transparent blur-2xl opacity-50 -z-10 animate-pulse" style={{ animationDelay: '0.5s' }}>
              404
            </div>
          </div>

          {/* Main content */}
          <div className="text-center space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-rose-500/20 border border-purple-500/30 backdrop-blur-sm">
              <span className="text-2xl">🎬</span>
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                {t("title")}
              </h2>
              <span className="text-2xl">🎥</span>
            </div>
            
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
              {t("description1")}
            </p>
            <p className="text-base text-gray-400">
              {t("description2")}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
            <button
              onClick={() => router.push("/")}
              className="group relative px-8 py-4 bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:from-rose-500 hover:via-pink-500 hover:to-fuchsia-500 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-105 active:scale-95 flex items-center gap-2 overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
              <FaHome className="relative z-10" />
              <span className="relative z-10">Go Home</span>
            </button>
            
            <button
              onClick={() => router.back()}
              className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white font-semibold rounded-xl transition-all duration-300 flex items-center gap-2"
            >
              <span>←</span>
              <span>{t("goBack")}</span>
            </button>
          </div>

          {/* Fun facts or tips */}
          <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-rose-500/10 border border-purple-500/20 backdrop-blur-sm max-w-md">
            <p className="text-sm text-gray-400 text-center">
              <span className="text-purple-400 font-semibold">{t("funFact")}</span>{" "}
              {t("funFactText")}
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-pulse {
          animation: pulse 3s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default NotFound;
