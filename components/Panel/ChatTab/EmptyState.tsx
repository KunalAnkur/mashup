interface EmptyStateProps {
  message: string;
}

export const EmptyState = ({ message }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 md:gap-3">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-fuchsia-500/20 rounded-full blur-2xl"></div>
        <div className="relative text-4xl md:text-6xl opacity-50">💬</div>
      </div>
      <p className="text-white/60 text-xs md:text-sm font-medium text-center px-4">
        {message}
      </p>
    </div>
  );
};

// Made with Bob
