interface UnderProcessProps {
  title?: string;
}

export default function UnderProcess({ title = "Dashboard" }: UnderProcessProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-foreground">
          {title}
        </h2>
        <p className="text-muted-foreground">
          Under Process
        </p>
      </div>
    </div>
  );
}
