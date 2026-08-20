import { Link, useLocation } from 'wouter';
import { useState } from 'react';
import { Button } from '@workspace/planton-ds/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/planton-ds/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@workspace/planton-ds/components/ui/avatar';
import { cn } from '@workspace/planton-ds/lib/utils';
import {
  useGetCurrentUser,
  getGetCurrentUserQueryKey,
  useLogoutUser,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Menu, X, Stethoscope, Building2 } from 'lucide-react';

export function Navbar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useGetCurrentUser({
    query: {
      queryKey: getGetCurrentUserQueryKey(),
      retry: false,
    },
  });

  const logout = useLogoutUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
      },
    },
  });

  const navLinks =
    user?.type === 'hospital'
      ? [
          { href: '/', label: 'Plantões' },
          { href: '/publish', label: 'Publicar' },
          { href: '/my-shifts', label: 'Meus plantões' },
        ]
      : user?.type === 'doctor'
      ? [
          { href: '/', label: 'Plantões' },
          { href: '/my-shifts', label: 'Minhas candidaturas' },
        ]
      : [{ href: '/', label: 'Plantões' }];

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-bold text-primary tracking-tight flex items-center gap-2"
          >
            <Stethoscope className="h-5 w-5" />
            Planton
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  location === link.href
                    ? 'text-primary bg-secondary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted transition-colors"
                    data-testid="user-menu-trigger"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block text-sm font-medium text-foreground max-w-32 truncate">
                      {user.name}
                    </span>
                    {user.type === 'hospital' ? (
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
                    ) : (
                      <Stethoscope className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.type === 'hospital' ? 'Hospital' : 'Médico'}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  {user.type === 'hospital' && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/publish">Publicar plantão</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/my-shifts">Meus plantões</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {user.type === 'doctor' && (
                    <DropdownMenuItem asChild>
                      <Link href="/my-shifts">Minhas candidaturas</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => logout.mutate()}
                    data-testid="logout-button"
                  >
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" data-testid="link-login">
                    Entrar
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" data-testid="link-register">
                    Cadastrar
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              data-testid="mobile-menu-toggle"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border pb-3 pt-2 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  location === link.href
                    ? 'text-primary bg-secondary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <div className="pt-2 flex gap-2 px-3">
                <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    Entrar
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1">
                  <Button size="sm" className="w-full">
                    Cadastrar
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
