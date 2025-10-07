import React, { Suspense, lazy } from 'react';
import { TabProps, FormFieldTabProps, TableTabProps } from '../types';

// Lazy load tab components only when needed
const TypographyTab = lazy(() => 
  import('./TypographyTab').then(module => ({ default: module.default }))
);
const ColorsTab = lazy(() => 
  import('./ColorsTab').then(module => ({ default: module.default }))
);
const LayoutTab = lazy(() => 
  import('./LayoutTab').then(module => ({ default: module.default }))
);
const FormFieldTab = lazy(() => 
  import('./FormFieldTab').then(module => ({ default: module.default }))
);
const TableTab = lazy(() => 
  import('./TableTab').then(module => ({ default: module.default }))
);

// Optimized loading component for tabs
const TabLoadingFallback: React.FC = React.memo(() => (
  <div className="flex items-center justify-center py-4">
    <div className="text-muted-foreground text-sm">Loading...</div>
  </div>
));

// Memoized Tab Wrappers to prevent unnecessary re-renders
export const LazyTypographyTab: React.FC<TabProps> = React.memo((props) => (
  <Suspense fallback={<TabLoadingFallback />}>
    <TypographyTab {...props} />
  </Suspense>
));

export const LazyColorsTab: React.FC<TabProps> = React.memo((props) => (
  <Suspense fallback={<TabLoadingFallback />}>
    <ColorsTab {...props} />
  </Suspense>
));

export const LazyLayoutTab: React.FC<TabProps> = React.memo((props) => (
  <Suspense fallback={<TabLoadingFallback />}>
    <LayoutTab {...props} />
  </Suspense>
));

export const LazyFormFieldTab: React.FC<FormFieldTabProps> = React.memo((props) => (
  <Suspense fallback={<TabLoadingFallback />}>
    <FormFieldTab {...props} />
  </Suspense>
  ));

export const LazyTableTab: React.FC<TableTabProps> = React.memo((props) => (
  <Suspense fallback={<TabLoadingFallback />}>
    <TableTab {...props} />
  </Suspense>
));
