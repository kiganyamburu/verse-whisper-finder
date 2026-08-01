import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Oops! The page you are looking for does not exist.
      </p>
      <Link 
        href="/" 
        className="px-6 py-3 bg-gradient-primary text-primary-foreground rounded-lg shadow-divine hover:shadow-glow transition-all"
      >
        Return Home
      </Link>
    </div>
  );
}
