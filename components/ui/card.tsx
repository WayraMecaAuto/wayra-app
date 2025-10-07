import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

interface CardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className, children, hoverable = true, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow-md",
        "transition-all duration-300 ease-out",
        "animate-in fade-in-0 slide-in-from-bottom-4",
        hoverable && "hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1",
        "w-full max-w-full",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div 
      className={cn(
        "flex flex-col space-y-1.5",
        "p-4 sm:p-5 md:p-6",
        "transition-all duration-200",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn(
        "font-semibold leading-none tracking-tight",
        "text-lg sm:text-xl md:text-2xl",
        "transition-colors duration-200",
        "bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: CardDescriptionProps) {
  return (
    <p 
      className={cn(
        "text-muted-foreground",
        "text-xs sm:text-sm md:text-base",
        "transition-colors duration-200",
        "leading-relaxed",
        className
      )} 
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: CardContentProps) {
  return (
    <div 
      className={cn(
        "pt-0",
        "p-4 sm:p-5 md:p-6",
        "transition-all duration-200",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div 
      className={cn(
        "flex items-center pt-0",
        "p-4 sm:p-5 md:p-6",
        "flex-wrap gap-2 sm:gap-3",
        "transition-all duration-200",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}

// Demo Component
export default function CardDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-2 animate-in fade-in-0 slide-in-from-top-4 duration-700">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Card Components Mejorados
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Con animaciones y diseño responsivo
          </p>
        </div>

        {/* Grid responsivo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="hover:border-blue-500/50">
            <CardHeader>
              <CardTitle>Card Básica</CardTitle>
              <CardDescription>
                Esta es una descripción de ejemplo que se adapta a diferentes tamaños de pantalla
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Contenido con padding responsivo y animaciones suaves al hacer hover
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-green-500/50">
            <CardHeader>
              <CardTitle>Con Footer</CardTitle>
              <CardDescription>
                Card con botones en el footer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full w-3/4 animate-pulse"></div>
                <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full w-1/2 animate-pulse delay-75"></div>
              </div>
            </CardContent>
            <CardFooter>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                Acción
              </button>
            </CardFooter>
          </Card>

          <Card className="hover:border-purple-500/50 md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>Card Destacada</CardTitle>
              <CardDescription>
                Con efectos visuales especiales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20 hover:scale-105 transition-transform">
                  <div className="text-2xl font-bold text-purple-600">42</div>
                  <div className="text-xs text-muted-foreground">Métrica 1</div>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20 hover:scale-105 transition-transform">
                  <div className="text-2xl font-bold text-blue-600">89</div>
                  <div className="text-xs text-muted-foreground">Métrica 2</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card full width */}
        <Card className="hover:border-orange-500/50" hoverable={false}>
          <CardHeader>
            <CardTitle>Card Ancha</CardTitle>
            <CardDescription>
              Perfecta para contenido extenso en todas las pantallas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20 hover:shadow-lg transition-all hover:scale-105"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="text-xl font-semibold text-orange-600">Item {i}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Elemento responsivo
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <span className="text-sm text-muted-foreground">4 elementos</span>
            <button className="px-3 py-1.5 text-sm border rounded-lg hover:bg-accent transition-colors">
              Ver más
            </button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}