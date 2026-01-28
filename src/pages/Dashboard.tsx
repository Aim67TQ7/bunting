import { PageLayout } from "@/components/page-layout";
import { Link } from "react-router-dom";
import { Activity, Wifi, Shield } from "lucide-react";

const Dashboard = () => {
  return (
    <PageLayout title="Dashboard" showMobileHeader={false}>
      <div className="flex flex-col items-center justify-center min-h-full bg-[#0a0e14] p-6 relative overflow-hidden">
        {/* Subtle grid background */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />

        {/* Main content */}
        <div className="relative z-10 text-center space-y-8 max-w-2xl">
          {/* Title */}
          <h1 
            className="text-5xl md:text-6xl font-bold tracking-wider"
            style={{ 
              color: '#00d4ff',
              textShadow: '0 0 20px rgba(0,212,255,0.5), 0 0 40px rgba(0,212,255,0.3)'
            }}
          >
            BUNTING GPT
          </h1>

          {/* Subtitle - CHANGED */}
          <p className="text-sm md:text-base tracking-[0.3em] text-gray-400 uppercase">
            Central Access Hub — <span className="text-[#00d4ff]">Now Integrated Inside Teams</span>
          </p>

          {/* Glowing orb/logo */}
          <div className="relative w-48 h-48 md:w-64 md:h-64 mx-auto my-12">
            {/* Outer ring */}
            <div 
              className="absolute inset-0 rounded-full border-2 border-red-500/30"
              style={{ boxShadow: '0 0 30px rgba(239,68,68,0.3), inset 0 0 30px rgba(239,68,68,0.1)' }}
            />
            {/* Inner glow */}
            <div 
              className="absolute inset-8 rounded-full bg-gradient-to-br from-red-600 to-red-800"
              style={{ boxShadow: '0 0 60px rgba(239,68,68,0.6), 0 0 100px rgba(239,68,68,0.4)' }}
            />
            {/* Core */}
            <div className="absolute inset-16 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
              <div className="w-8 h-8 bg-[#0a0e14] rounded-full" />
            </div>
          </div>

          {/* Central Access Hub text */}
          <p className="text-sm tracking-[0.2em] text-gray-500 uppercase">
            Central Access Hub — Powered by AI
          </p>

          {/* Launch button */}
          <Link 
            to="/chat"
            className="inline-block text-[#00d4ff] text-lg tracking-widest hover:text-white transition-colors"
            style={{ textShadow: '0 0 10px rgba(0,212,255,0.5)' }}
          >
            LAUNCH BUNTING GPT
          </Link>
        </div>

        {/* Bottom status bar */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-800 bg-[#0a0e14]/90 backdrop-blur">
          <div className="flex items-center justify-center gap-8 md:gap-16 py-4 px-4 text-xs md:text-sm">
            {/* System Online */}
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#00d4ff]" />
              <span className="text-gray-400">SYSTEM</span>
              <span className="text-[#00d4ff] font-medium">ONLINE</span>
            </div>

            {/* Privacy Link (was Network Stable) */}
            <Link 
              to="/privacy"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Wifi className="h-4 w-4 text-[#00d4ff]" />
              <span className="text-gray-400">PRIVACY</span>
              <span className="text-[#00d4ff] font-medium">POLICY</span>
            </Link>

            {/* Terms Link (was Security Active) */}
            <Link 
              to="/terms"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Shield className="h-4 w-4 text-[#00d4ff]" />
              <span className="text-gray-400">TERMS OF</span>
              <span className="text-[#00d4ff] font-medium">USE</span>
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Dashboard;
