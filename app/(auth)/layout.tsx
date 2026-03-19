import { appFlexibleViewportPageClass } from "@/components/UI/classTokens";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={`${appFlexibleViewportPageClass} flex flex-col items-center justify-center px-4 py-8`}>
      <div className="relative z-20 flex w-full max-w-md flex-col items-center gap-8">
        <div className="w-full">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
