import Link from "next/link";
import { Music4, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
        <Music4 className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-6xl font-bold gradient-text">404</h1>
      <h2 className="mt-3 text-2xl font-semibold">Track not found</h2>
      <p className="mt-2 text-muted-foreground max-w-md">
        The page you're looking for doesn't exist or has been moved. Maybe the
        wrong URL — or a silent audio file ate it.
      </p>
      <div className="mt-8 flex gap-3">
        <Button asChild>
          <Link href="/">
            <Home className="h-4 w-4" />
            Back home
          </Link>
        </Button>
        <Button asChild variant="outline">
          <a href="javascript:history.back()">
            <ArrowLeft className="h-4 w-4" />
            Go back
          </a>
        </Button>
      </div>
    </div>
  );
}
