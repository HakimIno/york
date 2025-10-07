import React, { useMemo } from 'react';
import { PerformanceStats } from '../module/wasm-interface';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface HeaderProps {
  stats: PerformanceStats | null;
  styleTemplate: any;
  error: string | null;
  onClearError: () => void;
}

const Header: React.FC<HeaderProps> = React.memo(({
  stats,
  styleTemplate,
  error,
  onClearError,
}) => {
  // Memoize expensive computations
  const memoryUsageKB = useMemo(() => 
    stats ? Math.round(stats.memory_usage_bytes / 1024) : 0,
    [stats?.memory_usage_bytes]
  );

  const hasStyleTemplate = useMemo(() => 
    Boolean(styleTemplate),
    [styleTemplate]
  );

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        {/* Title */}
        <div className="flex items-center space-x-2">
          <h1 className="text-lg font-semibold">HTML Builder</h1>
          <Badge variant="secondary" className="text-xs">
            WASM
          </Badge>
        </div>

        {/* Status & Stats */}
        <div className="flex items-center space-x-3">
          {/* WASM Status */}
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span className="text-xs text-muted-foreground">Ready</span>
          </div>

          <Separator orientation="vertical" className="h-4" />

          {/* Stats */}
          {stats && (
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span>{stats.spatial.total_elements} elements</span>
              <span>•</span>
              <span>{memoryUsageKB}KB</span>
            </div>
          )}

          {/* Style Template Status */}
          {hasStyleTemplate && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <Badge variant="outline" className="text-xs">
                Template Active
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="border-b bg-destructive/10 px-4 py-2">
          <div className="container flex items-center justify-between">
            <span className="text-sm text-destructive">{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearError}
              className="h-6 w-6 p-0 text-destructive hover:bg-destructive/20"
            >
              ×
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

Header.displayName = 'Header';

export default Header;
