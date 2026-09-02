interface EmptyStateProps {
  message: string;
}

export const EmptyState = ({ message }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      <div className="text-3xl md:text-4xl opacity-30">💬</div>
      <p className="text-white/45 text-xs md:text-sm text-center px-4">
        {message}
      </p>
    </div>
  );
};
